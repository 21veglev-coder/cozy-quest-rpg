import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameCharacter, InventoryItem, EnemyDef, ENEMIES, GameLocation, SET_BONUSES, SKILLS, SkillDef, rollLoot, RARITY_COLORS } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Dice6, Heart, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface CombatState {
  playerHp: number;
  playerMp: number;
  enemyHp: number;
  enemyAtk: number;
  enemyDef: number;
  log: string[];
  turn: number;
  finished: boolean;
  result: 'win' | 'lose' | null;
  cooldowns: Record<string, number>;
  buffs: { atk: number; def: number; spd: number; crit: number; turns: number }[];
  debuffs: { atk: number; def: number; turns: number }[];
  droppedItem: string | null;
}

const rollDice = (sides: number) => Math.floor(Math.random() * sides) + 1;

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

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    const char = charRes.data as unknown as GameCharacter;
    setCharacter(char);
    const itemsRes = await supabase.from('inventory_items').select('*').eq('character_id', char.id);
    if (itemsRes.data) setItems(itemsRes.data as InventoryItem[]);

    // Load skills for class/subclass
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
        enemyHp: picked.hp, enemyAtk: picked.atk, enemyDef: picked.def,
        log: [`${picked.icon} ${picked.name} (Lv.${picked.level}) jelent meg!`],
        turn: 1, finished: false, result: null,
        cooldowns: {}, buffs: [], debuffs: [], droppedItem: null,
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

  const executeTurn = (extraDmg?: number, heal?: number, skillBuff?: CombatState['buffs'][0], skillDebuff?: CombatState['debuffs'][0], skillName?: string) => {
    if (!combat || !character || !enemy || combat.finished) return;
    setRolling(true);
    const eqStats = getEquippedStats(items);
    const bt = getBuffTotals(combat.buffs);
    const dt = getDebuffTotals(combat.debuffs);

    const pAtk = character.atk + eqStats.atk + bt.atk;
    const pDef = character.def + eqStats.def + bt.def;
    const pCrit = character.crit_chance + eqStats.crit + bt.crit;
    const eAtk = combat.enemyAtk + dt.atk; // debuffs reduce enemy atk
    const eDef = combat.enemyDef + dt.def;

    const playerRoll = rollDice(20);
    const enemyRoll = rollDice(20);
    const isCrit = rollDice(100) <= pCrit;

    let playerDmg = extraDmg ? extraDmg : Math.max(1, pAtk + playerRoll - Math.max(0, eDef));
    if (!extraDmg && isCrit) playerDmg = Math.floor(playerDmg * 1.5);
    if (extraDmg && isCrit) playerDmg = Math.floor(playerDmg * 1.3);
    const enemyDmg = Math.max(1, Math.max(0, eAtk) + enemyRoll - pDef);

    const newLog: string[] = [];
    let newEnemyHp = combat.enemyHp;
    let newPlayerHp = combat.playerHp;

    if (skillName) newLog.push(`⚡ ${skillName}!`);
    if (heal && heal > 0) {
      const actualHeal = Math.min(heal, (character.max_hp + eqStats.hp) - combat.playerHp);
      newPlayerHp += actualHeal;
      newLog.push(`💚 +${actualHeal} HP gyógyítva`);
    }

    newLog.push(`🎲 Te: ${extraDmg ? playerDmg : playerRoll} → ${playerDmg} seb.${isCrit ? ' 💥 KRIT!' : ''}`);
    newEnemyHp -= playerDmg;
    if (newEnemyHp > 0) {
      newLog.push(`🎲 ${enemy.icon}: ${enemyRoll} → ${enemyDmg} seb.`);
      newPlayerHp -= enemyDmg;
    }

    // Tick buffs/debuffs
    const newBuffs = combat.buffs.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0);
    const newDebuffs = combat.debuffs.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0);
    if (skillBuff) newBuffs.push(skillBuff);
    if (skillDebuff) newDebuffs.push(skillDebuff);

    // Tick cooldowns
    const newCooldowns = { ...combat.cooldowns };
    Object.keys(newCooldowns).forEach(k => { if (newCooldowns[k] > 0) newCooldowns[k]--; });

    const finished = newEnemyHp <= 0 || newPlayerHp <= 0;
    const result = newEnemyHp <= 0 ? 'win' as const : newPlayerHp <= 0 ? 'lose' as const : null;

    let droppedItem: string | null = null;
    if (result === 'win') {
      newLog.push(`🏆 Győzelem! +${enemy.xpReward} XP, +${enemy.goldReward}💰`);
      const loot = rollLoot(enemy.level, enemy.locationType);
      if (loot) {
        droppedItem = loot.name;
        newLog.push(`🎁 Drop: ${loot.icon} ${loot.name} (${loot.rarity})!`);
        saveLoot(loot, character);
      }
    }
    if (result === 'lose') newLog.push('💀 Vereség...');

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
      droppedItem,
    } : null);

    if (result === 'win') applyRewards(enemy);
    if (result === 'lose') applyLoss();
    setTimeout(() => setRolling(false), 500);
  };

  const doTurn = useCallback(() => executeTurn(), [combat, character, enemy, items]);

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

    executeTurn(
      result.damage,
      result.heal,
      result.selfBuff as any,
      result.debuff as any,
      `${skill.icon} ${skill.name}`
    );
  };

  const saveLoot = async (loot: any, char: GameCharacter) => {
    await supabase.from('inventory_items').insert({
      character_id: char.id,
      name: loot.name, type: loot.type, rarity: loot.rarity, icon: loot.icon,
      description: loot.description, atk: loot.atk, def: loot.def, spd: loot.spd,
      hp_bonus: loot.hp_bonus, mp_bonus: loot.mp_bonus, crit_chance: loot.crit_chance,
      set_name: loot.set_name, sell_price: loot.rarity === 'legendary' ? 100 : loot.rarity === 'epic' ? 60 : loot.rarity === 'rare' ? 30 : 10,
    });
  };

  const applyRewards = async (e: EnemyDef) => {
    if (!character) return;
    const newXp = character.xp + e.xpReward;
    const xpNeeded = character.level * 100;
    const levelUp = newXp >= xpNeeded;
    const updates: any = { xp: levelUp ? newXp - xpNeeded : newXp, gold: character.gold + e.goldReward };
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
      xp_gained: e.xpReward, gold_gained: e.goldReward,
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
    setCombat(prev => prev ? { ...prev, playerHp: prev.playerHp + heal, log: [...prev.log, `🧪 +${heal} HP`] } : null);
    await supabase.from('inventory_items').delete().eq('id', potion.id);
    setItems(prev => prev.filter(i => i.id !== potion.id));
  };

  if (!combat || !enemy || !character) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold font-display animate-pulse-glow">Betöltés...</div></div>;
  }

  const eqStats = getEquippedStats(items);
  const totalHp = character.max_hp + eqStats.hp;
  const bt = getBuffTotals(combat.buffs);

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
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Enemy */}
          <motion.div className="rpg-panel p-6 text-center w-64" animate={combat.enemyHp <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}>
            <div className="text-5xl mb-2">{enemy.icon}</div>
            <p className="font-display text-foreground">{enemy.name}</p>
            <p className="text-xs text-muted-foreground mb-2">Lv.{enemy.level}</p>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-blood rounded-full" animate={{ width: `${(combat.enemyHp / enemy.hp) * 100}%` }} />
            </div>
            <p className="text-xs text-blood mt-1">{combat.enemyHp}/{enemy.hp} HP</p>
            {combat.debuffs.length > 0 && (
              <div className="flex justify-center gap-1 mt-1">
                {combat.debuffs.map((d, i) => (
                  <span key={i} className="text-[9px] text-destructive bg-destructive/10 px-1 rounded">
                    {d.atk !== 0 && `ATK${d.atk}`} {d.def !== 0 && `DEF${d.def}`} ({d.turns}t)
                  </span>
                ))}
              </div>
            )}
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
            <div className="h-2 bg-secondary rounded-full overflow-hidden mt-1">
              <motion.div className="h-full bg-mana rounded-full" animate={{ width: `${(combat.playerMp / (character.max_mp + eqStats.mp)) * 100}%` }} />
            </div>
            <p className="text-[10px] text-mana mt-0.5">{combat.playerMp}/{character.max_mp + eqStats.mp} MP</p>
            {combat.buffs.length > 0 && (
              <div className="flex justify-center gap-1 mt-1 flex-wrap">
                {combat.buffs.map((b, i) => (
                  <span key={i} className="text-[9px] text-nature bg-nature/10 px-1 rounded">
                    {b.atk > 0 && `+${b.atk}A`} {b.def > 0 && `+${b.def}D`} {b.crit > 0 && `+${b.crit}%C`} ({b.turns}t)
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-2 w-full max-w-sm">
            {!combat.finished ? (
              <>
                <div className="flex gap-2 w-full">
                  <Button onClick={doTurn} disabled={rolling} className="flex-1 font-display glow-ember">
                    <Dice6 className="w-4 h-4 mr-1" /> Támadás
                  </Button>
                  <Button variant="outline" onClick={usePotion} className="font-display">
                    <Heart className="w-4 h-4 mr-1 text-blood" /> Ital
                  </Button>
                </div>
                {/* Skills */}
                {availableSkills.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {availableSkills.map(skill => {
                      const cd = combat.cooldowns[skill.id] || 0;
                      const canUse = cd === 0 && combat.playerMp >= skill.mpCost;
                      return (
                        <Button key={skill.id} size="sm" variant="outline"
                          className={`font-display text-[10px] h-8 ${canUse ? 'hover:border-gold/50 hover:text-gold' : 'opacity-40'}`}
                          disabled={!canUse || rolling}
                          onClick={() => useSkill(skill)}
                          title={`${skill.description} (${skill.mpCost} MP, ${skill.cooldown}t CD)`}>
                          <span className="mr-1">{skill.icon}</span>
                          {skill.name}
                          {cd > 0 && <span className="ml-1 text-destructive">({cd})</span>}
                          <span className="ml-auto text-mana text-[8px]">{skill.mpCost}MP</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Button onClick={() => loadData()} className="font-display">
                  <Swords className="w-4 h-4 mr-1" /> Új harc
                </Button>
                <Button variant="outline" onClick={() => navigate('/lobby')} className="font-display">Vissza</Button>
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
                className={`text-xs ${line.includes('KRIT') ? 'text-gold font-bold' : line.includes('Győzelem') ? 'text-nature font-bold' : line.includes('Vereség') ? 'text-blood font-bold' : line.includes('Drop') ? 'text-shadow font-bold' : line.includes('⚡') ? 'text-mana' : line.includes('💚') ? 'text-nature' : 'text-foreground/70'}`}>
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
