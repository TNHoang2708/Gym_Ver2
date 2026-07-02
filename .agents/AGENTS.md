# Gym Planner AI - Security & PRD Management Rules

The following are strict project-scoped rules for Gym Planner AI.

## 1. Zero-Trust API Security
- **ALWAYS** check for `supabase.auth.getUser()` at the very beginning of ANY new or modified API route (`POST`, `GET`, etc.) in `src/app/api/`.
- If `user` is null or `authError` exists, immediately return a `401 Unauthorized` response.
- **NEVER** expose internal error messages (`error.message`) or stack traces to the client on a 500 status code. Always return generic strings like "Internal Server Error" or "AI service encountered an error."
- Any API route that uses AI (OpenAI, Gemini, Anthropic) **MUST** log token usage and costs to the `api_telemetry` table.

## 2. PRD Auto-Updating
- When implementing a feature mentioned in `docs/Features/PhaseX_PRD.md`, **PROACTIVELY** update the status in the PRD file (e.g. from "~50% Complete" to "100% Complete") once the functionality works.
- DO NOT wait for the user to explicitly remind you to update the PRD.

## 3. Privacy & Logging
- **NEVER** log or print sensitive user data (passwords, specific emails, exact physical locations) in `console.log()` or telemetry logs. Telemetry should only log `user_id` and token counts.
