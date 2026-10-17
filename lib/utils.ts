import type { EquipmentStatus } from '../types'

export const time = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(iso))
    : '—'

export const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(iso))

export const statusLabel: Record<EquipmentStatus, string> = {
  available: '現在可用',
  in_use: '使用中',
  maintenance: '休息維修',
}

export const statusIcon: Record<EquipmentStatus, string> = {
  available: '✓',
  in_use: '⌛',
  maintenance: '✎',
}
