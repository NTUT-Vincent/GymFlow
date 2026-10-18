# GymFlow — Next.js + Supabase + Vercel

GymFlow is a gym equipment booking and scheduling MVP with a member UI, staff dashboard,
and a branch-and-bound schedule optimizer. It uses **Next.js 15, React 19, TypeScript,
Supabase Auth (Google OAuth), PostgreSQL with RLS, and Vercel**.

Without Supabase environment variables, the application runs a localStorage-only demo.
Demo data and authenticated cloud data are **separate**; Firebase data is **not** automatically migrated.

## Features

- Member: see available equipment, request booking windows, view schedules, cancel bookings.
- Staff: manage equipment and run the schedule optimizer.
- Admin: manage gyms in addition to staff operations.
- Optimizer: client-side bounded search; schedule assignments are committed by an
  **atomic PostgreSQL RPC** with conflict checks and an exclusion constraint.
- Realtime: Supabase Postgres Changes for connected sessions (with focus refresh and
  read-after-write refresh as fallbacks).

## Setup (Supabase)

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open **SQL Editor**, execute `supabase/migrations/20261018000000_initial_schema.sql`
   (or use Supabase CLI migrations). This creates:
   - `profiles`, `gyms`, `equipment`, `bookings`, `schedules`;
   - new-user trigger, RLS policies and table privileges;
   - `cancel_booking` and `commit_schedule_batch` transactional functions;
   - Realtime publication for four application tables.
3. Supabase > **Authentication > Providers > Google**: enable Google and supply
   the Google OAuth Client ID and Client Secret from Google Cloud Console.
   Google's **authorized redirect URI** must be the callback URL shown in the
   Supabase Google provider settings, usually
   `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`.
4. Supabase > **Authentication > URL Configuration**:
   - Site URL: your Vercel production URL.
   - Additional Redirect URLs: `https://<YOUR_VERCEL_DOMAIN>/auth/callback`
     and `http://localhost:3000/auth/callback`.
   - Preview URLs: register only the exact trusted previews you plan to test;
     do not broadly allow unrelated origins.
5. Create `.env.local` from `.env.example` and fill in the **Project URL** and
   **Publishable key** from Supabase project settings:
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   ```
   An older Supabase project's legacy `anon` key can also be used in this
   publishable-key field if necessary. **Never use a service_role or secret key in NEXT_PUBLIC variables**.
6. Sign in once with Google, then promote the trusted account in SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where email = 'you@example.com';
   ```
   **Confirm the email and affected row before running this statement.**
   A newly signed-in user starts as `member`. After promotion, sign out/in or refresh.
7. As admin, create the first gym and add equipment from the staff dashboard.

## Vercel

1. Import `NTUT-Vincent/GymFlow` as a **Next.js** project; keep Output Directory at default.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   to **Settings > Environment Variables** for Production and Preview.
3. Add the production website URL to Supabase **URL Configuration** redirect allow list.
4. Redeploy to pick up environment changes. Check Preview **before merging** the PR.

No Firebase settings or service keys are required.

## Local verification

```bash
npm install
npm run lint       # TypeScript validation
npm run build
npm run dev
```

Visit http://localhost:3000; test Google login, creating a gym, booking, scheduling,
and cancellation. Without environment variables, you can test the local demo without
creating a Supabase project.

## Authorization & data consistency

- `profiles.role` is created as `member` by a database trigger. Client apps
  have no grant to edit profiles.
- RLS allows authenticated users to read gyms/equipment, members to see their own
  bookings/schedules, staff to manage equipment/assign schedules, admins to manage gyms.
- Only authenticated staff can call `commit_schedule_batch`; it validates booking
  status, gym, category, time and equipment. PostgreSQL exclusion constraint prevents
  overlapping reservations on the same equipment.
- `cancel_booking` checks ownership/staff membership and atomically deletes the
  associated schedule before returning.
- Do **not** add a Supabase service-role key to the browser or Vercel public environment.
- The frontend still runs the search algorithm; for large gyms, move compute off the
  main thread or onto a trusted backend.

## Migration from Firebase

This PR replaces **code and schema**, **not existing Firebase users or Firestore rows**.
Existing Firebase Google users will sign into Supabase as new identities (new UUIDs).
If real customer data already exists, plan a separate authenticated export/import,
map user IDs to new Supabase Auth IDs, and validate referential integrity **before**
turning off the old project. Never import Firebase credentials into a public repo.
