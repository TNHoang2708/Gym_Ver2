# Security PRD: The Endgame & Paranoia Protocols

## Overview
This document outlines the security measures implemented in the Gym Planner AI application to ensure bank-grade protection against bots, malicious actors, and automated attacks.

## 1. RLS Hardening (Supabase)
Row Level Security (RLS) policies are enforced strictly on all tables, ensuring users can only read/write their own data.
Service-role only policies are applied to sensitive tables like `global_settings` and `banned_ips`.

## 2. Iron Dome Middleware (`src/middleware.ts`)
- **Anti-Bot Shield**: Requires a valid `User-Agent` header. Violations trigger a **1-Hour Ban**.
- **CSRF Guard**: Validates `Origin` and `Referer` headers on mutations. Violations trigger a **3-Hour Ban**.
- **Malicious Path Scanner**: Instantly blocks and permanently bans IPs attempting to access sensitive files (`.env`, `.git`, `wp-admin`, `.php`, `.sql`, etc.).
- **Strict Security Headers**: Enforces CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy on all responses to prevent client-side attacks (XSS, Clickjacking).
- **Auth Guard**: Automatically redirects unauthenticated users to `/login`.
- **Honeypot Ban Hammer**: Validates IPs against `banned_ips`. Only blocks if `expires_at` is in the future or `NULL` (permanent).

## 3. Zod Environment Validation
- On boot, `src/lib/env.ts` validates required environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `GOOGLE_GEMINI_API_KEY`, etc.) using Zod.
- Prevents the application from starting in an insecure state.

## 4. API Rate Limiting (Supabase RPC)
- AI Endpoints (`/api/chat`, `/api/social/summary`, etc.) are protected by a strict rate limiter (e.g., 10 requests per minute).
- Backed by the `api_rate_limits` table in Postgres for accuracy across Vercel serverless functions.

## 5. XSS Sanitization (DOMPurify)
- All user text inputs (e.g., `userMessage` in chat, `exercise_name` in social summaries) are sanitized using `isomorphic-dompurify` before being processed or saved to the database.
- Prevents malicious HTML/JavaScript injections.

## 6. Honeypot Trap & Dynamic Ban System
- A fake endpoint `/api/admin/hidden-login` acts as a trap. Hits trigger a **Permanent Ban** (`expires_at: NULL`).
- Bans are stored in `banned_ips` with an optional `expires_at` column for temporary durations (e.g., 1 hour, 3 hours).
- **Telegram & Discord Alerts**: `middleware.ts` automatically sends incident reports containing IP, Reason, and Ban Duration to configured Webhooks (`telegram_bot_token` / `telegram_chat_id` / `discord_webhook_url` in `global_settings`).
