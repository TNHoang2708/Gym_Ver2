# Phase 30: Security Hardening, Single-Source Admin Auth, RLS & Strict CI PRD

## Executive Summary
Phase 30 establishes a production-hardened security posture for Gym Planner AI. It introduces `public.user_roles` as the single source of truth for admin privileges, eliminates vulnerable client-side column mutations, secures `global_settings` RLS policies, and restores strict CI pipeline enforcement on GitHub Actions.

---

## Technical Metrics & Verification Criteria

| Target Component | Metric / Specification | Status |
| :--- | :--- | :--- |
| **Admin Authorization** | Single Source of Truth (`public.user_roles`) across all `/api/admin/*` routes | **COMPLETED (100%)** |
| **User Memory Security** | Database Trigger blocking unauthorized `is_admin`, `subscription_tier`, `xp_points`, `streak_days` mutations | **COMPLETED (100%)** |
| **RLS Hardening** | `global_settings` RLS policies restricted to admin role | **COMPLETED (100%)** |
| **Strict CI Pipeline** | Strict `npm run lint`, `npx tsc --noEmit`, `npm run build` execution without soft fallbacks | **COMPLETED (100%)** |
| **Type Check & Build** | 0 TypeScript Errors, Clean Next.js Build | **VERIFIED (100%)** |

---

## Architectural Changes

### 1. Unified Admin Authorization Helper (`src/lib/auth/admin-check.ts`)
- Replaces legacy checks (`user_memory.is_admin`, metadata checks, or email parsing).
- Authenticates caller via server-side Supabase client (`auth.getUser()`).
- Queries `public.user_roles` table for `role === 'admin'`.
- Applied to all admin endpoints: `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/gamification`, `/api/admin/settings`, `/api/admin/ai-logs`, `/api/admin/exercises`, `/api/admin/feedback`, `/api/admin/assistant`.

### 2. Database Migration 030 (`supabase/migrations/030_security_user_roles_rls.sql`)
- Created `public.user_roles` table with strict RLS policies.
- Implemented `protect_user_memory_sensitive_columns()` trigger preventing non-admins from mutating `is_admin`, `subscription_tier`, `xp_points`, or `streak_days`.
- Secured `global_settings` table RLS policies.

### 3. Strict GitHub Actions CI Pipeline (`.github/workflows/production.yml`)
- Removed `npm run lint || true` fallback.
- Added strict `npx tsc --noEmit` and `npm run build` checks.
- Excluded non-app directories (`claudekit-engineer*`, `android/`, `ios/`, `.claude/`) via `eslint.config.mjs`.

---

## Future Phase Roadmap
- **Phase 31**: Mobile Production Domain Setup & Offline Screen (`https://gym-ver2.vercel.app`).
- **Phase 32**: Core E2E User Flow Tests & Accessibility Audit.
