import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameLocation, GameCharacter } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Swords, Map, ChevronRight } from 'lucide-react';

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

// Sub-zone definitions: each world has 4 sub-zones, each sub-zone filters locations by level range
const SUB_ZONES: Record<number, { id: string; name: string; levelRange: [number, number]; icon: string }[]> = {
  1: [
    { id: '1.1', name: 'W1.1 – Kezdő Völgy', levelRange: [1, 3], icon: '🌱' },
    { id: '1.2', name: 'W1.2 – Erdei Út', levelRange: [3, 5], icon: '🌲' },
    { id: '1.3', name: 'W1.3 – Hegyvidék', levelRange: [5, 7], icon: '⛰️' },
    { id: '1.4', name: 'W1.4 – Sötét Birodalom', levelRange: [7, 10], icon: '🏴' },
  ],
  2: [
    { id: '2.1', name: 'W2.1 – Pokol Kapu', levelRange: [5, 7], icon: '🔥' },
    { id: '2.2', name: 'W2.2 – Jégtorony', levelRange: [7, 8], icon: '❄️' },
    { id: '2.3', name: 'W2.3 – Démoni Pusztaság', levelRange: [8, 10], icon: '😈' },
    { id: '2.4', name: 'W2.4 – Végzet Csarnoka', levelRange: [10, 15], icon: '💀' },
  ],
  3: [
    { id: '3.1', name: 'W3.1 – Part Menti Romok', levelRange: [10, 13], icon: '🏛️' },
    { id: '3.2', name: 'W3.2 – Korall Palota', levelRange: [13, 15], icon: '🪸' },
    { id: '3.3', name: 'W3.3 – Sötét Mélység', levelRange: [15, 18], icon: '🕳️' },
    { id: '3.4', name: 'W3.4 – Poseidon Trónja', levelRange: [18, 25], icon: '🔱' },
  ],
};

const WorldMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const worldParam = parseInt(searchParams.get('world') || '1');
  const [world, setWorld] = useState(worldParam);
  const [subZoneIdx, setSubZoneIdx] = useState(0);
  const [allLocations, setAllLocations] = useState<GameLocation[]>([]);
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [selected, setSelected] = useState<GameLocation | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user, world]);

  const loadData = async () => {
    const [locRes, charRes] = await Promise.all([
      supabase.from('locations').select('*').eq('world', world),
      supabase.from('characters').select('*').eq('user_id', user!.id).single(),
    ]);
    if (locRes.data) setAllLocations(locRes.data as GameLocation[]);
    if (charRes.data) setCharacter(charRes.data as unknown as GameCharacter);
    setSelected(null);
    setSubZoneIdx(0);
  };

  const currentSubZones = SUB_ZONES[world] || SUB_ZONES[1];
  const currentSubZone = currentSubZones[subZoneIdx];
  
  // Filter locations for current sub-zone by level range
  const locations = allLocations.filter(l => 
    l.level_req >= currentSubZone.levelRange[0] && l.level_req <= currentSubZone.levelRange[1]
  );

  const goToLocation = (loc: GameLocation) => {
    if (!character || character.level < loc.level_req) return;
    if (loc.type === 'town') {
      navigate(`/shop?world=${world}`);
    } else if (loc.type === 'dungeon' || loc.type === 'raid') {
      navigate(`/dungeon/${loc.id}`);
    } else {
      navigate(`/combat/${loc.id}`);
    }
  };

  // Each sub-zone shows a 2x2 grid (4 map sections)
  const gridSize = 2;
  const canAccessWorld2 = character && character.prestige >= 1 && character.subclass;
  const canAccessWorld3 = character && character.prestige >= 2 && character.subclass;
  const canAccessSubZone = (idx: number) => {
    if (!character) return false;
    const sz = currentSubZones[idx];
    return character.level >= sz.levelRange[0];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">
          <Map className="w-5 h-5 inline mr-1" />Térkép
        </h1>
      </header>

      {/* World Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        <Button variant={world === 1 ? 'default' : 'outline'} size="sm" className="font-display text-xs"
          onClick={() => { setWorld(1); setSubZoneIdx(0); }}>
          🌍 W1
        </Button>
        <Button variant={world === 2 ? 'default' : 'outline'} size="sm" className="font-display text-xs"
          disabled={!canAccessWorld2}
          onClick={() => { if (canAccessWorld2) { setWorld(2); setSubZoneIdx(0); } }}>
          🏴 W2 {!canAccessWorld2 && '🔒'}
        </Button>
        <Button variant={world === 3 ? 'default' : 'outline'} size="sm" className="font-display text-xs"
          disabled={!canAccessWorld3}
          onClick={() => { if (canAccessWorld3) { setWorld(3); setSubZoneIdx(0); } }}>
          🌊 W3 {!canAccessWorld3 && '🔒'}
        </Button>
      </div>

      {world === 2 && !canAccessWorld2 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-display">Prestige 1 és subclass szükséges a W2-höz!</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 p-4">
          {/* Sub-zone selector */}
          <div className="flex gap-1 flex-wrap">
            {currentSubZones.map((sz, idx) => {
              const accessible = canAccessSubZone(idx);
              return (
                <Button
                  key={sz.id}
                  variant={subZoneIdx === idx ? 'default' : 'outline'}
                  size="sm"
                  className={`font-display text-[10px] h-8 ${!accessible ? 'opacity-40' : ''}`}
                  disabled={!accessible}
                  onClick={() => { setSubZoneIdx(idx); setSelected(null); }}
                >
                  {sz.icon} W{sz.id}
                  {!accessible && <Lock className="w-3 h-3 ml-1" />}
                </Button>
              );
            })}
          </div>

          {/* Sub-zone info */}
          <div className="rpg-panel p-3 flex items-center gap-3">
            <span className="text-2xl">{currentSubZone.icon}</span>
            <div>
              <p className="font-display text-sm text-gold">{currentSubZone.name}</p>
              <p className="text-[10px] text-muted-foreground">
                Szint: {currentSubZone.levelRange[0]}–{currentSubZone.levelRange[1]} · {locations.length} helyszín
              </p>
            </div>
            {subZoneIdx < currentSubZones.length - 1 && canAccessSubZone(subZoneIdx + 1) && (
              <Button variant="ghost" size="sm" className="ml-auto text-[10px]" onClick={() => { setSubZoneIdx(subZoneIdx + 1); setSelected(null); }}>
                Tovább <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            {/* 2x2 grid map */}
            <div className="flex-1 flex items-center justify-center">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                {Array.from({ length: gridSize * gridSize }, (_, i) => {
                  const loc = locations[i] || null;
                  const locked = loc && character ? character.level < loc.level_req : false;

                  return (
                    <motion.div key={i} whileHover={loc ? { scale: 1.08 } : {}}
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${loc ? TYPE_COLORS[loc.type] : 'border-border/20 bg-secondary/10'}
                        ${selected?.id === loc?.id ? 'glow-gold-sm ring-2 ring-gold/50' : ''}
                        ${locked ? 'opacity-40' : ''}`}
                      onClick={() => loc && setSelected(loc)}>
                      {loc ? (
                        locked ? <Lock className="w-5 h-5 text-muted-foreground" /> : (
                          <>
                            <span className="text-2xl">{loc.icon}</span>
                            <span className="text-[8px] text-foreground/60 mt-1 font-display truncate max-w-[70px] text-center">{loc.name}</span>
                          </>
                        )
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Location detail panel */}
            <div className="lg:w-80">
              {selected ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rpg-panel-gold p-5">
                  <div className="text-4xl mb-3">{selected.icon}</div>
                  <h2 className="font-display text-xl text-gold mb-1">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground mb-1">{TYPE_LABELS[selected.type]} · W{world}.{subZoneIdx + 1}</p>
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
      )}
    </div>
  );
};

export default WorldMap;
