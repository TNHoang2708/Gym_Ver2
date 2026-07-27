# Phase 24 PRD: Security & UX Audit Fixes

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team (Agent)
- **Date:** June 2026

## 2. Objective
Address critical vulnerabilities, state management infinite loops, data calculation errors, and UX friction discovered during the Comprehensive App Audit. This phase prioritizes security (Auth/Middleware) and core loop stability (Workout & Exercises).

## 3. Scope

### 3.1. 🔴 Critical Fixes (Security & Core)

#### Middleware Auth Protection
- Next.js `middleware.ts` was missing, exposing all protected routes (`/dashboard`, `/profile`, `/ai-coach`, etc.).
- Created `src/middleware.ts` to wire up the existing `src/proxy.ts` auth guards.

#### Auth Callback Route Implementation
- The PKCE flow was broken because the redirect route did not exist.
- Implemented `src/app/auth/callback/route.ts` to exchange the auth code for a valid Supabase session.

#### State Management Infinite Loops
- `src/app/(app)/exercises/page.tsx` had an infinite render loop caused by calling `createClient()` directly in the component body.
- `src/lib/hooks/use-data.ts` instantiated a stale client on module load, causing hydration mismatches.
- Refactored these to properly instantiate the Supabase client inside `useEffect` or SWR fetchers.

#### Core Workout Bugs
- Fixed an operator precedence bug in the `adjustRest()` function (`src/app/(app)/workout/active/page.tsx`) that broke the timer math.
- Fixed a bug where `volume_kg` and `duration_mins` were not included in the payload when saving to `workout_logs`.

#### Secure Admin Functionality
- `toggleSetting` in `src/app/admin/page.tsx` bypassed API routes and incorrectly wrote to the database directly from the client.
- Updated the component to post to `/api/admin/settings` securely using a server-side admin client.

### 3.2. 🟡 Important Fixes (Data & Logic)

#### Nutrition Data Integrity
- Food logs in `nutrition/page.tsx` did not record `meal_type`. Now saves correctly.

#### BMI & Body Fat Math Errors
- Handled division by zero in the BMI calculator (when height=0).
- Handled `NaN` errors in the Navy Body Fat calculator (when the difference between waist and neck was <= 0 or logarithmic values were invalid).

#### Workout Day Fallback
- `workout/active/page.tsx` defaulted to the first available non-rest day instead of today's actual scheduled day. Prioritized today's schedule fallback.

#### Missing Null Checks
- Added fallback values (`|| 0`) to `.toLocaleString()` calls in `leaderboard/page.tsx` and `community/page.tsx` to prevent crashes for new users with no volume.
- Unified UI metric display to use `kg` instead of `lbs` in the Community page.

#### Onboarding Progress Bar
- The progress bar in `onboarding/page.tsx` could never reach 100%. Updated the math calculation to `((currentStep + 1) / STEPS.length) * 100` so it correctly represents completion.

### 3.3. 🟢 Minor Fixes (UX Polish)

#### Landing Page Cleanup
- Wired up `#features` and `#ai` IDs so header navigation works correctly.
- Removed dead footer links.
- Updated the "Sign In" button `href` to correctly point to `/login` rather than `/register`.
- Removed fabricated brand endorsements from the landing page.

#### Global CSS Adjustments
- Added the missing `.fill-gold` CSS class in `src/app/globals.css` so that SVG stars fill correctly.

## 4. Files Modified
- `src/middleware.ts` [NEW]
- `src/app/auth/callback/route.ts` [NEW]
- `src/app/layout.tsx`
- `src/app/global-error.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(app)/exercises/page.tsx`
- `src/app/(app)/workout/active/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/api/admin/settings/route.ts`
- `src/components/AIQuickLogger.tsx`
- `src/lib/hooks/use-data.ts`
- `src/app/(app)/nutrition/page.tsx`
- `src/app/(app)/bmi/page.tsx`
- `src/app/(app)/leaderboard/page.tsx`
- `src/app/(app)/community/page.tsx`
- `src/app/(app)/onboarding/page.tsx`
