export type Role = 'member' | 'staff' | 'admin'
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance'
export type BookingStatus = 'pending' | 'scheduled' | 'cancelled'

export interface Gym {
  id: string
  name: string
  address: string
  openTime: string
  closeTime: string
  createdBy?: string
}

export interface Equipment {
  id: string
  gymId: string
  name: string
  category: string
  zone: string
  status: EquipmentStatus
  availableAt?: string
  utilization: number
}

export interface Booking {
  id: string
  gymId: string
  memberId: string
  memberName: string
  category: string
  startAt: string
  durationMinutes: number
  maxDelayMinutes: number
  priority: number
  status: BookingStatus
  equipmentId?: string
}

export interface ScheduleItem {
  id: string
  gymId: string
  bookingId: string
  memberId: string
  memberName: string
  equipmentId: string
  equipmentName: string
  category: string
  startAt: string
  endAt: string
  waitMinutes: number
}

export interface OptimizationResult {
  schedules: ScheduleItem[]
  unassignedBookingIds: string[]
  score: number
  optimal: boolean
  elapsedMs: number
}
