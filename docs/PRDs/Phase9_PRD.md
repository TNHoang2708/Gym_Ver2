# PRD — Phase 9: Exercise Library & Visual Anatomy

## Overview
Phase 9 introduces a comprehensive Exercise Library to the application. This ensures that users, particularly beginners, have a visual reference for how to perform the exercises prescribed by the AI. It will feature a searchable database, text instructions, and a dynamic 3D/2D visual muscle heatmap showing exactly which muscles are activated.

---

## Sub-Phase 9.1: Database & Schema Definition
**Estimated Time:** 15 mins

### Tasks:
- [x] 1. Create a new SQL migration file: `supabase/migrations/008_exercise_library.sql`.
- [x] 2. Define the `public.exercises` table schema (id, name, category, equipment, difficulty, instructions array, target_muscles array, video_url).
- [x] 3. Enable Row Level Security (RLS) on the `exercises` table.
- [x] 4. Create an RLS policy allowing public `SELECT` access for all authenticated users.
- [x] 5. Write a seed script within the migration to populate the first 50 common exercises (e.g., Barbell Bench Press, Squat, Deadlift, Dumbbell Fly).
- [x] 6. Ensure the seed data's `target_muscles` values strictly map to a predefined set of muscle group enums (e.g., 'chest', 'lats', 'glutes', 'hamstrings').
- [x] 7. Generate TypeScript types for the new `exercises` table using the Supabase CLI or manual definitions in `src/types/database.ts`.

---

## Sub-Phase 9.2: Visual Assets & Anatomy SVG Component
**Estimated Time:** 30 mins

### Tasks:
- [x] 1. Download or generate a base vector SVG of the human anatomy (front and back views).
- [x] 2. Create `src/components/AnatomyMap.tsx`.
- [x] 3. Import the SVG into the component, ensuring each major muscle group is an individual path with a unique `id` (e.g., `<path id="chest" d="..." />`).
- [x] 4. Define component props: `{ activeMuscles: string[], intensity?: 'low' | 'medium' | 'high' }`.
- [x] 5. Implement logic to dynamically apply CSS classes (e.g., `.fill-gold`) to the SVG paths whose IDs match the `activeMuscles` prop.
- [x] 6. Wrap the SVG paths in `framer-motion` to provide a smooth, glowing pulse animation when a muscle is highlighted.
- [x] 7. Create a fallback UI for browsers that fail to render complex SVGs, displaying a simple text list of activated muscles instead.

---

## Sub-Phase 9.3: Searchable Library UI (`/exercises`)
**Estimated Time:** 35 mins

### Tasks:
- [x] 1. Create a new Next.js route: `src/app/(app)/exercises/page.tsx`.
- [x] 2. Fetch the complete list of exercises from Supabase `exercises` table using Server-Side Rendering (SSR) or React Server Components.
- [x] 3. Build a sticky top navigation bar with a text search input.
- [x] 4. Implement client-side fuzzy searching to filter the exercise list in real-time as the user types.
- [x] 5. Add clickable filter chips below the search bar to filter by category: 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio'.
- [x] 6. Build an `ExerciseCard` component that displays the exercise name, difficulty badge, and a mini `AnatomyMap` thumbnail.
- [x] 7. Implement pagination or infinite scrolling if the list exceeds 50 items.
- [x] 8. Add an empty state component for when a user's search yields no results.

---

## Sub-Phase 9.4: Integration with Active Workout Engine
**Estimated Time:** 20 mins

### Tasks:
- [x] 1. Open `src/app/(app)/workout/active/page.tsx`.
- [x] 2. Next to the active exercise title, add an "Info" button (`<Info className="w-5 h-5" />`).
- [x] 3. Create an `ExerciseDetailModal` component.
- [x] 4. When the Info button is clicked, query the `exercises` table for the specific exercise name (if not already cached).
- [x] 5. Render the modal containing the full `AnatomyMap`, step-by-step text instructions, and a placeholder for a video tutorial.
- [x] 6. Ensure the modal respects the z-index and doesn't conflict with the active Rest Timer countdown.
- [x] 7. Add a "Close" button to dismiss the modal and immediately return the user to their active workout state.
