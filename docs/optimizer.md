# GymFlow Schedule Optimizer

> Updated: 2026-10-18. The legacy Firestore batch-write description has been replaced with the current Supabase RPC implementation.

## Code and execution

- `lib/optimizer.ts`: pure synchronous `optimizeSchedule(bookings, equipment, options, existingSchedules)`.
- `lib/optimizerClient.ts`: asynchronous-compatible wrapper `runOptimizer(...)` returning `Promise.resolve(optimizeSchedule(...))`.
- `components/GymFlowProvider.tsx`: `optimize()` orchestration.
- `components/AdminDashboard.tsx`: manual "執行最佳化排程" action and result summary.
- Execution remains **in the browser/main thread**, not a server action, worker, API route, Edge Function or Cron job.

## Algorithm as implemented

1. Filter pending bookings; choose equipment in the same gym and category, excluding maintenance equipment.
2. Enumerate candidate start times in default 15-minute increments from requested time through `maxDelayMinutes`. For `in_use` equipment, honor `availableAt`.
3. Sort pending bookings by fewest candidates, then priority descending, then requested start time.
4. Depth-first branch-and-bound search: assign nonoverlapping candidate intervals, or leave a booking unassigned with a penalty.
5. Existing assigned schedule intervals are preloaded to prevent duplicate use of equipment.
6. Candidate base cost = `delayMinutes * 6 + utilization * 0.08 - priority * 4`; repeat use of one machine adds `5 * (current search load)`; unassigned penalty = `10000 - priority * 100`.
7. Default time budget: 180ms. Results contain `schedules`, `unassignedBookingIds`, `score` (lower is better), `optimal` (currently `!timedOut`) and `elapsedMs`.

The `optimal` field means the code did not hit its deadline; the completeness/optimality claim and branch pruning should still have automated test coverage before relying on it for high-stakes allocation.

## Cloud commit sequence

1. Provider collects pending `bookings`, current `equipment`, and non-cancelled existing `schedules`.
2. Browser runs `runOptimizer`.
3. For Supabase mode, staff/admin calls `client.rpc('commit_schedule_batch', { p_schedules: [...] })` when the result includes assignments.
4. PostgreSQL locks/validates relevant booking rows, checks equipment category/gym/status and time-window requirements, inserts schedules, and updates corresponding bookings in **one transaction**.
5. A GiST exclusion constraint on `schedules` prohibits overlapping assigned time ranges for one equipment ID. Errors are surfaced to the UI; provider refreshes after successful commit.
6. In local demo mode, React state and `localStorage` are updated directly without Supabase RPC.

## Known limitations / QA

- Synchronous search has a fixed execution budget and may affect UI responsiveness with larger gym demand.
- Booking and equipment management currently use the first gym, so multi-gym UX is incomplete.
- No periodic optimization, event-driven worker, or automatic retry is implemented.
- Unit tests and integration tests for ties, fairness, concurrency, stale booking state, unassignable requests, and `optimal` semantics remain TODO.
- Validate the manual optimizer + database RPC on production/staging with appropriately disposable test reservations before marking the workflow verified.

See `supabase/migrations/20261018000000_initial_schema.sql` and `docs/supabase-schema.md`.
