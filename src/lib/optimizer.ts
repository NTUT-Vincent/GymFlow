import type { Booking, Equipment, OptimizationResult, ScheduleItem } from '../types'

interface Candidate {
  booking: Booking
  equipment: Equipment
  startMs: number
  endMs: number
  waitMinutes: number
  baseCost: number
}

interface OptimizeOptions {
  timeLimitMs?: number
  slotMinutes?: number
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const overlaps = (startMs: number, endMs: number, intervals: Array<[number, number]>) =>
  intervals.some(([start, end]) => startMs < end && endMs > start)

const buildCandidates = (booking: Booking, equipment: Equipment[], slotMinutes: number): Candidate[] => {
  const requestedMs = new Date(booking.startAt).getTime()
  const durationMs = booking.durationMinutes * 60_000
  const candidates: Candidate[] = []

  for (const machine of equipment) {
    if (machine.category !== booking.category || machine.status === 'maintenance') continue

    for (let delay = 0; delay <= booking.maxDelayMinutes; delay += slotMinutes) {
      const startMs = requestedMs + delay * 60_000
      const availableMs = machine.availableAt ? new Date(machine.availableAt).getTime() : -Infinity
      if (machine.status === 'in_use' && startMs < availableMs) continue

      candidates.push({
        booking,
        equipment: machine,
        startMs,
        endMs: startMs + durationMs,
        waitMinutes: delay,
        baseCost: delay * 6 + machine.utilization * 0.08 - booking.priority * 4,
      })
    }
  }

  return candidates.sort((a, b) => a.baseCost - b.baseCost || a.startMs - b.startMs)
}

export function optimizeSchedule(
  bookings: Booking[],
  equipment: Equipment[],
  options: OptimizeOptions = {},
): OptimizationResult {
  const startedAt = now()
  const deadline = startedAt + (options.timeLimitMs ?? 180)
  const slotMinutes = options.slotMinutes ?? 15
  const pending = bookings.filter((booking) => booking.status === 'pending')
  const candidatesByBooking = new Map(
    pending.map((booking) => [booking.id, buildCandidates(booking, equipment, slotMinutes)]),
  )

  const ordered = [...pending].sort((a, b) => {
    const candidateDiff = (candidatesByBooking.get(a.id)?.length ?? 0) - (candidatesByBooking.get(b.id)?.length ?? 0)
    return candidateDiff || b.priority - a.priority || a.startAt.localeCompare(b.startAt)
  })

  const intervals = new Map<string, Array<[number, number]>>()
  const loads = new Map<string, number>()
  const chosen: Candidate[] = []
  let bestChosen: Candidate[] = []
  let bestUnassigned: string[] = ordered.map((booking) => booking.id)
  let bestScore = bestUnassigned.length * 10_000
  let timedOut = false

  const search = (index: number, score: number, unassigned: string[]) => {
    if (now() >= deadline) {
      timedOut = true
      return
    }
    if (score >= bestScore) return
    if (index === ordered.length) {
      bestScore = score
      bestChosen = [...chosen]
      bestUnassigned = [...unassigned]
      return
    }

    const booking = ordered[index]
    const candidates = candidatesByBooking.get(booking.id) ?? []
    for (const candidate of candidates) {
      const machineIntervals = intervals.get(candidate.equipment.id) ?? []
      if (overlaps(candidate.startMs, candidate.endMs, machineIntervals)) continue

      const fairnessCost = (loads.get(candidate.equipment.id) ?? 0) * 5
      const nextIntervals = [...machineIntervals, [candidate.startMs, candidate.endMs] as [number, number]]
      intervals.set(candidate.equipment.id, nextIntervals)
      loads.set(candidate.equipment.id, (loads.get(candidate.equipment.id) ?? 0) + 1)
      chosen.push(candidate)

      search(index + 1, score + candidate.baseCost + fairnessCost, unassigned)

      chosen.pop()
      loads.set(candidate.equipment.id, (loads.get(candidate.equipment.id) ?? 1) - 1)
      if (machineIntervals.length) intervals.set(candidate.equipment.id, machineIntervals)
      else intervals.delete(candidate.equipment.id)
    }

    search(index + 1, score + 10_000 - booking.priority * 100, [...unassigned, booking.id])
  }

  search(0, 0, [])

  const schedules: ScheduleItem[] = bestChosen
    .map((candidate) => ({
      id: `schedule-${candidate.booking.id}`,
      gymId: candidate.booking.gymId,
      bookingId: candidate.booking.id,
      memberId: candidate.booking.memberId,
      memberName: candidate.booking.memberName,
      equipmentId: candidate.equipment.id,
      equipmentName: candidate.equipment.name,
      category: candidate.booking.category,
      startAt: new Date(candidate.startMs).toISOString(),
      endAt: new Date(candidate.endMs).toISOString(),
      waitMinutes: candidate.waitMinutes,
    }))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  return {
    schedules,
    unassignedBookingIds: bestUnassigned,
    score: Math.max(0, Math.round(bestScore)),
    optimal: !timedOut,
    elapsedMs: Math.round((now() - startedAt) * 10) / 10,
  }
}
