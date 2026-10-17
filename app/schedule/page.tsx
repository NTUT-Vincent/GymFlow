'use client'

import { MemberShell } from '@/components/MemberShell'
import { SchedulePage } from '@/components/SchedulePage'
import { useGymFlowData } from '@/components/GymFlowProvider'

export default function ScheduleRoute() {
  const data = useGymFlowData()

  return (
    <MemberShell>
      <SchedulePage
        memberId={data.user?.uid ?? 'demo-member'}
        bookings={data.bookings}
        schedules={data.schedules}
      />
    </MemberShell>
  )
}
