'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { demoBookings, demoEquipment, demoGyms, demoSchedules } from '@/data/demo'
import { auth, db, firebaseConfigured, signInWithGoogle, logout } from '@/lib/firebase'
import { runOptimizer } from '@/lib/optimizerClient'
import type {
  Booking,
  Equipment,
  EquipmentStatus,
  Gym,
  OptimizationResult,
  Role,
  ScheduleItem,
} from '@/types'

const STORAGE_KEY = 'gymflow-demo-v1'

interface LocalSnapshot {
  gyms: Gym[]
  equipment: Equipment[]
  bookings: Booking[]
  schedules: ScheduleItem[]
}

const fallbackSnapshot: LocalSnapshot = {
  gyms: demoGyms,
  equipment: demoEquipment,
  bookings: demoBookings,
  schedules: demoSchedules,
}

const readLocalSnapshot = (): LocalSnapshot => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) : fallbackSnapshot
  } catch {
    return fallbackSnapshot
  }
}

const normalizeDocs = <T extends { id: string }>(
  snapshot: { docs: Array<{ id: string; data: () => unknown }> },
) =>
  snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<T, 'id'>) })) as T[]

interface GymFlowContextType {
  gyms: Gym[]
  equipment: Equipment[]
  bookings: Booking[]
  schedules: ScheduleItem[]
  user: User | null
  role: Role
  cloudReady: boolean
  firebaseConfigured: boolean
  optimization: OptimizationResult | null
  toast: string
  addGym: (input: Omit<Gym, 'id'>) => Promise<void>
  addEquipment: (input: Omit<Equipment, 'id'>) => Promise<void>
  addBooking: (input: Omit<Booking, 'id' | 'memberId' | 'memberName' | 'status'>) => Promise<void>
  updateEquipmentStatus: (id: string, status: EquipmentStatus) => Promise<void>
  cancelBooking: (id: string) => Promise<void>
  optimize: () => Promise<OptimizationResult>
  resetDemo: () => void
  signInWithGoogle: () => Promise<unknown>
  logout: () => Promise<void>
  setMode: (mode: 'member' | 'admin') => void
  mode: 'member' | 'admin'
  notify: (message: string) => void
}

const GymFlowContext = createContext<GymFlowContextType | undefined>(undefined)

export function GymFlowProvider({ children }: { children: ReactNode }) {
  const [gyms, setGyms] = useState<Gym[]>(fallbackSnapshot.gyms)
  const [equipment, setEquipment] = useState<Equipment[]>(fallbackSnapshot.equipment)
  const [bookings, setBookings] = useState<Booking[]>(fallbackSnapshot.bookings)
  const [schedules, setSchedules] = useState<ScheduleItem[]>(fallbackSnapshot.schedules)
  const [localReady, setLocalReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>('member')
  const [cloudReady, setCloudReady] = useState(false)
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null)
  const [mode, setMode] = useState<'member' | 'admin'>('member')
  const [toast, setToast] = useState('')

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }, [])

  useEffect(() => {
    const saved = readLocalSnapshot()
    setGyms(saved.gyms)
    setEquipment(saved.equipment)
    setBookings(saved.bookings)
    setSchedules(saved.schedules)
    setLocalReady(true)
  }, [])

  useEffect(() => {
    if (!firebaseConfigured || !auth || !db) return
    const liveStops: Array<() => void> = []

    const unsubscribeAuth = auth.onAuthStateChanged(async (nextUser) => {
      liveStops.splice(0).forEach((stop) => stop())
      setUser(nextUser)
      setCloudReady(false)
      if (!nextUser || !db) return

      const userRef = doc(db, 'users', nextUser.uid)
      const userSnapshot = await getDoc(userRef)
      let resolvedRole: Role = 'member'
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          displayName: nextUser.displayName || 'GymFlow 會員',
          email: nextUser.email || '',
          role: 'member',
          createdAt: new Date().toISOString(),
        })
      } else {
        resolvedRole = (userSnapshot.data().role as Role) || 'member'
      }
      setRole(resolvedRole)

      const staffView = resolvedRole === 'staff' || resolvedRole === 'admin'
      const bookingSource = staffView
        ? collection(db, 'bookings')
        : query(collection(db, 'bookings'), where('memberId', '==', nextUser.uid))
      const scheduleSource = staffView
        ? collection(db, 'schedules')
        : query(collection(db, 'schedules'), where('memberId', '==', nextUser.uid))

      liveStops.push(
        onSnapshot(collection(db, 'gyms'), (snapshot) => setGyms(normalizeDocs<Gym>(snapshot))),
        onSnapshot(collection(db, 'equipment'), (snapshot) => setEquipment(normalizeDocs<Equipment>(snapshot))),
        onSnapshot(bookingSource, (snapshot) => setBookings(normalizeDocs<Booking>(snapshot))),
        onSnapshot(scheduleSource, (snapshot) => setSchedules(normalizeDocs<ScheduleItem>(snapshot))),
      )
      setCloudReady(true)
    })

    return () => {
      unsubscribeAuth()
      liveStops.forEach((stop) => stop())
    }
  }, [])

  useEffect(() => {
    if (cloudReady || !localReady) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gyms, equipment, bookings, schedules }))
  }, [bookings, cloudReady, equipment, gyms, schedules, localReady])

  const addGym = useCallback(
    async (input: Omit<Gym, 'id'>) => {
      if (cloudReady && db) {
        await addDoc(collection(db, 'gyms'), { ...input, createdBy: user?.uid ?? '' })
        return
      }
      setGyms((items) => [...items, { ...input, id: crypto.randomUUID() }])
    },
    [cloudReady, db, user],
  )

  const addEquipment = useCallback(
    async (input: Omit<Equipment, 'id'>) => {
      if (cloudReady && db) {
        await addDoc(collection(db, 'equipment'), input)
        return
      }
      setEquipment((items) => [...items, { ...input, id: crypto.randomUUID() }])
    },
    [cloudReady, db],
  )

  const addBooking = useCallback(
    async (input: Omit<Booking, 'id' | 'memberId' | 'memberName' | 'status'>) => {
      const value: Omit<Booking, 'id'> = {
        ...input,
        memberId: user?.uid ?? 'demo-member',
        memberName: user?.displayName ?? '小宇',
        status: 'pending',
      }
      if (cloudReady && db) {
        await addDoc(collection(db, 'bookings'), value)
        return
      }
      setBookings((items) => [...items, { ...value, id: crypto.randomUUID() }])
    },
    [cloudReady, db, user],
  )

  const updateEquipmentStatus = useCallback(
    async (id: string, status: EquipmentStatus) => {
      if (cloudReady && db) {
        await updateDoc(doc(db, 'equipment', id), { status })
        return
      }
      setEquipment((items) => items.map((item) => (item.id === id ? { ...item, status } : item)))
    },
    [cloudReady, db],
  )

  const cancelBooking = useCallback(async (id: string) => {
    if (cloudReady && db) {
      await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' })
      return
    }
    setBookings((items) => items.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)))
    setSchedules((items) => items.filter((item) => item.bookingId !== id))
  }, [cloudReady, db])

  const optimize = useCallback(async () => {
    const result = await runOptimizer(bookings, equipment)
    setOptimization(result)

    if (cloudReady && db) {
      const firestore = db
      const batch = writeBatch(firestore)
      result.schedules.forEach((item) => {
        batch.set(doc(firestore, 'schedules', item.id), item)
        batch.update(doc(firestore, 'bookings', item.bookingId), {
          status: 'scheduled',
          equipmentId: item.equipmentId,
        })
      })
      await batch.commit()
    } else {
      const affected = new Set(result.schedules.map((item) => item.bookingId))
      setSchedules((items) => [
        ...items.filter((item) => !affected.has(item.bookingId)),
        ...result.schedules,
      ])
      setBookings((items) =>
        items.map((item) => {
          const scheduled = result.schedules.find((schedule) => schedule.bookingId === item.id)
          return scheduled ? { ...item, status: 'scheduled', equipmentId: scheduled.equipmentId } : item
        }),
      )
    }

    return result
  }, [bookings, equipment, cloudReady, db])

  const resetDemo = useCallback(() => {
    setGyms(demoGyms)
    setEquipment(demoEquipment)
    setBookings(demoBookings)
    setSchedules(demoSchedules)
    setOptimization(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      gyms,
      equipment,
      bookings,
      schedules,
      user,
      role,
      cloudReady,
      toast,
      firebaseConfigured,
      optimization,
      notify,
      addGym,
      addEquipment,
      addBooking,
      updateEquipmentStatus,
      cancelBooking,
      optimize,
      resetDemo,
      signInWithGoogle,
      logout,
      setMode,
      mode,
    }),
    [
      gyms,
      equipment,
      bookings,
      schedules,
      user,
      role,
      cloudReady,
      toast,
      firebaseConfigured,
      optimization,
      notify,
      addGym,
      addEquipment,
      addBooking,
      updateEquipmentStatus,
      cancelBooking,
      optimize,
      resetDemo,
      signInWithGoogle,
      logout,
      setMode,
      mode,
    ],
  )

  return <GymFlowContext.Provider value={value}>{children}</GymFlowContext.Provider>
}

export function useGymFlowData() {
  const context = useContext(GymFlowContext)
  if (!context) {
    throw new Error('useGymFlowData must be used within a GymFlowProvider')
  }
  return context
}
