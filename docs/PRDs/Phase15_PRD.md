# PRD — Phase 15: Community Social Feed & Global Challenges

## Overview
Phase 15 introduces a multiplayer element to Gym Planner AI. By allowing users to share their workouts, celebrate their friends' victories with "Fist Bumps," and participate in global challenges, we create an addictive loop that dramatically increases user retention and organic growth.

---

## Sub-Phase 15.1: Social Database Schema Definition
**Estimated Time:** 15 mins

### Tasks:
- [ ] 1. Create a new SQL migration file: `supabase/migrations/011_social_feed.sql`.
- [ ] 2. Define the `public.posts` table schema (id, user_id, workout_log_id, ai_summary, volume_lifted, created_at).
- [ ] 3. Define the `public.post_likes` table schema (id, post_id, user_id, created_at).
- [ ] 4. Define the `public.post_comments` table schema (id, post_id, user_id, content, created_at).
- [ ] 5. Enable Row Level Security (RLS) on all three tables.
- [ ] 6. Create RLS policies allowing public `SELECT` access for authenticated users, but restricting `INSERT`/`UPDATE`/`DELETE` to the owner (`auth.uid() = user_id`).
- [ ] 7. Update TypeScript definitions in `src/types/index.ts` to include `Post`, `PostLike`, and `PostComment` interfaces.

---

## Sub-Phase 15.2: Global Social Feed UI (`/community`)
**Estimated Time:** 40 mins

### Tasks:
- [ ] 1. Create a new Next.js route: `src/app/(app)/community/page.tsx`.
- [ ] 2. Build the `CommunityFeed` component that queries the `posts` table, joining on the user's profile to fetch their avatar and username.
- [ ] 3. Build the `PostCard` component to display a single workout post. It must include the user's avatar, a hype AI-generated summary, and the total volume lifted.
- [ ] 4. Implement the interactive "Fist Bump" (Like) button. Clicking it should optimistically update the UI and send an API request to insert into `post_likes`.
- [ ] 5. Add an expandable comments section below each `PostCard`.
- [ ] 6. Ensure the feed uses infinite scrolling or pagination to prevent massive payloads.

---

## Sub-Phase 15.3: Workout Sharing Automation
**Estimated Time:** 25 mins

### Tasks:
- [ ] 1. Open `src/app/(app)/workout/active/page.tsx`.
- [ ] 2. In the "Workout Complete" modal or summary screen, add a prominent toggle switch: "Share to Community Feed".
- [ ] 3. If toggled ON, capture the completed exercises, sets, and reps.
- [ ] 4. When the user clicks "Finish", send a prompt to the AI: "Write a short, hype, 2-sentence summary of this workout for a social feed."
- [ ] 5. Insert the newly generated summary, along with the calculated total volume lifted, into the `posts` table.
- [ ] 6. Trigger a celebration animation (e.g., confetti) upon successful sharing.

---

## Sub-Phase 15.4: Navigation Integration
**Estimated Time:** 5 mins

### Tasks:
- [ ] 1. Open `src/components/layout/BottomNav.tsx` and `src/components/layout/Sidebar.tsx`.
- [ ] 2. Add a new navigation item for the Community tab, using the `Users` icon from Lucide React.
- [ ] 3. Ensure the active state highlighting works correctly when navigating to `/community`.
