import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Sword, Shield, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/lobby');
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/20"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 0.8, 0], y: [0, -50, -100] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-6"
      >
        <div className="flex justify-center gap-4 mb-6">
          <Sword className="w-8 h-8 text-ember animate-pulse-glow" />
          <Shield className="w-10 h-10 text-gold" />
          <Wand2 className="w-8 h-8 text-mana animate-pulse-glow" />
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground text-glow-gold mb-4">
          Realm of Shadows
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Multiplayer RPG kaland az osztályodnak. Válassz osztályt, gyűjts tárgyakat, harcolj együtt.
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/auth')}
            className="bg-primary text-primary-foreground font-display text-lg px-8 py-6 glow-gold-sm hover:bg-primary/90"
          >
            Belépés ⚔️
          </Button>
        </div>

        <div className="flex justify-center gap-8 mt-12 text-muted-foreground">
          {['⚔️ 4 Osztály', '🎒 Inventory', '💬 Chat', '👥 Multiplayer'].map(f => (
            <span key={f} className="text-sm">{f}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
