# GymFlow Supabase Schema & Authorization

> Updated: 2026-10-18. Implementation source: `supabase/migrations/20261018000000_initial_schema.sql`. Do not edit production rows by guessing UUIDs.

## Tables

| Table | Key fields | Purpose |
|---|---|---|
| `profiles` | `id` (Auth user UUID), `email`, `display_name`, `role` | Member/staff/admin identity and role |
| `gyms` | `id`, `name`, `address`, `open_time`, `close_time`, `created_by` | Gym locations |
| `equipment` | `id`, `gym_id`, `name`, `category`, `zone`, `status`, `available_at`, `utilization` | Inventory |
| `bookings` | `id`, `gym_id`, `member_id`, `category`, `start_at`, `duration_minutes`, `max_delay_minutes`, `priority`, `status`, `equipment_id` | Requests and assignments |
| `schedules` | `id` (text), `booking_id` (unique), `equipment_id`, `member_id`, `start_at`, `end_at`, `wait_minutes` | Actual assigned equipment time |

Types, constraints, relationships and indexes are defined in the migration; `types.ts` and `lib/supabase/mappers.ts` define the application representation.

## Roles and RLS

- `member` (default): read own profile, gyms/equipment, own bookings and schedules; create own pending bookings; cancel own booking using RPC.
- `staff`: read staff-visible profiles/bookings/schedules, create/edit equipment, run optimizer/commit RPC, cancel bookings when permitted.
- `admin`: staff permissions plus gym creation/edit/deletion.
- Auth trigger `handle_new_user` inserts an initial `profiles` row with `member` role; browsers do not get profile role update permission.
- RLS enabled on all five application tables. SQL policies/grants rather than frontend presentation determine actual access.
- Anonymous browser clients have no table grants. In Supabase-configured mode, logging out does not switch to the demo database.

## Transactional RPC functions

- `cancel_booking(p_booking_id uuid)`: verifies authorization, sets `status='cancelled'`, clears `equipment_id`, and removes the assigned schedule.
- `commit_schedule_batch(p_schedules jsonb)`: requires staff/admin, validates pending booking and equipment/time eligibility and atomically inserts schedules and updates booking statuses.
- `is_staff()`, `is_admin()`: helper authorization checks.
- Exclusion constraint `schedules_no_equipment_overlap` prevents overlapping time ranges on the same equipment.

## SQL Editor read-only diagnostics

```sql
-- All gyms (SQL Editor runs with elevated dashboard permissions)
select id, name, address, open_time, close_time
from public.gyms
order by name;

-- Equipment and owning gym
select g.name as gym_name, e.id, e.name as equipment_name,
       e.category, e.zone, e.status, e.utilization
from public.equipment e
join public.gyms g on g.id = e.gym_id
order by g.name, e.name;

-- Booking / schedule verification
select b.id, b.member_id, b.status, b.start_at,
       s.equipment_name, s.start_at as assigned_start, s.end_at
from public.bookings b
left join public.schedules s on s.booking_id = b.id
order by b.start_at desc;
```

To grant admin privileges to a trusted account, first verify the `profiles.id`/email in SQL Editor, then make a narrowly scoped update; never place SQL Editor/admin credentials in client code or docs.

## Realtime

Migration adds `gyms`, `equipment`, `bookings`, `schedules` to the `supabase_realtime` publication. Browser provider subscribes to row changes and also refreshes on focus and after writes. Realtime delivery is best-effort from the UI perspective; functional verification is still needed.

## Deployment state

User reported successfully configuring Supabase, applying the SQL, enabling Google OAuth, and signing into the production site. The app displayed cloud sync and a gym/equipment entry was visible. These observations do **not** establish that all RLS/RPC and multi-user flows have passed tests.

## Future migrations

Preserve existing data; add incremental schema migration files rather than rerunning the initial `create table` script on a populated project. Test RLS and RPC changes using member, staff and admin accounts.
