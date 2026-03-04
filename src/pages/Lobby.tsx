import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { GameCharacter, CLASSES, SUBCLASSES, InventoryItem } from '@/types/game';
import ChatPanel from '@/components/ChatPanel';
import CharacterSheet from '@/components/CharacterSheet';
import InventoryPanel from '@/components/InventoryPanel';
import Tutorial from '@/components/Tutorial';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, Users, BookOpen, Star } from 'lucide-react';

const Lobby = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<{ id: string; name: string; class: string; level: number }[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadCharacter();
    loadOnlinePlayers();
  }, [user]);

  const loadCharacter = async () => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (!data) {
      navigate('/create');
      return;
    }
    setCharacter(data);
    loadItems(data.id);
    setLoading(false);

    // Check if first visit
    const visited = localStorage.getItem('tutorial_seen');
    if (!visited) setShowTutorial(true);
  };

  const loadItems = async (charId: string) => {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('character_id', charId);
    if (data) setItems(data);
  };

  const loadOnlinePlayers = async () => {
    const { data } = await supabase
      .from('characters')
      .select('id, name, class, level')
      .limit(30);
    if (data) setOnlinePlayers(data);
  };

  const toggleEquip = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Potions and quest items can't be equipped
    if (item.type === 'potion' || item.type === 'quest') {
      toast.info(`${item.name}: ${item.description}`);
      return;
    }
    
    if (!item.equipped) {
      // Unequip any item in the same slot first
      const sameSlot = items.find(i => i.equipped && i.type === item.type);
      if (sameSlot) {
        await supabase.from('inventory_items').update({ equipped: false }).eq('id', sameSlot.id);
        setItems(prev => prev.map(i => i.id === sameSlot.id ? { ...i, equipped: false } : i));
      }
    }
    
    await supabase.from('inventory_items').update({ equipped: !item.equipped }).eq('id', itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, equipped: !i.equipped } : i));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_seen', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gold font-display animate-pulse-glow text-xl">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-4 flex items-center justify-between">
        <h1 className="font-display text-lg text-gold text-glow-gold">⚔️ Cozy Quest</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowTutorial(true)} className="text-muted-foreground hover:text-gold">
            <BookOpen className="w-4 h-4 mr-1" /> Tutorial
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-1" /> Kilépés
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
        {/* Left - Character & Players */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto">
          {character && <CharacterSheet character={character} />}

          {/* Online Players */}
          <div className="rpg-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gold" />
              <h3 className="font-display text-sm text-gold">Online Játékosok</h3>
              <span className="text-xs text-muted-foreground ml-auto">{onlinePlayers.length}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {onlinePlayers.map(player => {
                const cls = CLASSES.find(c => c.id === player.class);
                const sub = SUBCLASSES.find(s => s.id === (player as any).subclass);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-base">{sub?.icon || cls?.icon}</span>
                    <span className="text-foreground/80 truncate">{player.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Lv.{player.level}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center - Game Area placeholder */}
        <div className="lg:col-span-5 rpg-panel-gold flex flex-col items-center justify-center p-8 min-h-[300px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4 animate-float">🏰</div>
            <h2 className="font-display text-2xl text-gold text-glow-gold mb-2">Lobby</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Várd meg az osztálytársaidat, vagy beszélgess velük a chatben!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/map')}>
                🗺️ Térkép
              </Button>
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/combat')}>
                ⚔️ Harc
              </Button>
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/shop')}>
                🏪 Bolt
              </Button>
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/perks')}>
                <Star className="w-4 h-4 mr-1" /> Képességek
              </Button>
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/prestige')}>
                ⭐ Prestige
              </Button>
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/clans')}>
                🏰 Klánok
              </Button>
              <Button variant="outline" className="font-display border-border hover:border-gold/50 hover:text-gold" onClick={() => navigate('/teams')}>
                👥 Csapatok
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Right - Inventory & Chat */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <InventoryPanel items={items} onEquip={toggleEquip} onRefresh={() => { loadCharacter(); }} />
          </div>
          <div className="h-64 lg:h-72">
            <ChatPanel />
          </div>
        </div>
      </div>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && <Tutorial onClose={closeTutorial} />}
      </AnimatePresence>
    </div>
  );
};

export default Lobby;
