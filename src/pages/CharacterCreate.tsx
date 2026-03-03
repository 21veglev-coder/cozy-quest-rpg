import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CLASSES, ClassInfo, CharacterClass } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { STARTER_ITEMS } from '@/types/game';

const StatBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground w-8">{label}</span>
    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
    <span className="text-xs text-foreground w-6 text-right">{value}</span>
  </div>
);

const CharacterCreate = () => {
  const [selectedClass, setSelectedClass] = useState<ClassInfo>(CLASSES[0]);
  const [charName, setCharName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!charName.trim()) { toast.error('Adj nevet a karakterednek!'); return; }
    if (!user) return;
    setLoading(true);
    try {
      const stats = selectedClass.stats;
      const { data: char, error } = await supabase.from('characters').insert({
        user_id: user.id,
        name: charName,
        class: selectedClass.id,
        level: 1,
        xp: 0,
        hp: stats.hp,
        max_hp: stats.hp,
        mp: stats.mp,
        max_mp: stats.mp,
        gold: 50,
      }).select().single();
      if (error) throw error;

      // Add starter items
      const items = STARTER_ITEMS[selectedClass.id as CharacterClass].map(item => ({
        ...item,
        character_id: char.id,
      }));
      await supabase.from('inventory_items').insert(items);

      toast.success('Karakter létrehozva!');
      navigate('/lobby');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
        <h1 className="text-3xl font-display font-bold text-center text-glow-gold mb-8">Karakter Létrehozás</h1>

        {/* Name Input */}
        <div className="rpg-panel-gold p-4 mb-6">
          <label className="text-sm text-muted-foreground font-display block mb-2">Karakter Név</label>
          <Input
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            placeholder="Írd be a neved..."
            className="bg-background border-border text-lg font-display"
            maxLength={20}
          />
        </div>

        {/* Class Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {CLASSES.map((cls) => (
            <motion.button
              key={cls.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedClass(cls)}
              className={`rpg-panel p-4 text-center transition-all cursor-pointer ${
                selectedClass.id === cls.id ? 'border-glow glow-gold-sm' : 'hover:border-border/60'
              }`}
            >
              <div className="text-3xl mb-2">{cls.icon}</div>
              <div className={`font-display text-sm font-semibold ${cls.color}`}>{cls.name}</div>
            </motion.button>
          ))}
        </div>

        {/* Selected Class Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedClass.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rpg-panel-gold p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{selectedClass.icon}</span>
              <div>
                <h2 className={`text-xl font-display font-bold ${selectedClass.color}`}>{selectedClass.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedClass.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <StatBar label="HP" value={selectedClass.stats.hp} max={150} color="bg-blood" />
              <StatBar label="MP" value={selectedClass.stats.mp} max={120} color="bg-mana" />
              <StatBar label="ATK" value={selectedClass.stats.atk} max={20} color="bg-ember" />
              <StatBar label="DEF" value={selectedClass.stats.def} max={15} color="bg-foreground/60" />
              <StatBar label="SPD" value={selectedClass.stats.spd} max={20} color="bg-nature" />
            </div>
          </motion.div>
        </AnimatePresence>

        <Button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-display text-lg py-6 glow-gold-sm hover:bg-primary/90"
        >
          {loading ? 'Létrehozás...' : 'Karakter Létrehozása'}
        </Button>
      </motion.div>
    </div>
  );
};

export default CharacterCreate;
