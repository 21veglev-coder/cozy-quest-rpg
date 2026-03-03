import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameCharacter, InventoryItem, ENEMIES, EnemyDef, GameLocation, SET_BONUSES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Dice6, Heart, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

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
  const [enemyHp, setEnemyHp] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [battleActive, setBattleActive] = useState(false);
  const [dungeonComplete, setDungeonComplete] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    setCharacter(charRes.data);
    setPlayerHp(charRes.data.hp);
    const itemsRes = await supabase.from('inventory_items').select('*').eq('character_id', charRes.data.id);
    if (itemsRes.data) setItems(itemsRes.data);
    if (locationId) {
      const locRes = await supabase.from('locations').select('*').eq('id', locationId).single();
      if (locRes.data) {
        setLocation(locRes.data);
        setLog([`🏰 Beléptél: ${locRes.data.name}`]);
      }
    }
  };

  const spawnEnemy = useCallback(() => {
    if (!location) return;
    const isRaid = location.type === 'raid';
    const pool = ENEMIES.filter(e =>
      (isRaid ? e.locationType === 'raid' : e.locationType === 'dungeon') &&
      e.minZoneLevel <= location.level_req + 2
    );
    if (pool.length === 0) return;
    // Boss on last floor
    const isBoss = floor === maxFloors;
    let picked: EnemyDef;
    if (isBoss) {
      picked = pool.reduce((a, b) => a.level > b.level ? a : b);
      // Scale boss
      picked = { ...picked, hp: Math.floor(picked.hp * 1.5), atk: Math.floor(picked.atk * 1.3), name: `👑 ${picked.name} (Boss)` };
    } else {
      picked = pool[Math.floor(Math.random() * pool.length)];
      // Scale by floor
      picked = { ...picked, hp: picked.hp + floor * 10, atk: picked.atk + floor };
    }
    setEnemy(picked);
    setEnemyHp(picked.hp);
    setBattleActive(true);
    setLog(prev => [...prev, `--- ${floor}. szint ---`, `${picked.icon} ${picked.name} (Lv.${picked.level}) jelent meg!`]);
  }, [floor, location, maxFloors]);

  useEffect(() => {
    if (location && !battleActive && !dungeonComplete && character) {
      spawnEnemy();
    }
  }, [location, floor, character]);

  const doTurn = () => {
    if (!enemy || !character || !battleActive) return;
    const eqStats = getEquippedStats(items);
    const pAtk = character.atk + eqStats.atk;
    const pDef = character.def + eqStats.def;
    const pCrit = character.crit_chance + eqStats.crit;

    const pRoll = rollDice(20);
    const eRoll = rollDice(20);
    const isCrit = rollDice(100) <= pCrit;
    let pDmg = Math.max(1, pAtk + pRoll - enemy.def);
    if (isCrit) pDmg = Math.floor(pDmg * 1.5);
    const eDmg = Math.max(1, enemy.atk + eRoll - pDef);

    const newLog: string[] = [];
    let newEHp = enemyHp;
    let newPHp = playerHp;

    newLog.push(`🎲 Te: ${pRoll} → ${pDmg} seb.${isCrit ? ' 💥 KRIT!' : ''}`);
    newEHp -= pDmg;
    if (newEHp > 0) {
      newLog.push(`🎲 ${enemy.icon}: ${eRoll} → ${eDmg} seb.`);
      newPHp -= eDmg;
    }

    setEnemyHp(Math.max(0, newEHp));
    setPlayerHp(Math.max(0, newPHp));
    setLog(prev => [...prev, ...newLog]);

    if (newEHp <= 0) {
      setLog(prev => [...prev, `🏆 ${enemy.name} legyőzve! +${enemy.xpReward} XP, +${enemy.goldReward}💰`]);
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

  const applyFloorReward = async (e: EnemyDef) => {
    if (!character) return;
    await supabase.from('characters').update({
      xp: character.xp + e.xpReward,
      gold: character.gold + e.goldReward,
    }).eq('id', character.id);
  };

  const applyDungeonLoss = async () => {
    if (!character) return;
    await supabase.from('characters').update({ hp: Math.max(1, Math.floor(character.max_hp * 0.2)) }).eq('id', character.id);
  };

  const saveDungeonProgress = async () => {
    if (!character || !locationId) return;
    await supabase.from('dungeon_progress').upsert({
      character_id: character.id,
      location_id: locationId,
      current_floor: maxFloors,
      max_floor: maxFloors,
      completed: true,
    }, { onConflict: 'character_id,location_id' });
  };

  const nextFloor = () => {
    setFloor(f => f + 1);
  };

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

      {/* Floor progress */}
      <div className="px-4 pt-4">
        <div className="flex gap-1">
          {Array.from({ length: maxFloors }, (_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i < floor ? (dungeonComplete && playerHp <= 0 ? 'bg-blood' : 'bg-gold') : 'bg-secondary'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Battle */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {enemy && (
            <motion.div className="rpg-panel p-6 text-center w-56" animate={enemyHp <= 0 ? { opacity: 0.3 } : {}}>
              <div className="text-4xl mb-1">{enemy.icon}</div>
              <p className="font-display text-sm">{enemy.name}</p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                <motion.div className="h-full bg-blood rounded-full" animate={{ width: `${(enemyHp / enemy.hp) * 100}%` }} />
              </div>
              <p className="text-[10px] text-blood mt-1">{enemyHp}/{enemy.hp}</p>
            </motion.div>
          )}

          <div className="text-xl text-gold">⚔️</div>

          <div className="rpg-panel-gold p-4 text-center w-56">
            <p className="font-display text-sm text-gold">{character.name}</p>
            <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
              <motion.div className="h-full bg-nature rounded-full" animate={{ width: `${(playerHp / character.max_hp) * 100}%` }} />
            </div>
            <p className="text-[10px] text-nature mt-1">{playerHp}/{character.max_hp}</p>
          </div>

          <div className="flex gap-3">
            {battleActive ? (
              <>
                <Button onClick={doTurn} className="font-display"><Dice6 className="w-4 h-4 mr-1" /> Támadás</Button>
                <Button variant="outline" onClick={usePotion} className="font-display"><Heart className="w-4 h-4 mr-1 text-blood" /> Ital</Button>
              </>
            ) : !dungeonComplete ? (
              <Button onClick={nextFloor} className="font-display glow-gold-sm"><ChevronDown className="w-4 h-4 mr-1" /> Következő szint</Button>
            ) : (
              <Button onClick={() => navigate('/lobby')} className="font-display">Vissza a lobbyba</Button>
            )}
          </div>
        </div>

        {/* Log */}
        <div className="lg:w-72 rpg-panel flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-border"><h3 className="font-display text-xs text-gold">📜 Napló</h3></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {log.map((l, i) => (
              <p key={i} className={`text-[11px] ${l.includes('KRIT') ? 'text-gold font-bold' : l.includes('legyőzve') ? 'text-nature' : l.includes('Meghaltál') ? 'text-blood font-bold' : l.includes('teljesítve') ? 'text-gold font-bold' : 'text-foreground/60'}`}>{l}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dungeon;
