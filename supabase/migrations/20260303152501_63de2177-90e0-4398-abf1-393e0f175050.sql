ALTER TABLE public.inventory_items DROP CONSTRAINT inventory_items_type_check;
ALTER TABLE public.inventory_items
ADD CONSTRAINT inventory_items_type_check
CHECK (
  type = ANY (
    ARRAY[
      'weapon'::text,
      'helmet'::text,
      'shoulders'::text,
      'shoulder'::text,
      'chest'::text,
      'legs'::text,
      'boots'::text,
      'gloves'::text,
      'ring'::text,
      'necklace'::text,
      'armor'::text,
      'potion'::text,
      'quest'::text
    ]
  )
);