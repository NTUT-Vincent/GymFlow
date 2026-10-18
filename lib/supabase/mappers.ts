import type { Booking, Equipment, Gym, ScheduleItem } from '@/types'

// Keep UI/domain types in camelCase, while PostgreSQL uses conventional snake_case.
export const toGym = (row: any): Gym => ({
  id: row.id,
  name: row.name,
  address: row.address,
  openTime: row.open_time,
  closeTime: row.close_time,
  createdBy: row.created_by ?? undefined,
})

export const toEquipment = (row: any): Equipment => ({
  id: row.id,
  gymId: row.gym_id,
  name: row.name,
  category: row.category,
  zone: row.zone,
  status: row.status,
  availableAt: row.available_at ?? undefined,
  utilization: row.utilization,
})

export const toBooking = (row: any): Booking => ({
  id: row.id,
  gymId: row.gym_id,
  memberId: row.member_id,
  memberName: row.member_name,
  category: row.category,
  startAt: row.start_at,
  durationMinutes: row.duration_minutes,
  maxDelayMinutes: row.max_delay_minutes,
  priority: row.priority,
  status: row.status,
  equipmentId: row.equipment_id ?? undefined,
})

export const toSchedule = (row: any): ScheduleItem => ({
  id: row.id,
  gymId: row.gym_id,
  bookingId: row.booking_id,
  memberId: row.member_id,
  memberName: row.member_name,
  equipmentId: row.equipment_id,
  equipmentName: row.equipment_name,
  category: row.category,
  startAt: row.start_at,
  endAt: row.end_at,
  waitMinutes: row.wait_minutes,
})
