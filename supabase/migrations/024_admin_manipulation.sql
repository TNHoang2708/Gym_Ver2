-- Migration: 024_admin_manipulation.sql
-- Add gamification/subscription columns to user_memory and create feature_flags table

-- 1. Add columns to user_memory
ALTER TABLE public.user_memory 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- 2. Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'none' CHECK (rule_type IN ('all', 'pro', 'percent', 'none')),
  rule_value TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS for feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can modify feature flags"
  ON public.feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- Seed some initial flags
INSERT INTO public.feature_flags (key, description, rule_type, is_active)
VALUES 
  ('enable_hardcore_mode', 'Turn on hardcore mode features', 'none', false),
  ('new_dashboard_ui', 'Enable the new dashboard layout', 'all', true)
ON CONFLICT (key) DO NOTHING;
