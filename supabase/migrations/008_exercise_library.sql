-- Migration 008: Exercise Library

CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio', 'Full Body')),
    equipment TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    instructions TEXT[] NOT NULL DEFAULT '{}',
    target_muscles TEXT[] NOT NULL DEFAULT '{}',
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exercises
CREATE POLICY "Allow public read access to exercises"
    ON public.exercises
    FOR SELECT
    USING (true);

-- Seed Data (Sample 20 exercises to start)
INSERT INTO public.exercises (name, category, equipment, difficulty, instructions, target_muscles) VALUES
('Barbell Bench Press', 'Chest', 'Barbell', 'Intermediate', 
 ARRAY['Lie flat on a bench', 'Grip the bar slightly wider than shoulder-width', 'Lower the bar to your mid-chest', 'Press the bar back up to the starting position'],
 ARRAY['chest', 'triceps', 'shoulders']),

('Push-up', 'Chest', 'Bodyweight', 'Beginner',
 ARRAY['Start in a plank position', 'Lower your body until your chest nearly touches the floor', 'Push yourself back up'],
 ARRAY['chest', 'triceps', 'shoulders', 'core']),

('Dumbbell Incline Press', 'Chest', 'Dumbbell', 'Intermediate',
 ARRAY['Set an adjustable bench to a 30-45 degree angle', 'Press the dumbbells straight up over your upper chest', 'Lower them under control'],
 ARRAY['chest', 'triceps', 'shoulders']),

('Cable Crossover', 'Chest', 'Cable', 'Intermediate',
 ARRAY['Set pulleys high', 'Step forward and bring the handles together in front of your chest', 'Slowly release back'],
 ARRAY['chest']),

('Barbell Squat', 'Legs', 'Barbell', 'Intermediate',
 ARRAY['Place the bar on your upper back', 'Keep your chest up and core braced', 'Squat down until your thighs are parallel to the floor', 'Drive back up through your heels'],
 ARRAY['quads', 'glutes', 'hamstrings', 'core']),

('Leg Press', 'Legs', 'Machine', 'Beginner',
 ARRAY['Sit in the machine and place your feet on the sled', 'Lower the weight by bending your knees', 'Press the weight back up without locking your knees'],
 ARRAY['quads', 'glutes', 'calves']),

('Romanian Deadlift (RDL)', 'Legs', 'Barbell', 'Intermediate',
 ARRAY['Hold the bar at hip level', 'Hinge at the hips while keeping your legs slightly bent', 'Lower the bar just past your knees', 'Squeeze your glutes to return to the top'],
 ARRAY['hamstrings', 'glutes', 'lower_back']),

('Walking Lunges', 'Legs', 'Dumbbell', 'Beginner',
 ARRAY['Hold dumbbells by your sides', 'Step forward and lower your hips until both knees are bent at a 90-degree angle', 'Push off the front foot to step forward with the other leg'],
 ARRAY['quads', 'glutes', 'hamstrings']),

('Barbell Deadlift', 'Back', 'Barbell', 'Advanced',
 ARRAY['Stand with your mid-foot under the bar', 'Bend over and grab the bar', 'Keep your chest up and back straight', 'Lift the bar by extending your hips and knees'],
 ARRAY['glutes', 'hamstrings', 'lower_back', 'lats', 'core']),

('Pull-up', 'Back', 'Bodyweight', 'Intermediate',
 ARRAY['Hang from the bar with an overhand grip', 'Pull yourself up until your chin clears the bar', 'Lower yourself under control'],
 ARRAY['lats', 'biceps', 'upper_back']),

('Lat Pulldown', 'Back', 'Cable', 'Beginner',
 ARRAY['Sit at the machine and grab the wide bar', 'Pull the bar down to your upper chest', 'Slowly return the bar to the starting position'],
 ARRAY['lats', 'biceps']),

('Barbell Row', 'Back', 'Barbell', 'Intermediate',
 ARRAY['Hinge forward at the hips, keeping your back straight', 'Pull the barbell to your lower chest', 'Lower the weight under control'],
 ARRAY['lats', 'upper_back', 'biceps']),

('Overhead Press', 'Shoulders', 'Barbell', 'Intermediate',
 ARRAY['Hold the bar at shoulder height', 'Press the bar overhead until your arms are locked out', 'Lower the bar back to your shoulders'],
 ARRAY['shoulders', 'triceps', 'core']),

('Lateral Raise', 'Shoulders', 'Dumbbell', 'Beginner',
 ARRAY['Hold dumbbells by your sides', 'Raise your arms out to the side until they are parallel to the floor', 'Slowly lower them back down'],
 ARRAY['shoulders']),

('Barbell Curl', 'Arms', 'Barbell', 'Beginner',
 ARRAY['Hold the barbell with an underhand grip', 'Curl the weight up towards your chest', 'Lower the weight under control'],
 ARRAY['biceps']),

('Tricep Pushdown', 'Arms', 'Cable', 'Beginner',
 ARRAY['Attach a rope or straight bar to a high pulley', 'Keep your elbows tucked in and push the attachment down', 'Slowly return to the top'],
 ARRAY['triceps']),

('Hammer Curl', 'Arms', 'Dumbbell', 'Beginner',
 ARRAY['Hold dumbbells with a neutral grip (palms facing each other)', 'Curl the weights up', 'Lower them under control'],
 ARRAY['biceps', 'forearms']),

('Plank', 'Core', 'Bodyweight', 'Beginner',
 ARRAY['Support your weight on your forearms and toes', 'Keep your body in a straight line from head to heels', 'Hold this position'],
 ARRAY['core', 'shoulders']),

('Crunch', 'Core', 'Bodyweight', 'Beginner',
 ARRAY['Lie on your back with knees bent', 'Curl your shoulders off the floor', 'Lower back down slowly'],
 ARRAY['core']),

('Treadmill Running', 'Cardio', 'Machine', 'Beginner',
 ARRAY['Step onto the treadmill', 'Select your speed and incline', 'Run or walk continuously'],
 ARRAY['cardio', 'calves', 'quads']);
