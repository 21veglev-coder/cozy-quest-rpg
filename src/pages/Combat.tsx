import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameCharacter, InventoryItem, EnemyDef, ENEMIES, GameLocation, SET_BONUSES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Dice6, Shield, Zap, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface CombatState {
  playerHp: number;
  enemyHp: number;
  log: string[];
  turn: number;
  finished: boolean;
  result: 'win' | 'lose' | null;
}

const rollDice = (sides: number) => Math.floor(Math.random() * sides) + 1;

const getEquippedStats = (items: InventoryItem[]) => {
  const equipped = items.filter(i => i.equipped);
  const stats = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0, crit: 0 };
  const setCounts: Record<string, number> = {};
  equipped.forEach(item => {
    stats.atk += item.atk;
    stats.def += item.def;
    stats.spd += item.spd;
    stats.hp += item.hp_bonus;
    stats.mp += item.mp_bonus;
    stats.crit += item.crit_chance;
    if (item.set_name) setCounts[item.set_name] = (setCounts[item.set_name] || 0) + 1;
  });
  // Set bonuses
  Object.entries(setCounts).forEach(([setName, count]) => {
    const bonus = SET_BONUSES[setName];
    if (bonus && count >= bonus.pieces) {
      stats.atk += bonus.effect.atk || 0;
      stats.def += bonus.effect.def || 0;
      stats.spd += bonus.effect.spd || 0;
      stats.hp += bonus.effect.hp || 0;
      stats.mp += bonus.effect.mp || 0;
      stats.crit += bonus.effect.crit || 0;
    }
  });
  return stats;
};

const Combat = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [location, setLocation] = useState<GameLocation | null>(null);
  const [enemy, setEnemy] = useState<EnemyDef | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    setCharacter(charRes.data);
    const itemsRes = await supabase.from('inventory_items').select('*').eq('character_id', charRes.data.id);
    if (itemsRes.data) setItems(itemsRes.data);

    if (locationId) {
      const locRes = await supabase.from('locations').select('*').eq('id', locationId).single();
      if (locRes.data) setLocation(locRes.data);
    }
    // Pick random enemy for location
    const possibleEnemies = ENEMIES.filter(e =>
      e.locationType === 'zone' && (!locationId || e.minZoneLevel <= (charRes.data.level + 2))
    );
    if (possibleEnemies.length > 0) {
      const picked = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
      setEnemy(picked);
      setCombat({
        playerHp: charRes.data.hp,
        enemyHp: picked.hp,
        log: [`${picked.icon} ${picked.name} (Lv.${picked.level}) jelent meg!`],
        turn: 1,
        finished: false,
        result: null,
      });
    }
  };

  const doTurn = useCallback(() => {
    if (!combat || !character || !enemy || combat.finished) return;
    setRolling(true);

    const eqStats = getEquippedStats(items);
    const pAtk = character.atk + eqStats.atk;
    const pDef = character.def + eqStats.def;
    const pSpd = character.spd + eqStats.spd;
    const pCrit = character.crit_chance + eqStats.crit;

    const playerRoll = rollDice(20);
    const enemyRoll = rollDice(20);
    const isCrit = rollDice(100) <= pCrit;

    let playerDmg = Math.max(1, pAtk + playerRoll - enemy.def);
    if (isCrit) playerDmg = Math.floor(playerDmg * 1.5);
    const enemyDmg = Math.max(1, enemy.atk + enemyRoll - pDef);

    // Speed determines who goes first
    const playerFirst = pSpd + rollDice(6) >= enemy.spd + rollDice(6);
    const newLog: string[] = [];
    let newEnemyHp = combat.enemyHp;
    let newPlayerHp = combat.playerHp;

    if (playerFirst) {
      newLog.push(`🎲 Te dobsz: ${playerRoll} → ${playerDmg} sebzés${isCrit ? ' 💥 KRITIKUS!' : ''}`);
      newEnemyHp -= playerDmg;
      if (newEnemyHp > 0) {
        newLog.push(`🎲 ${enemy.icon} dob: ${enemyRoll} → ${enemyDmg} sebzés`);
        newPlayerHp -= enemyDmg;
      }
    } else {
      newLog.push(`🎲 ${enemy.icon} dob: ${enemyRoll} → ${enemyDmg} sebzés`);
      newPlayerHp -= enemyDmg;
      if (newPlayerHp > 0) {
        newLog.push(`🎲 Te dobsz: ${playerRoll} → ${playerDmg} sebzés${isCrit ? ' 💥 KRITIKUS!' : ''}`);
        newEnemyHp -= playerDmg;
      }
    }

    const finished = newEnemyHp <= 0 || newPlayerHp <= 0;
    const result = newEnemyHp <= 0 ? 'win' : newPlayerHp <= 0 ? 'lose' : null;

    if (result === 'win') newLog.push(`🏆 Győzelem! +${enemy.xpReward} XP, +${enemy.goldReward} arany`);
    if (result === 'lose') newLog.push('💀 Vereség...');

    setCombat(prev => prev ? {
      ...prev,
      playerHp: Math.max(0, newPlayerHp),
      enemyHp: Math.max(0, newEnemyHp),
      log: [...prev.log, `--- ${prev.turn}. kör ---`, ...newLog],
      turn: prev.turn + 1,
      finished,
      result,
    } : null);

    if (result === 'win') applyRewards(enemy);
    if (result === 'lose') applyLoss();

    setTimeout(() => setRolling(false), 500);
  }, [combat, character, enemy, items]);

  const applyRewards = async (e: EnemyDef) => {
    if (!character) return;
    const newXp = character.xp + e.xpReward;
    const xpNeeded = character.level * 100;
    const levelUp = newXp >= xpNeeded;
    const updates: any = {
      xp: levelUp ? newXp - xpNeeded : newXp,
      gold: character.gold + e.goldReward,
    };
    if (levelUp) {
      updates.level = character.level + 1;
      updates.perk_points = character.perk_points + 1;
      updates.max_hp = character.max_hp + 10;
      updates.max_mp = character.max_mp + 5;
      updates.hp = character.max_hp + 10;
      updates.mp = character.max_mp + 5;
      toast.success(`Szintlépés! Lv.${character.level + 1}! +1 Perk pont!`);
    }
    await supabase.from('characters').update(updates).eq('id', character.id);
    await supabase.from('combat_log').insert({
      character_id: character.id,
      location_id: locationId || null,
      enemy_name: e.name,
      enemy_level: e.level,
      result: 'win',
      xp_gained: e.xpReward,
      gold_gained: e.goldReward,
    });
  };

  const applyLoss = async () => {
    if (!character) return;
    const hpLost = Math.floor(character.max_hp * 0.3);
    await supabase.from('characters').update({ hp: Math.max(1, character.hp - hpLost) }).eq('id', character.id);
    await supabase.from('combat_log').insert({
      character_id: character.id,
      location_id: locationId || null,
      enemy_name: enemy?.name || 'Unknown',
      enemy_level: enemy?.level || 1,
      result: 'lose',
      xp_gained: 0,
      gold_gained: 0,
    });
  };

  const usePotion = async () => {
    if (!character || !combat || combat.finished) return;
    const potion = items.find(i => i.type === 'potion' && i.hp_bonus > 0);
    if (!potion) { toast.error('Nincs gyógyitalod!'); return; }
    const heal = Math.min(potion.hp_bonus, character.max_hp - combat.playerHp);
    setCombat(prev => prev ? {
      ...prev,
      playerHp: prev.playerHp + heal,
      log: [...prev.log, `🧪 Gyógyital használva: +${heal} HP`],
    } : null);
    await supabase.from('inventory_items').delete().eq('id', potion.id);
    setItems(prev => prev.filter(i => i.id !== potion.id));
  };

  if (!combat || !enemy || !character) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold font-display animate-pulse-glow">Betöltés...</div></div>;
  }

  const eqStats = getEquippedStats(items);
  const totalHp = character.max_hp + eqStats.hp;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">
          <Swords className="w-5 h-5 inline mr-1" />{location?.name || 'Harc'}
        </h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Battle Arena */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Enemy */}
          <motion.div className="rpg-panel p-6 text-center w-64" animate={combat.enemyHp <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}>
            <div className="text-5xl mb-2">{enemy.icon}</div>
            <p className="font-display text-foreground">{enemy.name}</p>
            <p className="text-xs text-muted-foreground mb-2">Lv.{enemy.level}</p>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-blood rounded-full" animate={{ width: `${(combat.enemyHp / enemy.hp) * 100}%` }} />
            </div>
            <p className="text-xs text-blood mt-1">{combat.enemyHp}/{enemy.hp} HP</p>
            <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>ATK {enemy.atk}</span><span>DEF {enemy.def}</span><span>SPD {enemy.spd}</span>
            </div>
          </motion.div>

          <div className="text-2xl text-gold font-display">⚔️ VS ⚔️</div>

          {/* Player */}
          <motion.div className="rpg-panel-gold p-6 text-center w-64">
            <p className="font-display text-gold">{character.name}</p>
            <p className="text-xs text-muted-foreground mb-2">Lv.{character.level}</p>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-nature rounded-full" animate={{ width: `${(combat.playerHp / totalHp) * 100}%` }} />
            </div>
            <p className="text-xs text-nature mt-1">{combat.playerHp}/{totalHp} HP</p>
            <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>ATK {character.atk + eqStats.atk}</span>
              <span>DEF {character.def + eqStats.def}</span>
              <span>CRIT {character.crit_chance + eqStats.crit}%</span>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3">
            {!combat.finished ? (
              <>
                <Button onClick={doTurn} disabled={rolling} className="font-display glow-ember">
                  <Dice6 className="w-4 h-4 mr-1" /> Támadás
                </Button>
                <Button variant="outline" onClick={usePotion} className="font-display">
                  <Heart className="w-4 h-4 mr-1 text-blood" /> Gyógyital
                </Button>
              </>
            ) : (
              <div className="flex gap-3">
                <Button onClick={() => { loadData(); }} className="font-display">
                  <Swords className="w-4 h-4 mr-1" /> Új harc
                </Button>
                <Button variant="outline" onClick={() => navigate('/lobby')} className="font-display">
                  Vissza
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Combat Log */}
        <div className="lg:w-80 rpg-panel flex flex-col max-h-[500px]">
          <div className="p-3 border-b border-border">
            <h3 className="font-display text-sm text-gold">📜 Harc Napló</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {combat.log.map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={`text-xs ${line.includes('KRITIKUS') ? 'text-gold font-bold' : line.includes('Győzelem') ? 'text-nature font-bold' : line.includes('Vereség') ? 'text-blood font-bold' : 'text-foreground/70'}`}>
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Combat;
