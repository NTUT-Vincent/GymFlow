import { describe, expect, it } from 'vitest'
import type { Booking, Equipment } from '../types'
import { optimizeSchedule } from './optimizer'

const equipment: Equipment[] = [
  { id: 'rack-a', gymId: 'gym', name: '深蹲架 A', category: '深蹲架', zone: 'A', status: 'available', utilization: 80 },
  { id: 'rack-b', gymId: 'gym', name: '深蹲架 B', category: '深蹲架', zone: 'A', status: 'available', utilization: 20 },
  { id: 'rack-c', gymId: 'gym', name: '維修中', category: '深蹲架', zone: 'A', status: 'maintenance', utilization: 0 },
]

const booking = (id: string, startAt: string): Booking => ({
  id,
  gymId: 'gym',
  memberId: id,
  memberName: id,
  category: '深蹲架',
  startAt,
  durationMinutes: 30,
  maxDelayMinutes: 30,
  priority: 1,
  status: 'pending',
})

describe('optimizeSchedule', () => {
  it('不會把預約分配到維修器材', () => {
    const result = optimizeSchedule([booking('one', '2026-07-16T10:00:00.000Z')], equipment)
    expect(result.schedules).toHaveLength(1)
    expect(result.schedules[0].equipmentId).not.toBe('rack-c')
  })

  it('避免同一器材的時段重疊，且優先平衡使用率', () => {
    const requests = [
      booking('one', '2026-07-16T10:00:00.000Z'),
      booking('two', '2026-07-16T10:00:00.000Z'),
    ]
    const result = optimizeSchedule(requests, equipment)
    expect(result.schedules).toHaveLength(2)
    expect(new Set(result.schedules.map((item) => item.equipmentId)).size).toBe(2)
  })

  it('沒有相容器材時明確回報未分配', () => {
    const request = { ...booking('one', '2026-07-16T10:00:00.000Z'), category: '游泳池' }
    const result = optimizeSchedule([request], equipment)
    expect(result.schedules).toHaveLength(0)
    expect(result.unassignedBookingIds).toEqual(['one'])
  })
})
