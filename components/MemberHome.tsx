'use client'

import type { Booking, Equipment, Gym, ScheduleItem } from '@/types'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { time, dateLabel } from '@/lib/utils'
import { EmptyState } from './EmptyState'
import { EquipmentCard } from './EquipmentCard'

interface MemberHomeProps {
  gyms: Gym[]
  equipment: Equipment[]
  schedules: ScheduleItem[]
  bookings: Booking[]
  memberId: string
  memberName: string
  onBook: () => void
}

export function MemberHome({ gyms, equipment, schedules, bookings, memberId, memberName, onBook }: MemberHomeProps) {
  const data = useGymFlowData()
  const available = equipment.filter((item) => item.status === 'available')
  const mySchedules = schedules.filter((item) => item.memberId === memberId && !bookings.some((booking) => booking.id === item.bookingId && booking.status === 'cancelled'))
  const next = mySchedules.filter((item) => new Date(item.endAt).getTime() > Date.now()).sort((a, b) => a.startAt.localeCompare(b.startAt))[0]
  const pending = bookings.filter((item) => item.memberId === memberId && item.status === 'pending').length

  return (
    <>
      <section className="hero sketch-card">
        <div className="hero-copy">
          <span className="eyebrow">今天也替自己留一點時間</span>
          <h1>嗨，{memberName}！<br /><em>舒服地動起來吧。</em></h1>
          <p>{gyms[0]?.name || 'GymFlow'} 現在有 <strong>{available.length} 台器材</strong> 可以直接使用。</p>
          {data.supabaseConfigured && !data.user ? (
            <button className="primary-button" onClick={() => void data.signInWithGoogle().catch((error: Error) => data.notify(error.message))}>Google 登入後開始預約</button>
          ) : (
            <button className="primary-button" onClick={onBook}>＋ 預約今天的訓練</button>
          )}
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <span className="scribble sun">✦</span>
          <div className="person"><i /><b /><span /></div>
          <div className="dumbbell"><i /><b /><i /></div>
          <span className="scribble motion">〰 〰</span>
        </div>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">YOUR FLOW</span><h2>接下來的安排</h2></div>
        <span className="hand-note">照自己的步調就好 ↘</span>
      </div>

      <div className="dashboard-grid">
        <section className="next-session sketch-card">
          {next ? (
            <>
              <div className="card-top"><span className="date-chip">{dateLabel(next.startAt)}</span><span className="confirmed">✓ 已安排</span></div>
              <div className="session-time">{time(next.startAt)} <span>— {time(next.endAt)}</span></div>
              <h3>{next.equipmentName}</h3>
              <p>{next.category}・{next.waitMinutes ? `等待 ${next.waitMinutes} 分鐘` : '準時開始'}</p>
              <div className="session-footer"><span>⌖ {gyms[0]?.name}</span><span>記得帶水壺 ◡̈</span></div>
            </>
          ) : <EmptyState icon="☁" title="還沒有排程" text="選一台喜歡的器材開始吧。" />}
        </section>

        <section className="mini-stats">
          <div className="stat sketch-card"><span>可用器材</span><strong>{available.length}<small> 台</small></strong><i className="trend">即時</i></div>
          <div className="stat sketch-card"><span>待分配</span><strong>{pending}<small> 筆</small></strong><i>排程器會幫忙</i></div>
        </section>
      </div>

      <div className="section-heading compact"><div><span className="eyebrow">AVAILABLE NOW</span><h2>現在可用的器材</h2></div></div>
      <div className="equipment-preview">
        {available.slice(0, 4).map((item) => <EquipmentCard key={item.id} item={item} />)}
      </div>
    </>
  )
}
