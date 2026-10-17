'use client'

import { useState } from 'react'
import type { Booking, Gym } from '@/types'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { equipmentCategories } from '@/data/demo'

interface BookingPageProps {
  gym?: Gym
  onDone: () => void
}

export function BookingPage({ gym, onDone }: BookingPageProps) {
  const data = useGymFlowData()
  const defaultStart = new Date(Date.now() + 60 * 60 * 1000)
  defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 15) * 15, 0, 0)
  const [category, setCategory] = useState(equipmentCategories[0])
  const [startAt, setStartAt] = useState(defaultStart.toISOString().slice(0, 16))
  const [duration, setDuration] = useState(30)
  const [flexible, setFlexible] = useState(30)
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!gym) return
    setSaving(true)
    try {
      await data.addBooking({
        gymId: gym.id,
        category,
        startAt: new Date(startAt).toISOString(),
        durationMinutes: duration,
        maxDelayMinutes: flexible,
        priority: 1,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="narrow-page">
      <div className="page-intro"><span className="eyebrow">BOOK A FLOW</span><h1>安排下一次訓練</h1><p>告訴我們想練什麼，排程器會找到最順的器材與時間。</p></div>
      <form className="booking-form sketch-card" onSubmit={submit}>
        <label>想使用的器材
          <div className="category-picker">
            {equipmentCategories.map((item) => (
              <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
        </label>
        <div className="form-grid">
          <label>希望開始時間<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required /></label>
          <label>訓練時間<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={30}>30 分鐘</option><option value={45}>45 分鐘</option><option value={60}>60 分鐘</option></select></label>
          <label>可接受延後<select value={flexible} onChange={(event) => setFlexible(Number(event.target.value))}><option value={0}>固定時間</option><option value={15}>15 分鐘</option><option value={30}>30 分鐘</option><option value={60}>60 分鐘</option></select></label>
          <label>場館<input value={gym?.name || '尚未建立場館'} disabled /></label>
        </div>
        <div className="form-note"><span>✦</span><p><strong>為什麼保留彈性？</strong><br />多一點彈性通常能顯著降低等待時間，也讓熱門器材分配更公平。</p></div>
        <button className="primary-button wide" disabled={saving || !gym}>{saving ? '送出中…' : '送出預約需求 →'}</button>
      </form>
    </div>
  )
}
