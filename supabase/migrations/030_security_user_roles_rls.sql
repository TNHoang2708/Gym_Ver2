-- Migration 030: Hardened User Roles & Sensitive Column RLS Protection

-- 1. Create dedicated user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages roles" ON public.user_roles;
CREATE POLICY "Service role manages roles"
  ON public.user_roles FOR ALL
  USING (false);

-- 2. Trigger function to protect sensitive user_memory columns from unauthorized client-side mutation
CREATE OR REPLACE FUNCTION public.protect_user_memory_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    (NEW.is_admin IS DISTINCT FROM OLD.is_admin) OR
    (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier) OR
    (NEW.xp_points IS DISTINCT FROM OLD.xp_points) OR
    (NEW.streak_days IS DISTINCT FROM OLD.streak_days)
  ) THEN
    -- Verify caller holds admin role in public.user_roles
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access Denied: Unprivileged modification of sensitive user_memory columns.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_protect_user_memory_sensitive_columns ON public.user_memory;
CREATE TRIGGER trigger_protect_user_memory_sensitive_columns
  BEFORE UPDATE ON public.user_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_memory_sensitive_columns();

-- 3. Hardened RLS policies on global_settings
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admin full access to global_settings" ON public.global_settings;

CREATE POLICY "Admin full access to global_settings"
  ON public.global_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users view non-sensitive global_settings"
  ON public.global_settings FOR SELECT
  USING (true);
