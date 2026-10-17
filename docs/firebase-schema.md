# Docs — Firebase Schema

## Collections

### `users`
Document ID = Firebase Auth UID.
```ts
{
  displayName: string
  email: string
  role: 'member' | 'staff' | 'admin'   // default 'member'
  createdAt: string (ISO)
}
```

### `gyms`
```ts
{
  id: string
  name: string
  address: string
  openTime: string   // 'HH:mm'
  closeTime: string  // 'HH:mm'
  createdBy?: string // auth UID
}
```

### `equipment`
```ts
{
  id: string
  gymId: string
  name: string
  category: string   // e.g. '跑步機', '飛輪', '深蹲架', '臥推架', '滑輪機'
  zone: string
  status: 'available' | 'in_use' | 'maintenance'
  availableAt?: string (ISO)
  utilization: number // 0-100
}
```

### `bookings`
```ts
{
  id: string
  gymId: string
  memberId: string
  memberName: string
  category: string
  startAt: string (ISO)
  durationMinutes: number
  maxDelayMinutes: number
  priority: number
  status: 'pending' | 'scheduled' | 'cancelled'
  equipmentId?: string
}
```

### `schedules`
Written by the optimizer after a successful run.
```ts
{
  id: string          // 'schedule-{bookingId}'
  gymId: string
  bookingId: string
  memberId: string
  memberName: string
  equipmentId: string
  equipmentName: string
  category: string
  startAt: string (ISO)
  endAt: string (ISO)
  waitMinutes: number
}
```

## Security Notes
- No Firestore security rules are enforced in this spec; `firestore.rules` exists at repo root and should be reviewed before production.
- Queries for member-scoped bookings/schedules use `where('memberId', '==', uid)`; staff/admin read all.
