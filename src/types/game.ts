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
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-nature',
  rare: 'text-mana',
  epic: 'text-shadow',
  legendary: 'text-gold',
};

export const STARTER_ITEMS: Record<CharacterClass, Omit<InventoryItem, 'id' | 'character_id'>[]> = {
  warrior: [
    { name: 'Rozsdás Kard', type: 'weapon', rarity: 'common', icon: '🗡️', description: 'Egy régi, de megbízható kard.', equipped: true },
    { name: 'Bőrpáncél', type: 'armor', rarity: 'common', icon: '🛡️', description: 'Alap bőr védelem.', equipped: true },
    { name: 'Kis Gyógyital', type: 'potion', rarity: 'common', icon: '🧪', description: '+30 HP', equipped: false },
  ],
  mage: [
    { name: 'Fabot', type: 'weapon', rarity: 'common', icon: '🪄', description: 'Egyszerű varázspálca.', equipped: true },
    { name: 'Köpeny', type: 'armor', rarity: 'common', icon: '🧥', description: 'Mágikus köntös.', equipped: true },
    { name: 'Mana Ital', type: 'potion', rarity: 'common', icon: '💧', description: '+30 MP', equipped: false },
  ],
  rogue: [
    { name: 'Tőr', type: 'weapon', rarity: 'common', icon: '🔪', description: 'Gyors pengéjű tőr.', equipped: true },
    { name: 'Sötét Ruha', type: 'armor', rarity: 'common', icon: '🥷', description: 'Rejtőzködéshez tökéletes.', equipped: true },
    { name: 'Füstbomba', type: 'potion', rarity: 'uncommon', icon: '💨', description: 'Meneküléshez.', equipped: false },
  ],
  healer: [
    { name: 'Szent Bot', type: 'weapon', rarity: 'common', icon: '✝️', description: 'Gyógyító energiát áraszt.', equipped: true },
    { name: 'Fehér Palást', type: 'armor', rarity: 'common', icon: '👘', description: 'Védelmet ad.', equipped: true },
    { name: 'Nagy Gyógyital', type: 'potion', rarity: 'uncommon', icon: '🧪', description: '+60 HP', equipped: false },
  ],
};
