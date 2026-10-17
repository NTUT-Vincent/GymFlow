'use client'

import { useState } from 'react'
import type { Equipment } from '@/types'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { EquipmentCard } from './EquipmentCard'

interface EquipmentPageProps {
  equipment: Equipment[]
}

export function EquipmentPage({ equipment }: EquipmentPageProps) {
  const [filter, setFilter] = useState('全部')
  const categories = ['全部', ...new Set(equipment.map((item) => item.category))]
  const shown = filter === '全部' ? equipment : equipment.filter((item) => item.category === filter)

  return (
    <>
      <div className="page-intro row"><div><span className="eyebrow">LIVE EQUIPMENT</span><h1>器材現在的狀態</h1><p>資訊會跟著現場更新，不用到了才排隊。</p></div><span className="live-badge">● 即時更新</span></div>
      <div className="filter-row">{categories.map((item) => (
        <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
          {item}
        </button>
      ))}</div>
      <div className="equipment-grid">{shown.map((item) => <EquipmentCard key={item.id} item={item} detailed />)}</div>
    </>
  )
}
