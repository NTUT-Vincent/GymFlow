# GymFlow Manual QA & Release Checklist

> Created: 2026-10-18. An unchecked item means **not independently verified**, not necessarily broken. Preserve the distinction between user-observed functionality and comprehensive test coverage.

## Confirmed observations (not substitutes for full E2E)

- [x] The Supabase migration PR #5 was merged into `main`.
- [x] Vercel reported successful builds for Supabase migration/mobile implementation and overflow-fix commits.
- [x] User reported a signed-in production session with "Supabase 已同步" visible.
- [x] User reported adding gyms/equipment; production homepage screenshot showed a gym with one available item.
- [x] 393px browser-device screenshot captured horizontal overflow **before** the CSS fix; fix commit `57da62e` deployed with a successful Vercel status.

## Mobile layout: pending re-test

- [ ] At 320px, 375px, 393px and 428px widths, check `document.documentElement.scrollWidth <= document.documentElement.clientWidth` on `/`, `/booking`, `/equipment`, `/schedule`, `/admin`.
- [ ] Verify no cut-off text/controls or internal grid overflows at 393px, using a fresh post-fix screenshot.
- [ ] Check the bottom navigation does not cover content or interfere with mobile browser safe-area/home indicator.
- [ ] Check right-header account menu works for both regular members and admins, is keyboard/touch accessible, and does not overflow.
- [ ] Verify booking date/time native controls and category selections at 320px and 393px.
- [ ] Check admin tab horizontal scrolling is contained inside the tabs and page does not scroll horizontally.
- [ ] Test touch actions (minimum target sizes), legibility, text zoom and both iOS Safari and Android Chrome where available.

## Database/auth/permissions: pending full E2E

- [ ] New member signs in through Google; `profiles` row exists with `role='member'`.
- [ ] Ordinary member cannot access admin mutations or staff-only RPCs (verify Supabase RLS, not merely UI).
- [ ] Admin adds gym and equipment; reload and verify persistence and correct `equipment.gym_id`.
- [ ] Member creates pending booking; verify row and own-visibility rules in `bookings`.
- [ ] Staff/admin runs optimizer; verify `commit_schedule_batch` produces valid `schedules` with `bookings.status='scheduled'`.
- [ ] Member cancels both pending and scheduled bookings; verify RPC updates and deletes assigned slot atomically.
- [ ] Two simultaneous conflicting assignments cannot overlap on the same equipment.
- [ ] Realtime/focus/read-after-write refresh works for a second signed-in session.
- [ ] Test expired session, bad network, rejected RLS and failed RPC error messages.

## Known scope limitations

- `/booking` always uses the first gym from `data.gyms[0]`.
- Admin equipment creation also uses `gyms[0]`; adding to a selected gym is not implemented.
- Gym creation currently uses fixed hours 06:00–23:00.
- Optimizer is inline synchronous with a default 180ms time budget; no Cron jobs have been enabled.
- Optimizer unit tests and broader automated integration/E2E tests are pending.
- Existing Firebase data are not automatically migrated.

## Next release discipline

- Before changing app code, read `AGENT.md`, `TODO.md`, and `PROGRESS.log`.
- Update `SPEC.md` for scope changes; update implementation docs and check TODO progress.
- After code changes, run `npm run lint`, `npm run build`, and relevant viewport/E2E tests; record actual pass/fail evidence rather than inferring it from deployment success.
- Keep `PROGRESS.log` append-only.
