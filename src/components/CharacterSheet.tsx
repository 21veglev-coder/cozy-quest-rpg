import { GameCharacter, CLASSES } from '@/types/game';
import { motion } from 'framer-motion';

interface CharacterSheetProps {
  character: GameCharacter;
}

const CharacterSheet = ({ character }: CharacterSheetProps) => {
  const cls = CLASSES.find(c => c.id === character.class)!;
  const hpPercent = (character.hp / character.max_hp) * 100;
  const mpPercent = (character.mp / character.max_mp) * 100;
  const xpPercent = (character.xp / (character.level * 100)) * 100;

  return (
    <div className="rpg-panel-gold p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl animate-float">{cls.icon}</div>
        <div>
          <h3 className="font-display font-bold text-foreground">{character.name}</h3>
          <p className={`text-xs font-display ${cls.color}`}>
            {cls.name} · Lvl {character.level}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-gold font-display text-sm">💰 {character.gold}</p>
          {character.perk_points > 0 && <p className="text-gold text-xs">⭐ {character.perk_points}</p>}
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blood">HP</span>
          <span className="text-muted-foreground">{character.hp}/{character.max_hp}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-blood rounded-full" style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      {/* MP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-mana">MP</span>
          <span className="text-muted-foreground">{character.mp}/{character.max_mp}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-mana rounded-full" style={{ width: `${mpPercent}%` }} />
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gold">XP</span>
          <span className="text-muted-foreground">{character.xp}/{character.level * 100}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-gold rounded-full" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
        <div className="rpg-panel p-1.5">
          <p className="text-ember font-bold">{character.atk}</p>
          <p className="text-muted-foreground">ATK</p>
        </div>
        <div className="rpg-panel p-1.5">
          <p className="text-foreground/80 font-bold">{character.def}</p>
          <p className="text-muted-foreground">DEF</p>
        </div>
        <div className="rpg-panel p-1.5">
          <p className="text-nature font-bold">{character.spd}</p>
          <p className="text-muted-foreground">SPD</p>
        </div>
        <div className="rpg-panel p-1.5">
          <p className="text-gold font-bold">{character.crit_chance}%</p>
          <p className="text-muted-foreground">CRIT</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
