import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameCharacter, InventoryItem, ENEMIES, ENEMY_ABILITIES, EnemyDef, GameLocation, SET_BONUSES, SKILLS, SkillDef, rollLoot } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Dice6, Heart, ChevronDown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import PokemonBattleScene from '@/components/PokemonBattleScene';

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

interface BattleState {
  cooldowns: Record<string, number>;
  buffs: { atk: number; def: number; spd: number; crit: number; turns: number }[];
  debuffs: { atk: number; def: number; turns: number }[];
  enemyAtk: number;
  enemyDef: number;
}

const Dungeon = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [location, setLocation] = useState<GameLocation | null>(null);
  const [floor, setFloor] = useState(1);
  const [maxFloors] = useState(5);
  const [enemy, setEnemy] = useState<EnemyDef | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMp, setPlayerMp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [battleActive, setBattleActive] = useState(false);
  const [dungeonComplete, setDungeonComplete] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<SkillDef[]>([]);
  const [bs, setBs] = useState<BattleState>({ cooldowns: {}, buffs: [], debuffs: [], enemyAtk: 0, enemyDef: 0 });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    const char = charRes.data as unknown as GameCharacter;
    setCharacter(char);
    setPlayerHp(char.hp);
    setPlayerMp(char.mp);
    const itemsRes = await supabase.from('inventory_items').select('*').eq('character_id', char.id);
    if (itemsRes.data) setItems(itemsRes.data as InventoryItem[]);
    const skills = SKILLS.filter(s => s.classReq === char.class && (s.subclassReq === null || s.subclassReq === char.subclass));
    setAvailableSkills(skills);
    if (locationId) {
      const locRes = await supabase.from('locations').select('*').eq('id', locationId).single();
      if (locRes.data) {
        setLocation(locRes.data as any);
        setLog([`🏰 Beléptél: ${(locRes.data as any).name}`]);
      }
    }
  };

  const spawnEnemy = useCallback(() => {
    if (!location) return;
    const isRaid = location.type === 'raid';
    const w = (location as any).world || 1;
    const pool = ENEMIES.filter(e =>
      (isRaid ? e.locationType === 'raid' : e.locationType === 'dungeon') &&
      e.minZoneLevel <= location.level_req + 2 &&
      (!e.world || e.world === w)
    );
    if (pool.length === 0) return;
    const isBoss = floor === maxFloors;
    const isMiniBoss = floor === maxFloors - 1;
    let picked: EnemyDef;
    if (isBoss) {
      picked = pool.reduce((a, b) => a.level > b.level ? a : b);
      picked = { ...picked, hp: Math.floor(picked.hp * 1.5), atk: Math.floor(picked.atk * 1.3), name: `👑 ${picked.name} (Boss)` };
    } else if (isMiniBoss) {
      // Mini-boss: second strongest enemy with enhanced stats and extra abilities
      const sorted = [...pool].sort((a, b) => b.level - a.level);
      const base = sorted.length > 1 ? sorted[1] : sorted[0];
      picked = {
        ...base,
        hp: Math.floor(base.hp * 1.25),
        atk: Math.floor(base.atk * 1.15),
        def: Math.floor(base.def * 1.2),
        xpReward: Math.floor(base.xpReward * 1.5),
        goldReward: Math.floor(base.goldReward * 1.5),
        name: `⚔️ ${base.name} (Mini-Boss)`,
        abilities: [
          ...(base.abilities || []),
          ENEMY_ABILITIES.enrage,
          ENEMY_ABILITIES.heal_self,
        ],
      };
    } else {
      picked = pool[Math.floor(Math.random() * pool.length)];
      picked = { ...picked, hp: picked.hp + floor * 10, atk: picked.atk + floor };
    }
    setEnemy(picked);
    setEnemyHp(picked.hp);
    setBattleActive(true);
    setBs({ cooldowns: {}, buffs: [], debuffs: [], enemyAtk: picked.atk, enemyDef: picked.def });
    const floorLabel = isBoss ? '🔥 BOSS SZINT' : isMiniBoss ? '⚔️ MINI-BOSS SZINT' : `${floor}. szint`;
    setLog(prev => [...prev, `--- ${floorLabel} ---`, `${picked.icon} ${picked.name} (Lv.${picked.level}) jelent meg!`]);
  }, [floor, location, maxFloors]);

  useEffect(() => {
    if (location && !battleActive && !dungeonComplete && character) spawnEnemy();
  }, [location, floor, character]);

  const executeTurn = (extraDmg?: number, heal?: number, skillBuff?: any, skillDebuff?: any, skillName?: string) => {
    if (!enemy || !character || !battleActive) return;
    const eqStats = getEquippedStats(items);
    const bt = { atk: 0, def: 0, crit: 0 };
    bs.buffs.filter(b => b.turns > 0).forEach(b => { bt.atk += b.atk || 0; bt.def += b.def || 0; bt.crit += b.crit || 0; });
    const dt = { atk: 0, def: 0 };
    bs.debuffs.filter(d => d.turns > 0).forEach(d => { dt.atk += d.atk || 0; dt.def += d.def || 0; });

    const pAtk = character.atk + eqStats.atk + bt.atk;
    const pDef = character.def + eqStats.def + bt.def;
    const pCrit = character.crit_chance + eqStats.crit + bt.crit;
    const eAtk = bs.enemyAtk + dt.atk;
    const eDef = bs.enemyDef + dt.def;

    const pRoll = rollDice(20);
    const eRoll = rollDice(20);
    const isCrit = rollDice(100) <= pCrit;
    let pDmg = extraDmg || Math.max(1, pAtk + pRoll - Math.max(0, eDef));
    if (isCrit) pDmg = Math.floor(pDmg * (extraDmg ? 1.3 : 1.5));
    const eDmg = Math.max(1, Math.max(0, eAtk) + eRoll - pDef);

    const newLog: string[] = [];
    let newEHp = enemyHp;
    let newPHp = playerHp;

    if (skillName) newLog.push(`⚡ ${skillName}!`);
    if (heal && heal > 0) {
      const h = Math.min(heal, character.max_hp + eqStats.hp - playerHp);
      newPHp += h;
      newLog.push(`💚 +${h} HP`);
    }

    newLog.push(`🎲 Te: ${pRoll} → ${pDmg} seb.${isCrit ? ' 💥 KRIT!' : ''}`);
    newEHp -= pDmg;
    if (newEHp > 0) {
      newLog.push(`🎲 ${enemy.icon}: ${eRoll} → ${eDmg} seb.`);
      newPHp -= eDmg;
    }

    setEnemyHp(Math.max(0, newEHp));
    setPlayerHp(Math.max(0, newPHp));
    setLog(prev => [...prev, ...newLog]);

    // Update battle state
    const newBuffs = bs.buffs.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0);
    const newDebuffs = bs.debuffs.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0);
    if (skillBuff) newBuffs.push(skillBuff);
    if (skillDebuff) newDebuffs.push(skillDebuff);
    const newCd = { ...bs.cooldowns };
    Object.keys(newCd).forEach(k => { if (newCd[k] > 0) newCd[k]--; });
    setBs({ ...bs, cooldowns: newCd, buffs: newBuffs, debuffs: newDebuffs });

    if (newEHp <= 0) {
      const loot = rollLoot(enemy.level, enemy.locationType);
      setLog(prev => [...prev, `🏆 ${enemy.name} legyőzve! +${enemy.xpReward} XP, +${enemy.goldReward}💰`]);
      if (loot) {
        setLog(prev => [...prev, `🎁 Drop: ${loot.icon} ${loot.name} (${loot.rarity})!`]);
        saveLoot(loot);
      }
      setBattleActive(false);
      applyFloorReward(enemy);
      if (floor >= maxFloors) {
        setDungeonComplete(true);
        setLog(prev => [...prev, '🎉 Dungeon teljesítve!']);
        saveDungeonProgress();
      }
    }
    if (newPHp <= 0) {
      setLog(prev => [...prev, '💀 Meghaltál a dungeonban...']);
      setBattleActive(false);
      setDungeonComplete(true);
      applyDungeonLoss();
    }
  };

  const doTurn = () => executeTurn();

  const useSkill = (skill: SkillDef) => {
    if ((bs.cooldowns[skill.id] || 0) > 0) { toast.error('Lehűlés alatt!'); return; }
    if (playerMp < skill.mpCost) { toast.error('Nincs elég manád!'); return; }
    const eqStats = getEquippedStats(items);
    const bt = { atk: 0, def: 0 };
    bs.buffs.filter(b => b.turns > 0).forEach(b => { bt.atk += b.atk || 0; bt.def += b.def || 0; });
    const pAtk = character!.atk + eqStats.atk + bt.atk;
    const pDef = character!.def + eqStats.def + bt.def;
    const result = skill.effect(pAtk, pDef);

    setPlayerMp(prev => prev - skill.mpCost);
    setBs(prev => ({ ...prev, cooldowns: { ...prev.cooldowns, [skill.id]: skill.cooldown } }));
    executeTurn(result.damage, result.heal, result.selfBuff, result.debuff, `${skill.icon} ${skill.name}`);
  };

  const saveLoot = async (loot: any) => {
    if (!character) return;
    await supabase.from('inventory_items').insert({
      character_id: character.id,
      name: loot.name, type: loot.type, rarity: loot.rarity, icon: loot.icon,
      description: loot.description, atk: loot.atk, def: loot.def, spd: loot.spd,
      hp_bonus: loot.hp_bonus, mp_bonus: loot.mp_bonus, crit_chance: loot.crit_chance,
      set_name: loot.set_name, sell_price: loot.rarity === 'legendary' ? 100 : loot.rarity === 'epic' ? 60 : 30,
    });
  };

  const applyFloorReward = async (e: EnemyDef) => {
    if (!character) return;
    await supabase.from('characters').update({
      xp: character.xp + e.xpReward, gold: character.gold + e.goldReward,
    }).eq('id', character.id);
  };

  const applyDungeonLoss = async () => {
    if (!character) return;
    await supabase.from('characters').update({ hp: Math.max(1, Math.floor(character.max_hp * 0.2)) }).eq('id', character.id);
  };

  const saveDungeonProgress = async () => {
    if (!character || !locationId) return;
    await supabase.from('dungeon_progress').upsert({
      character_id: character.id, location_id: locationId,
      current_floor: maxFloors, max_floor: maxFloors, completed: true,
    }, { onConflict: 'character_id,location_id' });
  };

  const nextFloor = () => setFloor(f => f + 1);

  const usePotion = async () => {
    if (!character) return;
    const potion = items.find(i => i.type === 'potion' && i.hp_bonus > 0);
    if (!potion) { toast.error('Nincs gyógyitalod!'); return; }
    const heal = Math.min(potion.hp_bonus, character.max_hp - playerHp);
    setPlayerHp(prev => prev + heal);
    setLog(prev => [...prev, `🧪 +${heal} HP`]);
    await supabase.from('inventory_items').delete().eq('id', potion.id);
    setItems(prev => prev.filter(i => i.id !== potion.id));
  };

  if (!character || !location) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold font-display animate-pulse-glow">Betöltés...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">{location.icon} {location.name}</h1>
        <span className="ml-auto text-xs text-muted-foreground font-display">{floor}/{maxFloors}. szint</span>
      </header>

      <div className="px-4 pt-4">
        <div className="flex gap-1">
          {Array.from({ length: maxFloors }, (_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i < floor ? (dungeonComplete && playerHp <= 0 ? 'bg-blood' : 'bg-gold') : 'bg-secondary'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {enemy && (
            <motion.div className="rpg-panel p-5 text-center w-56" animate={enemyHp <= 0 ? { opacity: 0.3 } : {}}>
              <div className="text-4xl mb-1">{enemy.icon}</div>
              <p className="font-display text-sm">{enemy.name}</p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                <motion.div className="h-full bg-blood rounded-full" animate={{ width: `${(enemyHp / enemy.hp) * 100}%` }} />
              </div>
              <p className="text-[10px] text-blood mt-1">{enemyHp}/{enemy.hp}</p>
              {bs.debuffs.length > 0 && (
                <div className="flex justify-center gap-1 mt-1">
                  {bs.debuffs.map((d, i) => (
                    <span key={i} className="text-[8px] text-destructive bg-destructive/10 px-1 rounded">
                      {d.atk !== 0 && `A${d.atk}`}{d.def !== 0 && `D${d.def}`}({d.turns}t)
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <div className="text-xl text-gold">⚔️</div>

          <div className="rpg-panel-gold p-4 text-center w-56">
            <p className="font-display text-sm text-gold">{character.name}</p>
            <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
              <motion.div className="h-full bg-nature rounded-full" animate={{ width: `${(playerHp / character.max_hp) * 100}%` }} />
            </div>
            <p className="text-[10px] text-nature mt-1">{playerHp}/{character.max_hp}</p>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
              <motion.div className="h-full bg-mana rounded-full" animate={{ width: `${(playerMp / character.max_mp) * 100}%` }} />
            </div>
            <p className="text-[9px] text-mana mt-0.5">{playerMp}/{character.max_mp} MP</p>
            {bs.buffs.length > 0 && (
              <div className="flex justify-center gap-1 mt-1 flex-wrap">
                {bs.buffs.map((b, i) => (
                  <span key={i} className="text-[8px] text-nature bg-nature/10 px-1 rounded">
                    {b.atk > 0 && `+${b.atk}A`}{b.def > 0 && `+${b.def}D`}{b.crit > 0 && `+${b.crit}%C`}({b.turns}t)
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            {battleActive ? (
              <>
                <div className="flex gap-2 w-full">
                  <Button onClick={doTurn} className="flex-1 font-display"><Dice6 className="w-4 h-4 mr-1" /> Támadás</Button>
                  <Button variant="outline" onClick={usePotion} className="font-display"><Heart className="w-4 h-4 mr-1 text-blood" /> Ital</Button>
                </div>
                {availableSkills.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 w-full">
                    {availableSkills.map(skill => {
                      const cd = bs.cooldowns[skill.id] || 0;
                      const canUse = cd === 0 && playerMp >= skill.mpCost;
                      return (
                        <Button key={skill.id} size="sm" variant="outline"
                          className={`font-display text-[9px] h-7 ${canUse ? 'hover:border-gold/50' : 'opacity-40'}`}
                          disabled={!canUse} onClick={() => useSkill(skill)}
                          title={`${skill.description} (${skill.mpCost}MP, ${skill.cooldown}t CD)`}>
                          {skill.icon} {skill.name}
                          {cd > 0 && <span className="text-destructive ml-0.5">({cd})</span>}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : !dungeonComplete ? (
              <Button onClick={nextFloor} className="font-display glow-gold-sm"><ChevronDown className="w-4 h-4 mr-1" /> Következő szint</Button>
            ) : (
              <Button onClick={() => navigate('/lobby')} className="font-display">Vissza a lobbyba</Button>
            )}
          </div>
        </div>

        <div className="lg:w-72 rpg-panel flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-border"><h3 className="font-display text-xs text-gold">📜 Napló</h3></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {log.map((l, i) => (
              <p key={i} className={`text-[11px] ${l.includes('KRIT') ? 'text-gold font-bold' : l.includes('legyőzve') ? 'text-nature' : l.includes('Meghaltál') ? 'text-blood font-bold' : l.includes('teljesítve') ? 'text-gold font-bold' : l.includes('Drop') ? 'text-shadow font-bold' : l.includes('⚡') ? 'text-mana' : l.includes('💚') ? 'text-nature' : 'text-foreground/60'}`}>{l}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dungeon;
