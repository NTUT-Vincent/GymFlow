import type { Booking, Equipment } from '../types'
import { optimizeSchedule } from '../lib/optimizer'

self.onmessage = (event: MessageEvent<{ bookings: Booking[]; equipment: Equipment[] }>) => {
  const result = optimizeSchedule(event.data.bookings, event.data.equipment, { timeLimitMs: 450 })
  self.postMessage(result)
}
