# GymFlow Product & Technical Spec

**Version:** 0.2.0 (as-built snapshot, 2026-10-18)  
**Source of truth:** `main` branch; `types.ts`, `components/GymFlowProvider.tsx`, `lib/optimizer.ts`, and `supabase/migrations/20261018000000_initial_schema.sql`.  
**Status:** Deployed MVP with working reported Google login/cloud sync and basic gym/equipment administration; full mobile and end-to-end test matrix still pending.

## Product scope and current routes

GymFlow is a gym equipment booking and scheduling MVP. Members request a category and time window; staff optimize assignments; admins maintain gyms and equipment.

| Route | Available behavior |
|---|---|
| `/` | Member homepage, next assigned session, current availability, pending count |
| `/booking` | Category, requested start time, duration (30/45/60 min), allowed delay (0/15/30/60 min), submit pending request |
| `/equipment` | Status and utilization for equipment, category filter |
| `/schedule` | Own pending and scheduled entries; cancel requests/bookings |
| `/admin` | Ops overview, per-equipment status, gym and equipment creation, manual optimizer |
| `/auth/callback` | Google OAuth PKCE authorization-code exchange |

## Current tech stack

- Next.js **15.2.8** App Router, React **19**, TypeScript **5.9**, custom CSS; hosted on Vercel.
- Supabase Google OAuth using `@supabase/ssr` and session cookies; Postgres with RLS for cloud persistence.
- `GymFlowProvider` manages auth, `member/staff/admin` role, gyms, equipment, bookings, schedules, cloud sync and toast notifications.
- Supabase Postgres Changes for ongoing refresh; focus/read-after-write refresh for fallback.
- LocalStorage demo snapshot used **only when Supabase environment variables are absent**. Existing Firebase users/data are not automatically migrated.
- No active Firebase Auth, Firestore, Docker deployment, PWA, or scheduled Cron execution is implemented in the current stack.

## Data model

- `Gym`: `id, name, address, openTime, closeTime, createdBy?`.
- `Equipment`: `id, gymId, name, category, zone, status, availableAt?, utilization`.
- `Booking`: `id, gymId, memberId, memberName, category, startAt, durationMinutes, maxDelayMinutes, priority, status, equipmentId?`.
- `ScheduleItem`: `id, gymId, bookingId, memberId, memberName, equipmentId, equipmentName, category, startAt, endAt, waitMinutes`.
- `OptimizationResult`: `schedules, unassignedBookingIds, score, optimal, elapsedMs`.
- PostgreSQL tables: `profiles`, `gyms`, `equipment`, `bookings`, `schedules`.
- Values: roles `member/staff/admin`; equipment status `available/in_use/maintenance`; booking status `pending/scheduled/cancelled`.
- SQL migration is authoritative for schema/constraints/RLS/RPCs; see `docs/supabase-schema.md`.

## Auth and role-based capabilities

- Authenticated members can view gyms/equipment, create their own pending bookings, read their own bookings/schedules, and cancel via `cancel_booking`.
- Staff/admin can manage equipment and commit optimizer assignments via `commit_schedule_batch`.
- Admins can create/edit/delete gyms according to RLS. The UI currently exposes gym creation, not full editing/deletion controls.
- Frontend route/menu visibility is supplementary; actual authorization is enforced by PostgreSQL grants, RLS, and RPC validation.
- The public client has no `service_role` credential.

## Optimizer and persistence

- `lib/optimizer.ts` performs synchronous depth-first branch-and-bound candidate assignment, accounting for gym/category, equipment status/availability, requested time/delay/duration, existing scheduled intervals, priority, waiting cost, fairness and unassigned penalties.
- Defaults: 15-minute candidate slots, 180ms search budget; `optimal` currently reflects `!timedOut`.
- Trigger: staff manually clicks "執行最佳化排程" in `/admin`.
- In cloud mode, validated assignments go through atomic `commit_schedule_batch` PostgreSQL RPC. A constraint prevents equipment time overlap. Cancellation uses atomic `cancel_booking` RPC.
- No background worker, Edge Function, Vercel Cron, Supabase Cron, or automatic rerun is active. Cron was considered and explicitly deferred.

## Mobile UI

- <=760px: fixed four-item bottom navigation with safe-area spacing; role-aware mobile account menu; compact homepage; touch-friendly category buttons and fields; schedule cards; stacked admin views.
- <=360px: reduced horizontal padding.
- Intrinsic Grid widths/viewport width overflow were corrected in CSS commit `57da62e`.
- **Post-fix screenshot/real-device acceptance remains pending**, including the reported 393px viewport overflow. See `docs/mobile-ui.md` and `docs/qa-checklist.md`.

## As-built limits and follow-up scope

- Member booking always targets the first gym (`gyms[0]`) rather than a user-chosen location.
- New equipment is also assigned to the first gym; no gym selector.
- Gym creation currently stores fixed operating hours 06:00–23:00.
- Search runs inline on the UI thread; larger load performance/optimality needs tests.
- Multi-user RLS/RPC and full booking→optimization→cancel flow are not yet independently verified.
- No automatic Firebase data migration.
- Deferred: Cron automation, unit tests, worker/off-main-thread compute, route loading/error states, SEO files, PWA, formatting/lint tooling, optional Dockerfile.

## Documentation index

- `README.md` — introduction, setup and quick links.
- `docs/architecture.md` — app modules, data flow, roles, current limits.
- `docs/supabase-schema.md` — PostgreSQL tables, RLS and RPC contracts.
- `docs/optimizer.md` — solver implementation and commit sequence.
- `docs/deployment.md` — production environment and Vercel/Supabase setup.
- `docs/mobile-ui.md` — responsive layout implementation and overflow incident.
- `docs/qa-checklist.md` — verified observations vs. pending acceptance.
- `TODO.md` and `PROGRESS.log` — upcoming work and append-only history.
