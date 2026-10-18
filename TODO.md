# Todo — GymFlow

> Updated 2026-10-18. Status reflects implementation vs. verification separately. Checkboxes marked done mean the named work was implemented or user-reported, not that every scenario has passed E2E tests.

## ✅ Done / implemented

- [x] Convert Vite project to Next.js 15 App Router with React 19 and TypeScript.
- [x] Migrate member pages, admin dashboard and custom CSS; add `GymFlowProvider`.
- [x] Replace Firebase Auth/Firestore integration with Supabase Auth + PostgreSQL/RLS; merge PR #5 to `main`.
- [x] Implement Google OAuth PKCE callback and role-gated admin route.
- [x] Add schema/trigger/RLS, `cancel_booking` and transactional `commit_schedule_batch` RPCs.
- [x] Reuse optimizer as inline synchronous client-side module (no Vite web worker).
- [x] Add Supabase Postgres Changes refresh, read-after-write refresh, and localStorage demo fallback.
- [x] Set up production Supabase, Google OAuth and Vercel environment according to the user; sign-in and cloud-sync indicator observed in the production site.
- [x] Basic admin-created gym and equipment reported; a gym and one available equipment item appeared in production UI.
- [x] Add responsive mobile account/admin menu, accessible member bottom navigation, touch targets, mobile booking controls, schedule cards and mobile admin styles.
- [x] Commit CSS mitigation for horizontal mobile overflow (responsive Grid `minmax(0, ...)`, constrained widths, wrapping, clipping).
- [x] Configure Vercel deploy + GitHub Actions TypeScript/`next build` CI; builds of referenced implementation commits reported successful.
- [x] Establish `AGENT.md`, `SPEC.md`, `TODO.md`, `PROGRESS.log` and detailed `docs/` documentation.

## 🔎 In progress / verification required

- [ ] Re-test reported mobile page-width overflow **after** the fix, including 320px/375px/393px widths and all member/admin screens.
- [ ] Verify mobile navigation, account menu, text legibility, input focus, safe-area and accessibility using real-device or device-emulation checks.
- [ ] Perform complete Supabase production/staging E2E: new member profile, staff/admin RLS, gym/equipment CRUD, pending booking, optimizer RPC, cancellation, realtime.
- [ ] Test concurrent/conflicting bookings and DB constraint behavior.
- [ ] Confirm current documentation-only commits have finished deploying if relevant to release tracking.

## 📌 Backlog / not yet implemented

- [ ] Add explicit gym selection to member booking (currently `gyms[0]`).
- [ ] Add gym selection when creating equipment (currently `gyms[0]`).
- [ ] Make gym opening/closing hours editable rather than read-only 06:00–23:00.
- [ ] Write optimizer unit tests (time windows, priorities, fairness, overlap, `optimal` semantics); add RLS/RPC integration tests.
- [ ] Move CPU-heavy optimization off the browser main thread when needed for scale.
- [ ] Add route-level loading/error handling (`loading.tsx`, `error.tsx`).
- [ ] Add sitemap and robots files when public SEO becomes relevant.
- [ ] Add PWA manifest/service worker if mobile offline/install support is desired.
- [ ] Add Prettier and explicit ESLint configuration/validation (current `npm run lint` is `tsc --noEmit`).
- [ ] Add Dockerfile only if a non-Vercel deployment path is required.
- [ ] Plan a separate Firebase data migration only if real legacy data must be retained.

## ⏸ Deferred by product decision

- [ ] Automatic recurring optimization via Supabase Cron/Edge Functions or Vercel Cron. **Do not implement until requested.** Current flow remains manual.

## References

- Product and scope: `SPEC.md`
- Engineering instructions: `AGENT.md`
- Current architecture: `docs/architecture.md`
- Supabase details: `docs/supabase-schema.md`
- Test coverage: `docs/qa-checklist.md`
- Historical record: `PROGRESS.log`
