import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameLocation, GameCharacter } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Swords, Map } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  town: 'border-gold/50 bg-gold/10',
  zone: 'border-nature/50 bg-nature/10',
  dungeon: 'border-shadow/50 bg-shadow/10',
  raid: 'border-blood/50 bg-blood/10',
};

const TYPE_LABELS: Record<string, string> = {
  town: '🏘️ Város',
  zone: '🌍 Zóna',
  dungeon: '🏰 Dungeon',
  raid: '🐉 Raid',
};

const WorldMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [selected, setSelected] = useState<GameLocation | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const [locRes, charRes] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase.from('characters').select('*').eq('user_id', user!.id).single(),
    ]);
    if (locRes.data) setLocations(locRes.data);
    if (charRes.data) setCharacter(charRes.data);
  };

  const goToLocation = (loc: GameLocation) => {
    if (!character || character.level < loc.level_req) return;
    if (loc.type === 'town') {
      navigate('/shop');
    } else if (loc.type === 'dungeon' || loc.type === 'raid') {
      navigate(`/dungeon/${loc.id}`);
    } else {
      navigate(`/combat/${loc.id}`);
    }
  };

  // Build 6x6 grid
  const gridSize = 6;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold"><Map className="w-5 h-5 inline mr-1" />Világtérkép</h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Grid Map */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const x = i % gridSize;
              const y = Math.floor(i / gridSize);
              const loc = locations.find(l => l.grid_x === x && l.grid_y === y);
              const locked = loc && character ? character.level < loc.level_req : false;

              return (
                <motion.div key={i} whileHover={loc ? { scale: 1.1 } : {}}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-lg border flex items-center justify-center text-lg cursor-pointer transition-all
                    ${loc ? TYPE_COLORS[loc.type] : 'border-border/20 bg-secondary/20'}
                    ${selected?.id === loc?.id ? 'glow-gold-sm ring-1 ring-gold/50' : ''}
                    ${locked ? 'opacity-40' : ''}`}
                  onClick={() => loc && setSelected(loc)}>
                  {loc ? (locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <span>{loc.icon}</span>) : null}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Location Details */}
        <div className="lg:w-80">
          {selected ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rpg-panel-gold p-5">
              <div className="text-4xl mb-3">{selected.icon}</div>
              <h2 className="font-display text-xl text-gold mb-1">{selected.name}</h2>
              <p className="text-xs text-muted-foreground mb-1">{TYPE_LABELS[selected.type]}</p>
              <p className="text-sm text-foreground/80 mb-4">{selected.description}</p>
              <p className="text-xs text-muted-foreground mb-4">Szükséges szint: <span className="text-gold">{selected.level_req}</span></p>
              <Button className="w-full font-display" 
                disabled={!character || character.level < selected.level_req}
                onClick={() => goToLocation(selected)}>
                {selected.type === 'town' ? '🏪 Belépés' : <><Swords className="w-4 h-4 mr-1" /> Felfedezés</>}
              </Button>
            </motion.div>
          ) : (
            <div className="rpg-panel p-5 text-center text-muted-foreground text-sm">
              Válassz egy helyszínt a térképen!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
