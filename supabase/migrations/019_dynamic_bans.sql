-- 1. Add expires_at to banned_ips
ALTER TABLE public.banned_ips 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Add telegram settings to global_settings (Tokens are managed securely via Dashboard)
INSERT INTO public.global_settings (key, value)
VALUES 
  ('telegram_bot_token', '""'::jsonb),
  ('telegram_chat_id', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
