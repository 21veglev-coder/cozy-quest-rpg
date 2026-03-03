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
export const PRESTIGE_SUBCLASS_REQ = 1;

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
  subclass_req: string | null;
  atk: number;
  def: number;
  spd: number;
  hp_bonus: number;
  mp_bonus: number;
  crit_chance: number;
  set_name: string | null;
  world: number;
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
  world: number;
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

export interface Clan {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  leader_id: string;
  level: number;
  xp: number;
  max_members: number;
  created_at: string;
}

export interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  character_id: string;
  role: 'leader' | 'officer' | 'member';
  joined_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  target_location_id: string | null;
  status: 'forming' | 'ready' | 'in_progress' | 'completed';
  max_size: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  character_id: string;
  ready: boolean;
  joined_at: string;
}

export interface Invite {
  id: string;
  type: 'team' | 'clan';
  target_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
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
  { id: 'fortress', name: 'Erőd', icon: '🏰', description: 'DEF +5/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'tank', effect: t => ({ def: t * 5 }) },
  { id: 'shield_wall', name: 'Pajzsfal', icon: '🧱', description: 'HP +25/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'tank', effect: t => ({ hp: t * 25 }) },
  { id: 'blood_rage', name: 'Vérszomj', icon: '🩸', description: 'ATK +6/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'berserker', effect: t => ({ atk: t * 6 }) },
  { id: 'frenzy', name: 'Őrjöngés', icon: '😤', description: 'SPD +4/tier, DEF -2/tier', maxTier: 4, classReq: 'warrior', subclassReq: 'berserker', effect: t => ({ spd: t * 4, def: t * -2 }) },
  { id: 'bushido', name: 'Bushido', icon: '⛩️', description: 'CRIT +5%/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'samurai', effect: t => ({ crit: t * 5 }) },
  { id: 'blade_dance', name: 'Pengék Tánca', icon: '💃', description: 'ATK +3, SPD +2/tier', maxTier: 4, classReq: 'warrior', subclassReq: 'samurai', effect: t => ({ atk: t * 3, spd: t * 2 }) },
  { id: 'piercing', name: 'Átütés', icon: '🔱', description: 'ATK +4/tier', maxTier: 5, classReq: 'warrior', subclassReq: 'javliner', effect: t => ({ atk: t * 4 }) },
  { id: 'reach', name: 'Hosszú Kar', icon: '📏', description: 'SPD +3/tier', maxTier: 4, classReq: 'warrior', subclassReq: 'javliner', effect: t => ({ spd: t * 3 }) },

  // ---- MAGE BASE ----
  { id: 'arcane_power', name: 'Mágikus Erő', icon: '🔮', description: 'ATK +4/tier', maxTier: 5, classReq: 'mage', subclassReq: null, effect: t => ({ atk: t * 4 }) },
  { id: 'mana_well', name: 'Mana Kút', icon: '💧', description: 'MP +20/tier', maxTier: 5, classReq: 'mage', subclassReq: null, effect: t => ({ mp: t * 20 }) },
  { id: 'spell_haste', name: 'Varázs Gyorsaság', icon: '⚡', description: 'SPD +2/tier', maxTier: 4, classReq: 'mage', subclassReq: null, effect: t => ({ spd: t * 2 }) },
  { id: 'divine_light', name: 'Szent Fény', icon: '☀️', description: 'HP +20/tier', maxTier: 5, classReq: 'mage', subclassReq: 'healer', effect: t => ({ hp: t * 20 }) },
  { id: 'guardian_angel', name: 'Őrangyal', icon: '👼', description: 'DEF +4/tier', maxTier: 5, classReq: 'mage', subclassReq: 'healer', effect: t => ({ def: t * 4 }) },
  { id: 'dark_pact', name: 'Sötét Paktum', icon: '☠️', description: 'ATK +5/tier', maxTier: 5, classReq: 'mage', subclassReq: 'necromancer', effect: t => ({ atk: t * 5 }) },
  { id: 'soul_drain', name: 'Lélek Szívás', icon: '👻', description: 'HP +15, MP +10/tier', maxTier: 4, classReq: 'mage', subclassReq: 'necromancer', effect: t => ({ hp: t * 15, mp: t * 10 }) },
  { id: 'pure_magic', name: 'Tiszta Mágia', icon: '✴️', description: 'ATK +6/tier', maxTier: 5, classReq: 'mage', subclassReq: 'arcanist', effect: t => ({ atk: t * 6 }) },
  { id: 'mana_surge', name: 'Mana Cunami', icon: '🌊', description: 'MP +30/tier', maxTier: 4, classReq: 'mage', subclassReq: 'arcanist', effect: t => ({ mp: t * 30 }) },
  { id: 'elemental_fury', name: 'Elemi Düh', icon: '🌪️', description: 'ATK +4, SPD +2/tier', maxTier: 5, classReq: 'mage', subclassReq: 'elementalist', effect: t => ({ atk: t * 4, spd: t * 2 }) },
  { id: 'storm_shield', name: 'Vihar Pajzs', icon: '⛈️', description: 'DEF +3, MP +15/tier', maxTier: 4, classReq: 'mage', subclassReq: 'elementalist', effect: t => ({ def: t * 3, mp: t * 15 }) },

  // ---- ROGUE BASE ----
  { id: 'backstab', name: 'Hátba Szúrás', icon: '🔪', description: 'CRIT +4%/tier', maxTier: 5, classReq: 'rogue', subclassReq: null, effect: t => ({ crit: t * 4 }) },
  { id: 'evasion', name: 'Kitérés', icon: '💨', description: 'SPD +3/tier', maxTier: 5, classReq: 'rogue', subclassReq: null, effect: t => ({ spd: t * 3 }) },
  { id: 'poison_blade', name: 'Mérgezett Penge', icon: '☠️', description: 'ATK +2/tier', maxTier: 4, classReq: 'rogue', subclassReq: null, effect: t => ({ atk: t * 2 }) },
  { id: 'death_mark', name: 'Haláljegy', icon: '💀', description: 'CRIT +8%/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'assassin', effect: t => ({ crit: t * 8 }) },
  { id: 'execute', name: 'Kivégzés', icon: '⚰️', description: 'ATK +6/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'assassin', effect: t => ({ atk: t * 6 }) },
  { id: 'eagle_eye', name: 'Sassszem', icon: '🦅', description: 'CRIT +5%, ATK +3/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'archer', effect: t => ({ crit: t * 5, atk: t * 3 }) },
  { id: 'wind_arrow', name: 'Szélnyíl', icon: '🏹', description: 'SPD +4/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'archer', effect: t => ({ spd: t * 4 }) },
  { id: 'tracking', name: 'Nyomkövetés', icon: '🐾', description: 'SPD +2, ATK +2/tier', maxTier: 5, classReq: 'rogue', subclassReq: 'hunter', effect: t => ({ spd: t * 2, atk: t * 2 }) },
  { id: 'survival', name: 'Túlélés', icon: '🏕️', description: 'HP +15, DEF +2/tier', maxTier: 4, classReq: 'rogue', subclassReq: 'hunter', effect: t => ({ hp: t * 15, def: t * 2 }) },
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
  world?: number;
}

export const ENEMIES: EnemyDef[] = [
  // World 1 - Zone
  { name: 'Goblin', icon: '👺', level: 1, hp: 30, atk: 5, def: 2, spd: 8, xpReward: 15, goldReward: 5, locationType: 'zone', minZoneLevel: 1, world: 1 },
  { name: 'Farkas', icon: '🐺', level: 2, hp: 45, atk: 8, def: 3, spd: 12, xpReward: 25, goldReward: 8, locationType: 'zone', minZoneLevel: 1, world: 1 },
  { name: 'Pók Királyné', icon: '🕷️', level: 3, hp: 60, atk: 10, def: 5, spd: 6, xpReward: 40, goldReward: 15, locationType: 'zone', minZoneLevel: 3, world: 1 },
  { name: 'Bandita', icon: '🥷', level: 2, hp: 40, atk: 9, def: 4, spd: 10, xpReward: 20, goldReward: 10, locationType: 'zone', minZoneLevel: 1, world: 1 },
  { name: 'Mérgező Kígyó', icon: '🐍', level: 3, hp: 35, atk: 12, def: 2, spd: 15, xpReward: 30, goldReward: 12, locationType: 'zone', minZoneLevel: 2, world: 1 },
  { name: 'Csontváz Harcos', icon: '💀', level: 5, hp: 80, atk: 14, def: 8, spd: 7, xpReward: 60, goldReward: 20, locationType: 'zone', minZoneLevel: 5, world: 1 },
  { name: 'Medveember', icon: '🐻', level: 4, hp: 95, atk: 13, def: 10, spd: 6, xpReward: 50, goldReward: 18, locationType: 'zone', minZoneLevel: 3, world: 1 },
  { name: 'Tűz Elementál', icon: '🔥', level: 7, hp: 120, atk: 20, def: 6, spd: 10, xpReward: 100, goldReward: 35, locationType: 'zone', minZoneLevel: 7, world: 1 },
  { name: 'Szellem', icon: '👻', level: 6, hp: 70, atk: 18, def: 2, spd: 18, xpReward: 75, goldReward: 25, locationType: 'zone', minZoneLevel: 5, world: 1 },
  { name: 'Orc Harcvezér', icon: '👹', level: 6, hp: 110, atk: 16, def: 11, spd: 7, xpReward: 85, goldReward: 30, locationType: 'zone', minZoneLevel: 5, world: 1 },
  { name: 'Jég Elem', icon: '❄️', level: 8, hp: 130, atk: 19, def: 8, spd: 9, xpReward: 110, goldReward: 40, locationType: 'zone', minZoneLevel: 7, world: 1 },
  { name: 'Sötét Lovag', icon: '🏇', level: 9, hp: 160, atk: 23, def: 14, spd: 11, xpReward: 140, goldReward: 50, locationType: 'zone', minZoneLevel: 8, world: 1 },
  // World 1 - Dungeon
  { name: 'Sötét Varázsló', icon: '🧙‍♂️', level: 4, hp: 70, atk: 16, def: 4, spd: 9, xpReward: 80, goldReward: 30, locationType: 'dungeon', minZoneLevel: 4, world: 1 },
  { name: 'Kőgolem', icon: '🗿', level: 5, hp: 150, atk: 12, def: 18, spd: 3, xpReward: 90, goldReward: 25, locationType: 'dungeon', minZoneLevel: 4, world: 1 },
  { name: 'Vámpír Gróf', icon: '🧛', level: 6, hp: 100, atk: 18, def: 10, spd: 14, xpReward: 120, goldReward: 45, locationType: 'dungeon', minZoneLevel: 6, world: 1 },
  { name: 'Múmia Úr', icon: '🧟', level: 5, hp: 90, atk: 14, def: 12, spd: 5, xpReward: 85, goldReward: 35, locationType: 'dungeon', minZoneLevel: 4, world: 1 },
  { name: 'Méregpók Anya', icon: '🕸️', level: 6, hp: 85, atk: 20, def: 6, spd: 12, xpReward: 100, goldReward: 40, locationType: 'dungeon', minZoneLevel: 5, world: 1 },
  { name: 'Lich Király', icon: '👑', level: 8, hp: 200, atk: 22, def: 12, spd: 8, xpReward: 200, goldReward: 80, locationType: 'dungeon', minZoneLevel: 8, world: 1 },
  { name: 'Démon Vezér', icon: '😈', level: 9, hp: 240, atk: 26, def: 14, spd: 10, xpReward: 250, goldReward: 100, locationType: 'dungeon', minZoneLevel: 8, world: 1 },
  // World 1 - Raid
  { name: 'Ősi Sárkány', icon: '🐉', level: 10, hp: 500, atk: 35, def: 20, spd: 12, xpReward: 500, goldReward: 200, locationType: 'raid', minZoneLevel: 8, world: 1 },

  // World 2 - Zone
  { name: 'Démoni Skorpió', icon: '🦂', level: 6, hp: 90, atk: 18, def: 8, spd: 14, xpReward: 80, goldReward: 30, locationType: 'zone', minZoneLevel: 5, world: 2 },
  { name: 'Jég Óriás', icon: '🧊', level: 8, hp: 180, atk: 22, def: 16, spd: 5, xpReward: 130, goldReward: 50, locationType: 'zone', minZoneLevel: 8, world: 2 },
  { name: 'Lávakobold', icon: '👹', level: 7, hp: 100, atk: 24, def: 6, spd: 16, xpReward: 110, goldReward: 40, locationType: 'zone', minZoneLevel: 5, world: 2 },
  { name: 'Pokol Kutya', icon: '🐕‍🦺', level: 6, hp: 75, atk: 20, def: 5, spd: 20, xpReward: 70, goldReward: 28, locationType: 'zone', minZoneLevel: 5, world: 2 },
  { name: 'Kristály Golem', icon: '💎', level: 8, hp: 200, atk: 18, def: 22, spd: 4, xpReward: 140, goldReward: 55, locationType: 'zone', minZoneLevel: 7, world: 2 },
  { name: 'Lidérc', icon: '🦇', level: 7, hp: 85, atk: 22, def: 4, spd: 22, xpReward: 95, goldReward: 35, locationType: 'zone', minZoneLevel: 6, world: 2 },
  { name: 'Méregtoll Hárpia', icon: '🦅', level: 9, hp: 140, atk: 26, def: 10, spd: 19, xpReward: 160, goldReward: 60, locationType: 'zone', minZoneLevel: 8, world: 2 },
  { name: 'Magma Óriás', icon: '🌋', level: 10, hp: 220, atk: 30, def: 18, spd: 6, xpReward: 200, goldReward: 80, locationType: 'zone', minZoneLevel: 9, world: 2 },
  // World 2 - Dungeon
  { name: 'Csontváz Mágus', icon: '☠️', level: 7, hp: 85, atk: 25, def: 5, spd: 12, xpReward: 100, goldReward: 40, locationType: 'dungeon', minZoneLevel: 5, world: 2 },
  { name: 'Árnyék Démon', icon: '😈', level: 8, hp: 160, atk: 28, def: 12, spd: 15, xpReward: 150, goldReward: 60, locationType: 'dungeon', minZoneLevel: 6, world: 2 },
  { name: 'Jég Sárkány', icon: '🐲', level: 9, hp: 250, atk: 30, def: 18, spd: 10, xpReward: 250, goldReward: 100, locationType: 'dungeon', minZoneLevel: 8, world: 2 },
  { name: 'Elemi Titán', icon: '⚡', level: 10, hp: 300, atk: 35, def: 15, spd: 12, xpReward: 300, goldReward: 120, locationType: 'dungeon', minZoneLevel: 8, world: 2 },
  { name: 'Véres Gladiátor', icon: '🗡️', level: 8, hp: 200, atk: 32, def: 14, spd: 18, xpReward: 200, goldReward: 80, locationType: 'dungeon', minZoneLevel: 5, world: 2 },
  { name: 'Halál Angyala', icon: '👼', level: 10, hp: 280, atk: 33, def: 16, spd: 16, xpReward: 280, goldReward: 110, locationType: 'dungeon', minZoneLevel: 9, world: 2 },
  { name: 'Csonttrón Őr', icon: '💀', level: 9, hp: 230, atk: 27, def: 20, spd: 8, xpReward: 220, goldReward: 90, locationType: 'dungeon', minZoneLevel: 7, world: 2 },
  // World 2 - Raid
  { name: 'Pokol Sárkány', icon: '🐲', level: 12, hp: 800, atk: 50, def: 25, spd: 14, xpReward: 800, goldReward: 350, locationType: 'raid', minZoneLevel: 10, world: 2 },
  { name: 'Örök Démonlord', icon: '👿', level: 15, hp: 1200, atk: 60, def: 30, spd: 16, xpReward: 1200, goldReward: 500, locationType: 'raid', minZoneLevel: 12, world: 2 },
];

// ---- SET BONUSES ----
export const SET_BONUSES: Record<string, { pieces: number; bonus: string; effect: { atk?: number; def?: number; spd?: number; hp?: number; mp?: number; crit?: number } }> = {
  // Class sets - World 1
  'Bajnok': { pieces: 3, bonus: 'ATK +12, DEF +10, HP +40', effect: { atk: 12, def: 10, hp: 40 } },
  'Árnyék': { pieces: 3, bonus: 'SPD +10, CRIT +10%, ATK +8', effect: { spd: 10, crit: 10, atk: 8 } },
  'Tűz': { pieces: 3, bonus: 'ATK +12, MP +40, CRIT +5%', effect: { atk: 12, mp: 40, crit: 5 } },
  // Generic sets
  'Szent': { pieces: 2, bonus: 'HP +50, DEF +5', effect: { hp: 50, def: 5 } },
  'Legenda': { pieces: 2, bonus: 'ATK +15, DEF +10, HP +50', effect: { atk: 15, def: 10, hp: 50 } },
  'Erőd': { pieces: 3, bonus: 'DEF +20, HP +80', effect: { def: 20, hp: 80 } },
  'Vérszomj': { pieces: 2, bonus: 'ATK +20, CRIT +10%', effect: { atk: 20, crit: 10 } },
  'Halál': { pieces: 2, bonus: 'ATK +15, MP +40', effect: { atk: 15, mp: 40 } },
};

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-nature',
  rare: 'text-mana',
  epic: 'text-shadow',
  legendary: 'text-gold',
};

// ---- ACTIVE SKILLS ----
export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  mpCost: number;
  cooldown: number; // turns
  classReq: CharacterClass;
  subclassReq: Subclass | null;
  effect: (charAtk: number, charDef: number) => { damage?: number; heal?: number; selfBuff?: { atk?: number; def?: number; spd?: number; crit?: number; turns: number }; debuff?: { atk?: number; def?: number; turns: number } };
}

export const SKILLS: SkillDef[] = [
  // Warrior base
  { id: 'power_strike', name: 'Erős Csapás', icon: '💥', description: '150% ATK sebzés', mpCost: 8, cooldown: 2, classReq: 'warrior', subclassReq: null,
    effect: (atk) => ({ damage: Math.floor(atk * 1.5) }) },
  { id: 'war_shout', name: 'Harci Kiáltás', icon: '📣', description: '+5 ATK 3 körre', mpCost: 10, cooldown: 4, classReq: 'warrior', subclassReq: null,
    effect: () => ({ selfBuff: { atk: 5, turns: 3 } }) },
  { id: 'shield_bash', name: 'Pajzs Ütés', icon: '🛡️', description: '80% ATK + ellenség -3 ATK', mpCost: 12, cooldown: 3, classReq: 'warrior', subclassReq: null,
    effect: (atk) => ({ damage: Math.floor(atk * 0.8), debuff: { atk: -3, def: 0, turns: 2 } }) },
  // Tank
  { id: 'fortress_stance', name: 'Erőd Állás', icon: '🏰', description: '+10 DEF 3 körre', mpCost: 15, cooldown: 5, classReq: 'warrior', subclassReq: 'tank',
    effect: () => ({ selfBuff: { def: 10, turns: 3 } }) },
  { id: 'taunt_slam', name: 'Tauntolás', icon: '🗣️', description: '120% ATK + ellenség -5 ATK', mpCost: 18, cooldown: 4, classReq: 'warrior', subclassReq: 'tank',
    effect: (atk) => ({ damage: Math.floor(atk * 1.2), debuff: { atk: -5, def: 0, turns: 3 } }) },
  // Berserker
  { id: 'rampage', name: 'Tombolo', icon: '🪓', description: '200% ATK sebzés', mpCost: 20, cooldown: 4, classReq: 'warrior', subclassReq: 'berserker',
    effect: (atk) => ({ damage: Math.floor(atk * 2.0) }) },
  { id: 'blood_fury', name: 'Vér Düh', icon: '🩸', description: '+8 ATK, +10% CRIT 3 körre', mpCost: 15, cooldown: 5, classReq: 'warrior', subclassReq: 'berserker',
    effect: () => ({ selfBuff: { atk: 8, crit: 10, turns: 3 } }) },
  // Samurai
  { id: 'iaido', name: 'Iaido', icon: '⛩️', description: '180% ATK, +15% CRIT esély', mpCost: 18, cooldown: 3, classReq: 'warrior', subclassReq: 'samurai',
    effect: (atk) => ({ damage: Math.floor(atk * 1.8) }) },
  // Javliner
  { id: 'javelin_throw', name: 'Dárda Dobás', icon: '🔱', description: '170% ATK távolsági', mpCost: 14, cooldown: 3, classReq: 'warrior', subclassReq: 'javliner',
    effect: (atk) => ({ damage: Math.floor(atk * 1.7) }) },

  // Mage base
  { id: 'fireball', name: 'Tűzgolyó', icon: '🔥', description: '160% ATK mágikus sebzés', mpCost: 12, cooldown: 2, classReq: 'mage', subclassReq: null,
    effect: (atk) => ({ damage: Math.floor(atk * 1.6) }) },
  { id: 'mana_shield', name: 'Mana Pajzs', icon: '🛡️', description: '+8 DEF 3 körre', mpCost: 15, cooldown: 4, classReq: 'mage', subclassReq: null,
    effect: () => ({ selfBuff: { def: 8, turns: 3 } }) },
  { id: 'arcane_bolt', name: 'Arkán Lövedék', icon: '✨', description: '130% ATK', mpCost: 8, cooldown: 1, classReq: 'mage', subclassReq: null,
    effect: (atk) => ({ damage: Math.floor(atk * 1.3) }) },
  // Healer
  { id: 'holy_heal', name: 'Szent Gyógyítás', icon: '💚', description: 'Gyógyít 50 HP-t', mpCost: 20, cooldown: 3, classReq: 'mage', subclassReq: 'healer',
    effect: () => ({ heal: 50 }) },
  { id: 'divine_shield', name: 'Isteni Pajzs', icon: '👼', description: '+12 DEF 3 körre', mpCost: 25, cooldown: 5, classReq: 'mage', subclassReq: 'healer',
    effect: () => ({ selfBuff: { def: 12, turns: 3 } }) },
  // Necromancer
  { id: 'death_bolt', name: 'Halál Sugár', icon: '☠️', description: '190% ATK sötét sebzés', mpCost: 18, cooldown: 3, classReq: 'mage', subclassReq: 'necromancer',
    effect: (atk) => ({ damage: Math.floor(atk * 1.9) }) },
  { id: 'life_drain', name: 'Élet Szívás', icon: '👻', description: '100% ATK seb + gyógyít felét', mpCost: 22, cooldown: 4, classReq: 'mage', subclassReq: 'necromancer',
    effect: (atk) => ({ damage: Math.floor(atk * 1.0), heal: Math.floor(atk * 0.5) }) },
  // Arcanist
  { id: 'arcane_blast', name: 'Arkán Robbanás', icon: '💥', description: '220% ATK', mpCost: 25, cooldown: 4, classReq: 'mage', subclassReq: 'arcanist',
    effect: (atk) => ({ damage: Math.floor(atk * 2.2) }) },
  // Elementalist
  { id: 'chain_lightning', name: 'Lánc Villám', icon: '⚡', description: '180% ATK villám', mpCost: 20, cooldown: 3, classReq: 'mage', subclassReq: 'elementalist',
    effect: (atk) => ({ damage: Math.floor(atk * 1.8) }) },
  { id: 'frost_nova', name: 'Fagy Nova', icon: '❄️', description: '120% ATK + ellenség -4 SPD', mpCost: 18, cooldown: 4, classReq: 'mage', subclassReq: 'elementalist',
    effect: (atk) => ({ damage: Math.floor(atk * 1.2), debuff: { atk: 0, def: -4, turns: 2 } }) },

  // Rogue base
  { id: 'quick_slash', name: 'Gyors Vágás', icon: '⚡', description: '140% ATK gyors csapás', mpCost: 8, cooldown: 1, classReq: 'rogue', subclassReq: null,
    effect: (atk) => ({ damage: Math.floor(atk * 1.4) }) },
  { id: 'smoke_bomb', name: 'Füstbomba', icon: '💨', description: '+6 SPD, +5% CRIT 3 körre', mpCost: 12, cooldown: 4, classReq: 'rogue', subclassReq: null,
    effect: () => ({ selfBuff: { spd: 6, crit: 5, turns: 3 } }) },
  { id: 'cheap_shot', name: 'Aljas Ütés', icon: '👊', description: '100% ATK + ellenség -3 DEF', mpCost: 10, cooldown: 3, classReq: 'rogue', subclassReq: null,
    effect: (atk) => ({ damage: Math.floor(atk * 1.0), debuff: { atk: 0, def: -3, turns: 2 } }) },
  // Assassin
  { id: 'assassination', name: 'Merénylet', icon: '🔪', description: '250% ATK (magas CRIT)', mpCost: 25, cooldown: 5, classReq: 'rogue', subclassReq: 'assassin',
    effect: (atk) => ({ damage: Math.floor(atk * 2.5) }) },
  { id: 'vanish', name: 'Eltűnés', icon: '🌑', description: '+15% CRIT 3 körre', mpCost: 15, cooldown: 4, classReq: 'rogue', subclassReq: 'assassin',
    effect: () => ({ selfBuff: { crit: 15, turns: 3 } }) },
  // Archer
  { id: 'multi_shot', name: 'Többes Lövés', icon: '🏹', description: '180% ATK', mpCost: 16, cooldown: 3, classReq: 'rogue', subclassReq: 'archer',
    effect: (atk) => ({ damage: Math.floor(atk * 1.8) }) },
  { id: 'snipe', name: 'Mesterlövés', icon: '🎯', description: '200% ATK precíz lövés', mpCost: 20, cooldown: 4, classReq: 'rogue', subclassReq: 'archer',
    effect: (atk) => ({ damage: Math.floor(atk * 2.0) }) },
  // Hunter
  { id: 'trap', name: 'Csapda', icon: '🪤', description: 'Ellenség -5 SPD, -3 ATK', mpCost: 14, cooldown: 3, classReq: 'rogue', subclassReq: 'hunter',
    effect: () => ({ debuff: { atk: -3, def: -5, turns: 3 } }) },
  { id: 'beast_strike', name: 'Bestia Csapás', icon: '🐾', description: '170% ATK', mpCost: 16, cooldown: 3, classReq: 'rogue', subclassReq: 'hunter',
    effect: (atk) => ({ damage: Math.floor(atk * 1.7) }) },
  // Shadowblade
  { id: 'shadow_strike', name: 'Árnyék Csapás', icon: '🌑', description: '190% ATK méreg', mpCost: 18, cooldown: 3, classReq: 'rogue', subclassReq: 'shadowblade',
    effect: (atk) => ({ damage: Math.floor(atk * 1.9) }) },
  { id: 'poison_cloud', name: 'Méregfelhő', icon: '☁️', description: 'Ellenség -4 ATK, -3 DEF', mpCost: 20, cooldown: 4, classReq: 'rogue', subclassReq: 'shadowblade',
    effect: () => ({ debuff: { atk: -4, def: -3, turns: 3 } }) },
];

// ---- LOOT TABLES ----
export interface LootDrop {
  name: string;
  type: ItemSlot;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  description: string;
  atk: number;
  def: number;
  spd: number;
  hp_bonus: number;
  mp_bonus: number;
  crit_chance: number;
  set_name: string | null;
  dropChance: number; // 0-100
  minEnemyLevel: number;
}

export const LOOT_TABLE: LootDrop[] = [
  // Common drops
  { name: 'Goblin Tőr', type: 'weapon', rarity: 'common', icon: '🔪', description: 'Goblinok fegyvere.', atk: 4, def: 0, spd: 1, hp_bonus: 0, mp_bonus: 0, crit_chance: 2, set_name: null, dropChance: 30, minEnemyLevel: 1 },
  { name: 'Farkas Bőr Sapka', type: 'helmet', rarity: 'common', icon: '🐺', description: 'Farkas bundából.', atk: 0, def: 3, spd: 1, hp_bonus: 5, mp_bonus: 0, crit_chance: 0, set_name: null, dropChance: 25, minEnemyLevel: 2 },
  { name: 'Pók Selyem Kesztyű', type: 'gloves', rarity: 'uncommon', icon: '🕸️', description: 'Ragacsos de erős.', atk: 2, def: 2, spd: 2, hp_bonus: 0, mp_bonus: 0, crit_chance: 3, set_name: null, dropChance: 20, minEnemyLevel: 3 },
  { name: 'Csont Gyűrű', type: 'ring', rarity: 'uncommon', icon: '💀', description: 'Csontból faragva.', atk: 3, def: 1, spd: 0, hp_bonus: 5, mp_bonus: 5, crit_chance: 2, set_name: null, dropChance: 15, minEnemyLevel: 5 },
  // Rare drops
  { name: 'Tűz Kard', type: 'weapon', rarity: 'rare', icon: '🔥', description: 'Lángoló penge.', atk: 12, def: 0, spd: 2, hp_bonus: 0, mp_bonus: 0, crit_chance: 5, set_name: 'Tűz', dropChance: 12, minEnemyLevel: 7 },
  { name: 'Tűz Vállvédő', type: 'shoulders', rarity: 'rare', icon: '🔥', description: 'Forró vállvédő.', atk: 3, def: 5, spd: 0, hp_bonus: 10, mp_bonus: 5, crit_chance: 0, set_name: 'Tűz', dropChance: 10, minEnemyLevel: 7 },
  { name: 'Vámpír Köpeny', type: 'chest', rarity: 'rare', icon: '🧛', description: 'Életerő szívás.', atk: 5, def: 7, spd: 3, hp_bonus: 20, mp_bonus: 0, crit_chance: 3, set_name: null, dropChance: 10, minEnemyLevel: 6 },
  { name: 'Kő Csizma', type: 'boots', rarity: 'rare', icon: '🗿', description: 'Nehéz de erős.', atk: 0, def: 10, spd: -2, hp_bonus: 15, mp_bonus: 0, crit_chance: 0, set_name: null, dropChance: 10, minEnemyLevel: 5 },
  // Epic drops
  { name: 'Sárkány Kard', type: 'weapon', rarity: 'epic', icon: '🐉', description: 'Sárkány fogából.', atk: 20, def: 3, spd: 3, hp_bonus: 10, mp_bonus: 0, crit_chance: 8, set_name: 'Legenda', dropChance: 8, minEnemyLevel: 8 },
  { name: 'Sárkány Sisak', type: 'helmet', rarity: 'epic', icon: '🐉', description: 'Sárkány pikkelyből.', atk: 5, def: 12, spd: 0, hp_bonus: 30, mp_bonus: 0, crit_chance: 3, set_name: 'Legenda', dropChance: 6, minEnemyLevel: 8 },
  { name: 'Lich Nyaklánc', type: 'necklace', rarity: 'epic', icon: '👑', description: 'Sötét mágia.', atk: 10, def: 0, spd: 2, hp_bonus: 0, mp_bonus: 30, crit_chance: 5, set_name: null, dropChance: 7, minEnemyLevel: 8 },
  // W2 drops
  { name: 'Démoni Karmok', type: 'gloves', rarity: 'epic', icon: '😈', description: 'Démoni erő.', atk: 8, def: 3, spd: 4, hp_bonus: 0, mp_bonus: 0, crit_chance: 8, set_name: null, dropChance: 10, minEnemyLevel: 8 },
  { name: 'Jég Korona', type: 'helmet', rarity: 'epic', icon: '🧊', description: 'Fagyos fejfedő.', atk: 4, def: 10, spd: 0, hp_bonus: 20, mp_bonus: 20, crit_chance: 2, set_name: null, dropChance: 8, minEnemyLevel: 8 },
  { name: 'Pokol Nadrág', type: 'legs', rarity: 'epic', icon: '🔥', description: 'Pokoli védelem.', atk: 3, def: 12, spd: 2, hp_bonus: 25, mp_bonus: 0, crit_chance: 3, set_name: null, dropChance: 8, minEnemyLevel: 10 },
  // Legendary (raid only)
  { name: 'Örök Lángoló Kard', type: 'weapon', rarity: 'legendary', icon: '⚔️', description: 'Legendás fegyver.', atk: 30, def: 5, spd: 5, hp_bonus: 20, mp_bonus: 10, crit_chance: 12, set_name: 'Legenda', dropChance: 5, minEnemyLevel: 10 },
  { name: 'Sárkányölő Páncél', type: 'chest', rarity: 'legendary', icon: '🐲', description: 'A legerősebb vért.', atk: 10, def: 25, spd: 0, hp_bonus: 60, mp_bonus: 0, crit_chance: 5, set_name: 'Legenda', dropChance: 4, minEnemyLevel: 10 },
];

export function rollLoot(enemyLevel: number, locationType: 'zone' | 'dungeon' | 'raid'): LootDrop | null {
  const eligible = LOOT_TABLE.filter(l => enemyLevel >= l.minEnemyLevel);
  if (eligible.length === 0) return null;
  // Higher drop chance in dungeons/raids
  const mult = locationType === 'raid' ? 2.0 : locationType === 'dungeon' ? 1.5 : 1.0;
  for (const loot of eligible.sort((a, b) => a.dropChance - b.dropChance)) {
    if (Math.random() * 100 < loot.dropChance * mult) return loot;
  }
  return null;
}

export const STARTER_ITEMS: Record<CharacterClass, Omit<InventoryItem, 'id' | 'character_id'>[]> = {
  warrior: [
    { name: 'Rozsdás Kard', type: 'weapon', rarity: 'common', icon: '🗡️', description: 'Egy régi, de megbízható kard.', equipped: true, atk: 3, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 0, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Bőrpáncél', type: 'chest', rarity: 'common', icon: '🛡️', description: 'Alap bőr védelem.', equipped: true, atk: 0, def: 3, spd: 0, hp_bonus: 10, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Kis Gyógyital', type: 'potion', rarity: 'common', icon: '🧪', description: '+30 HP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 30, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
  mage: [
    { name: 'Fabot', type: 'weapon', rarity: 'common', icon: '🪄', description: 'Egyszerű varázspálca.', equipped: true, atk: 4, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 5, crit_chance: 1, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Köntös', type: 'chest', rarity: 'common', icon: '👘', description: 'Könnyű ruha.', equipped: true, atk: 0, def: 1, spd: 1, hp_bonus: 0, mp_bonus: 15, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Mana Ital', type: 'potion', rarity: 'common', icon: '🧪', description: '+20 MP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 0, mp_bonus: 20, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
  rogue: [
    { name: 'Rozsdás Tőr', type: 'weapon', rarity: 'common', icon: '🔪', description: 'Éles, de kopott.', equipped: true, atk: 3, def: 0, spd: 2, hp_bonus: 0, mp_bonus: 0, crit_chance: 3, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Rongyos Köpeny', type: 'chest', rarity: 'common', icon: '🧥', description: 'Jobb, mint a semmi.', equipped: true, atk: 0, def: 2, spd: 2, hp_bonus: 5, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 5 },
    { name: 'Kis Gyógyital', type: 'potion', rarity: 'common', icon: '🧪', description: '+30 HP', equipped: false, atk: 0, def: 0, spd: 0, hp_bonus: 30, mp_bonus: 0, crit_chance: 0, socket_gems: [], set_name: null, sell_price: 3 },
  ],
};
