import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Team, TeamMember, GameCharacter, GameLocation, CLASSES, SUBCLASSES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Plus, Swords, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  // Realtime subscription for team members
  useEffect(() => {
    if (!myTeam) return;
    const channel = supabase.channel('team-' + myTeam.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${myTeam.id}` }, () => {
        loadTeamMembers(myTeam.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myTeam?.id]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    setCharacter(charRes.data as unknown as GameCharacter);

    // Load locations (dungeons/raids)
    const locRes = await supabase.from('locations').select('*').in('type', ['dungeon', 'raid']);
    if (locRes.data) setLocations(locRes.data as GameLocation[]);

    // Check if in a team
    const myMem = await supabase.from('team_members').select('*').eq('user_id', user!.id);
    if (myMem.data && myMem.data.length > 0) {
      const teamRes = await supabase.from('teams').select('*').eq('id', myMem.data[0].team_id).single();
      if (teamRes.data) {
        setMyTeam(teamRes.data as Team);
        setIsReady(myMem.data[0].ready);
        loadTeamMembers(teamRes.data.id);
      }
    } else {
      // Load available teams
      const allTeams = await supabase.from('teams').select('*').eq('status', 'forming').order('created_at', { ascending: false });
      if (allTeams.data) {
        // Load member counts and locations
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

  const createTeam = async () => {
    if (!character || !teamName.trim()) return;
    const { data, error } = await supabase.from('teams').insert({
      name: teamName.trim(),
      leader_id: user!.id,
      target_location_id: selectedLoc || null,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from('team_members').insert({
      team_id: data.id,
      user_id: user!.id,
      character_id: character.id,
    });
    toast.success('Csapat létrehozva!');
    setCreating(false);
    loadData();
  };

  const joinTeam = async (teamId: string) => {
    if (!character) return;
    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: user!.id,
      character_id: character.id,
    });
    if (error) { toast.error('Nem sikerült csatlakozni!'); return; }
    toast.success('Csatlakoztál!');
    loadData();
  };

  const toggleReady = async () => {
    if (!myTeam) return;
    const newReady = !isReady;
    await supabase.from('team_members').update({ ready: newReady })
      .eq('team_id', myTeam.id).eq('user_id', user!.id);
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
    setMyTeam(null);
    setMyTeamMembers([]);
    loadData();
  };

  const startDungeon = async () => {
    if (!myTeam || !myTeam.target_location_id) return;
    if (!myTeamMembers.every(m => m.ready)) {
      toast.error('Nem mindenki kész!');
      return;
    }
    await supabase.from('teams').update({ status: 'in_progress' }).eq('id', myTeam.id);
    navigate(`/dungeon/${myTeam.target_location_id}`);
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
      </header>

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {myTeam ? (
          /* My Team View */
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
                    {m.ready ? (
                      <CheckCircle className="w-4 h-4 text-nature" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Várakozik...</span>
                    )}
                  </div>
                );
              })}
            </div>

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
          /* Browse / Create Teams */
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
                    <option value="">Válassz célpontot...</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.icon} {loc.name} (W{loc.world}, Lv.{loc.level_req})</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button className="flex-1 font-display" onClick={createTeam} disabled={!teamName.trim()}>
                      Létrehozás
                    </Button>
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
