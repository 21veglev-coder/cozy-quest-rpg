import { InventoryItem, RARITY_COLORS, SET_BONUSES } from '@/types/game';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InventoryPanelProps {
  items: InventoryItem[];
  onEquip?: (itemId: string) => void;
  onRefresh?: () => void;
}

const InventoryPanel = ({ items, onEquip, onRefresh }: InventoryPanelProps) => {
  const [tooltip, setTooltip] = useState<InventoryItem | null>(null);
  const equipped = items.filter(i => i.equipped);
  const bag = items.filter(i => !i.equipped);

  const sellItem = async (item: InventoryItem) => {
    if (item.equipped) { toast.error('Először vedd le!'); return; }
    await supabase.from('inventory_items').delete().eq('id', item.id);
    // Add gold
    const charRes = await supabase.from('characters').select('id, gold').eq('id', item.character_id).single();
    if (charRes.data) {
      await supabase.from('characters').update({ gold: charRes.data.gold + item.sell_price }).eq('id', charRes.data.id);
    }
    toast.success(`${item.name} eladva ${item.sell_price}💰`);
    onRefresh?.();
  };

  // Set bonus calculation
  const setCounts: Record<string, number> = {};
  equipped.forEach(i => { if (i.set_name) setCounts[i.set_name] = (setCounts[i.set_name] || 0) + 1; });

  return (
    <div className="rpg-panel h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-sm text-gold">🎒 Felszerelés</h3>
      </div>

      {/* Equipped */}
      <div className="p-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2 font-display">Viselt</p>
        <div className="grid grid-cols-2 gap-2">
          {equipped.map(item => (
            <motion.div key={item.id} whileHover={{ scale: 1.03 }}
              className="rpg-panel border-glow p-2 flex items-center gap-2 cursor-pointer"
              onClick={() => onEquip?.(item.id)}
              onMouseEnter={() => setTooltip(item)} onMouseLeave={() => setTooltip(null)}>
              <span className="text-lg">{item.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                <div className="flex gap-1 text-[8px] text-muted-foreground">
                  {item.atk > 0 && <span className="text-ember">+{item.atk}</span>}
                  {item.def > 0 && <span>+{item.def}D</span>}
                  {item.crit_chance > 0 && <span className="text-gold">{item.crit_chance}%C</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Set bonuses */}
        {Object.entries(setCounts).map(([name, count]) => {
          const bonus = SET_BONUSES[name];
          if (!bonus) return null;
          const active = count >= bonus.pieces;
          return (
            <div key={name} className={`text-[9px] mt-1 ${active ? 'text-gold' : 'text-muted-foreground'}`}>
              🔗 {name} ({count}/{bonus.pieces}) {active && `- ${bonus.bonus}`}
            </div>
          );
        })}
      </div>

      {/* Bag */}
      <div className="p-3 flex-1 overflow-y-auto">
        <p className="text-xs text-muted-foreground mb-2 font-display">Táska</p>
        <div className="grid grid-cols-4 gap-2">
          {bag.map(item => (
            <motion.div key={item.id} whileHover={{ scale: 1.1 }}
              className="rpg-panel aspect-square flex items-center justify-center cursor-pointer hover:border-glow transition-all group relative"
              onClick={() => onEquip?.(item.id)}
              onContextMenu={(e) => { e.preventDefault(); sellItem(item); }}
              title={`${item.name} - ${item.description}\nATK:${item.atk} DEF:${item.def} SPD:${item.spd}\nJobb klikk: Elad (${item.sell_price}💰)`}>
              <span className="text-xl">{item.icon}</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: item.rarity === 'legendary' ? 'hsl(40 80% 50%)' : item.rarity === 'epic' ? 'hsl(260 40% 50%)' : item.rarity === 'rare' ? 'hsl(220 70% 55%)' : 'transparent' }} />
            </motion.div>
          ))}
          {[...Array(Math.max(0, 12 - bag.length))].map((_, i) => (
            <div key={`empty-${i}`} className="rpg-panel aspect-square opacity-30" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
