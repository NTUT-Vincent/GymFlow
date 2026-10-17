'use client'

import { useState } from 'react'
import type { Booking, Equipment, EquipmentStatus, Gym, ScheduleItem } from '@/types'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { equipmentCategories } from '@/data/demo'
import { time, dateLabel } from '@/lib/utils'
import { EquipmentCard } from './EquipmentCard'

interface AdminDashboardProps {
  gyms: Gym[]
  equipment: Equipment[]
  bookings: Booking[]
  schedules: ScheduleItem[]
  cloudReady: boolean
}

export function AdminDashboard({ gyms, equipment, bookings, schedules, cloudReady }: AdminDashboardProps) {
  const data = useGymFlowData()
  const [tab, setTab] = useState<'overview' | 'gyms' | 'equipment'>('overview')
  const [working, setWorking] = useState(false)
  const available = equipment.filter((item) => item.status === 'available').length
  const waiting = bookings.filter((item) => item.status === 'pending').length
  const optimization = data.optimization

  const runOptimization = async () => {
    setWorking(true)
    try {
      await data.optimize()
    } catch (error) {
      data.notify(error instanceof Error ? error.message : '排程失敗，請稍後再試。')
    } finally {
      setWorking(false)
    }
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <span className="eyebrow">GYMFLOW STUDIO</span>
          <h1>場館營運後台</h1>
          <p>早安，今天也讓大家流暢地訓練。</p>
        </div>
        <div className="admin-actions">
          <span className={`live-badge ${cloudReady ? '' : 'demo'}`}>{cloudReady ? '● 雲端同步' : '○ 本機示範'}</span>
          <button className="soft-button" onClick={data.resetDemo}>還原示範</button>
          <button className="primary-button" disabled={working} onClick={runOptimization}>
            {working ? '正在找最佳安排…' : '✦ 執行最佳化排程'}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>營運總覽</button>
        <button className={tab === 'gyms' ? 'active' : ''} onClick={() => setTab('gyms')}>場館管理</button>
        <button className={tab === 'equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>器材管理</button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="admin-stats">
            <div className="metric sketch-card">
              <span className="metric-icon">▤</span>
              <div>
                <span>今日預約</span>
                <strong>{String(bookings.filter((item) => item.status !== 'cancelled').length)}</strong>
                <small>包含待排程需求</small>
              </div>
            </div>
            <div className="metric sketch-card">
              <span className="metric-icon">✓</span>
              <div>
                <span>現在可用</span>
                <strong>{`${available}/${equipment.length}`}</strong>
                <small>台器材</small>
              </div>
            </div>
            <div className="metric sketch-card">
              <span className="metric-icon">⌛</span>
              <div>
                <span>待排程</span>
                <strong>{String(waiting)}</strong>
                <small>{waiting ? '建議執行最佳化' : '目前都安排好了'}</small>
              </div>
            </div>
            <div className="metric sketch-card">
              <span className="metric-icon">↗</span>
              <div>
                <span>平均使用率</span>
                <strong>{`${Math.round(equipment.reduce((sum, item) => sum + item.utilization, 0) / Math.max(1, equipment.length))}%`}</strong>
                <small>依示範數據</small>
              </div>
            </div>
          </div>

          {optimization && (
            <div className="optimizer-result sketch-card">
              <span className="optimizer-icon">✦</span>
              <div>
                <strong>本次排程已完成</strong>
                <p>安排 {optimization.schedules.length} 筆・未分配 {optimization.unassignedBookingIds.length} 筆・求解 {optimization.elapsedMs}ms・{optimization.optimal ? '已證明最佳解' : '限時最佳可行解'}</p>
              </div>
              <span className="score">score {optimization.score}</span>
            </div>
          )}

          <div className="admin-grid">
            <section className="admin-panel sketch-card">
              <div className="panel-heading">
                <div><span className="eyebrow">LIVE FLOOR</span><h2>現場器材</h2></div>
                <span>{available} 台可用</span>
              </div>
              <div className="compact-equipment-list">
                {equipment.slice(0, 6).map((item) => (
                  <EquipmentRow key={item.id} item={item} onChange={data.updateEquipmentStatus} />
                ))}
              </div>
            </section>
            <section className="admin-panel sketch-card">
              <div className="panel-heading">
                <div><span className="eyebrow">SCHEDULE QUEUE</span><h2>排程佇列</h2></div>
                <span>{waiting} 筆等待</span>
              </div>
              <div className="queue-list">
                {bookings.filter((item) => item.status !== 'cancelled').slice(0, 7).map((item) => {
                  const scheduled = schedules.find((schedule) => schedule.bookingId === item.id)
                  return (
                    <div className="queue-row" key={item.id}>
                      <span className="queue-time">{time(item.startAt)}</span>
                      <div>
                        <strong>{item.memberName}</strong>
                        <small>{item.category}・{item.durationMinutes} 分鐘</small>
                      </div>
                      <span className={`status-pill ${scheduled ? 'available' : 'in_use'}`}>{scheduled ? scheduled.equipmentName : '待分配'}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </>
      )}

      {tab === 'gyms' && <GymManagement gyms={gyms} onAdd={data.addGym} />}
      {tab === 'equipment' && <EquipmentManagement gyms={gyms} equipment={equipment} onAdd={data.addEquipment} onChange={data.updateEquipmentStatus} />}
    </>
  )
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) {
  return (
    <div className="metric sketch-card">
      <span className="metric-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  )
}

function EquipmentRow({ item, onChange }: { item: Equipment; onChange: (id: string, status: EquipmentStatus) => Promise<void> }) {
  return (
    <div className="equipment-row">
      <span className="row-icon">{item.status === 'available' ? '✓' : item.status === 'in_use' ? '⌛' : '✎'}</span>
      <div>
        <strong>{item.name}</strong>
        <small>{item.category}・{item.zone}</small>
      </div>
      <select
        value={item.status}
        onChange={(event) => onChange(item.id, event.target.value as EquipmentStatus)}
      >
        <option value="available">可用</option>
        <option value="in_use">使用中</option>
        <option value="maintenance">維修</option>
      </select>
    </div>
  )
}

function GymManagement({ gyms, onAdd }: { gyms: Gym[]; onAdd: (value: Omit<Gym, 'id'>) => Promise<void> }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onAdd({ name, address, openTime: '06:00', closeTime: '23:00' })
    setName('')
    setAddress('')
  }
  return (
    <div className="management-layout">
      <section className="admin-panel sketch-card">
        <div className="panel-heading">
          <div><span className="eyebrow">LOCATIONS</span><h2>目前場館</h2></div>
          <span>{gyms.length} 間</span>
        </div>
        <div className="gym-list">
          {gyms.map((gym) => (
            <article key={gym.id}>
              <span className="gym-pin">⌖</span>
              <div>
                <h3>{gym.name}</h3>
                <p>{gym.address}</p>
                <small>{gym.openTime} — {gym.closeTime}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
      <form className="admin-form sketch-card" onSubmit={submit}>
        <span className="eyebrow">NEW LOCATION</span>
        <h2>新增健身房</h2>
        <label>場館名稱<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：GymFlow 大安館" required /></label>
        <label>地址<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="輸入完整地址" required /></label>
        <div className="form-grid">
          <label>開門<input type="time" value="06:00" readOnly /></label>
          <label>休息<input type="time" value="23:00" readOnly /></label>
        </div>
        <button className="primary-button wide">＋ 新增場館</button>
      </form>
    </div>
  )
}

function EquipmentManagement({ gyms, equipment, onAdd, onChange }: { gyms: Gym[]; equipment: Equipment[]; onAdd: (value: Omit<Equipment, 'id'>) => Promise<void>; onChange: (id: string, status: EquipmentStatus) => Promise<void> }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(equipmentCategories[0])
  const [zone, setZone] = useState('自由重量區')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!gyms[0]) return
    await onAdd({ gymId: gyms[0].id, name, category, zone, status: 'available', utilization: 0 })
    setName('')
  }
  return (
    <div className="management-layout equipment-management">
      <section className="admin-panel sketch-card">
        <div className="panel-heading">
          <div><span className="eyebrow">EQUIPMENT</span><h2>器材清單</h2></div>
          <span>{equipment.length} 台</span>
        </div>
        <div className="compact-equipment-list">
          {equipment.map((item) => (
            <EquipmentRow key={item.id} item={item} onChange={onChange} />
          ))}
        </div>
      </section>
      <form className="admin-form sketch-card" onSubmit={submit}>
        <span className="eyebrow">NEW EQUIPMENT</span>
        <h2>新增器材</h2>
        <label>器材名稱<input value={name} onChange={(event) => setName(event.target.value)} placeholder="幫它取個好記的名字" required /></label>
        <label>類型<select value={category} onChange={(event) => setCategory(event.target.value)}>{equipmentCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>所在區域<input value={zone} onChange={(event) => setZone(event.target.value)} required /></label>
        <button className="primary-button wide" disabled={!gyms.length}>＋ 加入器材</button>
      </form>
    </div>
  )
}
