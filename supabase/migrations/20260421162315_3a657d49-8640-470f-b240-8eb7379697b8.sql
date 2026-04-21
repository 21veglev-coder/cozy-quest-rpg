-- Team combat shared state table
CREATE TABLE public.team_combat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL UNIQUE,
  location_id UUID,
  wave INTEGER NOT NULL DEFAULT 1,
  max_waves INTEGER NOT NULL DEFAULT 3,
  enemies JSONB NOT NULL DEFAULT '[]'::jsonb,
  members_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  log JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_actor_id UUID,
  turn INTEGER NOT NULL DEFAULT 1,
  finished BOOLEAN NOT NULL DEFAULT false,
  result TEXT,
  rewards JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_combat ENABLE ROW LEVEL SECURITY;

-- Members of the team can view their combat
CREATE POLICY "Team members can view own combat"
ON public.team_combat
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

-- Members of the team can insert combat (any member can start)
CREATE POLICY "Team members can create own combat"
ON public.team_combat
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

-- Members of the team can update combat
CREATE POLICY "Team members can update own combat"
ON public.team_combat
FOR UPDATE
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

-- Members of the team can delete combat
CREATE POLICY "Team members can delete own combat"
ON public.team_combat
FOR DELETE
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

-- Auto updated_at
CREATE OR REPLACE FUNCTION public.update_team_combat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_team_combat_updated_at
BEFORE UPDATE ON public.team_combat
FOR EACH ROW
EXECUTE FUNCTION public.update_team_combat_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_combat;
ALTER TABLE public.team_combat REPLICA IDENTITY FULL;