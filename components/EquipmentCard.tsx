'use client'

import type { Equipment } from '@/types'
import { statusIcon, statusLabel } from '@/lib/utils'

interface EquipmentCardProps {
  item: Equipment
  detailed?: boolean
}

export function EquipmentCard({ item, detailed = false }: EquipmentCardProps) {
  const categoryIcon = {
    跑步機: '⌁',
    飛輪: '◉',
    深蹲架: 'Π',
    臥推架: '⊢',
  }[item.category] ?? '⌘'

  return (
    <article className={`equipment-card sketch-card ${item.status}`}>
      <div className="equipment-drawing"><span>{categoryIcon}</span></div>
      <div className="equipment-copy">
        <span className={`status-pill ${item.status}`}>{statusIcon[item.status]} {statusLabel[item.status]}</span>
        <h3>{item.name}</h3>
        <p>{item.category}・{item.zone}</p>
        {detailed && (
          <small>
            最近使用率 {item.utilization}%{item.availableAt ? `・約 ${timeStr(item.availableAt)} 可用` : ''}
          </small>
        )}
      </div>
    </article>
  )
}

function timeStr(iso: string) {
  return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(iso),
  )
}
