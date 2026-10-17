'use client'

import { MemberShell } from '@/components/MemberShell'
import { EquipmentPage } from '@/components/EquipmentPage'
import { useGymFlowData } from '@/components/GymFlowProvider'

export default function EquipmentRoute() {
  const data = useGymFlowData()

  return (
    <MemberShell>
      <EquipmentPage equipment={data.equipment} />
    </MemberShell>
  )
}
