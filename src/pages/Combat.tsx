import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameCharacter, InventoryItem, EnemyDef, ENEMIES, GameLocation, SET_BONUSES, SKILLS, SkillDef, rollLoot, RARITY_COLORS, getEnemyAction, EnemyAbility, getXpMultiplier, getMaxLevel } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Dice6, Heart, Zap, Shield, Flame } from 'lucide-react';
import { toast } from 'sonner';
import PokemonBattleScene from '@/components/PokemonBattleScene';

interface CombatState {
  playerHp: number;
  playerMp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAtk: number;
  enemyDef: number;
  log: string[];
  turn: number;
  finished: boolean;
  result: 'win' | 'lose' | null;
  cooldowns: Record<string, number>;
  buffs: { name?: string; atk: number; def: number; spd: number; crit: number; turns: number }[];
  debuffs: { name?: string; atk: number; def: number; turns: number }[];
  enemyBuffs: { name?: string; atk: number; def: number; spd: number; turns: number }[];
  droppedItem: string | null;
  combo: number;
  lastHit: boolean; // did player hit last turn
  floatingDmg: { id: number; value: string; type: 'player' | 'enemy' | 'heal' | 'combo' | 'ability'; x: number; y: number }[];
}

const rollDice = (sides: number) => Math.floor(Math.random() * sides) + 1;
let floatId = 0;

const getEquippedStats = (items: InventoryItem[]) => {
  const equipped = items.filter(i => i.equipped);
  const stats = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0, crit: 0 };
  const setCounts: Record<string, number> = {};
  equipped.forEach(item => {
    stats.atk += item.atk; stats.def += item.def; stats.spd += item.spd;
    stats.hp += item.hp_bonus; stats.mp += item.mp_bonus; stats.crit += item.crit_chance;
    if (item.set_name) setCounts[item.set_name] = (setCounts[item.set_name] || 0) + 1;
  });
  Object.entries(setCounts).forEach(([setName, count]) => {
    const bonus = SET_BONUSES[setName];
    if (bonus && count >= bonus.pieces) {
      stats.atk += bonus.effect.atk || 0; stats.def += bonus.effect.def || 0;
      stats.spd += bonus.effect.spd || 0; stats.hp += bonus.effect.hp || 0;
      stats.mp += bonus.effect.mp || 0; stats.crit += bonus.effect.crit || 0;
    }
  });
  return stats;
};

// Floating damage number component
const FloatingNumber = ({ value, type }: { value: string; type: string }) => {
  const colors: Record<string, string> = {
    player: 'text-blood',
    enemy: 'text-ember',
    heal: 'text-nature',
    combo: 'text-gold',
    ability: 'text-mana',
  };
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: type === 'combo' ? 1.5 : 1.2 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className={`absolute font-display font-bold text-lg ${colors[type] || 'text-foreground'} pointer-events-none z-50`}
      style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
    >
      {value}
    </motion.div>
  );
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
  const [availableSkills, setAvailableSkills] = useState<SkillDef[]>([]);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [combat?.log]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    const char = charRes.data as unknown as GameCharacter;
    setCharacter(char);
    const itemsRes = await supabase.from('inventory_items').select('*').eq('character_id', char.id);
    if (itemsRes.data) setItems(itemsRes.data as InventoryItem[]);

    const skills = SKILLS.filter(s => s.classReq === char.class && (s.subclassReq === null || s.subclassReq === char.subclass));
    setAvailableSkills(skills);

    if (locationId) {
      const locRes = await supabase.from('locations').select('*').eq('id', locationId).single();
      if (locRes.data) setLocation(locRes.data as any);
    }
    const possibleEnemies = ENEMIES.filter(e =>
      e.locationType === 'zone' && (!locationId || e.minZoneLevel <= (char.level + 2))
    );
    if (possibleEnemies.length > 0) {
      const picked = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
      setEnemy(picked);
      setCombat({
        playerHp: char.hp, playerMp: char.mp,
        enemyHp: picked.hp, enemyMaxHp: picked.hp, enemyAtk: picked.atk, enemyDef: picked.def,
        log: [`${picked.icon} ${picked.name} (Lv.${picked.level}) jelent meg!`],
        turn: 1, finished: false, result: null,
        cooldowns: {}, buffs: [], debuffs: [], enemyBuffs: [],
        droppedItem: null, combo: 0, lastHit: false, floatingDmg: [],
      });
    }
  };

  const getBuffTotals = (buffs: CombatState['buffs']) => {
    const t = { atk: 0, def: 0, spd: 0, crit: 0 };
    buffs.filter(b => b.turns > 0).forEach(b => { t.atk += b.atk || 0; t.def += b.def || 0; t.spd += b.spd || 0; t.crit += b.crit || 0; });
    return t;
  };
  const getDebuffTotals = (debuffs: CombatState['debuffs']) => {
    const t = { atk: 0, def: 0 };
    debuffs.filter(d => d.turns > 0).forEach(d => { t.atk += d.atk || 0; t.def += d.def || 0; });
    return t;
  };
  const getEnemyBuffTotals = (buffs: CombatState['enemyBuffs']) => {
    const t = { atk: 0, def: 0, spd: 0 };
    buffs.filter(b => b.turns > 0).forEach(b => { t.atk += b.atk || 0; t.def += b.def || 0; t.spd += b.spd || 0; });
    return t;
  };

  const addFloat = (value: string, type: 'player' | 'enemy' | 'heal' | 'combo' | 'ability') => {
    const id = ++floatId;
    const x = Math.random() * 40 - 20;
    const y = Math.random() * 20 - 10;
    setCombat(prev => prev ? { ...prev, floatingDmg: [...prev.floatingDmg.slice(-8), { id, value, type, x, y }] } : null);
    setTimeout(() => {
      setCombat(prev => prev ? { ...prev, floatingDmg: prev.floatingDmg.filter(f => f.id !== id) } : null);
    }, 1200);
  };

  const executeTurn = async (extraDmg?: number, heal?: number, skillBuff?: CombatState['buffs'][0], skillDebuff?: CombatState['debuffs'][0], skillName?: string) => {
    if (!combat || !character || !enemy || combat.finished) return;
    setRolling(true);
    setSelectedAction(null);
    const eqStats = getEquippedStats(items);
    const bt = getBuffTotals(combat.buffs);
    const dt = getDebuffTotals(combat.debuffs);
    const ebt = getEnemyBuffTotals(combat.enemyBuffs);

    const pAtk = character.atk + eqStats.atk + bt.atk;
    const pDef = character.def + eqStats.def + bt.def;
    const pCrit = character.crit_chance + eqStats.crit + bt.crit;
    const eAtk = combat.enemyAtk + dt.atk + ebt.atk;
    const eDef = combat.enemyDef + dt.def + ebt.def;

    const playerRoll = rollDice(20);
    const enemyRoll = rollDice(20);
    const isCrit = rollDice(100) <= pCrit;

    // Combo multiplier
    const comboMultiplier = 1 + (combat.combo * 0.1); // +10% per combo
    let playerDmg = extraDmg ? extraDmg : Math.max(1, pAtk + playerRoll - Math.max(0, eDef));
    if (!extraDmg && isCrit) playerDmg = Math.floor(playerDmg * 1.5);
    if (extraDmg && isCrit) playerDmg = Math.floor(playerDmg * 1.3);
    playerDmg = Math.floor(playerDmg * comboMultiplier);

    const newLog: string[] = [];
    let newEnemyHp = combat.enemyHp;
    let newPlayerHp = combat.playerHp;
    let newCombo = combat.combo;
    const newFloats: { value: string; type: 'player' | 'enemy' | 'heal' | 'combo' | 'ability' }[] = [];

    if (skillName) newLog.push(`⚡ ${skillName}!`);
    if (heal && heal > 0) {
      const actualHeal = Math.min(heal, (character.max_hp + eqStats.hp) - combat.playerHp);
      newPlayerHp += actualHeal;
      newLog.push(`💚 +${actualHeal} HP gyógyítva`);
      newFloats.push({ value: `+${actualHeal} HP`, type: 'heal' });
    }

    // Player attack
    const playerHit = playerRoll >= 3; // miss on 1-2
    if (playerHit) {
      newLog.push(`🎲 Te: d20=${playerRoll} → ${playerDmg} seb.${isCrit ? ' 💥 KRIT!' : ''}${combat.combo > 0 ? ` 🔥x${combat.combo} COMBO` : ''}`);
      newEnemyHp -= playerDmg;
      newCombo += 1;
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 300);
      newFloats.push({ value: `-${playerDmg}${isCrit ? ' KRIT!' : ''}`, type: 'enemy' });
      if (newCombo >= 3 && newCombo % 2 === 1) {
        newFloats.push({ value: `🔥 ${newCombo}x COMBO!`, type: 'combo' });
      }
    } else {
      newLog.push(`🎲 Te: d20=${playerRoll} → Melléütés!`);
      newCombo = 0;
    }

    // Enemy turn (if alive)
    let enemyAbilityUsed: EnemyAbility | null = null;
    const newEnemyBuffs = combat.enemyBuffs.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0);

    if (newEnemyHp > 0) {
      // Check for enemy special ability
      enemyAbilityUsed = getEnemyAction(enemy, newEnemyHp);

      if (enemyAbilityUsed) {
        newLog.push(`${enemyAbilityUsed.icon} ${enemy.icon} ${enemyAbilityUsed.name}: ${enemyAbilityUsed.description}`);
        newFloats.push({ value: `${enemyAbilityUsed.icon} ${enemyAbilityUsed.name}`, type: 'ability' });

        if (enemyAbilityUsed.type === 'attack' || enemyAbilityUsed.damage) {
          const abilityDmg = enemyAbilityUsed.damageMultiplier
            ? Math.floor(eAtk * enemyAbilityUsed.damageMultiplier)
            : (enemyAbilityUsed.damage || 0) + eAtk;
          const totalAbilityDmg = Math.max(1, abilityDmg - pDef);
          newPlayerHp -= totalAbilityDmg;
          newLog.push(`💥 ${totalAbilityDmg} sebzés!`);
          newFloats.push({ value: `-${totalAbilityDmg}`, type: 'player' });
          setShakePlayer(true);
          setTimeout(() => setShakePlayer(false), 300);
        }
        if (enemyAbilityUsed.heal) {
          const eheal = Math.min(enemyAbilityUsed.heal, enemy.hp - newEnemyHp);
          newEnemyHp += eheal;
          if (eheal > 0) newLog.push(`💚 Ellenség +${eheal} HP`);
        }
        if (enemyAbilityUsed.selfBuff) {
          newEnemyBuffs.push({ name: enemyAbilityUsed.name, atk: enemyAbilityUsed.selfBuff.atk || 0, def: enemyAbilityUsed.selfBuff.def || 0, spd: enemyAbilityUsed.selfBuff.spd || 0, turns: enemyAbilityUsed.selfBuff.turns });
        }
        if (enemyAbilityUsed.playerDebuff) {
          // Apply player debuff via debuffs array below
          skillDebuff = { atk: enemyAbilityUsed.playerDebuff.atk || 0, def: enemyAbilityUsed.playerDebuff.def || 0, turns: enemyAbilityUsed.playerDebuff.turns };
        }
        if (enemyAbilityUsed.type !== 'attack' && !enemyAbilityUsed.damage) {
          // Still does normal attack
          const normalDmg = Math.max(1, eAtk + enemyRoll - pDef);
          newPlayerHp -= normalDmg;
          newLog.push(`🎲 ${enemy.icon}: d20=${enemyRoll} → ${normalDmg} seb.`);
          newFloats.push({ value: `-${normalDmg}`, type: 'player' });
          setShakePlayer(true);
          setTimeout(() => setShakePlayer(false), 300);
        }
      } else {
        // Normal enemy attack
        const enemyDmg = Math.max(1, eAtk + enemyRoll - pDef);
        newPlayerHp -= enemyDmg;
        newLog.push(`🎲 ${enemy.icon}: d20=${enemyRoll} → ${enemyDmg} seb.`);
        newFloats.push({ value: `-${enemyDmg}`, type: 'player' });
        setShakePlayer(true);
        setTimeout(() => setShakePlayer(false), 300);
      }
    }

    // Tick buffs/debuffs
    const newBuffs = combat.buffs.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0);
    const newDebuffs = combat.debuffs.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0);
    if (skillBuff) newBuffs.push(skillBuff);
    if (skillDebuff && !enemyAbilityUsed?.playerDebuff) newDebuffs.push(skillDebuff);
    if (enemyAbilityUsed?.playerDebuff) {
      newDebuffs.push({ name: enemyAbilityUsed.name, atk: enemyAbilityUsed.playerDebuff.atk || 0, def: enemyAbilityUsed.playerDebuff.def || 0, turns: enemyAbilityUsed.playerDebuff.turns });
    }

    // Tick cooldowns
    const newCooldowns = { ...combat.cooldowns };
    Object.keys(newCooldowns).forEach(k => { if (newCooldowns[k] > 0) newCooldowns[k]--; });

    const finished = newEnemyHp <= 0 || newPlayerHp <= 0;
    const result = newEnemyHp <= 0 ? 'win' as const : newPlayerHp <= 0 ? 'lose' as const : null;

    let droppedItem: string | null = null;
    if (result === 'win') {
      const comboBonus = Math.floor(newCombo * 2);
      const xpMult = character ? getXpMultiplier(character.prestige) : 1;
      const scaledXp = Math.floor(enemy.xpReward * xpMult);
      newLog.push(`🏆 Győzelem! +${scaledXp} XP${xpMult > 1 ? ` (×${xpMult.toFixed(1)})` : ''}, +${enemy.goldReward + comboBonus}💰 ${comboBonus > 0 ? `(combo bónusz: +${comboBonus}💰)` : ''}`);
      const loot = rollLoot(enemy.level, enemy.locationType);
      if (loot) {
        const saved = await saveLoot(loot, character);
        if (saved) {
          droppedItem = loot.name;
          newLog.push(`🎁 Drop: ${loot.icon} ${loot.name} (${loot.rarity})!`);
        } else {
          newLog.push(`⚠️ Drop mentési hiba: ${loot.name}`);
        }
      }
    }
    if (result === 'lose') newLog.push('💀 Vereség...');

    // Apply floating damage
    newFloats.forEach(f => addFloat(f.value, f.type));

    setCombat(prev => prev ? {
      ...prev,
      playerHp: Math.max(0, newPlayerHp),
      playerMp: prev.playerMp,
      enemyHp: Math.max(0, newEnemyHp),
      log: [...prev.log, `--- ${prev.turn}. kör ---`, ...newLog],
      turn: prev.turn + 1,
      finished, result,
      cooldowns: newCooldowns,
      buffs: newBuffs,
      debuffs: newDebuffs,
      enemyBuffs: newEnemyBuffs,
      droppedItem,
      combo: newCombo,
      lastHit: playerHit,
    } : null);

    if (result === 'win') await applyRewards(enemy, newCombo);
    if (result === 'lose') await applyLoss();
    setTimeout(() => setRolling(false), 600);
  };

  const doTurn = useCallback(() => { void executeTurn(); }, [combat, character, enemy, items]);

  const useSkill = (skill: SkillDef) => {
    if (!combat || !character) return;
    if ((combat.cooldowns[skill.id] || 0) > 0) { toast.error(`${skill.name} lehűlés alatt!`); return; }
    if (combat.playerMp < skill.mpCost) { toast.error('Nincs elég manád!'); return; }

    const eqStats = getEquippedStats(items);
    const bt = getBuffTotals(combat.buffs);
    const pAtk = character.atk + eqStats.atk + bt.atk;
    const pDef = character.def + eqStats.def + bt.def;
    const result = skill.effect(pAtk, pDef);

    setCombat(prev => prev ? ({
      ...prev,
      playerMp: prev.playerMp - skill.mpCost,
      cooldowns: { ...prev.cooldowns, [skill.id]: skill.cooldown },
    }) : null);

    void executeTurn(
      result.damage,
      result.heal,
      result.selfBuff as any,
      result.debuff as any,
      `${skill.icon} ${skill.name}`
    );
  };

  const saveLoot = async (loot: any, char: GameCharacter): Promise<boolean> => {
    const { data, error } = await supabase.from('inventory_items').insert({
      character_id: char.id,
      name: loot.name, type: loot.type, rarity: loot.rarity, icon: loot.icon,
      description: loot.description, atk: loot.atk, def: loot.def, spd: loot.spd,
      hp_bonus: loot.hp_bonus, mp_bonus: loot.mp_bonus, crit_chance: loot.crit_chance,
      set_name: loot.set_name, sell_price: loot.rarity === 'legendary' ? 100 : loot.rarity === 'epic' ? 60 : loot.rarity === 'rare' ? 30 : 10,
    }).select('*').single();

    if (error) {
      console.error('Loot insert hiba:', error.message, loot);
      toast.error(`A loot mentése sikertelen: ${loot.name}`);
      return false;
    }

    if (data) {
      setItems(prev => [...prev, data as InventoryItem]);
    }

    return true;
  };

  const applyRewards = async (e: EnemyDef, comboCount: number) => {
    if (!character) return;
    const comboBonus = Math.floor(comboCount * 2);
    const xpMult = getXpMultiplier(character.prestige);
    const scaledXp = Math.floor(e.xpReward * xpMult);
    const maxLvl = getMaxLevel(character.prestige);
    const newXp = character.xp + scaledXp;
    const xpNeeded = character.level * 100;
    const canLevelUp = character.level < maxLvl;
    const levelUp = canLevelUp && newXp >= xpNeeded;
    const updates: any = { xp: levelUp ? newXp - xpNeeded : (canLevelUp ? newXp : Math.min(newXp, xpNeeded - 1)), gold: character.gold + e.goldReward + comboBonus };
    if (levelUp) {
      updates.level = character.level + 1;
      updates.perk_points = character.perk_points + 1;
      updates.max_hp = character.max_hp + 10;
      updates.max_mp = character.max_mp + 5;
      updates.hp = character.max_hp + 10;
      updates.mp = character.max_mp + 5;
      toast.success(`Szintlépés! Lv.${character.level + 1}!`);
    }
    await supabase.from('characters').update(updates).eq('id', character.id);
    await supabase.from('combat_log').insert({
      character_id: character.id, location_id: locationId || null,
      enemy_name: e.name, enemy_level: e.level, result: 'win',
      xp_gained: scaledXp, gold_gained: e.goldReward + comboBonus,
    });
  };

  const applyLoss = async () => {
    if (!character) return;
    await supabase.from('characters').update({ hp: Math.max(1, character.hp - Math.floor(character.max_hp * 0.3)) }).eq('id', character.id);
    await supabase.from('combat_log').insert({
      character_id: character.id, location_id: locationId || null,
      enemy_name: enemy?.name || 'Unknown', enemy_level: enemy?.level || 1,
      result: 'lose', xp_gained: 0, gold_gained: 0,
    });
  };

  const usePotion = async () => {
    if (!character || !combat || combat.finished) return;
    const potion = items.find(i => i.type === 'potion' && i.hp_bonus > 0);
    if (!potion) { toast.error('Nincs gyógyitalod!'); return; }
    const heal = Math.min(potion.hp_bonus, character.max_hp - combat.playerHp);
    addFloat(`+${heal} HP`, 'heal');
    setCombat(prev => prev ? { ...prev, playerHp: prev.playerHp + heal, log: [...prev.log, `🧪 +${heal} HP`] } : null);
    await supabase.from('inventory_items').delete().eq('id', potion.id);
    setItems(prev => prev.filter(i => i.id !== potion.id));
  };

  if (!combat || !enemy || !character) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold font-display animate-pulse-glow text-xl">Betöltés...</div></div>;
  }

  const eqStats = getEquippedStats(items);
  const totalHp = character.max_hp + eqStats.hp;
  const totalMp = character.max_mp + eqStats.mp;
  const hpPercent = (combat.playerHp / totalHp) * 100;
  const mpPercent = (combat.playerMp / totalMp) * 100;
  const enemyHpPercent = (combat.enemyHp / combat.enemyMaxHp) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-base text-gold text-glow-gold">
          <Swords className="w-4 h-4 inline mr-1" />{location?.name || 'Harc'}
        </h1>
        {combat.combo > 0 && (
          <motion.div
            key={combat.combo}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ml-auto font-display text-sm text-gold"
          >
            🔥 {combat.combo}x Combo
          </motion.div>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3">
        {/* Pokemon-style Battle Arena */}
        <div className="flex-1">
          <PokemonBattleScene
            playerClass={character.class}
            player={{ name: character.name, level: character.level, hp: combat.playerHp, maxHp: totalHp, mp: combat.playerMp, maxMp: totalMp }}
            enemyName={enemy.name}
            enemyIcon={enemy.icon}
            enemyLevel={enemy.level}
            enemyHp={combat.enemyHp}
            enemyMaxHp={combat.enemyMaxHp}
            attackingSide={rolling ? 'player' : null}
            shakePlayer={shakePlayer}
            shakeEnemy={shakeEnemy}
            enemyDefeated={combat.enemyHp <= 0}
            playerDefeated={combat.playerHp <= 0}
            locationType={enemy.locationType}
            world={enemy.world}
            playerBadges={combat.buffs.length > 0 ? combat.buffs.map((b, i) => (
              <span key={i} className="text-[8px] bg-nature/20 text-nature px-1.5 py-0.5 rounded font-display">
                {b.atk > 0 && `+${b.atk}A `}{b.def > 0 && `+${b.def}D `}{b.crit > 0 && `+${b.crit}%C `}({b.turns}t)
              </span>
            )) : null}
            enemyBadges={(combat.enemyBuffs.length > 0 || combat.debuffs.length > 0) ? (
              <>
                {combat.enemyBuffs.map((b, i) => (
                  <span key={`eb${i}`} className="text-[8px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-display">
                    {b.name || 'Buff'} ({b.turns}t)
                  </span>
                ))}
                {combat.debuffs.map((d, i) => (
                  <span key={`d${i}`} className="text-[8px] bg-mana/20 text-mana px-1.5 py-0.5 rounded font-display">
                    {d.atk !== 0 && `ATK${d.atk} `}{d.def !== 0 && `DEF${d.def} `}({d.turns}t)
                  </span>
                ))}
              </>
            ) : null}
            floatingNumbers={
              <AnimatePresence>
                {combat.floatingDmg.map(f => (
                  <div key={f.id} className="absolute top-1/2 left-1/2 z-50" style={{ transform: `translate(${f.x}px, ${f.y}px)` }}>
                    <FloatingNumber value={f.value} type={f.type} />
                  </div>
                ))}
              </AnimatePresence>
            }
            dialogue={
              combat.finished
                ? combat.result === 'win'
                  ? `🏆 Győztél! +${enemy.xpReward} XP · +${enemy.goldReward + Math.floor(combat.combo * 2)} 💰${combat.droppedItem ? ` · 🎁 ${combat.droppedItem}` : ''}`
                  : `💀 Vereséget szenvedtél a ${enemy.name} ellen...`
                : combat.log[combat.log.length - 1] || `Mit teszel? Kör ${combat.turn}${combat.combo > 0 ? ` · 🔥 ${combat.combo}x Combo` : ''}`
            }
            actionMenu={
              !combat.finished ? (
                <div className="space-y-1.5">
                  {selectedAction !== 'skills' ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={doTurn}
                        disabled={rolling}
                        className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow disabled:opacity-40"
                      >
                        <Dice6 className="w-4 h-4 text-ember" />
                        <span className="font-display text-[11px] text-foreground">Támadás</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedAction('skills')}
                        disabled={rolling || availableSkills.length === 0}
                        className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow disabled:opacity-40"
                      >
                        <Zap className="w-4 h-4 text-mana" />
                        <span className="font-display text-[11px] text-foreground">Képesség</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={usePotion}
                        disabled={rolling || !items.some(i => i.type === 'potion' && i.hp_bonus > 0)}
                        className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow disabled:opacity-40"
                      >
                        <Heart className="w-4 h-4 text-blood" />
                        <span className="font-display text-[11px] text-foreground">
                          Ital ({items.filter(i => i.type === 'potion' && i.hp_bonus > 0).length})
                        </span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate('/lobby')}
                        className="rpg-panel p-2 flex items-center gap-1.5 cursor-pointer hover:border-glow"
                      >
                        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                        <span className="font-display text-[11px] text-foreground">Menekülés</span>
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[10px] text-gold">⚡ Képességek</span>
                        <button
                          onClick={() => setSelectedAction(null)}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          ← Vissza
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1 max-h-[100px] overflow-y-auto">
                        {availableSkills.map(skill => {
                          const cd = combat.cooldowns[skill.id] || 0;
                          const canUse = cd === 0 && combat.playerMp >= skill.mpCost;
                          return (
                            <button
                              key={skill.id}
                              onClick={() => canUse && useSkill(skill)}
                              disabled={!canUse || rolling}
                              className={`rpg-panel p-1.5 text-left flex items-center gap-1.5 ${canUse ? 'hover:border-glow cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                              title={skill.description}
                            >
                              <span className="text-sm">{skill.icon}</span>
                              <span className="font-display text-[10px] text-foreground flex-1 truncate">{skill.name}</span>
                              <span className="text-[9px] text-mana">{skill.mpCost}MP</span>
                              {cd > 0 && <span className="text-[9px] text-destructive">CD{cd}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <Button onClick={() => loadData()} size="sm" className="font-display text-xs">
                    <Swords className="w-3 h-3 mr-1" /> Új harc
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/lobby')} className="font-display text-xs">
                    Vissza
                  </Button>
                </div>
              )
            }
          />
        </div>

        {/* Combat Log */}
        <div className="lg:w-72 rpg-panel flex flex-col max-h-[500px]">
          <div className="p-2 border-b border-border">
            <h3 className="font-display text-xs text-gold">📜 Harc Napló</h3>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {combat.log.map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={`text-[10px] leading-tight ${line.includes('KRIT') ? 'text-gold font-bold' : line.includes('Győzelem') ? 'text-nature font-bold' : line.includes('Vereség') ? 'text-blood font-bold' : line.includes('Drop') ? 'text-shadow font-bold' : line.includes('⚡') ? 'text-mana' : line.includes('💚') ? 'text-nature' : line.includes('COMBO') ? 'text-gold' : line.includes('💥') || line.includes('Megvadult') || line.includes('BOSS') ? 'text-destructive font-bold' : line.startsWith('---') ? 'text-muted-foreground/50 text-[8px]' : 'text-foreground/70'}`}>
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