
-- Invites table for team and clan invitations
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'team' or 'clan'
  target_id UUID NOT NULL, -- team_id or clan_id
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invites" ON public.invites FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);
CREATE POLICY "Auth users can create invites" ON public.invites FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Recipients can update invites" ON public.invites FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Users can delete own invites" ON public.invites FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Enable realtime for invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;

-- Delete inventory items policy (was missing)
CREATE POLICY "Users can delete own items" ON public.inventory_items FOR DELETE USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));
