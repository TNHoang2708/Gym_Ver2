-- Enable RLS on all critical tables
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies to ensure we start clean
DROP POLICY IF EXISTS "Enable all access for all users" ON public.food_logs;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.workout_logs;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.workout_session_logs;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.user_memory;
DROP POLICY IF EXISTS "Public access to exercises" ON public.exercises;

-- 1. Food Logs Policies
CREATE POLICY "Users can only view their own food logs"
ON public.food_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own food logs"
ON public.food_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own food logs"
ON public.food_logs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own food logs"
ON public.food_logs FOR DELETE
USING (auth.uid() = user_id);

-- 2. Workout Logs Policies
CREATE POLICY "Users can only view their own workout logs"
ON public.workout_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own workout logs"
ON public.workout_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own workout logs"
ON public.workout_logs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own workout logs"
ON public.workout_logs FOR DELETE
USING (auth.uid() = user_id);

-- 3. Workout Session Logs Policies
CREATE POLICY "Users can only view their own session logs"
ON public.workout_session_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own session logs"
ON public.workout_session_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own session logs"
ON public.workout_session_logs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own session logs"
ON public.workout_session_logs FOR DELETE
USING (auth.uid() = user_id);

-- 4. User Memory Policies
CREATE POLICY "Users can only view their own memory"
ON public.user_memory FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can only insert their own memory"
ON public.user_memory FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only update their own memory"
ON public.user_memory FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only delete their own memory"
ON public.user_memory FOR DELETE
USING (auth.uid() = id);

-- 5. Exercises Table (Read-Only for all Authenticated users)
CREATE POLICY "Authenticated users can read exercises"
ON public.exercises FOR SELECT
USING (auth.role() = 'authenticated');
