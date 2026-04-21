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
  playerClass, player, players,
  enemyName, enemyIcon, enemyLevel, enemyHp, enemyMaxHp, enemies,
  wave, maxWaves,
  attackingSide, shakePlayer, shakeEnemy,
  enemyDefeated, playerDefeated,
  locationType, world,
  playerBadges, enemyBadges, floatingNumbers,
  dialogue, actionMenu, onTargetEnemy,
}: PokemonBattleSceneProps) => {
  const bg = getBattleBackground(locationType, world);

  // Normalize to arrays
  const playerList: BattleStats[] = players && players.length > 0
    ? players
    : (player ? [{ ...player, charClass: playerClass, isActive: true }] : []);
  const enemyList: EnemyStats[] = enemies && enemies.length > 0
    ? enemies
    : (enemyName ? [{
        name: enemyName, icon: enemyIcon || '👹', level: enemyLevel || 1,
        hp: enemyHp || 0, maxHp: enemyMaxHp || 1, isDefeated: enemyDefeated,
      }] : []);

  const hpColor = (pct: number) =>
    pct > 50 ? 'bg-nature' : pct > 25 ? 'bg-gold' : 'bg-blood';

  // Layout sizing for multiple sprites
  const enemySize = enemyList.length === 1 ? 'w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48'
    : enemyList.length === 2 ? 'w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36'
    : 'w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28';
  const playerSize = playerList.length === 1 ? 'w-32 h-32 sm:w-40 sm:h-40 lg:w-52 lg:h-52'
    : playerList.length === 2 ? 'w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40'
    : 'w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32';

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

        {/* Wave indicator - top center */}
        {wave !== undefined && maxWaves !== undefined && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-card/90 backdrop-blur-sm border-2 border-gold/60 rounded-full px-3 py-1 shadow-md">
            <span className="font-display text-[10px] text-gold">🌊 Hullám {wave}/{maxWaves}</span>
          </div>
        )}

        {/* Enemies row - top */}
        <div className="absolute top-0 right-0 left-0 flex justify-end items-start gap-2 p-3 z-10">
          {enemyList.map((e, idx) => {
            const pct = e.maxHp > 0 ? (e.hp / e.maxHp) * 100 : 0;
            const isAttackingTarget = attackingSide === 'player' && idx === 0;
            const shakeThis = shakeEnemy && idx === 0;
            const isClickable = !!onTargetEnemy && !e.isDefeated && !!e.id;
            return (
              <motion.div
                key={e.id || `enemy-${idx}`}
                className="flex flex-col items-center gap-1"
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {/* Stats panel above sprite */}
                <div className={`bg-card/90 backdrop-blur-sm border-2 ${e.isTarget ? 'border-blood' : 'border-gold/60'} rounded-lg p-1.5 min-w-[120px] shadow-md`}>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-display text-[10px] text-foreground truncate">{e.name}</span>
                    <span className="font-display text-[9px] text-muted-foreground">Lv.{e.level}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden border border-border mt-0.5">
                    <motion.div
                      className={`h-full ${hpColor(pct)} rounded-full`}
                      animate={{ width: `${Math.max(0, pct)}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="text-[8px] text-right text-muted-foreground font-display">{e.hp}/{e.maxHp}</div>
                </div>
                {/* Sprite */}
                <motion.div
                  className={`relative ${enemySize} ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => isClickable && onTargetEnemy!(e.id!)}
                  animate={
                    e.isDefeated
                      ? { opacity: 0, y: 60, rotateZ: 25, scale: 0.8 }
                      : shakeThis
                        ? { x: [0, -10, 10, -8, 8, 0] }
                        : isAttackingTarget
                          ? { x: [0, -30, 0], scale: [1, 1.05, 1] }
                          : {}
                  }
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  transition={{ duration: e.isDefeated ? 0.8 : 0.3 }}
                >
                  <motion.img
                    src={getEnemySprite(e.name, e.icon)}
                    alt={e.name}
                    className="w-full h-full object-contain pixelated drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
                    animate={pct < 30 && !e.isDefeated ? { y: [0, -3, 0] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {e.isTarget && !e.isDefeated && (
                    <motion.div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-blood text-lg"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >▼</motion.div>
                  )}
                  {!e.isDefeated && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/40 rounded-full blur-sm" />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
          {enemyBadges && <div className="absolute top-12 right-3 flex flex-wrap gap-1 max-w-[160px] justify-end">{enemyBadges}</div>}
        </div>

        {/* Players row - bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-start items-end gap-2 p-3 z-10">
          {playerList.map((p, idx) => {
            const pct = p.maxHp > 0 ? (p.hp / p.maxHp) * 100 : 0;
            const mpPct = p.maxMp && p.maxMp > 0 ? ((p.mp || 0) / p.maxMp) * 100 : 0;
            const isAttacker = attackingSide === 'player' && p.isActive;
            const shakeThis = shakePlayer && p.isActive;
            const sprite = getPlayerSprite(p.charClass || playerClass || 'warrior');
            return (
              <motion.div
                key={p.id || `player-${idx}`}
                className="flex flex-col items-center gap-1"
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {/* Sprite */}
                <motion.div
                  className={`relative ${playerSize}`}
                  animate={
                    p.isDefeated
                      ? { opacity: 0.35, y: 30, rotateZ: -15 }
                      : shakeThis
                        ? { x: [0, -8, 8, -5, 5, 0] }
                        : isAttacker
                          ? { x: [0, 40, 0], scale: [1, 1.05, 1] }
                          : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <motion.img
                    src={sprite}
                    alt={p.name}
                    className="w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
                    animate={pct < 25 && !p.isDefeated ? { y: [0, -2, 0] } : {}}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {p.isActive && !p.isDefeated && (
                    <motion.div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-gold text-lg"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >▼</motion.div>
                  )}
                  {!p.isDefeated && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/40 rounded-full blur-sm" />
                  )}
                </motion.div>
                {/* Stats below sprite */}
                <div className={`bg-card/90 backdrop-blur-sm border-2 ${p.isActive ? 'border-gold' : 'border-gold/40'} rounded-lg p-1.5 min-w-[130px] shadow-md`}>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`font-display text-[10px] truncate ${p.isActive ? 'text-gold' : 'text-foreground'}`}>{p.name}</span>
                    <span className="font-display text-[9px] text-muted-foreground">Lv.{p.level}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden border border-border mt-0.5">
                    <motion.div
                      className={`h-full ${hpColor(pct)} rounded-full`}
                      animate={{ width: `${Math.max(0, pct)}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="text-[8px] text-right text-foreground font-display">{p.hp}/{p.maxHp}</div>
                  {p.maxMp !== undefined && (
                    <div className="h-1 bg-secondary rounded-full overflow-hidden border border-border mt-0.5">
                      <motion.div
                        className="h-full bg-mana rounded-full"
                        animate={{ width: `${Math.max(0, mpPct)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {playerBadges && <div className="absolute bottom-20 left-3 flex flex-wrap gap-1 max-w-[160px]">{playerBadges}</div>}
        </div>
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