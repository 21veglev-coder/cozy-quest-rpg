
-- Add stat columns to items
ALTER TABLE public.inventory_items 
ADD COLUMN atk integer NOT NULL DEFAULT 0,
ADD COLUMN def integer NOT NULL DEFAULT 0,
ADD COLUMN spd integer NOT NULL DEFAULT 0,
ADD COLUMN hp_bonus integer NOT NULL DEFAULT 0,
ADD COLUMN mp_bonus integer NOT NULL DEFAULT 0,
ADD COLUMN crit_chance integer NOT NULL DEFAULT 0,
ADD COLUMN socket_gems text[] DEFAULT '{}',
ADD COLUMN set_name text DEFAULT NULL,
ADD COLUMN sell_price integer NOT NULL DEFAULT 5;

-- Add stat columns to characters for perk bonuses
ALTER TABLE public.characters
ADD COLUMN atk integer NOT NULL DEFAULT 10,
ADD COLUMN def integer NOT NULL DEFAULT 10,
ADD COLUMN spd integer NOT NULL DEFAULT 10,
ADD COLUMN crit_chance integer NOT NULL DEFAULT 5,
ADD COLUMN perk_points integer NOT NULL DEFAULT 0;

-- Perks table
CREATE TABLE public.character_perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  perk_id text NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(character_id, perk_id)
);
ALTER TABLE public.character_perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own perks" ON public.character_perks
FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own perks" ON public.character_perks
FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own perks" ON public.character_perks
FOR UPDATE USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Shop items (global catalog)
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  icon text NOT NULL DEFAULT '📦',
  description text,
  price integer NOT NULL DEFAULT 10,
  level_req integer NOT NULL DEFAULT 1,
  class_req text DEFAULT NULL,
  atk integer NOT NULL DEFAULT 0,
  def integer NOT NULL DEFAULT 0,
  spd integer NOT NULL DEFAULT 0,
  hp_bonus integer NOT NULL DEFAULT 0,
  mp_bonus integer NOT NULL DEFAULT 0,
  crit_chance integer NOT NULL DEFAULT 0,
  set_name text DEFAULT NULL
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop" ON public.shop_items FOR SELECT USING (true);

-- Locations (world map)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏔️',
  type text NOT NULL DEFAULT 'zone', -- zone, town, dungeon, raid
  level_req integer NOT NULL DEFAULT 1,
  grid_x integer NOT NULL DEFAULT 0,
  grid_y integer NOT NULL DEFAULT 0,
  connected_to uuid[] DEFAULT '{}'
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);

-- Combat log
CREATE TABLE public.combat_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.locations(id) DEFAULT NULL,
  enemy_name text NOT NULL,
  enemy_level integer NOT NULL DEFAULT 1,
  result text NOT NULL, -- 'win' or 'lose'
  xp_gained integer NOT NULL DEFAULT 0,
  gold_gained integer NOT NULL DEFAULT 0,
  loot_item_id uuid DEFAULT NULL,
  combat_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.combat_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own combat log" ON public.combat_log
FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own combat log" ON public.combat_log
FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Dungeon progress
CREATE TABLE public.dungeon_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.locations(id) NOT NULL,
  current_floor integer NOT NULL DEFAULT 1,
  max_floor integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(character_id, location_id)
);
ALTER TABLE public.dungeon_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dungeon progress" ON public.dungeon_progress
FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own dungeon progress" ON public.dungeon_progress
FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own dungeon progress" ON public.dungeon_progress
FOR UPDATE USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Seed shop items
INSERT INTO public.shop_items (name, type, rarity, icon, description, price, level_req, class_req, atk, def, spd, hp_bonus, mp_bonus, crit_chance, set_name) VALUES
('Acél Kard', 'weapon', 'uncommon', '⚔️', 'Jól kovácsolt acélpenge.', 80, 2, NULL, 8, 0, 0, 0, 0, 3, NULL),
('Mágikus Köpeny', 'armor', 'uncommon', '🧥', 'Mana-átitatott szövet.', 90, 2, 'mage', 0, 3, 0, 0, 20, 0, NULL),
('Árnyék Tőr', 'weapon', 'rare', '🗡️', 'Mérgezett pengéjű tőr.', 200, 4, 'rogue', 12, 0, 5, 0, 0, 10, 'Árnyék'),
('Árnyék Köntös', 'armor', 'rare', '🥷', 'Láthatatlanná tesz.', 220, 4, 'rogue', 0, 6, 8, 10, 0, 5, 'Árnyék'),
('Páncélozott Mellvért', 'armor', 'uncommon', '🛡️', 'Nehéz de megbízható.', 120, 3, 'warrior', 0, 10, -2, 30, 0, 0, NULL),
('Tűz Pálca', 'weapon', 'rare', '🔥', 'Tűzgolyó varázslat bónusz.', 250, 5, 'mage', 15, 0, 0, 0, 30, 5, 'Tűz'),
('Tűz Korona', 'armor', 'rare', '👑', 'Lángoló fejfedő.', 280, 5, 'mage', 5, 2, 0, 0, 40, 3, 'Tűz'),
('Szent Buzogány', 'weapon', 'uncommon', '🔨', 'Gyógyító erő.', 100, 2, 'healer', 6, 2, 0, 20, 10, 0, NULL),
('Gyógy Kristály', 'weapon', 'rare', '💎', 'Hatalmas gyógyerő.', 300, 6, 'healer', 4, 0, 0, 40, 50, 0, 'Szent'),
('Lélek Palást', 'armor', 'rare', '✨', 'Védelmet ad a sötétség ellen.', 280, 6, 'healer', 0, 8, 3, 30, 30, 0, 'Szent'),
('HP Ital', 'potion', 'common', '🧪', '+50 HP visszaállítás.', 15, 1, NULL, 0, 0, 0, 50, 0, 0, NULL),
('MP Ital', 'potion', 'common', '💧', '+40 MP visszaállítás.', 15, 1, NULL, 0, 0, 0, 0, 40, 0, NULL),
('Nagy HP Ital', 'potion', 'uncommon', '🧪', '+120 HP visszaállítás.', 40, 3, NULL, 0, 0, 0, 120, 0, 0, NULL),
('Legendás Kard', 'weapon', 'legendary', '⚔️', 'A legendák pengéje.', 1000, 10, NULL, 25, 5, 3, 20, 0, 12, 'Legenda'),
('Legendás Páncél', 'armor', 'legendary', '🛡️', 'Elpusztíthatatlan páncél.', 1200, 10, NULL, 0, 25, 0, 80, 20, 5, 'Legenda');

-- Seed locations for world map
INSERT INTO public.locations (name, description, icon, type, level_req, grid_x, grid_y) VALUES
('Kezdő Falu', 'Biztonságos hely, bolt és pihenés.', '🏘️', 'town', 1, 3, 5),
('Sötét Erdő', 'Goblinok és farkasok tanyája.', '🌲', 'zone', 1, 2, 4),
('Kristály Barlang', 'Csillogó ásványok és pókók.', '💎', 'zone', 3, 4, 3),
('Elhagyott Erőd', 'Régi romok, csontváz harcosok.', '🏚️', 'zone', 5, 1, 2),
('Tűzhegy', 'Vulkanikus terep, tűz elementálok.', '🌋', 'zone', 7, 5, 1),
('Árnyék Torony', 'Sötét mágia központja.', '🗼', 'dungeon', 4, 3, 2),
('A Végzet Barlangia', 'Mély szintű dungeon, hatalmas szörnyek.', '🕳️', 'dungeon', 6, 2, 1),
('Sárkány Szentély', 'Raid boss: Ősi Sárkány. Csak bátraknak!', '🐉', 'raid', 8, 4, 0),
('Kereskedő Város', 'Nagy bolt, ritka tárgyak.', '🏪', 'town', 3, 5, 4),
('Jégtorony', 'Fagyott ellenségek. Jég szett darabok.', '🏔️', 'dungeon', 8, 1, 0);
