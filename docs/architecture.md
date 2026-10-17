# Docs — Architecture

## Overview
GymFlow is a Next.js 15 App Router application. All pages are client components (`'use client'`) because they rely on Firebase Auth state, localStorage, and browser APIs. Data is managed centrally through `GymFlowProvider` (React Context) and synced to Firestore when cloud-ready.

## Directory Layout
```
app/
  layout.tsx          # Root layout + GymFlowProvider
  globals.css         # Global styles (migrated from styles.css)
  page.tsx            # /  (member home)
  booking/page.tsx    # /booking
  equipment/page.tsx  # /equipment
  schedule/page.tsx   # /schedule
  admin/page.tsx      # /admin
components/
  GymFlowProvider.tsx # Context provider: data, auth, optimizer, toast/notify
  Header.tsx          # Top bar: brand, mode switch, account
  Sidebar.tsx         # Member sidebar navigation
  MemberShell.tsx     # Member layout shell (workspace + sidebar)
  AdminShell.tsx      # Admin layout shell
  MemberHome.tsx      # Home page content
  BookingPage.tsx     # Booking form
  EquipmentPage.tsx   # Equipment status grid
  SchedulePage.tsx    # Member schedule timeline
  AdminDashboard.tsx  # Admin dashboard (stats, optimizer, tabs)
  EquipmentCard.tsx   # Shared equipment card
  Doodle.tsx          # Decorative span
  EmptyState.tsx      # Empty state card
  NavButton.tsx       # Nav link button
lib/
  firebase.ts         # Firebase app/auth/firestore init + signIn/logout
  optimizer.ts        # Schedule optimization algorithm
  optimizerClient.ts  # Wrapper: runs optimizer, returns Promise
  utils.ts            # time, dateLabel, statusLabel, statusIcon helpers
data/
  demo.ts             # Demo gyms, equipment, bookings, schedules, categories
types.ts              # Shared TypeScript types
```

## State Flow
1. `GymFlowProvider` mounts → reads `localStorage` snapshot or demo fallback.
2. If Firebase configured → `onAuthStateChanged` listener resolves user role from `/users/{uid}`, then attaches `onSnapshot` listeners to `gyms`, `equipment`, `bookings`, `schedules` (scoped by `memberId` for non-staff).
3. Writes (addGym, addEquipment, addBooking, updateEquipmentStatus, cancelBooking, optimize) write to Firestore when cloud-ready, otherwise update React state + `localStorage`.
4. `toast`/`notify` lives in context; any component can call `data.notify(message)`.

## Mode Switch
- `member` → `MemberShell` (sidebar + main content)
- `admin` → `AdminShell` (admin dashboard only)
- Admin access is gated: only `staff`/`admin` roles (or demo mode when Firebase not configured).
