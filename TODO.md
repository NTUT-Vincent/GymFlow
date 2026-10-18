# Todo — GymFlow

## Done
- [x] Improve mobile member/admin navigation, booking touch targets, and schedule card layout (2026-10-18)
- [x] Fix horizontal mobile overflow by correcting grid min-width and viewport sizing (2026-10-18)
- [x] Convert Vite project to Next.js App Router
- [x] Migrate all pages and components
- [x] Replace Firebase Auth / Firestore with Supabase Auth + PostgreSQL + RLS (PR)
- [x] Replace Vite web worker optimizer with inline sync client
- [x] Migrate styles to app/globals.css
- [x] Create GymFlowProvider context
- [x] Production build passes for all routes
- [x] Verify dev server renders app correctly
- [x] Create AGENT.md, SPEC.md, PROGRESS.log, TODO.md, docs/

## Todo
- [ ] Visually validate the latest responsive changes on 320px, 375px and 393px mobile viewports, including the admin view
- [x] Add Supabase Google OAuth callback and RLS-backed staff/admin checks
- [ ] Write unit tests for optimizer (vitest/jest)
- [x] Add atomic database RPC to commit optimizer results
- [ ] Move compute-heavy optimizer off the main thread
- [ ] Add loading.tsx / error.tsx per route
- [ ] Add sitemap.ts and robots.ts
- [x] Prepare Vercel deployment config and README instructions
- [ ] Create Supabase project, apply SQL migration, enable Google OAuth, set Vercel env vars and verify Preview deployment
- [ ] Migrate existing Firebase data if needed (not automatic)
- [ ] Add PWA manifest + service worker (was in Vite)
- [ ] Add Prettier config and ESLint validation
- [ ] Add Dockerfile for deployment
