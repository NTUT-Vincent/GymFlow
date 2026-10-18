# Todo — GymFlow

## Done
- [x] Convert Vite project to Next.js App Router
- [x] Migrate all pages and components
- [x] Migrate Firebase client to Next.js env vars
- [x] Replace Vite web worker optimizer with inline sync client
- [x] Migrate styles to app/globals.css
- [x] Create GymFlowProvider context
- [x] Production build passes for all routes
- [x] Verify dev server renders app correctly
- [x] Create AGENT.md, SPEC.md, PROGRESS.log, TODO.md, docs/

## Todo
- [ ] Add Firebase Auth middleware / route protection
- [ ] Write unit tests for optimizer (vitest/jest)
- [ ] Add server actions for optimizer (move off client)
- [ ] Add loading.tsx / error.tsx per route
- [ ] Add sitemap.ts and robots.ts
- [x] Prepare Vercel deployment config and README instructions
- [ ] Connect repository in Vercel and verify production deployment
- [ ] Add PWA manifest + service worker (was in Vite)
- [ ] Add Prettier config and validate lint
- [ ] Add Dockerfile for deployment
