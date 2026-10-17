# Docs — Schedule Optimizer

## Location
- `lib/optimizer.ts` — core `optimizeSchedule()` algorithm (pure, synchronous)
- `lib/optimizerClient.ts` — `runOptimizer()` wrapper returning `Promise<OptimizationResult>`

## Algorithm
Greedy branch-and-bound search over pending bookings:
1. Filter bookings with `status === 'pending'`.
2. For each booking, build candidate (equipment, start time) slots within `maxDelayMinutes`, skipping:
   - equipment whose `category` doesn't match
   - equipment with `status === 'maintenance'`
   - slots starting before an `in_use` machine becomes `availableAt`
3. Order bookings by fewest candidates first, then priority desc, then start time asc.
4. DFS search assigning each booking to a non-overlapping slot, minimizing cost:
   - `baseCost = delay*6 + utilization*0.08 - priority*4`
   - fairness cost per equipment load
   - unassigned penalty = 10,000 - priority*100
5. Time-bounded (default 180ms); returns best found if timeout.

## Output
`OptimizationResult`:
- `schedules[]` — assigned `ScheduleItem`s
- `unassignedBookingIds[]` — booking IDs that couldn't be placed
- `score` — final cost (lower is better)
- `optimal` — true if search completed within time limit
- `elapsedMs` — solve time

## Client Integration
`runOptimizer(bookings, equipment)` → promise. On resolve:
- Sets `optimization` state.
- Cloud-ready: write batch sets `schedules` docs and updates `bookings` to `scheduled` with `equipmentId`.
- Local: merges schedules into state and updates booking statuses.

## Notes
- Originally a Vite web worker (`new URL(..., import.meta.url)`); replaced with inline sync call because Next.js App Router does not support that Vite worker pattern. The algorithm is fast enough for demo data sets.
