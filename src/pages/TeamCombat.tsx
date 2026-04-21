import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  GameCharacter, InventoryItem, ENEMIES, EnemyDef,
  GameLocation, getXpMultiplier,
} from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Dice6, Heart, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';
import PokemonBattleScene from '@/components/PokemonBattleScene';

// ============== Types stored in team_combat (JSON shape) ==============
interface TCEnemy {
  id: string;
  name: string;
  icon: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  xpReward: number;
  goldReward: number;
}
interface TCMember {
  user_id: string;
  character_id: string;
  name: string;
  charClass: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  defending: boolean; // halves damage next enemy turn
}
interface TCRow {
  id: string;
  team_id: string;
  location_id: string | null;
  wave: number;
  max_waves: number;
  enemies: TCEnemy[];
  members_state: Record<string, TCMember>;
  log: string[];
  current_actor_id: string | null; // user_id of whose turn it is
  turn: number;
  finished: boolean;
  result: string | null;
  rewards: { xp: number; gold: number } | null;
}

const rng = (n: number) => Math.floor(Math.random() * n);
const rollD20 = () => rng(20) + 1;
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Build a wave of enemies for the location, scaled to party size
const buildWave = (loc: GameLocation | null, partySize: number, wave: number, maxWaves: number): TCEnemy[] => {
  const world = loc?.world || 1;
  const isFinalWave = wave === maxWaves;
  const pool = ENEMIES.filter(e => e.locationType === (loc?.type === 'zone' ? 'zone' : 'dungeon') && (e.world || 1) === world);
  const fallback = ENEMIES.filter(e => (e.world || 1) === world);
  const candidates = pool.length > 0 ? pool : (fallback.length > 0 ? fallback : ENEMIES);
  const count = isFinalWave ? Math.max(1, Math.ceil(partySize / 2)) : Math.max(1, partySize);
  const enemies: TCEnemy[] = [];
  for (let i = 0; i < count; i++) {
    const def = candidates[rng(candidates.length)];
    const scale = 1 + (wave - 1) * 0.25 + (isFinalWave ? 0.5 : 0);
    const hp = Math.floor(def.hp * scale);
    enemies.push({
      id: newId(),
      name: isFinalWave && i === 0 ? `👑 ${def.name}` : def.name,
      icon: def.icon,
      level: def.level + (wave - 1),
      hp, maxHp: hp,
      atk: Math.floor(def.atk * (isFinalWave ? 1.4 : 1)),
      def: def.def,
      spd: def.spd,
      xpReward: Math.floor(def.xpReward * scale),
      goldReward: Math.floor(def.goldReward * scale),
    });
  }
  return enemies;
};

const TeamCombat = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tc, setTc] = useState<TCRow | null>(null);
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [location, setLocation] = useState<GameLocation | null>(null);
  const [targetEnemyId, setTargetEnemyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [attackingSide, setAttackingSide] = useState<'player' | 'enemy' | null>(null);
  const [floatingDmg, setFloatingDmg] = useState<{ id: number; value: string; type: string }[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!teamId) { navigate('/teams'); return; }
    void initBattle();
  }, [user, teamId]);

  // Realtime subscription
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase.channel(`tc-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_combat', filter: `team_id=eq.${teamId}` }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          toast.info('A harc megszakadt.');
          navigate('/teams');
          return;
        }
        if (payload.new) {
          const prev = tcRef.current;
          const next = payload.new as TCRow;
          // Detect transitions to trigger animations
          if (prev && next.turn > prev.turn) {
            setAttackingSide('player');
            setShakeEnemy(true);
            setTimeout(() => { setShakeEnemy(false); setAttackingSide(null); }, 350);
          }
          setTc(next);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId]);

  const tcRef = useRef<TCRow | null>(null);
  useEffect(() => { tcRef.current = tc; }, [tc]);

  const initBattle = async () => {
    if (initRef.current) return;
    initRef.current = true;

    // Load my character
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) { toast.error('Karakter nem található'); navigate('/lobby'); return; }
    const char = charRes.data as unknown as GameCharacter;
    setCharacter(char);

    const itemsRes = await supabase.from('inventory_items').select('*').eq('character_id', char.id);
    if (itemsRes.data) setItems(itemsRes.data as InventoryItem[]);

    // Check existing combat
    const existing = await supabase.from('team_combat').select('*').eq('team_id', teamId).maybeSingle();
    if (existing.data) {
      setTc(existing.data as unknown as TCRow);
      // Load location for background
      if ((existing.data as any).location_id) {
        const lRes = await supabase.from('locations').select('*').eq('id', (existing.data as any).location_id).single();
        if (lRes.data) setLocation(lRes.data as GameLocation);
      }
      return;
    }

    // Build new combat (only leader / first arriver creates it)
    const teamRes = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (!teamRes.data) { toast.error('Csapat nem található'); navigate('/teams'); return; }
    const team = teamRes.data as any;

    // Only the leader initializes to avoid race
    if (team.leader_id !== user!.id) {
      // Wait for leader to create
      toast.info('Várakozás a vezérre...');
      return;
    }

    let loc: GameLocation | null = null;
    if (team.target_location_id) {
      const lRes = await supabase.from('locations').select('*').eq('id', team.target_location_id).single();
      if (lRes.data) { loc = lRes.data as GameLocation; setLocation(loc); }
    }

    // Load all team members + characters
    const memRes = await supabase.from('team_members').select('*').eq('team_id', teamId);
    if (!memRes.data || memRes.data.length === 0) { toast.error('Nincs csapattag'); navigate('/teams'); return; }
    const charIds = memRes.data.map((m: any) => m.character_id);
    const charsRes = await supabase.from('characters').select('*').in('id', charIds);
    const chars = (charsRes.data || []) as unknown as GameCharacter[];

    const members_state: Record<string, TCMember> = {};
    const orderedMembers: TCMember[] = [];
    memRes.data.forEach((m: any) => {
      const c = chars.find(ch => ch.id === m.character_id);
      if (!c) return;
      const tm: TCMember = {
        user_id: m.user_id, character_id: c.id, name: c.name,
        charClass: c.class, level: c.level,
        hp: c.hp, maxHp: c.max_hp, mp: c.mp, maxMp: c.max_mp,
        atk: c.atk, def: c.def, spd: c.spd, defending: false,
      };
      members_state[m.user_id] = tm;
      orderedMembers.push(tm);
    });

    // Sort by SPD descending => first actor
    orderedMembers.sort((a, b) => b.spd - a.spd);
    const firstActor = orderedMembers[0]?.user_id || null;

    const partySize = orderedMembers.length;
    const maxWaves = loc?.type === 'dungeon' || loc?.type === 'raid' ? 4 : 3;
    const wave1 = buildWave(loc, partySize, 1, maxWaves);

    const initialLog = [
      `⚔️ Csapatharc kezdődik!`,
      `🌊 Hullám 1/${maxWaves} — ${wave1.length} ellenfél jelent meg!`,
      `▶️ ${members_state[firstActor!]?.name || '?'} köre`,
    ];

    const insertRes = await supabase.from('team_combat').insert({
      team_id: teamId, location_id: loc?.id || null,
      wave: 1, max_waves: maxWaves,
      enemies: wave1 as any, members_state: members_state as any,
      log: initialLog as any, current_actor_id: firstActor, turn: 1,
      finished: false, result: null, rewards: { xp: 0, gold: 0 } as any,
    }).select().single();

    if (insertRes.error) { toast.error(insertRes.error.message); return; }
    setTc(insertRes.data as unknown as TCRow);
  };

  const addFloat = (value: string, type: string) => {
    const id = Date.now() + Math.random();
    setFloatingDmg(prev => [...prev.slice(-6), { id, value, type }]);
    setTimeout(() => setFloatingDmg(prev => prev.filter(f => f.id !== id)), 1100);
  };

  const isMyTurn = tc && tc.current_actor_id === user?.id && !tc.finished;
  const myMember = tc && user ? tc.members_state[user.id] : null;

  const liveEnemies = (tc?.enemies || []).filter(e => e.hp > 0);
  const liveMembers = tc ? Object.values(tc.members_state).filter(m => m.hp > 0) : [];

  // ===== Action: attack chosen target =====
  const performAction = async (action: 'attack' | 'defend' | 'potion') => {
    if (!tc || !isMyTurn || !user || !myMember || busy) return;
    setBusy(true);

    const updated: TCRow = JSON.parse(JSON.stringify(tc));
    const newLog: string[] = [];

    // Reset defending at start of own turn
    updated.members_state[user.id].defending = false;

    if (action === 'attack') {
      const target = updated.enemies.find(e => e.id === targetEnemyId && e.hp > 0)
        || updated.enemies.find(e => e.hp > 0);
      if (!target) { setBusy(false); return; }
      const roll = rollD20();
      const hit = roll >= 3;
      if (hit) {
        const dmg = Math.max(1, myMember.atk + roll - target.def);
        target.hp = Math.max(0, target.hp - dmg);
        newLog.push(`🎲 ${myMember.name}: d20=${roll} → ${target.name}: -${dmg} HP`);
        addFloat(`-${dmg}`, 'enemy');
        setShakeEnemy(true); setAttackingSide('player');
        setTimeout(() => { setShakeEnemy(false); setAttackingSide(null); }, 350);
        if (target.hp <= 0) newLog.push(`💀 ${target.name} legyőzve!`);
      } else {
        newLog.push(`🎲 ${myMember.name}: d20=${roll} → Melléütés!`);
      }
    } else if (action === 'defend') {
      updated.members_state[user.id].defending = true;
      newLog.push(`🛡️ ${myMember.name} védekezik (50% sebzéscsökkentés következő körben)`);
    } else if (action === 'potion') {
      const potion = items.find(i => i.type === 'potion' && i.hp_bonus > 0);
      if (!potion) { toast.error('Nincs italod!'); setBusy(false); return; }
      const heal = Math.min(potion.hp_bonus, myMember.maxHp - myMember.hp);
      updated.members_state[user.id].hp = myMember.hp + heal;
      newLog.push(`🧪 ${myMember.name} ${heal} HP-t gyógyult`);
      addFloat(`+${heal} HP`, 'heal');
      await supabase.from('inventory_items').delete().eq('id', potion.id);
      setItems(prev => prev.filter(i => i.id !== potion.id));
    }

    // ===== Check wave clear =====
    const aliveEnemies = updated.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
      // Award rewards from this wave
      const waveXp = updated.enemies.reduce((s, e) => s + e.xpReward, 0);
      const waveGold = updated.enemies.reduce((s, e) => s + e.goldReward, 0);
      updated.rewards = {
        xp: (updated.rewards?.xp || 0) + waveXp,
        gold: (updated.rewards?.gold || 0) + waveGold,
      };
      newLog.push(`✨ Hullám ${updated.wave} tisztítva! +${waveXp} XP, +${waveGold} 💰`);

      if (updated.wave >= updated.max_waves) {
        // Victory
        updated.finished = true;
        updated.result = 'win';
        newLog.push(`🏆 GYŐZELEM! Csapat siker!`);
        updated.log = [...updated.log, ...newLog];
        await supabase.from('team_combat').update({
          enemies: updated.enemies as any,
          members_state: updated.members_state as any,
          log: updated.log as any,
          rewards: updated.rewards as any,
          finished: true, result: 'win',
        }).eq('id', updated.id);
        await applyRewardsToAll(updated);
        setBusy(false);
        return;
      }

      // Next wave
      updated.wave += 1;
      updated.enemies = buildWave(location, Object.keys(updated.members_state).length, updated.wave, updated.max_waves);
      newLog.push(`🌊 Hullám ${updated.wave}/${updated.max_waves} — ${updated.enemies.length} új ellenfél!`);
    } else {
      // ===== Enemies' counter-attack: each alive enemy hits a random alive member =====
      const aliveMembers = Object.values(updated.members_state).filter(m => m.hp > 0);
      if (aliveMembers.length > 0) {
        aliveEnemies.forEach(en => {
          const tgt = aliveMembers[rng(aliveMembers.length)];
          const eRoll = rollD20();
          let dmg = Math.max(1, en.atk + eRoll - tgt.def);
          if (tgt.defending) { dmg = Math.floor(dmg / 2); newLog.push(`🛡️ ${tgt.name} blokkol!`); }
          tgt.hp = Math.max(0, tgt.hp - dmg);
          updated.members_state[tgt.user_id].hp = tgt.hp;
          newLog.push(`🎲 ${en.name}: d20=${eRoll} → ${tgt.name}: -${dmg} HP`);
          if (tgt.hp <= 0) newLog.push(`💀 ${tgt.name} elesett!`);
        });
        setShakePlayer(true); setAttackingSide('enemy');
        setTimeout(() => { setShakePlayer(false); setAttackingSide(null); }, 350);
      }
    }

    // ===== Check defeat =====
    const aliveAfter = Object.values(updated.members_state).filter(m => m.hp > 0);
    if (aliveAfter.length === 0) {
      updated.finished = true;
      updated.result = 'lose';
      newLog.push(`💀 A csapat vereséget szenvedett...`);
      updated.log = [...updated.log, ...newLog];
      await supabase.from('team_combat').update({
        enemies: updated.enemies as any,
        members_state: updated.members_state as any,
        log: updated.log as any,
        finished: true, result: 'lose',
      }).eq('id', updated.id);
      await applyDefeatToAll(updated);
      setBusy(false);
      return;
    }

    // ===== Next actor (round-robin among alive members by SPD) =====
    const sortedAlive = aliveAfter.slice().sort((a, b) => b.spd - a.spd);
    const myIdx = sortedAlive.findIndex(m => m.user_id === user.id);
    const next = sortedAlive[(myIdx + 1) % sortedAlive.length];
    updated.current_actor_id = next.user_id;
    updated.turn += 1;
    newLog.push(`▶️ ${next.name} köre`);

    updated.log = [...updated.log, ...newLog].slice(-40);

    await supabase.from('team_combat').update({
      enemies: updated.enemies as any,
      members_state: updated.members_state as any,
      log: updated.log as any,
      rewards: updated.rewards as any,
      current_actor_id: updated.current_actor_id,
      turn: updated.turn,
      wave: updated.wave,
    }).eq('id', updated.id);

    setTargetEnemyId(null);
    setBusy(false);
  };

  const applyRewardsToAll = async (final: TCRow) => {
    // Each member gets the full reward (co-op style)
    const xp = final.rewards?.xp || 0;
    const gold = final.rewards?.gold || 0;
    const charIds = Object.values(final.members_state).map(m => m.character_id);
    const charsRes = await supabase.from('characters').select('*').in('id', charIds);
    if (!charsRes.data) return;
    for (const c of charsRes.data as any[]) {
      const xpMult = getXpMultiplier(c.prestige || 0);
      const scaledXp = Math.floor(xp * xpMult);
      const newXp = c.xp + scaledXp;
      const xpNeeded = c.level * 100;
      const levelUp = newXp >= xpNeeded;
      const updates: any = {
        xp: levelUp ? newXp - xpNeeded : newXp,
        gold: c.gold + gold,
      };
      if (levelUp) {
        updates.level = c.level + 1;
        updates.perk_points = (c.perk_points || 0) + 1;
        updates.max_hp = c.max_hp + 10;
        updates.max_mp = c.max_mp + 5;
        updates.hp = c.max_hp + 10;
        updates.mp = c.max_mp + 5;
      } else {
        // Persist remaining HP from battle
        const ms = final.members_state[c.user_id];
        if (ms) updates.hp = ms.hp;
      }
      await supabase.from('characters').update(updates).eq('id', c.id);
      await supabase.from('combat_log').insert({
        character_id: c.id, location_id: final.location_id,
        enemy_name: `Csapatharc (W${final.wave})`, enemy_level: c.level,
        result: 'win', xp_gained: scaledXp, gold_gained: gold,
      });
    }
    toast.success(`Csapat győzelem! +${xp} XP, +${gold} 💰 mindenkinek`);
  };

  const applyDefeatToAll = async (final: TCRow) => {
    const charIds = Object.values(final.members_state).map(m => m.character_id);
    const charsRes = await supabase.from('characters').select('*').in('id', charIds);
    if (!charsRes.data) return;
    for (const c of charsRes.data as any[]) {
      await supabase.from('characters').update({
        hp: Math.max(1, c.hp - Math.floor(c.max_hp * 0.3)),
      }).eq('id', c.id);
      await supabase.from('combat_log').insert({
        character_id: c.id, location_id: final.location_id,
        enemy_name: `Csapatharc (W${final.wave})`, enemy_level: c.level,
        result: 'lose', xp_gained: 0, gold_gained: 0,
      });
    }
    toast.error('Csapat vereség...');
  };

  const exitBattle = async () => {
    if (tc && tc.finished) {
      // Cleanup and reset team status
      await supabase.from('team_combat').delete().eq('id', tc.id);
      await supabase.from('teams').update({ status: 'forming' }).eq('id', tc.team_id);
    }
    navigate('/teams');
  };

  if (!tc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gold font-display animate-pulse-glow text-xl">Harc betöltése...</div>
      </div>
    );
  }

  // Build PokemonBattleScene props
  const sceneEnemies = tc.enemies.map(e => ({
    id: e.id, name: e.name, icon: e.icon, level: e.level,
    hp: e.hp, maxHp: e.maxHp,
    isDefeated: e.hp <= 0,
    isTarget: e.id === targetEnemyId,
  }));

  // Sort players by SPD desc to keep visual order stable
  const scenePlayers = Object.values(tc.members_state)
    .sort((a, b) => b.spd - a.spd)
    .map(m => ({
      id: m.user_id, name: m.name, level: m.level,
      hp: m.hp, maxHp: m.maxHp, mp: m.mp, maxMp: m.maxMp,
      charClass: m.charClass,
      isActive: m.user_id === tc.current_actor_id,
      isDefeated: m.hp <= 0,
    }));

  const currentActor = tc.current_actor_id ? tc.members_state[tc.current_actor_id] : null;
  const dialogue = tc.finished
    ? tc.result === 'win'
      ? `🏆 GYŐZELEM! +${tc.rewards?.xp || 0} XP · +${tc.rewards?.gold || 0} 💰 mindenkinek`
      : `💀 A csapat vereséget szenvedett.`
    : isMyTurn
      ? `▶️ A te köröd! Válassz célpontot és akciót.`
      : `⏳ ${currentActor?.name || '?'} köre... várakozz.`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={exitBattle}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-base text-gold text-glow-gold">
          <Swords className="w-4 h-4 inline mr-1" />Csapatharc
          {location && <span className="text-muted-foreground text-xs ml-2">· {location.icon} {location.name}</span>}
        </h1>
        <div className="ml-auto font-display text-xs text-gold">🌊 Hullám {tc.wave}/{tc.max_waves}</div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3">
        <div className="flex-1">
          <PokemonBattleScene
            players={scenePlayers}
            enemies={sceneEnemies}
            wave={tc.wave}
            maxWaves={tc.max_waves}
            attackingSide={attackingSide}
            shakePlayer={shakePlayer}
            shakeEnemy={shakeEnemy}
            locationType={location?.type}
            world={location?.world}
            onTargetEnemy={(id) => isMyTurn && setTargetEnemyId(id)}
            floatingNumbers={
              <AnimatePresence>
                {floatingDmg.map(f => (
                  <motion.div key={f.id}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -50, scale: 1.2 }}
                    transition={{ duration: 1 }}
                    className={`absolute top-1/3 left-1/2 font-display font-bold text-lg ${
                      f.type === 'heal' ? 'text-nature' : f.type === 'enemy' ? 'text-ember' : 'text-blood'
                    } pointer-events-none`}
                    style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
                  >
                    {f.value}
                  </motion.div>
                ))}
              </AnimatePresence>
            }
            dialogue={dialogue}
            actionMenu={
              tc.finished ? (
                <div className="grid grid-cols-1 gap-1.5">
                  <Button onClick={exitBattle} size="sm" className="font-display text-xs">
                    <ArrowLeft className="w-3 h-3 mr-1" /> Vissza a csapathoz
                  </Button>
                </div>
              ) : isMyTurn && myMember && myMember.hp > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-gold font-display flex items-center gap-1">
                    <Crown className="w-3 h-3" /> A te köröd
                  </div>
                  {liveEnemies.length > 1 && !targetEnemyId && (
                    <p className="text-[9px] text-muted-foreground">Válassz célpontot fent ↑</p>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => performAction('attack')}
                      disabled={busy}
                      className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow disabled:opacity-40"
                    >
                      <Dice6 className="w-4 h-4 text-ember" />
                      <span className="font-display text-[11px]">Támadás</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => performAction('defend')}
                      disabled={busy}
                      className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow disabled:opacity-40"
                    >
                      <Shield className="w-4 h-4 text-mana" />
                      <span className="font-display text-[11px]">Védekezés</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => performAction('potion')}
                      disabled={busy || !items.some(i => i.type === 'potion' && i.hp_bonus > 0)}
                      className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow disabled:opacity-40 col-span-2"
                    >
                      <Heart className="w-4 h-4 text-blood" />
                      <span className="font-display text-[11px]">
                        Ital ({items.filter(i => i.type === 'potion' && i.hp_bonus > 0).length})
                      </span>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-display">⏳ Várakozás</p>
                  <p className="text-[10px] text-foreground font-display">{currentActor?.name || '...'} köre</p>
                </div>
              )
            }
          />
        </div>

        {/* Combat Log */}
        <div className="lg:w-72 rpg-panel flex flex-col max-h-[500px]">
          <div className="p-2 border-b border-border">
            <h3 className="font-display text-xs text-gold">📜 Csapat Napló</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {tc.log.slice().reverse().map((line, i) => (
              <motion.p key={`${tc.turn}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`text-[10px] leading-tight ${
                  line.includes('GYŐZELEM') ? 'text-nature font-bold' :
                  line.includes('vereséget') ? 'text-blood font-bold' :
                  line.includes('Hullám') ? 'text-gold font-bold' :
                  line.includes('▶️') ? 'text-mana' :
                  line.includes('💀') ? 'text-destructive' :
                  'text-foreground/70'
                }`}>
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCombat;