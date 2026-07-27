-- Force Admin RLS policies with unique names
CREATE POLICY "Admins_Force_View_Memory" ON public.user_memory FOR SELECT
USING ( public.is_admin() );

CREATE POLICY "Admins_Force_View_WorkoutLogs" ON public.workout_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_memory WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins_Force_View_FoodLogs" ON public.food_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_memory WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins_Force_View_Sessions" ON public.workout_session_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_memory WHERE user_id = auth.uid() AND is_admin = true));
