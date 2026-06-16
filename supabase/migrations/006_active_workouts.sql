-- Migration: 006_active_workouts.sql
-- Create table for tracking detailed sets/reps during an active workout session

CREATE TABLE IF NOT EXISTS public.workout_session_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE, -- Link to the parent workout log for the day
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg NUMERIC(6,2),
    reps_achieved INTEGER NOT NULL,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.workout_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session logs"
    ON public.workout_session_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session logs"
    ON public.workout_session_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session logs"
    ON public.workout_session_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session logs"
    ON public.workout_session_logs FOR DELETE
    USING (auth.uid() = user_id);
