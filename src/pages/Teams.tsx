import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Team, TeamMember, GameCharacter, GameLocation, Invite, CLASSES, SUBCLASSES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Plus, Swords, CheckCircle, UserPlus, Search, Bell, X } from 'lucide-react';
import { toast } from 'sonner';

const Teams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [teams, setTeams] = useState<(Team & { members?: any[]; location?: GameLocation })[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [myTeamMembers, setMyTeamMembers] = useState<(TeamMember & { char?: GameCharacter })[]>([]);
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  // Invite state
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameCharacter[]>([]);
  const [pendingInvites, setPendingInvites] = useState<(Invite & { teamName?: string; fromName?: string })[]>([]);
  const [showInvites, setShowInvites] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
    loadMyInvites();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('team-invites-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: `to_user_id=eq.${user.id}` }, () => {
        loadMyInvites();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    if (!myTeam) return;
    const channel = supabase.channel('team-' + myTeam.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${myTeam.id}` }, () => {
        loadTeamMembers(myTeam.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myTeam?.id]);

  const loadMyInvites = async () => {
    if (!user) return;
    const res = await supabase.from('invites').select('*').eq('to_user_id', user.id).eq('type', 'team').eq('status', 'pending');
    if (!res.data) return;
    const enriched = await Promise.all(res.data.map(async (inv: any) => {
      const teamRes = await supabase.from('teams').select('name').eq('id', inv.target_id).single();
      const charRes = await supabase.from('characters').select('name').eq('user_id', inv.from_user_id).single();
      return { ...inv, teamName: teamRes.data?.name, fromName: charRes.data?.name };
    }));
    setPendingInvites(enriched);
  };

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    setCharacter(charRes.data as unknown as GameCharacter);

    const locRes = await supabase.from('locations').select('*').in('type', ['zone', 'dungeon', 'raid']);
    if (locRes.data) setLocations(locRes.data as GameLocation[]);

    const myMem = await supabase.from('team_members').select('*').eq('user_id', user!.id);
    if (myMem.data && myMem.data.length > 0) {
      const teamRes = await supabase.from('teams').select('*').eq('id', myMem.data[0].team_id).single();
      if (teamRes.data) {
        setMyTeam(teamRes.data as Team);
        setIsReady(myMem.data[0].ready);
        loadTeamMembers(teamRes.data.id);
      }
    } else {
      const allTeams = await supabase.from('teams').select('*').eq('status', 'forming').order('created_at', { ascending: false });
      if (allTeams.data) {
        const enriched = await Promise.all((allTeams.data as Team[]).map(async t => {
          const memRes = await supabase.from('team_members').select('id').eq('team_id', t.id);
          const locRes = t.target_location_id
            ? await supabase.from('locations').select('*').eq('id', t.target_location_id).single()
            : null;
          return { ...t, members: memRes.data || [], location: locRes?.data as GameLocation | undefined };
        }));
        setTeams(enriched);
      }
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    const memRes = await supabase.from('team_members').select('*').eq('team_id', teamId);
    if (!memRes.data) return;
    const charIds = memRes.data.map(m => m.character_id);
    const charsRes = await supabase.from('characters').select('*').in('id', charIds);
    const charMap = new Map((charsRes.data || []).map(c => [c.id, c]));
    setMyTeamMembers(memRes.data.map(m => ({ ...m, char: charMap.get(m.character_id) as any })));
  };

  const getMaxSize = (locId: string | null) => {
    if (!locId) return 3;
    const loc = locations.find(l => l.id === locId);
    if (!loc) return 3;
    if (loc.type === 'dungeon' || loc.type === 'raid') return 5;
    return 3; // zone = max 3
  };

  const createTeam = async () => {
    if (!character || !teamName.trim()) return;
    const maxSize = getMaxSize(selectedLoc || null);
    const { data, error } = await supabase.from('teams').insert({
      name: teamName.trim(), leader_id: user!.id, target_location_id: selectedLoc || null, max_size: maxSize,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from('team_members').insert({ team_id: data.id, user_id: user!.id, character_id: character.id });
    toast.success('Csapat létrehozva!');
    setCreating(false);
    loadData();
  };

  const joinTeam = async (teamId: string) => {
    if (!character) return;
    const { error } = await supabase.from('team_members').insert({ team_id: teamId, user_id: user!.id, character_id: character.id });
    if (error) { toast.error('Nem sikerült csatlakozni!'); return; }
    toast.success('Csatlakoztál!');
    loadData();
  };

  const toggleReady = async () => {
    if (!myTeam) return;
    const newReady = !isReady;
    await supabase.from('team_members').update({ ready: newReady }).eq('team_id', myTeam.id).eq('user_id', user!.id);
    setIsReady(newReady);
  };

  const leaveTeam = async () => {
    if (!myTeam) return;
    if (myTeam.leader_id === user!.id) {
      await supabase.from('teams').delete().eq('id', myTeam.id);
      toast.success('Csapat feloszlatva.');
    } else {
      await supabase.from('team_members').delete().eq('team_id', myTeam.id).eq('user_id', user!.id);
      toast.success('Kiléptél.');
    }
    setMyTeam(null); setMyTeamMembers([]); loadData();
  };

  const startMission = async () => {
    if (!myTeam || !myTeam.target_location_id) return;
    if (!myTeamMembers.every(m => m.ready)) { toast.error('Nem mindenki kész!'); return; }
    await supabase.from('teams').update({ status: 'in_progress' }).eq('id', myTeam.id);
    const loc = locations.find(l => l.id === myTeam.target_location_id);
    if (loc?.type === 'zone') {
      navigate(`/combat/${myTeam.target_location_id}`);
    } else {
      navigate(`/dungeon/${myTeam.target_location_id}`);
    }
  };

  // Invite functions
  const searchPlayers = async () => {
    if (!searchQuery.trim()) return;
    const res = await supabase.from('characters').select('*').ilike('name', `%${searchQuery.trim()}%`).neq('user_id', user!.id).limit(10);
    if (res.data) {
      // Filter out players already in team
      const memberUserIds = new Set(myTeamMembers.map(m => m.user_id));
      setSearchResults((res.data as unknown as GameCharacter[]).filter(c => !memberUserIds.has(c.user_id)));
    }
  };

  const invitePlayer = async (targetChar: GameCharacter) => {
    if (!myTeam) return;
    // Check if already invited
    const existing = await supabase.from('invites').select('id').eq('type', 'team').eq('target_id', myTeam.id).eq('to_user_id', targetChar.user_id).eq('status', 'pending');
    if (existing.data && existing.data.length > 0) { toast.error('Már meghívtad!'); return; }
    await supabase.from('invites').insert({ type: 'team', target_id: myTeam.id, from_user_id: user!.id, to_user_id: targetChar.user_id });
    toast.success(`${targetChar.name} meghívva!`);
    setSearchResults(prev => prev.filter(c => c.id !== targetChar.id));
  };

  const acceptInvite = async (invite: Invite) => {
    if (!character) return;
    await supabase.from('invites').update({ status: 'accepted' }).eq('id', invite.id);
    await supabase.from('team_members').insert({ team_id: invite.target_id, user_id: user!.id, character_id: character.id });
    toast.success('Csatlakozás sikeres!');
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    loadData();
  };

  const declineInvite = async (invite: Invite) => {
    await supabase.from('invites').update({ status: 'declined' }).eq('id', invite.id);
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    toast.success('Meghívás elutasítva.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">
          <Users className="w-5 h-5 inline mr-1" />Csapatok
        </h1>
        <div className="ml-auto relative">
          <Button variant="ghost" size="sm" onClick={() => setShowInvites(!showInvites)} className="relative">
            <Bell className="w-4 h-4" />
            {pendingInvites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                {pendingInvites.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Pending Invites Dropdown */}
      <AnimatePresence>
        {showInvites && pendingInvites.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mt-2 rpg-panel-gold p-4 space-y-2">
            <h3 className="font-display text-sm text-gold">📨 Meghívások</h3>
            {pendingInvites.map(inv => (
              <div key={inv.id} className="rpg-panel p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm truncate">{inv.teamName || 'Csapat'}</p>
                  <p className="text-[10px] text-muted-foreground">Meghívó: {inv.fromName || '...'}</p>
                </div>
                <Button size="sm" className="font-display text-xs" onClick={() => acceptInvite(inv)}>✅</Button>
                <Button size="sm" variant="outline" className="font-display text-xs" onClick={() => declineInvite(inv)}>❌</Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {myTeam ? (
          <div className="space-y-4">
            <div className="rpg-panel-gold p-6 text-center">
              <h2 className="font-display text-xl text-gold">{myTeam.name}</h2>
              {myTeam.target_location_id && (
                <p className="text-sm text-muted-foreground mt-1">
                  Célpont: {locations.find(l => l.id === myTeam.target_location_id)?.name || '...'}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{myTeamMembers.length}/{myTeam.max_size} tag</p>
            </div>

            <div className="rpg-panel p-4 space-y-2">
              <h3 className="font-display text-sm text-gold mb-2">Tagok</h3>
              {myTeamMembers.map(m => {
                const cls = CLASSES.find(c => c.id === m.char?.class);
                const sub = SUBCLASSES.find(s => s.id === m.char?.subclass);
                return (
                  <div key={m.id} className="flex items-center gap-3 rpg-panel p-2">
                    <span className="text-lg">{sub?.icon || cls?.icon || '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm truncate">{m.char?.name || '...'}</p>
                      <p className="text-[10px] text-muted-foreground">Lv.{m.char?.level}</p>
                    </div>
                    {m.ready ? <CheckCircle className="w-4 h-4 text-nature" /> : <span className="text-[10px] text-muted-foreground">Várakozik...</span>}
                  </div>
                );
              })}
            </div>

            {/* Invite Section (leader only) */}
            {myTeam.leader_id === user!.id && (
              <div className="rpg-panel p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm text-gold">👥 Meghívás</h3>
                  <Button size="sm" variant="outline" className="font-display text-xs" onClick={() => setInviting(!inviting)}>
                    <UserPlus className="w-3 h-3 mr-1" /> Meghívás
                  </Button>
                </div>
                {inviting && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-sm font-display text-foreground"
                        placeholder="Karakter neve..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchPlayers()} />
                      <Button size="sm" onClick={searchPlayers}><Search className="w-4 h-4" /></Button>
                    </div>
                    {searchResults.map(c => {
                      const cls = CLASSES.find(cl => cl.id === c.class);
                      return (
                        <div key={c.id} className="rpg-panel p-2 flex items-center gap-3">
                          <span>{cls?.icon || '👤'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-sm truncate">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">Lv.{c.level} {cls?.name}</p>
                          </div>
                          <Button size="sm" className="font-display text-xs" onClick={() => invitePlayer(c)}>
                            <UserPlus className="w-3 h-3 mr-1" /> Meghív
                          </Button>
                        </div>
                      );
                    })}
                    {searchResults.length === 0 && searchQuery && (
                      <p className="text-xs text-muted-foreground text-center">Keress karakter névre!</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 font-display" variant={isReady ? 'secondary' : 'default'} onClick={toggleReady}>
                {isReady ? '✅ Kész' : '⏳ Kész Jelzés'}
              </Button>
              {myTeam.leader_id === user!.id && (
                <Button className="flex-1 font-display" onClick={startDungeon}
                  disabled={!myTeamMembers.every(m => m.ready) || myTeamMembers.length < 2}>
                  <Swords className="w-4 h-4 mr-1" /> Indulás!
                </Button>
              )}
            </div>
            <Button variant="outline" className="w-full font-display text-destructive" onClick={leaveTeam}>
              {myTeam.leader_id === user!.id ? 'Csapat Feloszlatása' : 'Kilépés'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-lg text-gold">Elérhető Csapatok</h2>
              <Button size="sm" className="font-display" onClick={() => setCreating(true)}>
                <Plus className="w-4 h-4 mr-1" /> Új Csapat
              </Button>
            </div>

            {teams.length === 0 && !creating && (
              <div className="rpg-panel p-8 text-center text-muted-foreground">
                Nincs elérhető csapat. Hozz létre egyet!
              </div>
            )}

            {teams.map(team => (
              <motion.div key={team.id} className="rpg-panel p-4 flex items-center gap-4" whileHover={{ scale: 1.01 }}>
                <Swords className="w-6 h-6 text-gold" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-gold">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.location ? `${team.location.icon} ${team.location.name}` : 'Nincs cél'}
                    · {team.members?.length || 0}/{team.max_size} tag
                  </p>
                </div>
                <Button size="sm" className="font-display text-xs" onClick={() => joinTeam(team.id)}
                  disabled={(team.members?.length || 0) >= team.max_size}>
                  Csatlakozás
                </Button>
              </motion.div>
            ))}

            <AnimatePresence>
              {creating && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rpg-panel-gold p-6 space-y-4">
                  <h3 className="font-display text-lg text-gold">Új Csapat</h3>
                  <input className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-display text-foreground"
                    placeholder="Csapat neve..." value={teamName} onChange={e => setTeamName(e.target.value)} maxLength={30} />
                  <select className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground"
                    value={selectedLoc} onChange={e => setSelectedLoc(e.target.value)}>
                    <option value="">Válassz célpontot (zone: max 3, dungeon/raid: max 5)...</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.icon} {loc.name} ({loc.type === 'zone' ? 'Harc' : loc.type === 'dungeon' ? 'Dungeon' : 'Raid'}, W{loc.world}, Lv.{loc.level_req})</option>
                    ))}
                  </select>
                  {selectedLoc && (
                    <p className="text-xs text-muted-foreground font-display">
                      Max csapatméret: {getMaxSize(selectedLoc)} fő
                      ({locations.find(l => l.id === selectedLoc)?.type === 'zone' ? '🗺️ Sima harc' : locations.find(l => l.id === selectedLoc)?.type === 'dungeon' ? '🏰 Dungeon' : '⚔️ Raid'})
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button className="flex-1 font-display" onClick={createTeam} disabled={!teamName.trim()}>Létrehozás</Button>
                    <Button variant="outline" className="font-display" onClick={() => setCreating(false)}>Mégse</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
