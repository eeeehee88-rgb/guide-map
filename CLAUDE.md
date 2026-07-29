# Guide-trip Handoff

## Project

- React 19 + Vinext app for a mobile-first travel map and AI recommendation flow.
- Main app entry: `app/page.tsx`
- Global styles: `app/globals.css`
- Supabase schema: `supabase/schema.sql`
- Sites hosting project: `.openai/hosting.json`
- Production URL: https://inuyama-family-map.eeeehee88.chatgpt.site

## Commands

- Install dependencies: `npm install`
- Local dev server: `npm.cmd run dev:vinext`
- Build: `npm.cmd run build`

On Windows PowerShell, prefer `npm.cmd` because `npm.ps1` may be blocked by execution policy.

## Environment

Copy `.env.example` to `.env.local` or configure equivalent hosted runtime variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `GOOGLE_MAPS_API_KEY`

The deployed Sites environment already has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `GOOGLE_MAPS_API_KEY`
- `DEEPSEEK_API_KEY`

## Auth State

- Login is required before region setup.
- Default screen is login.
- Signup is opened from the text link under the login form.
- Signup fields: email, password, password confirmation, phone number.
- Phone number is stored in Supabase `user_metadata.phone`.
- The app loads Supabase browser config at runtime from `app/api/auth-config/route.ts` so hosted env vars work after Sites deployment.
- Supabase Email provider should have `Confirm email` OFF for immediate signup/login without email verification.

## Supabase

- Project ref: `moqqokbidafcdlmfjygv`
- Required schema is in `supabase/schema.sql`.
- `trip_profiles` stores per-user trip state.
- RLS is enabled and scoped to `auth.uid()`.
- Test user `eeeehee88@gmail.com` was deleted on 2026-07-29 so it can be recreated.

## Recent Work

- Split AI guidebook generation from the original recommendation service.
- Changed first-run flow:
  - login first
  - then region setup
  - then trip member setup
- Added password-based signup/login.
- Added password confirmation validation and clearer duplicate-signup/login failure messages.

## Notes

- Supabase built-in auth email provider has a low email send rate limit. If `Confirm email` is ON, repeated signup attempts can hit `email rate limit exceeded`.
- Current desired auth behavior is no email confirmation; keep `Confirm email` OFF.
- For production email confirmation or password reset later, configure custom SMTP in Supabase.
