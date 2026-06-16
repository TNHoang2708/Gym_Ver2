# Phase 8: Social & Community Hub

## Core Objective
Introduce social dynamics to Gym Planner AI to increase user retention and gamification. By allowing users to see how they stack up against the global community, we create natural motivation. We will build a Global Leaderboard and allow users to generate shareable workout summaries.

## Features & Progress

### 1. Global Leaderboard (`/leaderboard`)
- [ ] Database Query: Create an RPC (Remote Procedure Call) or secure view in Supabase to aggregate total volume moved or longest streaks across all users without exposing private PII (emails).
- [ ] UI: A premium, gold-accented leaderboard table.
- [ ] Ranks 1, 2, and 3 get special gold, silver, and bronze highlighting.

### 2. Shareable Workout Summaries
- [ ] On the Active Workout complete screen (`/workout/active`), add a "Share" button.
- [ ] Generate a beautifully formatted text snippet to the clipboard (e.g., "🔥 I just crushed a 4,500kg Leg Day using Gym Planner AI! My streak is now 12 days. Join me!").

### 3. Public User Profiles (Optional/Lite)
- [ ] Update `user_memory` to include a `display_name` and `is_public` toggle.
- [ ] A public route `/u/[username]` that shows a user's stats *only if* their profile is set to public.

---
**Status:** 0% Complete (Planning Phase)
