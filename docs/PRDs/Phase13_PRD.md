# PRD — Phase 13: Production Deployment & CI/CD

## Overview
Phase 13 represents the launch sequence. Before deploying the application to the public internet, we must ensure the database is cryptographically secure, the build pipeline is automated, and the production environments are properly configured to scale.

---

## Sub-Phase 13.1: Database Hardening (Row Level Security)
**Estimated Time:** 25 mins

### Tasks:
- [ ] 1. Open the Supabase Dashboard and navigate to the Authentication settings. Disable "Enable Signup" if the app is currently in closed beta, or ensure email confirmation is strictly required.
- [ ] 2. Audit the `food_logs` table. Ensure an RLS policy exists enforcing `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE operations.
- [ ] 3. Audit the `workout_logs` and `workout_session_logs` tables. Ensure strict `user_id` ownership policies are enforced.
- [ ] 4. Audit the `user_memory` table. Ensure users can only modify their own memory rows.
- [ ] 5. Run a script using an anonymous API key to attempt to query another user's data to mathematically prove the RLS policies are functioning correctly and blocking the request.

---

## Sub-Phase 13.2: CI/CD Pipeline (GitHub Actions)
**Estimated Time:** 20 mins

### Tasks:
- [ ] 1. Create a new directory and file: `.github/workflows/production.yml`.
- [ ] 2. Define the trigger: The action should run "On push to `main` branch" and "On pull request to `main`".
- [ ] 3. Configure the runner to use `ubuntu-latest`.
- [ ] 4. Add the setup steps: Checkout code, setup Node.js v20.
- [ ] 5. Add the caching layer to speed up dependency installation (`actions/cache@v3` for `~/.npm` and `.next/cache`).
- [ ] 6. Add the execution steps: `npm ci`, followed by `npm run lint`, and finally `npm run build`.
- [ ] 7. In the GitHub repository settings, establish branch protection rules requiring this workflow to pass before any code can be merged into `main`.

---

## Sub-Phase 13.3: Stripe Production Setup
**Estimated Time:** 20 mins

### Tasks:
- [ ] 1. Log into the Stripe Dashboard and toggle "Test Mode" to "Live Mode".
- [ ] 2. Re-create the Pro Subscription Product in the live environment and copy the new Live Price ID.
- [ ] 3. Update the `.env.production` file to use the `sk_live_...` and `pk_live_...` Stripe keys.
- [ ] 4. Setup a production webhook endpoint pointing to your deployed domain (e.g., `https://gymplanner.ai/api/webhooks/stripe`).
- [ ] 5. Retrieve the live webhook signing secret and add it to the production environment variables.

---

## Sub-Phase 13.4: Vercel Deployment & Custom Domains
**Estimated Time:** 25 mins

### Tasks:
- [ ] 1. Log into Vercel and import the GitHub repository.
- [ ] 2. Ensure the framework preset is set to Next.js.
- [ ] 3. Open the Environment Variables tab in Vercel. Carefully paste all required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, and the live Stripe keys.
- [ ] 4. Trigger the first production build manually.
- [ ] 5. Navigate to the Vercel Domains setting and map the custom domain (e.g., `gymplanner.ai`).
- [ ] 6. Update your DNS registrar (e.g., Namecheap, Cloudflare) with the Vercel nameservers or A/CNAME records.
- [ ] 7. Perform a final smoke test on the production URL: Create an account, log a workout, and verify the AI responds correctly in the live environment.
