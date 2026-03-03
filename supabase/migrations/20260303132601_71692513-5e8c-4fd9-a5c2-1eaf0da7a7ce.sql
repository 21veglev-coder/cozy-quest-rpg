
-- Add world and subclass_req to shop_items
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS world integer NOT NULL DEFAULT 1;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS subclass_req text DEFAULT NULL;

-- Add world to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS world integer NOT NULL DEFAULT 1;

-- Create clans table
CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '⚔️',
  description text,
  leader_id uuid NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  max_members integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clans" ON public.clans FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update own clan" ON public.clans FOR UPDATE TO authenticated USING (auth.uid() = leader_id);
CREATE POLICY "Leaders can delete own clan" ON public.clans FOR DELETE TO authenticated USING (auth.uid() = leader_id);

-- Create clan_members table
CREATE TABLE public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clans" ON public.clan_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Clan leaders can manage members" ON public.clan_members FOR DELETE TO authenticated
  USING (clan_id IN (SELECT id FROM public.clans WHERE leader_id = auth.uid()));

-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  leader_id uuid NOT NULL,
  target_location_id uuid REFERENCES public.locations(id),
  status text NOT NULL DEFAULT 'forming',
  max_size integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Auth users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = leader_id);
CREATE POLICY "Leaders can delete teams" ON public.teams FOR DELETE TO authenticated USING (auth.uid() = leader_id);

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readiness" ON public.team_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Team leaders can manage members" ON public.team_members FOR DELETE TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE leader_id = auth.uid()));

-- Enable realtime for teams
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
