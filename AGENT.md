# Agent Instructions — GymFlow (Next.js)

This file tells coding agents how to track progress on this project by writing spec, docs, log, and todo files to disk. Follow these conventions for every work session.

## Project Overview

GymFlow is a gym booking / equipment scheduling app rebuilt on **Next.js 15 (App Router)** with **React 19**, **TypeScript**, **Tailwind-free custom CSS**, and **Firebase** (Auth + Firestore) with a `localStorage` demo fallback.

Key areas:
- Member views: home, booking, equipment status, schedule
- Admin view: dashboard, gym management, equipment management, schedule optimizer
- Core lib: Firebase client, schedule optimizer (was a Vite web worker; now inline sync), demo data

## Tracking Files

Agents must maintain these files under the project root. Create them if they do not exist.

| File | Path | Purpose |
|------|------|---------|
| Spec | `SPEC.md` | Product/technical specification of what is being built |
| Docs | `docs/` directory | Implementation notes, architecture decisions, API references |
| Log | `PROGRESS.log` | Chronological record of completed work sessions |
| Todo | `TODO.md` | Actionable task list with status (todo / in-progress / done) |

## When to Write/Update

1. **At the start of a session:** Read `TODO.md` and `PROGRESS.log` to understand context.
2. **Before implementing a feature:** Update `SPEC.md` (if scope changes) and add tasks to `TODO.md`.
3. **During implementation:** Mark tasks `in-progress` in `TODO.md`; append notes to `PROGRESS.log`.
4. **After completing a task:** Mark it `done` in `TODO.md`; append a summary line to `PROGRESS.log`; add implementation details to `docs/` if non-trivial.
5. **At the end of a session:** Ensure `TODO.md`, `PROGRESS.log`, and `SPEC.md` reflect the current state.

## File Conventions

### `TODO.md`

Use Markdown checkboxes. Prefix status with emoji:

```markdown
# Todo — GymFlow

## In Progress
- [ ] Migrate optimizer worker to server action (next)

## Todo
- [ ] Add Firebase Auth middleware route
- [ ] Write unit tests for optimizer

## Done
- [x] Convert Vite project to Next.js App Router
- [x] Migrate all pages and components
- [x] Production build passes
```

### `PROGRESS.log`

Append-only chronological log. Format: `[YYYY-MM-DD] <summary>` followed by bullets.

```markdown
# Progress Log — GymFlow

## 2026-10-17
- Converted Vite + React SPA to Next.js 15 App Router
- Migrated src/ to app/, components/, lib/, data/, types.ts
- Added GymFlowProvider context replacing useGymFlowData hook
- Production build passes for all 6 routes (/ , /booking, /equipment, /schedule, /admin)
```

### `SPEC.md`

Keep this short and versioned. Include: tech stack, routes, data model, Firebase collections, key behaviors.

```markdown
# Spec — GymFlow

## Stack
- Next.js 15 (App Router), React 19, TypeScript
- Firebase Auth + Firestore (demo mode: localStorage)
- Custom CSS (no Tailwind)

## Routes
- `/` Member home
- `/booking` Member booking form
- `/equipment` Equipment status
- `/schedule` Member schedule
- `/admin` Admin dashboard (gym/equipment mgmt, optimizer)

## Data Model
See `types.ts`. Firestore collections: gyms, equipment, bookings, schedules, users.

## Key Behaviors
- Optimizer runs client-side (sync), writes schedules to Firestore when cloud-ready
- Role-based access: member / staff / admin
```

### `docs/`

Create one file per significant topic, e.g.:
- `docs/architecture.md`
- `docs/firebase-schema.md`
- `docs/optimizer.md`
- `docs/deployment.md`

## Agent Workflow Rules

- Do **not** delete or overwrite existing `SPEC.md`, `TODO.md`, `PROGRESS.log`, or `docs/` files without reason.
- Prefer appending to `PROGRESS.log` over editing past entries.
- If you refactor code, update `docs/` and `SPEC.md` to match before marking related todos done.
- When in doubt about the current state, read `TODO.md` first, then `PROGRESS.log`, then inspect the code.

## Example Session

```
1. Read TODO.md -> find "Convert optimizer to server action" marked [ ]
2. Read SPEC.md -> confirm optimizer behavior
3. Implement server action in app/admin/actions.ts
4. Edit TODO.md: change [ ] to [x]
5. Append to PROGRESS.log: "2026-10-17 - Added optimizer server action"
6. Add docs/optimizer.md describing server action flow
```
