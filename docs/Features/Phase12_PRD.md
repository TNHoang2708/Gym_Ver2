# PRD — Phase 12: Admin & Telemetry Dashboard

## Overview
As the application scales, the owner requires a centralized "God Mode" portal to monitor the health and profitability of the system. Phase 12 introduces a secure Admin Dashboard dedicated to tracking Daily/Monthly Active Users, OpenAI token expenditures, and system errors.

---

## Sub-Phase 12.1: Authentication & Role-Based Access Control (RBAC)
**Estimated Time:** 20 mins

### Tasks:
- [x] 1. Open Supabase SQL Editor and alter the `user_memory` table (or Auth schema) to include an `is_admin` boolean column, defaulting to `false`.
- [x] 2. Update your specific user record in the database, setting `is_admin = true`.
- [x] 3. Create a Next.js middleware function (`src/middleware.ts`) if one doesn't exist.
- [x] 4. In the middleware, intercept all traffic attempting to reach `/admin/*`.
- [x] 5. Query the session to determine if the user has admin rights. If `is_admin === false`, forcefully redirect them to the `/dashboard` or `/login` page with a 403 status.
- [x] 6. Ensure the backend API routes serving the admin dashboard also verify the admin claim to prevent direct curl/fetch exploits.

---

## Sub-Phase 12.2: Telemetry Database Schema
**Estimated Time:** 15 mins

### Tasks:
- [x] 1. Create a new SQL migration file: `supabase/migrations/009_telemetry_logs.sql`.
- [x] 2. Define the `public.api_telemetry` table schema (id, timestamp, user_id, endpoint, tokens_used, cost_estimated, error_message).
- [x] 3. Ensure Row Level Security (RLS) is enabled on `api_telemetry`.
- [x] 4. Create an RLS policy that explicitly blocks ALL `SELECT`, `UPDATE`, and `DELETE` access to the public. Only users where `is_admin = true` can read this table.
- [x] 5. Allow inserts via a service role key or authenticated users (so the app can log their telemetry).

---

## Sub-Phase 12.3: API Logging Middleware
**Estimated Time:** 20 mins

### Tasks:
- [x] 1. Open the primary AI integration route: `src/app/api/chat/route.ts`.
- [x] 2. Capture the exact token usage reported by the `generateText` / `streamText` response metadata (`usage.totalTokens`).
- [x] 3. Write an asynchronous background function `logTelemetry(userId, tokens)` that pushes this data to the `api_telemetry` table.
- [x] 4. Calculate the estimated cost (e.g., $0.000150 per 1k tokens for gpt-4o-mini) and save it in the `cost_estimated` column.
- [x] 5. Wrap the API handler in a try/catch block. If the OpenAI API throws an error, log the error message string to the telemetry table before returning a 500 status to the client.

---

## Sub-Phase 12.4: Admin UI & Metric Visualizations
**Estimated Time:** 35 mins

### Tasks:
- [x] 1. Create the secure route: `src/app/admin/page.tsx`.
- [x] 2. Build three primary metric cards at the top of the dashboard: "Total Active Users", "Total Workouts Logged", and "Total API Cost ($)".
- [x] 3. Use `recharts` to build a 30-day line chart plotting the Daily Active Users (DAU).
- [x] 4. Use `recharts` to build a bar chart showing daily OpenAI API token expenditure.
- [x] 5. Build a "Recent Signups" data table listing the latest 20 users who joined the platform.
- [x] 6. Add a manual "Kill Switch" toggle for the AI API. If an API billing threshold is exceeded, the admin can flip this toggle (updating a global settings row in Supabase) to temporarily disable the `/api/chat` route and save costs.

---
**Status:** ~90% Complete (Success-path API token logging may be missing)
