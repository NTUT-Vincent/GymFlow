# Spec — GymFlow

## Stack
- Next.js 15 (App Router), React 19, TypeScript
- Supabase Auth + PostgreSQL (RLS) (demo mode: `localStorage` fallback)
- Custom CSS (no Tailwind; migrated from original `styles.css`)
- Build: `npx next build` / `npx next dev`

## Routes
| Route | Shell | Description |
|-------|-------|-------------|
| `/` | MemberShell | Member home: hero, next session, stats, available equipment preview |
| `/booking` | MemberShell | Booking form: category, start time, duration, max delay, gym |
| `/equipment` | MemberShell | Live equipment status grid with category filter |
| `/schedule` | MemberShell | Member timeline: pending bookings + scheduled sessions with cancel |
| `/admin` | AdminShell | Admin dashboard: stats, optimizer, gym management, equipment management |

## Data Model
See `types.ts` for full TypeScript interfaces.

Core entities:
- `Gym` — id, name, address, openTime, closeTime, createdBy
- `Equipment` — id, gymId, name, category, zone, status, availableAt?, utilization
- `Booking` — id, gymId, memberId, memberName, category, startAt, durationMinutes, maxDelayMinutes, priority, status, equipmentId?
- `ScheduleItem` — id, gymId, bookingId, memberId, memberName, equipmentId, equipmentName, category, startAt, endAt, waitMinutes
- `OptimizationResult` — schedules, unassignedBookingIds, score, optimal, elapsedMs

Roles: `member` \| `staff` \| `admin`
Equipment status: `available` \| `in_use` \| `maintenance`
Booking status: `pending` \| `scheduled` \| `cancelled`

## Supabase Tables
- `profiles` (Auth user ID, name, email, role)
- `gyms`
- `equipment`
- `bookings`
- `schedules`

Source of truth: `supabase/migrations/20261018000000_initial_schema.sql`.

## Key Behaviors
- Auth: Google OAuth with PKCE callback; role resolved from `profiles` (default `member`)
- Cloud-ready: when Supabase config is present and user signed in, data syncs to PostgreSQL; otherwise `localStorage` demo mode
- Optimizer: client-side synchronous scheduling algorithm; atomically commits `schedules` + `bookings` using `commit_schedule_batch` RPC
- Admin gates: back-office UI and PostgreSQL RLS/RPC restrict staff/admin operations; no service_role in browser
- Demo data: localStorage fallback only when Supabase environment variables are absent. No automatic Firebase data migration.

## Navigation
Next.js `<Link>` client-side navigation between `/`, `/booking`, `/equipment`, `/schedule`, `/admin`.

## Responsive Mobile UI
- The member view uses a fixed four-item bottom navigation on narrow screens (760px and below), with safe-area inset padding.
- Mobile headers provide an account menu with member navigation and staff/admin navigation only when the user has permission.
- The booking form has touch-sized equipment category choices and vertically stacked fields.
- The schedule timeline becomes vertically stacked cards on small screens.
- Mobile and desktop layout containers use shrinkable CSS grid tracks and constrained widths to avoid horizontal page overflow.
- Device-level viewport/screenshot validation remains pending; see `TODO.md` and `docs/mobile-ui.md`.
