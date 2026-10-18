'use client'

import { MemberShell } from '@/components/MemberShell'
import { MemberHome } from '@/components/MemberHome'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const data = useGymFlowData()
  const router = useRouter()

  return (
    <MemberShell>
      <MemberHome
        gyms={data.gyms}
        equipment={data.equipment}
        schedules={data.schedules}
        bookings={data.bookings}
        memberId={data.user?.uid ?? 'demo-member'}
        memberName={data.user?.displayName || '小宇'}
        onBook={() => router.push('/booking')}
      />
    </MemberShell>
  )
}
