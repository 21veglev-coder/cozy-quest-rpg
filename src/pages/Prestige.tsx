import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { GameCharacter, CLASSES, SUBCLASSES, SubclassInfo, PRESTIGE_LEVEL_REQ, PRESTIGE_SUBCLASS_REQ, getMaxLevel, getXpMultiplier } from '@/types/game';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Prestige = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassInfo | null>(null);
  const [prestiging, setPrestiging] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadCharacter();
  }, [user]);

  const loadCharacter = async () => {
    const { data } = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!data) { navigate('/create'); return; }
    setCharacter(data as unknown as GameCharacter);
    setLoading(false);
  };

  const maxLevel = character ? getMaxLevel(character.prestige) : PRESTIGE_LEVEL_REQ;
  const xpMult = character ? getXpMultiplier(character.prestige) : 1;
  const canPrestige = character && character.level >= maxLevel;
  const canChooseSubclass = character && character.prestige >= PRESTIGE_SUBCLASS_REQ && !character.subclass;
  const availableSubclasses = character ? SUBCLASSES.filter(s => s.parentClass === character.class) : [];
  const cls = character ? CLASSES.find(c => c.id === character.class) : null;
  const nextMaxLevel = character ? getMaxLevel(character.prestige + 1) : 30;
  const nextXpMult = character ? getXpMultiplier(character.prestige + 1) : 1;

  const handlePrestige = async () => {
    if (!character || !canPrestige) return;
    setPrestiging(true);
    try {
      const baseStats = cls!.stats;
      const newPrestige = character.prestige + 1;
      const { error } = await supabase.from('characters').update({
        prestige: newPrestige,
        level: 1,
        xp: 0,
        hp: baseStats.hp,
        max_hp: baseStats.hp,
        mp: baseStats.mp,
        max_mp: baseStats.mp,
        atk: baseStats.atk,
        def: baseStats.def,
        spd: baseStats.spd,
        crit_chance: baseStats.crit,
        perk_points: newPrestige * 3, // Bonus perk points per prestige
      }).eq('id', character.id);
      if (error) throw error;
      toast.success(`Prestige ${newPrestige}! 🌟 +${newPrestige * 3} perk pont!`);
      loadCharacter();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPrestiging(false);
    }
  };

  const handleChooseSubclass = async () => {
    if (!character || !selectedSubclass) return;
    setPrestiging(true);
    try {
      const bonuses = selectedSubclass.statBonuses;
      const { error } = await supabase.from('characters').update({
        subclass: selectedSubclass.id,
        max_hp: character.max_hp + (bonuses.hp || 0),
        hp: character.hp + (bonuses.hp || 0),
        max_mp: character.max_mp + (bonuses.mp || 0),
        mp: character.mp + (bonuses.mp || 0),
        atk: character.atk + (bonuses.atk || 0),
        def: character.def + (bonuses.def || 0),
        spd: character.spd + (bonuses.spd || 0),
        crit_chance: character.crit_chance + (bonuses.crit || 0),
      }).eq('id', character.id);
      if (error) throw error;
      toast.success(`${selectedSubclass.name} subclass választva! 🎉`);
      navigate('/lobby');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPrestiging(false);
    }
  };

  if (loading || !character) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold font-display animate-pulse-glow text-xl">Betöltés...</div></div>;
  }

  const currentSubclass = character.subclass ? SUBCLASSES.find(s => s.id === character.subclass) : null;

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/lobby')} className="mb-4 text-muted-foreground hover:text-gold">
          ← Vissza
        </Button>

        <h1 className="text-3xl font-display font-bold text-center text-glow-gold mb-2">⭐ Prestige Rendszer</h1>
        <p className="text-center text-muted-foreground text-sm mb-4">
          Prestige: <span className="text-gold font-bold">{character.prestige}</span> · Level: <span className="text-foreground">{character.level}/{maxLevel}</span>
        </p>
        <p className="text-center text-muted-foreground text-xs mb-8">
          XP szorzó: <span className="text-gold font-bold">×{xpMult.toFixed(2)}</span>
        </p>

        {/* Current Subclass */}
        {currentSubclass && (
          <div className="rpg-panel-gold p-4 mb-6 text-center">
            <span className="text-2xl">{currentSubclass.icon}</span>
            <p className={`font-display font-bold ${currentSubclass.color}`}>{currentSubclass.name}</p>
            <p className="text-xs text-muted-foreground">{currentSubclass.description}</p>
          </div>
        )}

        {/* Prestige Section */}
        <div className="rpg-panel-gold p-6 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">🌟 Prestige</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Elérd a {maxLevel}. szintet, és Prestige-elj! A szinted visszaáll 1-re, de bónusz perk pontokat kapsz.
            <br />Max level: {maxLevel} → {nextMaxLevel} · XP szorzó: ×{xpMult.toFixed(2)} → ×{nextXpMult.toFixed(2)}
            <br />Prestige 1 után subclass-t választhatsz!
          </p>

          {!canPrestige && (
            <div className="rpg-panel p-3 text-center">
              <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gold rounded-full"
                  style={{ width: `${(character.level / maxLevel) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Még <span className="text-gold font-bold">{maxLevel - character.level}</span> szint a Prestige-ig
              </p>
            </div>
          )}

          {canPrestige && (
            <Button
              onClick={handlePrestige}
              disabled={prestiging}
              className="w-full bg-primary text-primary-foreground font-display glow-gold-sm"
            >
              {prestiging ? 'Prestige...' : `⭐ Prestige ${character.prestige + 1} (+${(character.prestige + 1) * 3} perk pont)`}
            </Button>
          )}
        </div>

        {/* Subclass Selection */}
        {canChooseSubclass && (
          <div className="rpg-panel-gold p-6">
            <h2 className="font-display text-lg text-gold mb-3">🎭 Subclass Választás</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Válassz subclass-t a {cls?.name} számára! Ez végleges.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {availableSubclasses.map(sub => (
                <motion.button
                  key={sub.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedSubclass(sub)}
                  className={`rpg-panel p-4 text-left transition-all cursor-pointer ${
                    selectedSubclass?.id === sub.id ? 'border-glow glow-gold-sm' : 'hover:border-border/60'
                  }`}
                >
                  <div className="text-2xl mb-1">{sub.icon}</div>
                  <p className={`font-display text-sm font-bold ${sub.color}`}>{sub.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{sub.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(sub.statBonuses).map(([key, val]) => (
                      <span key={key} className={`text-[9px] px-1 rounded ${(val as number) > 0 ? 'text-nature bg-nature/10' : 'text-destructive bg-destructive/10'}`}>
                        {key.toUpperCase()} {(val as number) > 0 ? '+' : ''}{val as number}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selectedSubclass && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Button
                    onClick={handleChooseSubclass}
                    disabled={prestiging}
                    className="w-full bg-primary text-primary-foreground font-display glow-gold-sm"
                  >
                    {prestiging ? 'Választás...' : `${selectedSubclass.icon} ${selectedSubclass.name} választása`}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!canChooseSubclass && character.prestige > 0 && currentSubclass && (
          <div className="rpg-panel p-4 text-center text-muted-foreground text-sm">
            ✅ Subclass kiválasztva: <span className={`font-bold ${currentSubclass.color}`}>{currentSubclass.name}</span>
          </div>
        )}

        {!canChooseSubclass && character.prestige === 0 && (
          <div className="rpg-panel p-4 text-center text-muted-foreground text-sm">
            🔒 Prestige 1 szükséges a subclass feloldásához
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Prestige;
