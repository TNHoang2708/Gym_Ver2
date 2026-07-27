CREATE TABLE IF NOT EXISTS public.banned_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    banned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure is_admin exists
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
DECLARE
  admin_status boolean;
BEGIN
  SELECT (role = 'admin') INTO admin_status FROM public.user_roles WHERE user_id = auth.uid();
  RETURN coalesce(admin_status, false);
EXCEPTION WHEN undefined_table THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage
DO $$ 
BEGIN
  BEGIN
    CREATE POLICY "Public can view banned ips" ON public.banned_ips FOR SELECT USING ( true );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Admins can manage banned ips" ON public.banned_ips FOR ALL USING ( public.is_admin() );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Service role can insert
  BEGIN
    CREATE POLICY "Service role can manage banned ips" ON public.banned_ips FOR ALL TO service_role USING ( true );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
