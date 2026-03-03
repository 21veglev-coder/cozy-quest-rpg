import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Clan, ClanMember, GameCharacter, Invite, CLASSES, SUBCLASSES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Crown, Shield, Plus, LogOut, UserPlus, Search, Bell } from 'lucide-react';
import { toast } from 'sonner';

const Clans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [myMembership, setMyMembership] = useState<ClanMember | null>(null);
  const [members, setMembers] = useState<(ClanMember & { character_name?: string; character_class?: string; character_level?: number; character_subclass?: string | null })[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('⚔️');
  // Invite state
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameCharacter[]>([]);
  const [pendingInvites, setPendingInvites] = useState<(Invite & { clanName?: string; fromName?: string })[]>([]);
  const [showInvites, setShowInvites] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
    loadMyInvites();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('clan-invites-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: `to_user_id=eq.${user.id}` }, () => {
        loadMyInvites();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const loadMyInvites = async () => {
    if (!user) return;
    const res = await supabase.from('invites').select('*').eq('to_user_id', user.id).eq('type', 'clan').eq('status', 'pending');
    if (!res.data) return;
    const enriched = await Promise.all(res.data.map(async (inv: any) => {
      const clanRes = await supabase.from('clans').select('name').eq('id', inv.target_id).single();
      const charRes = await supabase.from('characters').select('name').eq('user_id', inv.from_user_id).single();
      return { ...inv, clanName: clanRes.data?.name, fromName: charRes.data?.name };
    }));
    setPendingInvites(enriched);
  };

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    setCharacter(charRes.data as unknown as GameCharacter);

    const memRes = await supabase.from('clan_members').select('*').eq('user_id', user!.id).single();
    if (memRes.data) {
      setMyMembership(memRes.data as ClanMember);
      const clanRes = await supabase.from('clans').select('*').eq('id', memRes.data.clan_id).single();
      if (clanRes.data) { setMyClan(clanRes.data as Clan); loadMembers(memRes.data.clan_id); }
    } else {
      const allClans = await supabase.from('clans').select('*').order('level', { ascending: false });
      if (allClans.data) setClans(allClans.data as Clan[]);
    }
  };

  const loadMembers = async (clanId: string) => {
    const memRes = await supabase.from('clan_members').select('*').eq('clan_id', clanId);
    if (!memRes.data) return;
    const charIds = memRes.data.map(m => m.character_id);
    const charsRes = await supabase.from('characters').select('id, name, class, level, subclass').in('id', charIds);
    const charMap = new Map((charsRes.data || []).map(c => [c.id, c]));
    setMembers(memRes.data.map(m => {
      const c = charMap.get(m.character_id);
      return { ...m, character_name: c?.name, character_class: c?.class, character_level: c?.level, character_subclass: c?.subclass } as any;
    }));
  };

  const createClan = async () => {
    if (!character || !newName.trim()) return;
    const { data, error } = await supabase.from('clans').insert({
      name: newName.trim(), icon: newIcon, description: newDesc.trim() || null, leader_id: user!.id,
    }).select().single();
    if (error) { toast.error(error.message.includes('unique') ? 'Ez a klán név már foglalt!' : error.message); return; }
    await supabase.from('clan_members').insert({ clan_id: data.id, user_id: user!.id, character_id: character.id, role: 'leader' });
    toast.success(`${newName} klán létrehozva!`);
    setCreating(false); loadData();
  };

  const joinClan = async (clanId: string) => {
    if (!character) return;
    const { error } = await supabase.from('clan_members').insert({ clan_id: clanId, user_id: user!.id, character_id: character.id, role: 'member' });
    if (error) { toast.error('Nem sikerült csatlakozni!'); return; }
    toast.success('Csatlakoztál a klánhoz!'); loadData();
  };

  const leaveClan = async () => {
    if (!myMembership) return;
    if (myMembership.role === 'leader') {
      await supabase.from('clans').delete().eq('id', myMembership.clan_id);
      toast.success('Klán feloszlatva.');
    } else {
      await supabase.from('clan_members').delete().eq('id', myMembership.id);
      toast.success('Kiléptél a klánból.');
    }
    setMyClan(null); setMyMembership(null); setMembers([]); loadData();
  };

  // Invite functions
  const searchPlayers = async () => {
    if (!searchQuery.trim()) return;
    const res = await supabase.from('characters').select('*').ilike('name', `%${searchQuery.trim()}%`).neq('user_id', user!.id).limit(10);
    if (res.data) {
      const memberUserIds = new Set(members.map(m => m.user_id));
      setSearchResults((res.data as unknown as GameCharacter[]).filter(c => !memberUserIds.has(c.user_id)));
    }
  };

  const invitePlayer = async (targetChar: GameCharacter) => {
    if (!myClan) return;
    const existing = await supabase.from('invites').select('id').eq('type', 'clan').eq('target_id', myClan.id).eq('to_user_id', targetChar.user_id).eq('status', 'pending');
    if (existing.data && existing.data.length > 0) { toast.error('Már meghívtad!'); return; }
    await supabase.from('invites').insert({ type: 'clan', target_id: myClan.id, from_user_id: user!.id, to_user_id: targetChar.user_id });
    toast.success(`${targetChar.name} meghívva!`);
    setSearchResults(prev => prev.filter(c => c.id !== targetChar.id));
  };

  const acceptInvite = async (invite: Invite) => {
    if (!character) return;
    await supabase.from('invites').update({ status: 'accepted' }).eq('id', invite.id);
    await supabase.from('clan_members').insert({ clan_id: invite.target_id, user_id: user!.id, character_id: character.id, role: 'member' });
    toast.success('Csatlakozás sikeres!');
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    loadData();
  };

  const declineInvite = async (invite: Invite) => {
    await supabase.from('invites').update({ status: 'declined' }).eq('id', invite.id);
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    toast.success('Meghívás elutasítva.');
  };

  const ICONS = ['⚔️', '🛡️', '🔮', '🗡️', '🐉', '🦅', '🔥', '💀', '👑', '🌟', '🏴', '⚡'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">
          <Users className="w-5 h-5 inline mr-1" />Klánok
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

      {/* Pending Invites */}
      <AnimatePresence>
        {showInvites && pendingInvites.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mt-2 rpg-panel-gold p-4 space-y-2">
            <h3 className="font-display text-sm text-gold">📨 Klán Meghívások</h3>
            {pendingInvites.map(inv => (
              <div key={inv.id} className="rpg-panel p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm truncate">{inv.clanName || 'Klán'}</p>
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
        {myClan ? (
          <div className="space-y-4">
            <div className="rpg-panel-gold p-6 text-center">
              <div className="text-4xl mb-2">{myClan.icon}</div>
              <h2 className="font-display text-2xl text-gold">{myClan.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{myClan.description || 'Nincs leírás.'}</p>
              <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>Lv.{myClan.level}</span>
                <span>{members.length}/{myClan.max_members} tag</span>
              </div>
            </div>

            <div className="rpg-panel p-4">
              <h3 className="font-display text-sm text-gold mb-3">Tagok</h3>
              <div className="space-y-2">
                {members.map(m => {
                  const cls = CLASSES.find(c => c.id === m.character_class);
                  const sub = SUBCLASSES.find(s => s.id === m.character_subclass);
                  return (
                    <div key={m.id} className="flex items-center gap-3 rpg-panel p-2">
                      <span className="text-lg">{sub?.icon || cls?.icon || '👤'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm truncate">{m.character_name || 'Ismeretlen'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Lv.{m.character_level} · {cls?.name}{sub ? ` / ${sub.name}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {m.role === 'leader' && <Crown className="w-3 h-3 text-gold inline" />}
                        {m.role === 'officer' && <Shield className="w-3 h-3 text-mana inline" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invite Section (leader/officer) */}
            {(myMembership?.role === 'leader' || myMembership?.role === 'officer') && (
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

            <Button variant="outline" className="w-full font-display text-destructive" onClick={leaveClan}>
              <LogOut className="w-4 h-4 mr-1" />
              {myMembership?.role === 'leader' ? 'Klán Feloszlatása' : 'Kilépés a Klánból'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-lg text-gold">Elérhető Klánok</h2>
              <Button size="sm" className="font-display" onClick={() => setCreating(true)}>
                <Plus className="w-4 h-4 mr-1" /> Klán Alapítás
              </Button>
            </div>

            {clans.length === 0 && !creating && (
              <div className="rpg-panel p-8 text-center text-muted-foreground">
                Még nincsenek klánok. Alapíts egyet!
              </div>
            )}

            {clans.map(clan => (
              <motion.div key={clan.id} className="rpg-panel p-4 flex items-center gap-4" whileHover={{ scale: 1.01 }}>
                <span className="text-3xl">{clan.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-gold">{clan.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{clan.description || 'Nincs leírás.'}</p>
                  <p className="text-[10px] text-muted-foreground">Lv.{clan.level}</p>
                </div>
                <Button size="sm" className="font-display text-xs" onClick={() => joinClan(clan.id)}>
                  Csatlakozás
                </Button>
              </motion.div>
            ))}

            <AnimatePresence>
              {creating && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rpg-panel-gold p-6 space-y-4">
                  <h3 className="font-display text-lg text-gold">Új Klán Alapítása</h3>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setNewIcon(ic)}
                        className={`text-2xl p-1 rounded ${newIcon === ic ? 'bg-primary/20 ring-1 ring-primary' : ''}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                  <input className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-display text-foreground"
                    placeholder="Klán neve..." value={newName} onChange={e => setNewName(e.target.value)} maxLength={30} />
                  <textarea className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground resize-none"
                    placeholder="Leírás (opcionális)..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} maxLength={200} />
                  <div className="flex gap-2">
                    <Button className="flex-1 font-display" onClick={createClan} disabled={!newName.trim()}>
                      {newIcon} Létrehozás
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

export default Clans;
