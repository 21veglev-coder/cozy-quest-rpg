import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ShopItem, GameCharacter, RARITY_COLORS } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const Shop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const [shopRes, charRes] = await Promise.all([
      supabase.from('shop_items').select('*').order('level_req'),
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

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold">🏪 Bolt</h1>
        <div className="ml-auto font-display text-sm text-gold">💰 {character?.gold ?? 0}</div>
      </header>

      <div className="flex gap-2 p-4 flex-wrap">
        {['all', 'weapon', 'armor', 'potion'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            className="font-display text-xs" onClick={() => setFilter(f)}>
            {f === 'all' ? 'Mind' : f === 'weapon' ? '⚔️ Fegyver' : f === 'armor' ? '🛡️ Páncél' : '🧪 Ital'}
          </Button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 overflow-y-auto">
        {filtered.map(item => {
          const canBuy = character && character.gold >= item.price && character.level >= item.level_req && (!item.class_req || item.class_req === character.class);
          return (
            <motion.div key={item.id} whileHover={{ scale: 1.02 }}
              className={`rpg-panel p-4 cursor-pointer transition-all ${selected?.id === item.id ? 'border-glow glow-gold-sm' : ''}`}
              onClick={() => setSelected(item)}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-sm font-semibold truncate ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.type} · Lv.{item.level_req}{item.class_req ? ` · ${item.class_req}` : ''}</p>
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
              <Button size="sm" className="w-full font-display text-xs" disabled={!canBuy} onClick={(e) => { e.stopPropagation(); buyItem(item); }}>
                <ShoppingCart className="w-3 h-3 mr-1" /> Megvesz
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
