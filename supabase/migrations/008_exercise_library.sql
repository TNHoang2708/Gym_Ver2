-- Migration: 008_exercise_library.sql
-- Description: Create the public.exercises table and seed it with initial data.

CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    equipment TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    instructions TEXT[] NOT NULL DEFAULT '{}',
    target_muscles TEXT[] NOT NULL DEFAULT '{}',
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access for exercises" ON public.exercises
    FOR SELECT TO authenticated, anon
    USING (true);

-- Seed Initial Data
INSERT INTO public.exercises (name, category, equipment, difficulty, instructions, target_muscles) VALUES
('Barbell Bench Press', 'Chest', 'Barbell', 'Intermediate', ARRAY['Lie on a flat bench.', 'Grip the barbell slightly wider than shoulder-width.', 'Lower the bar to your mid-chest.', 'Press the bar upwards until your arms are fully extended.'], ARRAY['chest', 'triceps', 'shoulders']),
('Barbell Squat', 'Legs', 'Barbell', 'Intermediate', ARRAY['Stand with your feet shoulder-width apart.', 'Rest the barbell on your upper back.', 'Lower your hips down and back.', 'Drive through your heels to stand back up.'], ARRAY['quadriceps', 'glutes', 'hamstrings']),
('Deadlift', 'Back', 'Barbell', 'Advanced', ARRAY['Stand with feet hip-width apart, barbell over your mid-foot.', 'Bend at your hips and knees to grab the bar.', 'Keep your back straight and lift the bar by extending your hips and knees.', 'Lower the bar under control.'], ARRAY['hamstrings', 'glutes', 'lower_back', 'lats']),
('Pull-up', 'Back', 'Bodyweight', 'Intermediate', ARRAY['Grab the pull-up bar with an overhand grip.', 'Hang freely.', 'Pull yourself up until your chin clears the bar.', 'Lower yourself down slowly.'], ARRAY['lats', 'biceps', 'upper_back']),
('Dumbbell Overhead Press', 'Shoulders', 'Dumbbell', 'Beginner', ARRAY['Sit or stand with a dumbbell in each hand at shoulder height.', 'Press the dumbbells straight up overhead.', 'Lower them back down to your shoulders.'], ARRAY['shoulders', 'triceps']),
('Dumbbell Fly', 'Chest', 'Dumbbell', 'Beginner', ARRAY['Lie on a bench with dumbbells held over your chest.', 'Slightly bend your elbows.', 'Lower the dumbbells out to the sides in a wide arc.', 'Bring them back to the starting position.'], ARRAY['chest', 'shoulders']),
('Barbell Row', 'Back', 'Barbell', 'Intermediate', ARRAY['Bend your torso forward slightly.', 'Hold the barbell with an overhand grip.', 'Pull the barbell to your lower chest/upper abdomen.', 'Lower the barbell slowly.'], ARRAY['lats', 'upper_back', 'biceps']),
('Bicep Curl', 'Arms', 'Dumbbell', 'Beginner', ARRAY['Stand holding dumbbells by your sides.', 'Keep your elbows close to your torso.', 'Curl the weights upward toward your shoulders.', 'Lower the weights under control.'], ARRAY['biceps']),
('Tricep Extension', 'Arms', 'Cable', 'Beginner', ARRAY['Attach a rope or straight bar to a high pulley.', 'Keep your elbows tucked by your sides.', 'Push the attachment down until your arms are fully extended.', 'Return to the starting position.'], ARRAY['triceps']),
('Leg Press', 'Legs', 'Machine', 'Beginner', ARRAY['Sit on the machine and place your feet on the platform.', 'Lower the platform by bending your knees.', 'Push the platform back up by extending your knees.'], ARRAY['quadriceps', 'glutes', 'calves'])
ON CONFLICT DO NOTHING;
