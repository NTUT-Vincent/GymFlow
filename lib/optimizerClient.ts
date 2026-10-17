import type { Booking, Equipment, OptimizationResult } from '../types'
import { optimizeSchedule } from './optimizer'

// Next.js App Router does not support Vite-style `new URL(..., import.meta.url)`
// web workers. The optimizer is synchronous and fast enough for the demo data set,
// so we run it inline and resolve as a promise to keep the same async API.
export function runOptimizer(bookings: Booking[], equipment: Equipment[]): Promise<OptimizationResult> {
  return Promise.resolve(optimizeSchedule(bookings, equipment))
}
