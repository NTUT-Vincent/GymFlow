# Spec — GymFlow

## Stack
- Next.js 15 (App Router), React 19, TypeScript
- Firebase Auth + Firestore (demo mode: `localStorage` fallback)
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

## Firestore Collections
- `gyms`
- `equipment`
- `bookings`
- `schedules`
- `users` (displayName, email, role, createdAt)

## Key Behaviors
- Auth: Google sign-in via Firebase popup; role resolved from `/users/{uid}` doc (default `member`)
- Cloud-ready: when Firebase config is present and user signed in, data syncs to Firestore; otherwise `localStorage` demo mode
- Optimizer: client-side synchronous scheduling algorithm; writes `schedules` + updates `bookings` to `scheduled` when cloud-ready
- Admin gates: admin tab only accessible for `staff`/`admin` roles (or demo mode)
- Demo data: seeded from `data/demo.ts`; reset via "還原示範" button

## Navigation
Next.js `<Link>` client-side navigation between `/`, `/booking`, `/equipment`, `/schedule`, `/admin`.
