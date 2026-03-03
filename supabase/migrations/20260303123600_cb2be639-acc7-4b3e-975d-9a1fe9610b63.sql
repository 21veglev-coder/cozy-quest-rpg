
-- Add prestige and subclass to characters
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS prestige integer NOT NULL DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS subclass text;

-- We'll keep the existing item type column flexible for new slot types
-- No schema change needed for inventory_items since type is already text
