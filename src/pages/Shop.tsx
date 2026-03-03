import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ShopItem, GameCharacter, RARITY_COLORS, SUBCLASSES } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const SLOT_LABELS: Record<string, string> = {
  weapon: '⚔️ Fegyver', helmet: '⛑️ Sisak', shoulders: '🦺 Váll', chest: '🛡️ Mellvért',
  legs: '👖 Nadrág', boots: '👢 Csizma', gloves: '🧤 Kesztyű', ring: '💍 Gyűrű',
  necklace: '📿 Nyaklánc', potion: '🧪 Ital',
};

const SHOP_NAMES: Record<string, { label: string; icon: string }> = {
  kezdo_falu: { label: 'Kezdő Falu Bolt', icon: '🏘️' },
  kereskedo_varos: { label: 'Kereskedő Város Bolt', icon: '🏪' },
};

const Shop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const worldParam = parseInt(searchParams.get('world') || '1');
  const [world, setWorld] = useState(worldParam);
  const [shopName, setShopName] = useState('kezdo_falu');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user, world, shopName]);

  const loadData = async () => {
    const query = supabase.from('shop_items').select('*').eq('world', world).order('level_req');
    if (world === 1) query.eq('shop_name', shopName);
    const [shopRes, charRes] = await Promise.all([
      query,
      supabase.from('characters').select('*').eq('user_id', user!.id).single(),
    ]);
    if (shopRes.data) setItems(shopRes.data);
    if (charRes.data) setCharacter(charRes.data);
  };

  const buyItem = async (item: ShopItem) => {
    if (!character) return;
    if (character.gold < item.price) { toast.error('Nincs elég aranyad!'); return; }
    if (character.level < item.level_req) { toast.error(`Legalább ${item.level_req}. szint kell!`); return; }
    if (item.class_req && item.class_req !== character.class) { toast.error('Nem a te osztályodhoz való!'); return; }
    if (item.subclass_req && item.subclass_req !== character.subclass) {
      const sub = SUBCLASSES.find(s => s.id === item.subclass_req);
      toast.error(`Csak ${sub?.name || item.subclass_req} subclass számára!`);
      return;
    }

    const { error: insertErr } = await supabase.from('inventory_items').insert({
      character_id: character.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      icon: item.icon,
      description: item.description,
      atk: item.atk,
      def: item.def,
      spd: item.spd,
      hp_bonus: item.hp_bonus,
      mp_bonus: item.mp_bonus,
      crit_chance: item.crit_chance,
      set_name: item.set_name,
      sell_price: Math.floor(item.price * 0.4),
    });
    if (insertErr) { toast.error('Hiba történt!'); return; }

    await supabase.from('characters').update({ gold: character.gold - item.price }).eq('id', character.id);
    setCharacter(prev => prev ? { ...prev, gold: prev.gold - item.price } : null);
    toast.success(`${item.name} megvásárolva!`);
  };

  // Filter items based on character class/subclass
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false;
    // In World 2, only show items for character's subclass (or no subclass_req)
    if (world === 2 && i.subclass_req && i.subclass_req !== character?.subclass) return false;
    // In World 1, only show items for character's class (or no class_req)
    if (i.class_req && i.class_req !== character?.class) return false;
    return true;
  });

  const canAccessWorld2 = character && character.prestige >= 1 && character.subclass;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">
          {world === 1 ? '🏪 World 1 Bolt' : '🏴 World 2 Bolt'}
        </h1>
        <div className="ml-auto font-display text-sm text-gold">💰 {character?.gold ?? 0}</div>
      </header>

      {/* World Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        <Button variant={world === 1 ? 'default' : 'outline'} size="sm" className="font-display text-xs"
          onClick={() => { setWorld(1); setShopName('kezdo_falu'); }}>
          🌍 World 1
        </Button>
        <Button variant={world === 2 ? 'default' : 'outline'} size="sm" className="font-display text-xs"
          disabled={!canAccessWorld2}
          onClick={() => { if (canAccessWorld2) { setWorld(2); setShopName(''); } }}>
          🏴 World 2 {!canAccessWorld2 && '🔒'}
        </Button>
      </div>

      {/* Shop location tabs (World 1 only) */}
      {world === 1 && (
        <div className="flex gap-2 px-4 pt-2">
          {Object.entries(SHOP_NAMES).map(([key, { label, icon }]) => (
            <Button key={key} variant={shopName === key ? 'default' : 'outline'} size="sm"
              className="font-display text-xs" onClick={() => setShopName(key)}>
              {icon} {label}
            </Button>
          ))}
        </div>
      )}

      {/* Slot filter */}
      <div className="flex gap-2 p-4 flex-wrap">
        <Button key="all" variant={filter === 'all' ? 'default' : 'outline'} size="sm"
          className="font-display text-xs" onClick={() => setFilter('all')}>
          Mind
        </Button>
        {Object.entries(SLOT_LABELS).map(([key, label]) => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm"
            className="font-display text-xs" onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      {world === 2 && !canAccessWorld2 && (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-display">Prestige 1 és subclass szükséges a World 2 bolthoz!</p>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 overflow-y-auto">
        {filtered.map(item => {
          const canBuy = character && character.gold >= item.price && character.level >= item.level_req
            && (!item.class_req || item.class_req === character.class)
            && (!item.subclass_req || item.subclass_req === character.subclass);
          const subInfo = item.subclass_req ? SUBCLASSES.find(s => s.id === item.subclass_req) : null;
          return (
            <motion.div key={item.id} whileHover={{ scale: 1.02 }}
              className="rpg-panel p-4 cursor-pointer transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-sm font-semibold truncate ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {SLOT_LABELS[item.type] || item.type} · Lv.{item.level_req}
                    {subInfo && <span className={`ml-1 ${subInfo.color}`}> · {subInfo.icon} {subInfo.name}</span>}
                  </p>
                </div>
                <div className="text-gold font-display text-sm">{item.price}💰</div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
              <div className="flex flex-wrap gap-2 text-[10px] mb-3">
                {item.atk > 0 && <span className="text-ember">ATK +{item.atk}</span>}
                {item.def > 0 && <span className="text-foreground/70">DEF +{item.def}</span>}
                {item.spd > 0 && <span className="text-nature">SPD +{item.spd}</span>}
                {item.hp_bonus > 0 && <span className="text-blood">HP +{item.hp_bonus}</span>}
                {item.mp_bonus > 0 && <span className="text-mana">MP +{item.mp_bonus}</span>}
                {item.crit_chance > 0 && <span className="text-gold">CRIT +{item.crit_chance}%</span>}
                {item.set_name && <span className="text-shadow">🔗 {item.set_name} szett</span>}
              </div>
              <Button size="sm" className="w-full font-display text-xs" disabled={!canBuy}
                onClick={() => buyItem(item)}>
                <ShoppingCart className="w-3 h-3 mr-1" /> Megvesz
              </Button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground p-8">
            Nincs elérhető tárgy ebben a kategóriában.
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
