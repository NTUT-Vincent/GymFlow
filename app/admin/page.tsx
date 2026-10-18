'use client'

import { AdminShell } from '@/components/AdminShell'
import { AdminDashboard } from '@/components/AdminDashboard'
import { useGymFlowData } from '@/components/GymFlowProvider'

export default function AdminRoute() {
  const data = useGymFlowData()
  const canManage = !data.supabaseConfigured || (!!data.user && (data.role === 'staff' || data.role === 'admin'))

  if (data.authLoading) {
    return <AdminShell><p>正在驗證登入狀態…</p></AdminShell>
  }

  if (!canManage) {
    return (
      <AdminShell>
        <section className="admin-panel sketch-card" role="alert">
          <h1>沒有後台權限</h1>
          <p>請登入具有 staff 或 admin 權限的帳號。</p>
        </section>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <AdminDashboard
        gyms={data.gyms}
        equipment={data.equipment}
        bookings={data.bookings}
        schedules={data.schedules}
        cloudReady={data.cloudReady}
      />
    </AdminShell>
  )
}
