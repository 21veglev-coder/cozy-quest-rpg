import { InventoryItem, RARITY_COLORS } from '@/types/game';
import { motion } from 'framer-motion';

interface InventoryPanelProps {
  items: InventoryItem[];
  onEquip?: (itemId: string) => void;
}

const InventoryPanel = ({ items, onEquip }: InventoryPanelProps) => {
  const equipped = items.filter(i => i.equipped);
  const bag = items.filter(i => !i.equipped);

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
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03 }}
              className="rpg-panel border-glow p-2 flex items-center gap-2 cursor-pointer"
              onClick={() => onEquip?.(item.id)}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.type}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bag */}
      <div className="p-3 flex-1 overflow-y-auto">
        <p className="text-xs text-muted-foreground mb-2 font-display">Táska</p>
        <div className="grid grid-cols-4 gap-2">
          {bag.map(item => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.1 }}
              className="rpg-panel aspect-square flex items-center justify-center cursor-pointer hover:border-glow transition-all group relative"
              onClick={() => onEquip?.(item.id)}
              title={`${item.name} - ${item.description}`}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" 
                style={{ backgroundColor: item.rarity === 'legendary' ? 'hsl(40 80% 50%)' : item.rarity === 'epic' ? 'hsl(260 40% 50%)' : 'transparent' }} 
              />
            </motion.div>
          ))}
          {/* Empty slots */}
          {[...Array(Math.max(0, 12 - bag.length))].map((_, i) => (
            <div key={`empty-${i}`} className="rpg-panel aspect-square opacity-30" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
