CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    ip_address TEXT,
    details TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Admins can view and manage
  BEGIN
    CREATE POLICY "Admins can manage security alerts" ON public.security_alerts FOR ALL USING ( public.is_admin() );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Service role can insert
  BEGIN
    CREATE POLICY "Service role can manage security alerts" ON public.security_alerts FOR ALL TO service_role USING ( true );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Add discord webhook setting to global_settings if it doesn't exist
INSERT INTO public.global_settings (key, value)
VALUES ('discord_webhook_url', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
