import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { getPlayerSprite, getEnemySprite, getBattleBackground } from '@/lib/sprites';

interface BattleStats {
  id?: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  charClass?: string;
  isActive?: boolean;
  isDefeated?: boolean;
}

interface EnemyStats {
  id?: string;
  name: string;
  icon: string;
  level: number;
  hp: number;
  maxHp: number;
  isTarget?: boolean;
  isDefeated?: boolean;
}

interface PokemonBattleSceneProps {
  // Player(s) — pass single via `player`+`playerClass` OR multiple via `players`
  playerClass?: string;
  player?: BattleStats;
  players?: BattleStats[];
  // Enemy — single via `enemyName/Icon/...` OR multiple via `enemies`
  enemyName?: string;
  enemyIcon?: string;
  enemyLevel?: number;
  enemyHp?: number;
  enemyMaxHp?: number;
  enemies?: EnemyStats[];
  // Wave indicator
  wave?: number;
  maxWaves?: number;
  // Visual state
  attackingSide: 'player' | 'enemy' | null;
  shakePlayer?: boolean;
  shakeEnemy?: boolean;
  enemyDefeated?: boolean;
  playerDefeated?: boolean;
  locationType?: string;
  world?: number;
  // Optional buff/debuff badges
  playerBadges?: ReactNode;
  enemyBadges?: ReactNode;
  // Floating numbers (already positioned)
  floatingNumbers?: ReactNode;
  // Dialogue / log box content (last 2-3 lines as Pokemon-style text)
  dialogue?: string;
  // Action menu (rendered at bottom-right of dialogue)
  actionMenu?: ReactNode;
  // Click handler for selecting a target enemy (when enemies array given)
  onTargetEnemy?: (enemyId: string) => void;
}

/**
 * Pokemon-style battle scene:
 * - Background image
 * - Enemy sprite (top-right, facing forward) with stats panel (top-left)
 * - Player sprite (bottom-left, back view) with stats panel (bottom-right)
 * - Bottom dialogue / action box
 */
const PokemonBattleScene = ({
  playerClass, player,
  enemyName, enemyIcon, enemyLevel, enemyHp, enemyMaxHp,
  attackingSide, shakePlayer, shakeEnemy,
  enemyDefeated, playerDefeated,
  locationType, world,
  playerBadges, enemyBadges, floatingNumbers,
  dialogue, actionMenu,
}: PokemonBattleSceneProps) => {
  const playerSprite = getPlayerSprite(playerClass);
  const enemySprite = getEnemySprite(enemyName, enemyIcon);
  const bg = getBattleBackground(locationType, world);

  const enemyHpPct = enemyMaxHp > 0 ? (enemyHp / enemyMaxHp) * 100 : 0;
  const playerHpPct = player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const playerMpPct = player.maxMp && player.maxMp > 0 ? ((player.mp || 0) / player.maxMp) * 100 : 0;

  const hpColor = (pct: number) =>
    pct > 50 ? 'bg-nature' : pct > 25 ? 'bg-gold' : 'bg-blood';

  return (
    <div className="relative w-full rounded-lg overflow-hidden border-2 border-gold/40 shadow-lg">
      {/* Battle Arena */}
      <div
        className="relative w-full aspect-[16/9] bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        {/* Floating damage numbers layer */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {floatingNumbers}
        </div>

        {/* Enemy Stats Panel - top-left */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm border-2 border-gold/60 rounded-lg p-2 min-w-[180px] shadow-md"
        >
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="font-display text-xs text-foreground truncate">{enemyName}</span>
            <span className="font-display text-[10px] text-muted-foreground">Lv.{enemyLevel}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className={`h-full ${hpColor(enemyHpPct)} rounded-full`}
              animate={{ width: `${Math.max(0, enemyHpPct)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[9px] text-right text-muted-foreground mt-0.5 font-display">
            HP {enemyHp}/{enemyMaxHp}
          </div>
          {enemyBadges && <div className="flex flex-wrap gap-1 mt-1">{enemyBadges}</div>}
        </motion.div>

        {/* Enemy sprite - top-right */}
        <motion.div
          className="absolute top-8 right-8 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48"
          initial={{ x: 200, opacity: 0 }}
          animate={
            enemyDefeated
              ? { opacity: 0, y: 60, rotateZ: 25, scale: 0.8 }
              : shakeEnemy
                ? { x: [0, -10, 10, -8, 8, 0] }
                : attackingSide === 'enemy'
                  ? { x: [0, -40, 0], scale: [1, 1.05, 1] }
                  : { x: 0, opacity: 1 }
          }
          transition={{ duration: enemyDefeated ? 0.8 : 0.4 }}
        >
          <motion.img
            src={enemySprite}
            alt={enemyName}
            className="w-full h-full object-contain pixelated drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
            animate={enemyHpPct < 30 && !enemyDefeated ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ imageRendering: 'pixelated' }}
          />
          {/* Enemy shadow */}
          {!enemyDefeated && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/40 rounded-full blur-sm" />
          )}
        </motion.div>

        {/* Player sprite - bottom-left (back view) */}
        <motion.div
          className="absolute bottom-2 left-4 w-32 h-32 sm:w-40 sm:h-40 lg:w-52 lg:h-52"
          initial={{ x: -200, opacity: 0 }}
          animate={
            playerDefeated
              ? { opacity: 0.4, y: 30, rotateZ: -15 }
              : shakePlayer
                ? { x: [0, -8, 8, -5, 5, 0] }
                : attackingSide === 'player'
                  ? { x: [0, 40, 0], scale: [1, 1.05, 1] }
                  : { x: 0, opacity: 1 }
          }
          transition={{ duration: 0.4 }}
        >
          <motion.img
            src={playerSprite}
            alt={player.name}
            className="w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
            animate={playerHpPct < 25 && !playerDefeated ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ imageRendering: 'pixelated' }}
          />
          {!playerDefeated && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-3 bg-black/40 rounded-full blur-sm" />
          )}
        </motion.div>

        {/* Player Stats Panel - bottom-right */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm border-2 border-gold/60 rounded-lg p-2 min-w-[200px] shadow-md"
        >
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="font-display text-xs text-gold truncate">{player.name}</span>
            <span className="font-display text-[10px] text-muted-foreground">Lv.{player.level}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className={`h-full ${hpColor(playerHpPct)} rounded-full`}
              animate={{ width: `${Math.max(0, playerHpPct)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[9px] text-right text-foreground mt-0.5 font-display">
            HP {player.hp}/{player.maxHp}
          </div>
          {player.maxMp !== undefined && (
            <>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden border border-border mt-1">
                <motion.div
                  className="h-full bg-mana rounded-full"
                  animate={{ width: `${Math.max(0, playerMpPct)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="text-[8px] text-right text-mana mt-0.5 font-display">
                MP {player.mp}/{player.maxMp}
              </div>
            </>
          )}
          {playerBadges && <div className="flex flex-wrap gap-1 mt-1">{playerBadges}</div>}
        </motion.div>
      </div>

      {/* Bottom dialogue + action box (Pokemon-style) */}
      <div className="bg-card border-t-4 border-gold/60 p-3 min-h-[120px] flex flex-col sm:flex-row gap-3">
        {/* Dialogue text */}
        <div className="flex-1 bg-background/80 border-2 border-border rounded p-3 text-foreground font-display text-sm leading-relaxed min-h-[80px]">
          <AnimatePresence mode="wait">
            {dialogue && (
              <motion.p
                key={dialogue}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {dialogue}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Action menu */}
        {actionMenu && (
          <div className="sm:w-64 shrink-0">
            {actionMenu}
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonBattleScene;