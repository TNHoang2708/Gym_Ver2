# Phase 7: Active Workout Engine & PWA

## Core Objective
Transform the app from a planning tool into an in-the-gym companion. We will build a live workout interface where users can step through their AI-generated exercises, track live weights/reps, and use a rest timer. We will also make the app a fully installable Progressive Web App (PWA).

## Features & Progress

### 1. Database Layer (Supabase)
- [x] Create `workout_session_logs` table to store detailed sets/reps/weight per exercise.
- [x] Create `exercise_library` table for storing instructions/muscle groups (optional, AI can provide).

### 2. Active Workout Interface (`/workout/active`)
- [x] Fetch today's planned exercises from the active `workout_schedules`.
- [x] Step-by-step UI: one exercise on screen at a time.
- [x] Input fields to log actual Weight (kg/lbs) and Reps achieved for each set.
- [x] Integrated Rest Timer (e.g., 60s countdown) with visual ring and sound cue.
- [x] "Finish Workout" summary screen showing total volume lifted and time taken.
- [x] Save completed workout to `workout_logs` and `workout_session_logs`.

### 3. Progressive Web App (PWA) Integration
- [x] Add `manifest.json` with app name, colors, and icons.
- [x] Add Service Worker (`next-pwa` or custom) for offline caching of core assets.
- [x] Add meta tags for iOS Safari (apple-touch-icon, apple-mobile-web-app-capable).
- [x] "Install App" button in the Profile or Dashboard.

### 4. Stripe Subscription UI (Bonus)
- [x] Create a `/pro` upgrade page explaining the benefits of the Pro Tier (which is currently just a static badge on the profile).
- [x] Add pricing cards and a mock "Subscribe" button flow.

---
**Status:** 0% Complete (Implementation starting now)
