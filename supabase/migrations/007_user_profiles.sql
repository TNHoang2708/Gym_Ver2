-- Migration: 007_user_profiles.sql
-- Add display_name to user_memory and create global leaderboard view

ALTER TABLE public.user_memory 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create a secure view for the global leaderboard
-- It sums the total volume from workout logs and joins with display_name
CREATE OR REPLACE VIEW public.global_leaderboard_view AS
SELECT 
    um.user_id,
    COALESCE(um.display_name, 'Anonymous Athlete') as display_name,
    COALESCE(SUM(wl.volume_kg), 0) as total_volume_kg
FROM 
    public.user_memory um
LEFT JOIN 
    public.workout_logs wl ON um.user_id = wl.user_id
GROUP BY 
    um.user_id, um.display_name
ORDER BY 
    total_volume_kg DESC;

-- Grant access to the view
GRANT SELECT ON public.global_leaderboard_view TO authenticated;
GRANT SELECT ON public.global_leaderboard_view TO anon;
