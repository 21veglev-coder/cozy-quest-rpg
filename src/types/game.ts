export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'healer';

export interface ClassInfo {
  id: CharacterClass;
  name: string;
  icon: string;
  description: string;
  color: string;
  stats: { hp: number; mp: number; atk: number; def: number; spd: number };
}

export const CLASSES: ClassInfo[] = [
  {
    id: 'warrior',
    name: 'Harcos',
    icon: '⚔️',
    description: 'Erős közelharci hős, magas HP és védekezés.',
    color: 'text-ember',
    stats: { hp: 120, mp: 20, atk: 15, def: 12, spd: 8 },
  },
  {
    id: 'mage',
    name: 'Mágus',
    icon: '🔮',
    description: 'Varázslatok mestere, hatalmas mana készlet.',
    color: 'text-mana',
    stats: { hp: 70, mp: 100, atk: 18, def: 5, spd: 10 },
  },
  {
    id: 'rogue',
    name: 'Tolvaj',
    icon: '🗡️',
    description: 'Gyors és halálos, kritikus csapások specialistája.',
    color: 'text-nature',
    stats: { hp: 85, mp: 40, atk: 14, def: 7, spd: 16 },
  },
  {
    id: 'healer',
    name: 'Gyógyító',
    icon: '✨',
    description: 'A csapat támasza, gyógyítás és védelem.',
    color: 'text-gold',
    stats: { hp: 90, mp: 80, atk: 8, def: 9, spd: 11 },
  },
];

export interface GameCharacter {
  id: string;
  user_id: string;
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  gold: number;
  atk: number;
  def: number;
  spd: number;
  crit_chance: number;
  perk_points: number;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  description: string;
  equipped: boolean;
  atk: number;
  def: number;
  spd: number;
  hp_bonus: number;
  mp_bonus: number;
  crit_chance: number;
  socket_gems: string[];
  set_name: string | null;
  sell_price: number;
}

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  icon: string;
  description: string;
  price: number;
  level_req: number;
  class_req: string | null;
  atk: number;
  def: number;
  spd: number;
  hp_bonus: number;
  mp_bonus: number;
  crit_chance: number;
  set_name: string | null;
}

export interface GameLocation {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'zone' | 'town' | 'dungeon' | 'raid';
  level_req: number;
  grid_x: number;
  grid_y: number;
  connected_to: string[];
}

export interface CombatLogEntry {
  id: string;
  character_id: string;
  location_id: string | null;
  enemy_name: string;
  enemy_level: number;
  result: 'win' | 'lose';
  xp_gained: number;
  gold_gained: number;
  loot_item_id: string | null;
  combat_data: any;
  created_at: string;
}

export interface DungeonProgress {
  id: string;
  character_id: string;
  location_id: string;
  current_floor: number;
  max_floor: number;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

export interface CharacterPerk {
  id: string;
  character_id: string;
  perk_id: string;
  tier: number;
}

// ---- PERK DEFINITIONS ----
export interface PerkDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxTier: number;
  classReq: CharacterClass | null;
  effect: (tier: number) => { atk?: number; def?: number; spd?: number; hp?: number; mp?: number; crit?: number };
}

export const PERKS: PerkDef[] = [
  { id: 'brute_force', name: 'Nyers Erő', icon: '💪', description: 'ATK +3/tier', maxTier: 5, classReq: 'warrior', effect: t => ({ atk: t * 3 }) },
  { id: 'iron_skin', name: 'Vasalja Bőr', icon: '🛡️', description: 'DEF +3/tier', maxTier: 5, classReq: 'warrior', effect: t => ({ def: t * 3 }) },
  { id: 'war_cry', name: 'Harci Kiáltás', icon: '📣', description: 'HP +15/tier', maxTier: 4, classReq: 'warrior', effect: t => ({ hp: t * 15 }) },
  { id: 'arcane_power', name: 'Mágikus Erő', icon: '🔮', description: 'ATK +4/tier', maxTier: 5, classReq: 'mage', effect: t => ({ atk: t * 4 }) },
  { id: 'mana_well', name: 'Mana Kút', icon: '💧', description: 'MP +20/tier', maxTier: 5, classReq: 'mage', effect: t => ({ mp: t * 20 }) },
  { id: 'spell_haste', name: 'Varázs Gyorsaság', icon: '⚡', description: 'SPD +2/tier', maxTier: 4, classReq: 'mage', effect: t => ({ spd: t * 2 }) },
  { id: 'backstab', name: 'Hátba Szúrás', icon: '🔪', description: 'CRIT +4%/tier', maxTier: 5, classReq: 'rogue', effect: t => ({ crit: t * 4 }) },
  { id: 'evasion', name: 'Kitérés', icon: '💨', description: 'SPD +3/tier', maxTier: 5, classReq: 'rogue', effect: t => ({ spd: t * 3 }) },
  { id: 'poison_blade', name: 'Mérgezett Penge', icon: '☠️', description: 'ATK +2/tier', maxTier: 4, classReq: 'rogue', effect: t => ({ atk: t * 2 }) },
  { id: 'divine_light', name: 'Szent Fény', icon: '☀️', description: 'HP +20/tier', maxTier: 5, classReq: 'healer', effect: t => ({ hp: t * 20 }) },
  { id: 'inner_peace', name: 'Belső Béke', icon: '🧘', description: 'MP +15/tier', maxTier: 5, classReq: 'healer', effect: t => ({ mp: t * 15 }) },
  { id: 'guardian', name: 'Őrangyal', icon: '👼', description: 'DEF +2/tier', maxTier: 4, classReq: 'healer', effect: t => ({ def: t * 2 }) },
  // Universal perks
  { id: 'vitality', name: 'Életerő', icon: '❤️', description: 'HP +10/tier', maxTier: 5, classReq: null, effect: t => ({ hp: t * 10 }) },
  { id: 'swiftness', name: 'Fürgeség', icon: '🏃', description: 'SPD +2/tier', maxTier: 3, classReq: null, effect: t => ({ spd: t * 2 }) },
  { id: 'fortune', name: 'Szerencse', icon: '🍀', description: 'CRIT +2%/tier', maxTier: 3, classReq: null, effect: t => ({ crit: t * 2 }) },
];

// ---- ENEMY DEFINITIONS ----
export interface EnemyDef {
  name: string;
  icon: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  xpReward: number;
  goldReward: number;
  locationType: 'zone' | 'dungeon' | 'raid';
  minZoneLevel: number;
}

export const ENEMIES: EnemyDef[] = [
  { name: 'Goblin', icon: '👺', level: 1, hp: 30, atk: 5, def: 2, spd: 8, xpReward: 15, goldReward: 5, locationType: 'zone', minZoneLevel: 1 },
  { name: 'Farkas', icon: '🐺', level: 2, hp: 45, atk: 8, def: 3, spd: 12, xpReward: 25, goldReward: 8, locationType: 'zone', minZoneLevel: 1 },
  { name: 'Pók Királyné', icon: '🕷️', level: 3, hp: 60, atk: 10, def: 5, spd: 6, xpReward: 40, goldReward: 15, locationType: 'zone', minZoneLevel: 3 },
  { name: 'Csontváz Harcos', icon: '💀', level: 5, hp: 80, atk: 14, def: 8, spd: 7, xpReward: 60, goldReward: 20, locationType: 'zone', minZoneLevel: 5 },
  { name: 'Tűz Elementál', icon: '🔥', level: 7, hp: 120, atk: 20, def: 6, spd: 10, xpReward: 100, goldReward: 35, locationType: 'zone', minZoneLevel: 7 },
  { name: 'Sötét Varázsló', icon: '🧙‍♂️', level: 4, hp: 70, atk: 16, def: 4, spd: 9, xpReward: 80, goldReward: 30, locationType: 'dungeon', minZoneLevel: 4 },
  { name: 'Kőgolem', icon: '🗿', level: 5, hp: 150, atk: 12, def: 18, spd: 3, xpReward: 90, goldReward: 25, locationType: 'dungeon', minZoneLevel: 4 },
  { name: 'Vámpír Gróf', icon: '🧛', level: 6, hp: 100, atk: 18, def: 10, spd: 14, xpReward: 120, goldReward: 45, locationType: 'dungeon', minZoneLevel: 6 },
  { name: 'Lich Király', icon: '👑', level: 8, hp: 200, atk: 22, def: 12, spd: 8, xpReward: 200, goldReward: 80, locationType: 'dungeon', minZoneLevel: 8 },
  { name: 'Ősi Sárkány', icon: '🐉', level: 10, hp: 500, atk: 35, def: 20, spd: 12, xpReward: 500, goldReward: 200, locationType: 'raid', minZoneLevel: 8 },
];

// ---- SET BONUSES ----
export const SET_BONUSES: Record<string, { pieces: number; bonus: string; effect: { atk?: number; def?: number; spd?: number; hp?: number; mp?: number; crit?: number } }> = {
  'Árnyék': { pieces: 2, bonus: 'SPD +8, CRIT +8%', effect: { spd: 8, crit: 8 } },
  'Tűz': { pieces: 2, bonus: 'ATK +10, MP +30', effect: { atk: 10, mp: 30 } },
  'Szent': { pieces: 2, bonus: 'HP +50, DEF +5', effect: { hp: 50, def: 5 } },
  'Legenda': { pieces: 2, bonus: 'ATK +15, DEF +10, HP +50', effect: { atk: 15, def: 10, hp: 50 } },
};

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-nature',
  rare: 'text-mana',
  epic: 'text-shadow',
  legendary: 'text-gold',
};

export const STARTER_ITEMS: Record<CharacterClass, Omit<InventoryItem, 'id' | 'character_id'>[]> = {
  warrior: [
    { name: 'Rozsdás Kard', type: 'weapon', rarity: 'common', icon: '🗡️', description: 'Egy régi, de megbízható kard.', equipped: true, atk: 3, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 0, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Bőrpáncél', type: 'armor', rarity: 'common', icon: '🛡️', description: 'Alap bőr védelem.', equipped: true, atk: 0, def: 3, spd: 0, hp_bonus: 10, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Kis Gyógyital', type: 'potion', rarity: 'common', icon: '🧪', description: '+30 HP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 30, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
  mage: [
    { name: 'Fabot', type: 'weapon', rarity: 'common', icon: '🪄', description: 'Egyszerű varázspálca.', equipped: true, atk: 4, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 5, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Köpeny', type: 'armor', rarity: 'common', icon: '🧥', description: 'Mágikus köntös.', equipped: true, atk: 0, def: 2, spd: 0, hp_bonus: 0, mp_bonus: 15, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Mana Ital', type: 'potion', rarity: 'common', icon: '💧', description: '+30 MP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 30, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
  rogue: [
    { name: 'Tőr', type: 'weapon', rarity: 'common', icon: '🔪', description: 'Gyors pengéjű tőr.', equipped: true, atk: 3, def: 0, spd: 2, hp_bonus: 0, mp_bonus: 0, crit_chance: 3, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Sötét Ruha', type: 'armor', rarity: 'common', icon: '🥷', description: 'Rejtőzködéshez tökéletes.', equipped: true, atk: 0, def: 2, spd: 3, hp_bonus: 0, mp_bonus: 0, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Füstbomba', type: 'potion', rarity: 'uncommon', icon: '💨', description: 'Meneküléshez.', equipped: false, atk: 0, def: 0, spd: 5, hp_bonus: 0, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 8 },
  ],
  healer: [
    { name: 'Szent Bot', type: 'weapon', rarity: 'common', icon: '✝️', description: 'Gyógyító energiát áraszt.', equipped: true, atk: 2, def: 0, spd: 0, hp_bonus: 10, mp_bonus: 5, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Fehér Palást', type: 'armor', rarity: 'common', icon: '👘', description: 'Védelmet ad.', equipped: true, atk: 0, def: 3, spd: 0, hp_bonus: 10, mp_bonus: 10, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Nagy Gyógyital', type: 'potion', rarity: 'uncommon', icon: '🧪', description: '+60 HP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 60, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 8 },
  ],
};
