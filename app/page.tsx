'use client'

import { MemberShell } from '@/components/MemberShell'
import { MemberHome } from '@/components/MemberHome'
import { useGymFlowData } from '@/components/GymFlowProvider'

export default function HomePage() {
  const data = useGymFlowData()
  const currentGym = data.gyms[0]

  return (
    <MemberShell>
      <MemberHome
        gyms={data.gyms}
        equipment={data.equipment}
        schedules={data.schedules}
        bookings={data.bookings}
        memberId={data.user?.uid ?? 'demo-member'}
        memberName={data.user?.displayName || '小宇'}
        onBook={() => {
          // Navigation handled by shell links; keep as no-op here
        }}
      />
    </MemberShell>
  )
}
