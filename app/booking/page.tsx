'use client'

import { MemberShell } from '@/components/MemberShell'
import { BookingPage } from '@/components/BookingPage'
import { useGymFlowData } from '@/components/GymFlowProvider'
import { useRouter } from 'next/navigation'

export default function BookingRoute() {
  const data = useGymFlowData()
  const router = useRouter()
  const currentGym = data.gyms[0]

  return (
    <MemberShell>
      <BookingPage
        gym={currentGym}
        onDone={() => {
          data.notify('預約需求已送出，等候排程分配。')
          router.push('/schedule')
        }}
      />
    </MemberShell>
  )
}
