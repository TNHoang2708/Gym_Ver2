-- Migration 023: Admin Core Management (Feedback, AI Logs, Exercises)

-- 1. Upgrade `feedback` table
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('bug', 'feature', 'other'));

-- 2. Admin RLS Policies for feedback
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all feedback"
  ON public.feedback FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete all feedback"
  ON public.feedback FOR DELETE
  USING (is_admin());

-- 3. Admin RLS Policies for chat_messages (AI Logs)
CREATE POLICY "Admins can view all chat messages"
  ON public.chat_messages FOR SELECT
  USING (is_admin());

-- 4. Admin RLS Policies for exercises (CMS)
-- (Select is already public for all users via 008)
CREATE POLICY "Admins can insert exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update exercises"
  ON public.exercises FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete exercises"
  ON public.exercises FOR DELETE
  USING (is_admin());

-- 5. Admin RLS Policies for api_telemetry (Analytics)
-- Telemetry is mostly insert-only from Edge/Server, but Admin needs to SELECT for Analytics
CREATE POLICY "Admins can view api telemetry"
  ON public.api_telemetry FOR SELECT
  USING (is_admin());

-- 6. Admin RLS Policies for workout_session_logs (Analytics)
CREATE POLICY "Admins can view all workout session logs"
  ON public.workout_session_logs FOR SELECT
  USING (is_admin());

-- 7. Admin RLS Policies for food_logs (Analytics)
CREATE POLICY "Admins can view all food logs"
  ON public.food_logs FOR SELECT
  USING (is_admin());
