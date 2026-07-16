import type { Booking, Equipment, Gym, ScheduleItem } from '../types'

const todayAt = (hour: number, minute = 0) => {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const demoGyms: Gym[] = [
  {
    id: 'gym-demo-taipei',
    name: 'GymFlow 松菸館',
    address: '台北市信義區光復南路 133 號',
    openTime: '06:00',
    closeTime: '23:00',
  },
]

export const demoEquipment: Equipment[] = [
  { id: 'treadmill-01', gymId: 'gym-demo-taipei', name: '跑跑一號', category: '跑步機', zone: '有氧角落', status: 'available', utilization: 62 },
  { id: 'treadmill-02', gymId: 'gym-demo-taipei', name: '跑跑二號', category: '跑步機', zone: '有氧角落', status: 'in_use', availableAt: todayAt(new Date().getHours(), 45), utilization: 81 },
  { id: 'bike-01', gymId: 'gym-demo-taipei', name: '微風飛輪', category: '飛輪', zone: '窗邊區', status: 'available', utilization: 48 },
  { id: 'bike-02', gymId: 'gym-demo-taipei', name: '夕陽飛輪', category: '飛輪', zone: '窗邊區', status: 'maintenance', utilization: 54 },
  { id: 'rack-01', gymId: 'gym-demo-taipei', name: '力量深蹲架 A', category: '深蹲架', zone: '自由重量區', status: 'available', utilization: 76 },
  { id: 'rack-02', gymId: 'gym-demo-taipei', name: '力量深蹲架 B', category: '深蹲架', zone: '自由重量區', status: 'available', utilization: 69 },
  { id: 'bench-01', gymId: 'gym-demo-taipei', name: '雲朵臥推椅', category: '臥推架', zone: '自由重量區', status: 'available', utilization: 58 },
  { id: 'cable-01', gymId: 'gym-demo-taipei', name: '全能滑輪機', category: '滑輪機', zone: '肌力訓練區', status: 'available', utilization: 73 },
]

export const demoBookings: Booking[] = [
  { id: 'booking-01', gymId: 'gym-demo-taipei', memberId: 'demo-member', memberName: '小宇', category: '深蹲架', startAt: todayAt(18, 0), durationMinutes: 45, maxDelayMinutes: 45, priority: 2, status: 'pending' },
  { id: 'booking-02', gymId: 'gym-demo-taipei', memberId: 'member-mia', memberName: 'Mia', category: '跑步機', startAt: todayAt(18, 0), durationMinutes: 30, maxDelayMinutes: 30, priority: 1, status: 'pending' },
  { id: 'booking-03', gymId: 'gym-demo-taipei', memberId: 'member-jay', memberName: 'Jay', category: '深蹲架', startAt: todayAt(18, 15), durationMinutes: 45, maxDelayMinutes: 60, priority: 1, status: 'pending' },
  { id: 'booking-04', gymId: 'gym-demo-taipei', memberId: 'member-lin', memberName: '小林', category: '滑輪機', startAt: todayAt(18, 30), durationMinutes: 30, maxDelayMinutes: 30, priority: 1, status: 'pending' },
]

export const demoSchedules: ScheduleItem[] = [
  {
    id: 'schedule-preview',
    gymId: 'gym-demo-taipei',
    bookingId: 'booking-preview',
    memberId: 'demo-member',
    memberName: '小宇',
    equipmentId: 'bike-01',
    equipmentName: '微風飛輪',
    category: '飛輪',
    startAt: todayAt(17, 15),
    endAt: todayAt(17, 45),
    waitMinutes: 0,
  },
]

export const equipmentCategories = ['跑步機', '飛輪', '深蹲架', '臥推架', '滑輪機']
