'use client'

import { Header } from './Header'
import { useGymFlowData } from './GymFlowProvider'
import type { ReactNode } from 'react'

export function AdminShell({ children }: { children: ReactNode }) {
  const data = useGymFlowData()

  return (
    <div className="app-shell">
      <Header />
      <main className="admin-content">{children}</main>
      {data.toast && <div className="toast" role="status">{data.toast}</div>}
    </div>
  )
}
