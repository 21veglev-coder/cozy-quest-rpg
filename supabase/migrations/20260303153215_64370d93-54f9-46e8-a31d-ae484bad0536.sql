
-- Add shop_name column to differentiate shops within the same world
ALTER TABLE public.shop_items ADD COLUMN shop_name text NOT NULL DEFAULT 'kezdo_falu';

-- Move higher level items (level_req >= 6) to Kereskedő Város
UPDATE public.shop_items SET shop_name = 'kereskedo_varos' WHERE world = 1 AND level_req >= 6;
