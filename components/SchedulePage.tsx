'use client'

import type { Booking, ScheduleItem } from '@/types'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { EmptyState } from './EmptyState'
import { time, dateLabel } from '@/lib/utils'

interface SchedulePageProps {
  memberId: string
  bookings: Booking[]
  schedules: ScheduleItem[]
}

export function SchedulePage({ memberId, bookings, schedules }: SchedulePageProps) {
  const data = useGymFlowData()
  const mine = schedules.filter((item) => item.memberId === memberId)
  const pending = bookings.filter((item) => item.memberId === memberId && item.status === 'pending')

  return (
    <>
      <div className="page-intro"><span className="eyebrow">MY SCHEDULE</span><h1>我的訓練排程</h1><p>排好的節奏會出現在這裡，有變化也可以隨時取消。</p></div>
      <div className="timeline sketch-card">
        {mine.length === 0 && pending.length === 0 ? <EmptyState icon="≋" title="這裡還很安靜" text="預約後，排程就會出現在這裡。" /> : null}
        {pending.map((item) => (
          <div className="timeline-item pending" key={item.id}>
            <div className="timeline-time">{time(item.startAt)}<span>希望時間</span></div>
            <div className="timeline-line"><i /></div>
            <div className="timeline-card">
              <span className="status-pill in_use">⌛ 等待分配</span>
              <h3>{item.category}</h3>
              <p>{item.durationMinutes} 分鐘・可延後 {item.maxDelayMinutes} 分鐘</p>
              <button className="text-button" onClick={() => data.cancelBooking(item.id)}>取消需求</button>
            </div>
          </div>
        ))}
        {mine.map((item) => (
          <div className="timeline-item" key={item.id}>
            <div className="timeline-time">{time(item.startAt)}<span>{dateLabel(item.startAt)}</span></div>
            <div className="timeline-line"><i /></div>
            <div className="timeline-card">
              <span className="status-pill available">✓ 已安排</span>
              <h3>{item.equipmentName}</h3>
              <p>{item.category}・到 {time(item.endAt)}{item.waitMinutes ? `・等待 ${item.waitMinutes} 分鐘` : ''}</p>
              <button className="text-button" onClick={() => data.cancelBooking(item.bookingId)}>取消預約</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
