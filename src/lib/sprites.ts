import warriorBack from '@/assets/sprites/warrior-back.png';
import mageBack from '@/assets/sprites/mage-back.png';
import rogueBack from '@/assets/sprites/rogue-back.png';
import enemyGoblin from '@/assets/sprites/enemy-goblin.png';
import enemySkeleton from '@/assets/sprites/enemy-skeleton.png';
import enemyDragon from '@/assets/sprites/enemy-dragon.png';
import enemyWolf from '@/assets/sprites/enemy-wolf.png';
import enemyDemon from '@/assets/sprites/enemy-demon.png';
import enemyKraken from '@/assets/sprites/enemy-kraken.png';
import enemyGolem from '@/assets/sprites/enemy-golem.png';
import enemyMage from '@/assets/sprites/enemy-mage.png';
import bgGrass from '@/assets/sprites/battle-bg-grass.jpg';
import bgDungeon from '@/assets/sprites/battle-bg-dungeon.jpg';
import bgWater from '@/assets/sprites/battle-bg-water.jpg';

export const PLAYER_SPRITES: Record<string, string> = {
  warrior: warriorBack,
  mage: mageBack,
  rogue: rogueBack,
};

export const getPlayerSprite = (charClass: string): string => {
  return PLAYER_SPRITES[charClass] || warriorBack;
};

/**
 * Map enemy name/icon to a sprite. Falls back to a class-based sprite,
 * then to the goblin sprite as ultimate fallback.
 */
export const getEnemySprite = (enemyName: string, enemyIcon?: string): string => {
  const n = enemyName.toLowerCase();

  // Specific creature matches (Hungarian names)
  if (n.includes('kraken') || n.includes('polip') || n.includes('tintahal')) return enemyKraken;
  if (n.includes('sárkány') || n.includes('hidra')) return enemyDragon;
  if (n.includes('csontváz') || n.includes('múmia') || n.includes('lich') || n.includes('csonttrón')) return enemySkeleton;
  if (n.includes('farkas') || n.includes('kutya')) return enemyWolf;
  if (n.includes('démon') || n.includes('démoni') || n.includes('ördög') || n.includes('pokol') || n.includes('démonlord')) return enemyDemon;
  if (n.includes('golem') || n.includes('kőgolem') || n.includes('óriás') || n.includes('titán')) return enemyGolem;
  if (n.includes('varázsló') || n.includes('mágus') || n.includes('boszorkány') || n.includes('nekromanta')) return enemyMage;
  if (n.includes('goblin') || n.includes('bandita') || n.includes('orc') || n.includes('kobold')) return enemyGoblin;

  // Icon-based fallback
  if (enemyIcon) {
    if (enemyIcon.includes('🐉') || enemyIcon.includes('🐲')) return enemyDragon;
    if (enemyIcon.includes('💀') || enemyIcon.includes('☠️') || enemyIcon.includes('🧟')) return enemySkeleton;
    if (enemyIcon.includes('🐺') || enemyIcon.includes('🐕')) return enemyWolf;
    if (enemyIcon.includes('😈') || enemyIcon.includes('👿') || enemyIcon.includes('👹')) return enemyDemon;
    if (enemyIcon.includes('🗿') || enemyIcon.includes('💎') || enemyIcon.includes('🧊')) return enemyGolem;
    if (enemyIcon.includes('🧙') || enemyIcon.includes('🔮') || enemyIcon.includes('🧜')) return enemyMage;
    if (enemyIcon.includes('🦑') || enemyIcon.includes('🐙')) return enemyKraken;
  }

  return enemyGoblin;
};

/** Get a battle background based on location type / world */
export const getBattleBackground = (locationType?: string, world?: number): string => {
  if (world === 3) return bgWater;
  if (locationType === 'dungeon' || locationType === 'raid') return bgDungeon;
  return bgGrass;
};