# GymFlow Deployment & Operations

> Updated: 2026-10-18. The Firebase deployment instructions previously here are obsolete; production uses Vercel + Supabase.

## Production resources

- Repository: https://github.com/NTUT-Vincent/GymFlow
- Branch deployed to production: `main`
- Production site: https://gym-flow-iota.vercel.app/
- Vercel project: `gym-flow` in `ntutvincents-projects`
- Supabase project: managed separately in the Supabase dashboard (do not commit account IDs, credentials, or secret keys).
- PR #5 (Supabase migration) was merged 2026-10-18. Mobile CSS/UX fixes and documentation updates followed on `main`.

## Required public environment variables

Set both for the Vercel Production environment (and Preview for branch testing):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

The public publishable key is used in `lib/supabase/client.ts` and the auth callback route. **Never put the Supabase secret/service_role key in any `NEXT_PUBLIC_*` setting or client code.**

## OAuth setup

1. Enable the Google provider in Supabase Authentication; supply Google Cloud OAuth Client ID and Client Secret **inside the respective dashboards**.
2. Register the Supabase provider callback `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` in Google Cloud authorized redirect URIs.
3. In Supabase Authentication URL Configuration, set the production Site URL and allow `https://gym-flow-iota.vercel.app/auth/callback` and, for local development, `http://localhost:3000/auth/callback`. Preview redirect URLs should be allowlisted only when needed.
4. Run `supabase/migrations/20261018000000_initial_schema.sql` once in Supabase SQL Editor or use migrations in a controlled workflow.
5. Sign in with Google. To grant a trusted user admin access, verify their exact identity in `profiles` and make a **targeted** role change from the Supabase SQL Editor, not the browser.

## Current status and what is NOT yet verified

- User confirmed that the production UI displayed Google account name and "Supabase 已同步".
- User reported creating a gym and equipment in production; the homepage displayed an item, supporting basic read/write functionality.
- Earlier Vercel deployment status checks showed successful builds for the Supabase PR and mobile code commits.
- This does **not** verify all RLS permission paths, pending-booking insertion, cancellation, scheduling RPC, race conditions, multi-gym behavior, or mobile interactions. See `docs/qa-checklist.md`.
- After new commits to `main`, Vercel deploys again; check the specific commit/deployment in the Vercel dashboard rather than assuming deployment is ready.

## Local development and CI

```bash
npm install
npm run lint       # package.json: tsc --noEmit
npm run build
npm run dev
```

CI configuration: `.github/workflows/nextjs-ci.yml`; it runs on pushes and PRs to `main`, using Node 22, TypeScript checking and `next build`. A successful build does not replace browser/E2E testing. `next.config.ts` does not bypass type-check errors.

## Data and backups

- Tables: `profiles`, `gyms`, `equipment`, `bookings`, `schedules`.
- Firebase data and user IDs are **not** automatically migrated. Plan a separate data migration only if there is existing data to preserve.
- Before applying further database migrations, assess impact on existing Supabase rows and make appropriate backups.

## Scheduled jobs

**None enabled in the GymFlow repository.** Automatic optimization using Supabase Cron/Edge Functions or Vercel Cron was discussed and explicitly deferred. Any future schedule needs a trusted, idempotent endpoint/worker plus concurrency controls; do not run it simply by invoking browser code.

See `README.md`, `docs/supabase-schema.md`, `docs/architecture.md` and `docs/qa-checklist.md`.
