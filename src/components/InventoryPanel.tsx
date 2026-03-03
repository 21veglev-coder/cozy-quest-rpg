import { InventoryItem, RARITY_COLORS, SET_BONUSES, ITEM_SLOTS } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InventoryPanelProps {
  items: InventoryItem[];
  onEquip?: (itemId: string) => void;
  onRefresh?: () => void;
}

const ItemTooltip = ({ item, position }: { item: InventoryItem; position: { x: number; y: number } }) => {
  const statLines: string[] = [];
  if (item.atk > 0) statLines.push(`⚔️ ATK: +${item.atk}`);
  if (item.def > 0) statLines.push(`🛡️ DEF: +${item.def}`);
  if (item.spd !== 0) statLines.push(`💨 SPD: ${item.spd > 0 ? '+' : ''}${item.spd}`);
  if (item.hp_bonus > 0) statLines.push(`❤️ HP: +${item.hp_bonus}`);
  if (item.mp_bonus > 0) statLines.push(`💙 MP: +${item.mp_bonus}`);
  if (item.crit_chance > 0) statLines.push(`🎯 Krit: +${item.crit_chance}%`);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[100] pointer-events-none"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      <div className="rpg-panel border-glow p-2.5 min-w-[160px] max-w-[200px] shadow-xl">
        <p className={`text-xs font-display font-bold ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
        <p className="text-[9px] text-muted-foreground capitalize">[{item.type}] • {item.rarity}</p>
        {item.description && (
          <p className="text-[9px] text-muted-foreground/70 mt-1 italic">{item.description}</p>
        )}
        {statLines.length > 0 && (
          <div className="mt-1.5 border-t border-border pt-1.5 space-y-0.5">
            {statLines.map((line, i) => (
              <p key={i} className="text-[10px] text-foreground/90">{line}</p>
            ))}
          </div>
        )}
        {item.set_name && (
          <p className="text-[9px] text-gold mt-1">🔗 Szett: {item.set_name}</p>
        )}
        <p className="text-[8px] text-muted-foreground mt-1.5 border-t border-border pt-1">💰 Elad: {item.sell_price} arany</p>
      </div>
    </motion.div>
  );
};

const InventoryPanel = ({ items, onEquip, onRefresh }: InventoryPanelProps) => {
  const [tooltip, setTooltip] = useState<{ item: InventoryItem; position: { x: number; y: number } } | null>(null);
  const equipped = items.filter(i => i.equipped);
  const bag = items.filter(i => !i.equipped);

  const sellItem = async (item: InventoryItem) => {
    if (item.equipped) { toast.error('Először vedd le!'); return; }
    await supabase.from('inventory_items').delete().eq('id', item.id);
    const charRes = await supabase.from('characters').select('id, gold').eq('id', item.character_id).single();
    if (charRes.data) {
      await supabase.from('characters').update({ gold: charRes.data.gold + item.sell_price }).eq('id', charRes.data.id);
    }
    toast.success(`${item.name} eladva ${item.sell_price}💰`);
    onRefresh?.();
  };

  const handleMouseEnter = (e: React.MouseEvent, item: InventoryItem) => {
    setTooltip({ item, position: { x: e.clientX, y: e.clientY } });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip(prev => prev ? { ...prev, position: { x: e.clientX, y: e.clientY } } : null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Set bonus calculation
  const setCounts: Record<string, number> = {};
  equipped.forEach(i => { if (i.set_name) setCounts[i.set_name] = (setCounts[i.set_name] || 0) + 1; });

  // Group equipped items by slot
  const equippedBySlot: Record<string, InventoryItem | undefined> = {};
  equipped.forEach(i => { equippedBySlot[i.type] = i; });

  return (
    <div className="rpg-panel h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-sm text-gold">🎒 Felszerelés</h3>
      </div>

      {/* Equipment Slots */}
      <div className="p-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2 font-display">Viselt Felszerelés</p>
        <div className="grid grid-cols-3 gap-1.5">
          {ITEM_SLOTS.map(slot => {
            const item = equippedBySlot[slot.id];
            return (
              <motion.div
                key={slot.id}
                whileHover={{ scale: 1.03 }}
                className={`rpg-panel p-1.5 flex items-center gap-1.5 cursor-pointer min-h-[36px] ${item ? 'border-glow' : 'opacity-50'}`}
                onClick={() => item && onEquip?.(item.id)}
                onMouseEnter={(e) => item && handleMouseEnter(e, item)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <span className="text-sm">{item?.icon || slot.icon}</span>
                <div className="min-w-0 flex-1">
                  {item ? (
                    <>
                      <p className={`text-[9px] font-semibold truncate ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                      <div className="flex gap-0.5 text-[7px] text-muted-foreground">
                        {item.atk > 0 && <span className="text-ember">+{item.atk}A</span>}
                        {item.def > 0 && <span>+{item.def}D</span>}
                        {item.crit_chance > 0 && <span className="text-gold">{item.crit_chance}%C</span>}
                      </div>
                    </>
                  ) : (
                    <p className="text-[8px] text-muted-foreground truncate">{slot.name}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
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
              className="rpg-panel aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-glow transition-all group relative"
              onClick={() => onEquip?.(item.id)}
              onMouseEnter={(e) => handleMouseEnter(e, item)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: item.rarity === 'legendary' ? 'hsl(40 80% 50%)' : item.rarity === 'epic' ? 'hsl(260 40% 50%)' : item.rarity === 'rare' ? 'hsl(220 70% 55%)' : 'transparent' }} />
              <button
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => { e.stopPropagation(); sellItem(item); }}
                title={`Elad: ${item.sell_price}💰`}
              >💰</button>
            </motion.div>
          ))}
          {[...Array(Math.max(0, 16 - bag.length))].map((_, i) => (
            <div key={`empty-${i}`} className="rpg-panel aspect-square opacity-30" />
          ))}
        </div>
      </div>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {tooltip && <ItemTooltip item={tooltip.item} position={tooltip.position} />}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPanel;
