export type CharacterClass = 'warrior' | 'mage' | 'rogue';

export type WarriorSubclass = 'tank' | 'javliner' | 'samurai' | 'berserker';
export type MageSubclass = 'necromancer' | 'healer' | 'arcanist' | 'elementalist';
export type RogueSubclass = 'assassin' | 'archer' | 'hunter' | 'shadowblade';
export type Subclass = WarriorSubclass | MageSubclass | RogueSubclass;

export interface ClassInfo {
  id: CharacterClass;
  name: string;
  icon: string;
  description: string;
  color: string;
  stats: { hp: number; mp: number; atk: number; def: number; spd: number; crit: number; str: number; int: number; agi: number; vit: number; luk: number };
}

export interface SubclassInfo {
  id: Subclass;
  name: string;
  icon: string;
  description: string;
  color: string;
  parentClass: CharacterClass;
  statBonuses: Partial<ClassInfo['stats']>;
}

export const CLASSES: ClassInfo[] = [
  {
    id: 'warrior',
    name: 'Harcos',
    icon: '⚔️',
    description: 'Erős közelharci hős, magas HP és védekezés.',
    color: 'text-ember',
    stats: { hp: 150, mp: 30, atk: 18, def: 16, spd: 8, crit: 5, str: 20, int: 5, agi: 8, vit: 18, luk: 6 },
  },
  {
    id: 'mage',
    name: 'Mágus',
    icon: '🔮',
    description: 'Varázslatok mestere, hatalmas mana készlet.',
    color: 'text-mana',
    stats: { hp: 80, mp: 120, atk: 22, def: 6, spd: 10, crit: 8, str: 5, int: 22, agi: 10, vit: 8, luk: 7 },
  },
  {
    id: 'rogue',
    name: 'Tolvaj',
    icon: '🗡️',
    description: 'Gyors és halálos, kritikus csapások specialistája.',
    color: 'text-nature',
    stats: { hp: 100, mp: 50, atk: 16, def: 8, spd: 18, crit: 15, str: 12, int: 8, agi: 22, vit: 10, luk: 12 },
  },
];

export const SUBCLASSES: SubclassInfo[] = [
  // Warrior subclasses
  { id: 'tank', name: 'Pajzsvédő', icon: '🛡️', description: 'A csapat védőfala. Hatalmas DEF és HP.', color: 'text-ember', parentClass: 'warrior', statBonuses: { hp: 60, def: 12, vit: 10, spd: -3 } },
  { id: 'javliner', name: 'Dárdás', icon: '🔱', description: 'Távolsági közelharcos, átütő erővel.', color: 'text-ember', parentClass: 'warrior', statBonuses: { atk: 10, spd: 5, str: 8, agi: 5 } },
  { id: 'samurai', name: 'Szamuráj', icon: '⛩️', description: 'Fegyelmezett harcos, egyensúlyban.', color: 'text-ember', parentClass: 'warrior', statBonuses: { atk: 8, def: 5, spd: 5, crit: 8, str: 5, agi: 5 } },
  { id: 'berserker', name: 'Berserker', icon: '🪓', description: 'Őrült sebzés, gyenge védelem.', color: 'text-destructive', parentClass: 'warrior', statBonuses: { atk: 18, crit: 12, str: 15, def: -5, hp: -20 } },

  // Mage subclasses
  { id: 'necromancer', name: 'Nekromanta', icon: '💀', description: 'A halál mestere, sötét varázslatok.', color: 'text-shadow', parentClass: 'mage', statBonuses: { atk: 12, hp: 20, int: 10, mp: 20, vit: 5 } },
  { id: 'healer', name: 'Gyógyító', icon: '✨', description: 'A csapat támasza, gyógyítás és védelem.', color: 'text-gold', parentClass: 'mage', statBonuses: { hp: 40, mp: 30, def: 6, vit: 10, int: 8 } },
  { id: 'arcanist', name: 'Arkanista', icon: '📖', description: 'Tiszta mágikus erő, maximális sebzés.', color: 'text-mana', parentClass: 'mage', statBonuses: { atk: 15, mp: 40, int: 15, crit: 5 } },
  { id: 'elementalist', name: 'Elementalista', icon: '🌪️', description: 'Az elemek ura: tűz, jég, villám.', color: 'text-accent', parentClass: 'mage', statBonuses: { atk: 10, mp: 25, spd: 5, int: 12, agi: 5 } },

  // Rogue subclasses
  { id: 'assassin', name: 'Orgyilkos', icon: '🔪', description: 'Egy csapás, egy halál. Maximális crit.', color: 'text-destructive', parentClass: 'rogue', statBonuses: { atk: 12, crit: 20, agi: 12, spd: 5, def: -3 } },
  { id: 'archer', name: 'Íjász', icon: '🏹', description: 'Távolsági harcban jeleskedik.', color: 'text-nature', parentClass: 'rogue', statBonuses: { atk: 10, spd: 8, agi: 10, crit: 8 } },
  { id: 'hunter', name: 'Vadász', icon: '🐾', description: 'A természet szövetségese, sokoldalú.', color: 'text-nature', parentClass: 'rogue', statBonuses: { hp: 20, atk: 5, def: 5, spd: 5, vit: 8, luk: 8 } },
  { id: 'shadowblade', name: 'Árnypenge', icon: '🌑', description: 'Árnyékból támad, méreggel öl.', color: 'text-shadow', parentClass: 'rogue', statBonuses: { atk: 8, spd: 10, crit: 12, agi: 10, int: 5 } },
];

// Item slot types (WoW-style 10 slots)
export type ItemSlot = 'weapon' | 'helmet' | 'shoulders' | 'chest' | 'legs' | 'boots' | 'gloves' | 'ring' | 'necklace' | 'potion' | 'quest';

export const ITEM_SLOTS: { id: ItemSlot; name: string; icon: string }[] = [
  { id: 'weapon', name: 'Fegyver', icon: '⚔️' },
  { id: 'helmet', name: 'Sisak', icon: '🪖' },
  { id: 'shoulders', name: 'Vállvédő', icon: '🦺' },
  { id: 'chest', name: 'Mellvért', icon: '🛡️' },
  { id: 'legs', name: 'Nadrág', icon: '👖' },
  { id: 'boots', name: 'Csizma', icon: '👢' },
  { id: 'gloves', name: 'Kesztyű', icon: '🧤' },
  { id: 'ring', name: 'Gyűrű', icon: '💍' },
  { id: 'necklace', name: 'Nyaklánc', icon: '📿' },
];

export const PRESTIGE_LEVEL_REQ = 50;
export const PRESTIGE_SUBCLASS_REQ = 1; // Minimum prestige to unlock subclass

export interface GameCharacter {
  id: string;
  user_id: string;
  name: string;
  class: CharacterClass;
  subclass: Subclass | null;
  prestige: number;
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
  type: ItemSlot;
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
  subclassReq: Subclass | null;
  effect: (tier: number) => { atk?: number; def?: number; spd?: number; hp?: number; mp?: number; crit?: number };
}

export const PERKS: PerkDef[] = [
  // ---- WARRIOR BASE ----
  { id: 'brute_force', name: 'Nyers Erő', icon: '💪', description: 'ATK +3/tier', maxTier: 5, classReq: 'warrior', subclassReq: null, effect: t => ({ atk: t * 3 }) },
  { id: 'iron_skin', name: 'Vasalja Bőr', icon: '🛡️', description: 'DEF +3/tier', maxTier: 5, classReq: 'warrior', subclassReq: null, effect: t => ({ def: t * 3 }) },
  { id: 'war_cry', name: 'Harci Kiáltás', icon: '📣', description: 'HP +15/tier', maxTier: 4, classReq: 'warrior', subclassReq: null, effect: t => ({ hp: t * 15 }) },
  // Tank subclass perks
  { id: 'fortress', name: 'Erőd', icon: '🏰', description: 'DEF +5/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'tank', effect: t => ({ def: t * 5 }) },
  { id: 'shield_wall', name: 'Pajzsfal', icon: '🧱', description: 'HP +25/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'tank', effect: t => ({ hp: t * 25 }) },
  // Berserker subclass perks
  { id: 'blood_rage', name: 'Vérszomj', icon: '🩸', description: 'ATK +6/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'berserker', effect: t => ({ atk: t * 6 }) },
  { id: 'frenzy', name: 'Őrjöngés', icon: '😤', description: 'SPD +4/tier, DEF -2/tier', maxTier: 4, classReq: 'warrior', subclassReq: 'berserker', effect: t => ({ spd: t * 4, def: t * -2 }) },
  // Samurai subclass perks
  { id: 'bushido', name: 'Bushido', icon: '⛩️', description: 'CRIT +5%/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'samurai', effect: t => ({ crit: t * 5 }) },
  { id: 'blade_dance', name: 'Pengék Tánca', icon: '💃', description: 'ATK +3, SPD +2/tier', maxTier: 4, classReq: 'warrior', subclassReq: 'samurai', effect: t => ({ atk: t * 3, spd: t * 2 }) },
  // Javliner subclass perks
  { id: 'piercing', name: 'Átütés', icon: '🔱', description: 'ATK +4/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'javliner', effect: t => ({ atk: t * 4 }) },
  { id: 'reach', name: 'Hosszú Kar', icon: '📏', description: 'SPD +3/tier', maxTier: 4, classReq: 'warrior', subclassReq: 'javliner', effect: t => ({ spd: t * 3 }) },

  // ---- MAGE BASE ----
  { id: 'arcane_power', name: 'Mágikus Erő', icon: '🔮', description: 'ATK +4/tier', maxTier: 5, classReq: 'mage', subclassReq: null, effect: t => ({ atk: t * 4 }) },
  { id: 'mana_well', name: 'Mana Kút', icon: '💧', description: 'MP +20/tier', maxTier: 5, classReq: 'mage', subclassReq: null, effect: t => ({ mp: t * 20 }) },
  { id: 'spell_haste', name: 'Varázs Gyorsaság', icon: '⚡', description: 'SPD +2/tier', maxTier: 4, classReq: 'mage', subclassReq: null, effect: t => ({ spd: t * 2 }) },
  // Healer subclass perks
  { id: 'divine_light', name: 'Szent Fény', icon: '☀️', description: 'HP +20/tier', maxTier: 5, classReq: 'mage', subclassReq: 'healer', effect: t => ({ hp: t * 20 }) },
  { id: 'guardian_angel', name: 'Őrangyal', icon: '👼', description: 'DEF +4/tier', maxTier: 5, classReq: 'mage', subclassReq: 'healer', effect: t => ({ def: t * 4 }) },
  // Necromancer subclass perks
  { id: 'dark_pact', name: 'Sötét Paktum', icon: '☠️', description: 'ATK +5/tier', maxTier: 5, classReq: 'mage', subclassReq: 'necromancer', effect: t => ({ atk: t * 5 }) },
  { id: 'soul_drain', name: 'Lélek Szívás', icon: '👻', description: 'HP +15, MP +10/tier', maxTier: 4, classReq: 'mage', subclassReq: 'necromancer', effect: t => ({ hp: t * 15, mp: t * 10 }) },
  // Arcanist subclass perks
  { id: 'pure_magic', name: 'Tiszta Mágia', icon: '✴️', description: 'ATK +6/tier', maxTier: 5, classReq: 'mage', subclassReq: 'arcanist', effect: t => ({ atk: t * 6 }) },
  { id: 'mana_surge', name: 'Mana Cunami', icon: '🌊', description: 'MP +30/tier', maxTier: 4, classReq: 'mage', subclassReq: 'arcanist', effect: t => ({ mp: t * 30 }) },
  // Elementalist subclass perks
  { id: 'elemental_fury', name: 'Elemi Düh', icon: '🌪️', description: 'ATK +4, SPD +2/tier', maxTier: 5, classReq: 'mage', subclassReq: 'elementalist', effect: t => ({ atk: t * 4, spd: t * 2 }) },
  { id: 'storm_shield', name: 'Vihar Pajzs', icon: '⛈️', description: 'DEF +3, MP +15/tier', maxTier: 4, classReq: 'mage', subclassReq: 'elementalist', effect: t => ({ def: t * 3, mp: t * 15 }) },

  // ---- ROGUE BASE ----
  { id: 'backstab', name: 'Hátba Szúrás', icon: '🔪', description: 'CRIT +4%/tier', maxTier: 5, classReq: 'rogue', subclassReq: null, effect: t => ({ crit: t * 4 }) },
  { id: 'evasion', name: 'Kitérés', icon: '💨', description: 'SPD +3/tier', maxTier: 5, classReq: 'rogue', subclassReq: null, effect: t => ({ spd: t * 3 }) },
  { id: 'poison_blade', name: 'Mérgezett Penge', icon: '☠️', description: 'ATK +2/tier', maxTier: 4, classReq: 'rogue', subclassReq: null, effect: t => ({ atk: t * 2 }) },
  // Assassin subclass perks
  { id: 'death_mark', name: 'Haláljegy', icon: '💀', description: 'CRIT +8%/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'assassin', effect: t => ({ crit: t * 8 }) },
  { id: 'execute', name: 'Kivégzés', icon: '⚰️', description: 'ATK +6/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'assassin', effect: t => ({ atk: t * 6 }) },
  // Archer subclass perks
  { id: 'eagle_eye', name: 'Sassszem', icon: '🦅', description: 'CRIT +5%, ATK +3/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'archer', effect: t => ({ crit: t * 5, atk: t * 3 }) },
  { id: 'wind_arrow', name: 'Szélnyíl', icon: '🏹', description: 'SPD +4/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'archer', effect: t => ({ spd: t * 4 }) },
  // Hunter subclass perks
  { id: 'tracking', name: 'Nyomkövetés', icon: '🐾', description: 'SPD +2, ATK +2/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'hunter', effect: t => ({ spd: t * 2, atk: t * 2 }) },
  { id: 'survival', name: 'Túlélés', icon: '🏕️', description: 'HP +15, DEF +2/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'hunter', effect: t => ({ hp: t * 15, def: t * 2 }) },
  // Shadowblade subclass perks
  { id: 'shadow_step', name: 'Árnyéklépés', icon: '🌑', description: 'SPD +5/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'shadowblade', effect: t => ({ spd: t * 5 }) },
  { id: 'venom_coat', name: 'Méregbevonat', icon: '🧪', description: 'ATK +4, CRIT +3/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'shadowblade', effect: t => ({ atk: t * 4, crit: t * 3 }) },

  // ---- UNIVERSAL ----
  { id: 'vitality', name: 'Életerő', icon: '❤️', description: 'HP +10/tier', maxTier: 5, classReq: null, subclassReq: null, effect: t => ({ hp: t * 10 }) },
  { id: 'swiftness', name: 'Fürgeség', icon: '🏃', description: 'SPD +2/tier', maxTier: 3, classReq: null, subclassReq: null, effect: t => ({ spd: t * 2 }) },
  { id: 'fortune', name: 'Szerencse', icon: '🍀', description: 'CRIT +2%/tier', maxTier: 3, classReq: null, subclassReq: null, effect: t => ({ crit: t * 2 }) },
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
    { name: 'Bőrpáncél', type: 'chest', rarity: 'common', icon: '🛡️', description: 'Alap bőr védelem.', equipped: true, atk: 0, def: 3, spd: 0, hp_bonus: 10, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Kis Gyógyital', type: 'potion', rarity: 'common', icon: '🧪', description: '+30 HP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 30, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
  mage: [
    { name: 'Fabot', type: 'weapon', rarity: 'common', icon: '🪄', description: 'Egyszerű varázspálca.', equipped: true, atk: 4, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 5, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Köpeny', type: 'chest', rarity: 'common', icon: '🧥', description: 'Mágikus köntös.', equipped: true, atk: 0, def: 2, spd: 0, hp_bonus: 0, mp_bonus: 15, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Mana Ital', type: 'potion', rarity: 'uncommon', icon: '💧', description: '+30 MP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 30, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
  rogue: [
    { name: 'Tőr', type: 'weapon', rarity: 'common', icon: '🔪', description: 'Gyors pengéjű tőr.', equipped: true, atk: 3, def: 0, spd: 2, hp_bonus: 0, mp_bonus: 0, crit_chance: 3, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Sötét Ruha', type: 'chest', rarity: 'common', icon: '🥷', description: 'Rejtőzködéshez tökéletes.', equipped: true, atk: 0, def: 2, spd: 3, hp_bonus: 0, mp_bonus: 0, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Füstbomba', type: 'potion', rarity: 'uncommon', icon: '💨', description: 'Meneküléshez.', equipped: false, atk: 0, def: 0, spd: 5, hp_bonus: 0, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 8 },
  ],
};
