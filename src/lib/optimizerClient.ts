import type { Booking, Equipment, OptimizationResult } from '../types'
import { optimizeSchedule } from './optimizer'

export function runOptimizer(bookings: Booking[], equipment: Equipment[]): Promise<OptimizationResult> {
  if (typeof Worker === 'undefined') return Promise.resolve(optimizeSchedule(bookings, equipment))

  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/optimizer.worker.ts', import.meta.url), { type: 'module' })
    const fallback = window.setTimeout(() => {
      worker.terminate()
      resolve(optimizeSchedule(bookings, equipment))
    }, 1_200)

    worker.onmessage = (event: MessageEvent<OptimizationResult>) => {
      window.clearTimeout(fallback)
      worker.terminate()
      resolve(event.data)
    }

    worker.onerror = () => {
      window.clearTimeout(fallback)
      worker.terminate()
      resolve(optimizeSchedule(bookings, equipment))
    }

    worker.postMessage({ bookings, equipment })
  })
}
