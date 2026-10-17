'use client'

import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useGymFlowData } from './GymFlowProvider'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function MemberShell({ children }: { children: ReactNode }) {
  const data = useGymFlowData()
  const pathname = usePathname()

  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
      {data.toast && <div className="toast" role="status">{data.toast}</div>}
    </div>
  )
}
