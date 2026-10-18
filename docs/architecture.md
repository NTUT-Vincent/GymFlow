# GymFlow Architecture

> Updated: 2026-10-18. This document replaces the obsolete Firebase/Firestore architecture description. Source of truth: current `main` code.

## Stack and deployment

- Next.js 15.2.8 App Router, React 19, TypeScript 5, custom CSS (no Tailwind).
- Vercel hosts the Next.js site: https://gym-flow-iota.vercel.app/.
- Supabase Auth with Google OAuth and PKCE; PostgreSQL with RLS for cloud data.
- Demo fallback: React state plus browser `localStorage` **only when Supabase public environment variables are absent**. Demo rows are not automatically uploaded into Supabase.
- There is no Firebase client, Firestore store, or active Firebase deployment path in the current application.
- Automated Cron/recurring optimizer execution is **not implemented**; the decision was to defer it.

## Routes and principal modules

| Path | Module | Responsibility |
|---|---|---|
| `/` | `app/page.tsx`, `MemberHome` | Homepage, next training slot, equipment overview |
| `/booking` | `app/booking/page.tsx`, `BookingPage` | Submit pending booking request |
| `/equipment` | `app/equipment/page.tsx`, `EquipmentPage` | Equipment list, status, category filter |
| `/schedule` | `app/schedule/page.tsx`, `SchedulePage` | Member's pending/assigned bookings and cancellation |
| `/admin` | `app/admin/page.tsx`, `AdminDashboard` | Operations metrics, gyms, equipment, manual optimization |
| `/auth/callback` | `app/auth/callback/route.ts` | Exchange Google OAuth authorization code for Supabase session |

- `app/layout.tsx` mounts `GymFlowProvider`.
- `components/GymFlowProvider.tsx`: shared React Context, Supabase session, role, data reads/writes, subscriptions, demo fallback, optimizer invocation, notifications.
- `lib/supabase/client.ts`: Supabase SSR browser client using public URL/publishable key and cookies.
- `lib/supabase/mappers.ts`: snake_case PostgreSQL rows to camelCase domain models.
- `lib/optimizer.ts`: synchronous branch-and-bound scheduling algorithm.
- `lib/optimizerClient.ts`: promise-returning wrapper around inline optimizer.
- `supabase/migrations/20261018000000_initial_schema.sql`: PostgreSQL schema, grants, RLS, trigger, RPCs, Realtime publication.
- `types.ts`: `Gym`, `Equipment`, `Booking`, `ScheduleItem`, `OptimizationResult` and union types.

## Authentication and cloud data flow

1. Frontend initiates `supabase.auth.signInWithOAuth({ provider: 'google' })`; the browser redirects through Supabase/Google.
2. `/auth/callback` exchanges the OAuth `code` for a session and sets response cookies.
3. `GymFlowProvider` calls `auth.getUser()`, reads `profiles.role`, and loads gyms/equipment plus role-appropriate bookings/schedules.
4. `cloudReady` is set only after those initial data reads succeed. The display "Supabase 已同步" indicates this initialized/synced state; it does not prove every possible mutation is correct.
5. Subsequent updates use Supabase Postgres Changes on four tables with browser focus refresh and read-after-write refresh.
6. Without configured Supabase variables, local demo data is read/saved from `localStorage`; when configured, anonymous users do not automatically fall back to demo data.

## Mutations and authorization

- Create gym: direct `gyms.insert`, administrator RLS gate.
- Create/update equipment: `equipment.insert/update`, staff/admin RLS gate.
- Create booking: `bookings.insert` with pending status and current authenticated `member_id`; RLS enforces ownership/fields.
- Cancel booking: `cancel_booking` RPC checks ownership/staff and removes any assigned schedule atomically.
- Manual optimize: `runOptimizer(pending, equipment, activeSchedules)` executes on browser main thread. Staff/admin commits assignments via `commit_schedule_batch` RPC. Server validates and applies them transactionally; overlapping equipment intervals are rejected by the PostgreSQL exclusion constraint.
- RLS and server-side RPCs, **not** the conditional UI menu, are the authorization boundary.

## Current limitations

- `app/booking/page.tsx` selects `data.gyms[0]` as the booking gym; members cannot explicitly choose among multiple gyms.
- `EquipmentManagement` assigns new equipment to `gyms[0]`; no gym selector yet.
- The gym creation form currently submits fixed operating hours 06:00–23:00; the displayed time fields are read-only.
- Optimizer runs inline and can affect UI responsiveness for larger search spaces; its default time budget is 180ms.
- No automatic/periodic scheduler is enabled.
- Production Google sign-in and data sync have been user-observed, and at least one gym/equipment item was visible. Full admin/member/RPC end-to-end test results remain unverified.
- The 393px overflow screenshot prompted CSS fixes on 2026-10-18, but **post-fix viewport/device acceptance remains unverified**.

See `SPEC.md`, `docs/supabase-schema.md`, `docs/optimizer.md`, `docs/mobile-ui.md` and `docs/qa-checklist.md`.
