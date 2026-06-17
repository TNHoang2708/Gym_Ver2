-- Migration 009: Admin & Telemetry

-- 1. Add is_admin to user_memory
ALTER TABLE public.user_memory ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create global_settings table
CREATE TABLE public.global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial settings
INSERT INTO public.global_settings (key, value) VALUES ('ai_kill_switch', 'false'::jsonb) ON CONFLICT (key) DO NOTHING;

-- Enable RLS on global_settings
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to global_settings (since API routes need to check it)
CREATE POLICY "Allow public read access to global settings"
    ON public.global_settings
    FOR SELECT
    USING (true);

-- Allow admins to update global_settings
CREATE POLICY "Allow admins to update global settings"
    ON public.global_settings
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_memory 
        WHERE user_id = auth.uid() AND is_admin = true
      )
    );

-- 3. Create api_telemetry table
CREATE TABLE public.api_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_estimated NUMERIC(10, 6) DEFAULT 0,
    error_message TEXT
);

-- Enable RLS on api_telemetry
ALTER TABLE public.api_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own telemetry
CREATE POLICY "Allow users to insert telemetry"
    ON public.api_telemetry
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all telemetry
CREATE POLICY "Allow admins to read all telemetry"
    ON public.api_telemetry
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_memory 
        WHERE user_id = auth.uid() AND is_admin = true
      )
    );
