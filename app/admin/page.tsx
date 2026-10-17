'use client'

import { AdminShell } from '@/components/AdminShell'
import { AdminDashboard } from '@/components/AdminDashboard'
import { useGymFlowData } from '@/components/GymFlowProvider'

export default function AdminRoute() {
  const data = useGymFlowData()

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
