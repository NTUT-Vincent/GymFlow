# Docs — Deployment

## Local Development
```bash
npm install
npm run dev      # http://localhost:3000
```

## Production Build
```bash
npm run build
npm start        # http://localhost:3000 (production server)
```

## Environment Variables
Copy `.env.example` to `.env.local` (dev) or set on your host (prod):
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```
All values are `NEXT_PUBLIC_*` because Firebase config is read on the client.

## Deploy Targets

### Vercel (Recommended for Next.js)
1. Connect GitHub repo to Vercel.
2. Add the `NEXT_PUBLIC_FIREBASE_*` env vars in Project Settings.
3. Deploy on push to main.

### Firebase Hosting
1. Ensure `firebase.json` is configured for the `public` directory (Next.js `out/` if using `output: 'export'`, or use Firebase Hosting + Next.js integration).
2. `npm run build` then `firebase deploy`.

## Static Export
Next.js App Router pages are prerendered as static content by default. If you need `next export`, add `output: 'export'` to `next.config.ts` (note: some App Router features may not work).

## Firebase Security
Review `firestore.rules` and `firestore.indexes.json` before enabling production Firestore access. The app reads/writes `gyms`, `equipment`, `bookings`, `schedules`, and `users`.

## Notes
- `tsconfig.json` has `typescript.ignoreBuildErrors: true` in `next.config.ts` to keep builds unblocked during migration; consider enabling strict type checks in `next build` later.
- The app works in demo/localStorage mode without Firebase configured.
