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
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { demoBookings, demoEquipment, demoGyms, demoSchedules } from '@/data/demo'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { toBooking, toEquipment, toGym, toSchedule } from '@/lib/supabase/mappers'
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
type Client = NonNullable<ReturnType<typeof createClient>>
type AppUser = { uid: string; displayName: string | null; email: string | null }

interface LocalSnapshot {
  gyms: Gym[]
  equipment: Equipment[]
  bookings: Booking[]
  schedules: ScheduleItem[]
}

const demoSnapshot: LocalSnapshot = {
  gyms: demoGyms,
  equipment: demoEquipment,
  bookings: demoBookings,
  schedules: demoSchedules,
}
const emptySnapshot: LocalSnapshot = { gyms: [], equipment: [], bookings: [], schedules: [] }

function readLocalSnapshot(): LocalSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as LocalSnapshot : demoSnapshot
  } catch {
    return demoSnapshot
  }
}

function toAppUser(user: SupabaseUser): AppUser {
  return {
    uid: user.id,
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null,
    email: user.email ?? null,
  }
}

interface GymFlowContextType {
  gyms: Gym[]
  equipment: Equipment[]
  bookings: Booking[]
  schedules: ScheduleItem[]
  user: AppUser | null
  role: Role
  cloudReady: boolean
  authLoading: boolean
  supabaseConfigured: boolean
  optimization: OptimizationResult | null
  toast: string
  addGym: (input: Omit<Gym, 'id'>) => Promise<void>
  addEquipment: (input: Omit<Equipment, 'id'>) => Promise<void>
  addBooking: (input: Omit<Booking, 'id' | 'memberId' | 'memberName' | 'status'>) => Promise<void>
  updateEquipmentStatus: (id: string, status: EquipmentStatus) => Promise<void>
  cancelBooking: (id: string) => Promise<void>
  optimize: () => Promise<OptimizationResult>
  resetDemo: () => void
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  setMode: (mode: 'member' | 'admin') => void
  mode: 'member' | 'admin'
  notify: (message: string) => void
}

const GymFlowContext = createContext<GymFlowContextType | undefined>(undefined)

export function GymFlowProvider({ children }: { children: ReactNode }) {
  const initial = supabaseConfigured ? emptySnapshot : demoSnapshot
  const [gyms, setGyms] = useState<Gym[]>(initial.gyms)
  const [equipment, setEquipment] = useState<Equipment[]>(initial.equipment)
  const [bookings, setBookings] = useState<Booking[]>(initial.bookings)
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initial.schedules)
  const [localReady, setLocalReady] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)
  const [role, setRole] = useState<Role>('member')
  const [cloudReady, setCloudReady] = useState(false)
  const [authLoading, setAuthLoading] = useState(supabaseConfigured)
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null)
  const [mode, setMode] = useState<'member' | 'admin'>('member')
  const [toast, setToast] = useState('')

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3500)
  }, [])

  const applySnapshot = useCallback((snapshot: LocalSnapshot) => {
    setGyms(snapshot.gyms)
    setEquipment(snapshot.equipment)
    setBookings(snapshot.bookings)
    setSchedules(snapshot.schedules)
  }, [])

  const syncData = useCallback(async (client: Client, uid: string, resolvedRole: Role) => {
    const staff = resolvedRole === 'staff' || resolvedRole === 'admin'
    const bookingsQuery = client.from('bookings').select('*')
    const schedulesQuery = client.from('schedules').select('*')
    const [gymResult, equipmentResult, bookingResult, scheduleResult] = await Promise.all([
      client.from('gyms').select('*'),
      client.from('equipment').select('*'),
      staff ? bookingsQuery : bookingsQuery.eq('member_id', uid),
      staff ? schedulesQuery : schedulesQuery.eq('member_id', uid),
    ])
    const error = [gymResult.error, equipmentResult.error, bookingResult.error, scheduleResult.error].find(Boolean)
    if (error) throw new Error(error.message)
    applySnapshot({
      gyms: (gymResult.data ?? []).map(toGym),
      equipment: (equipmentResult.data ?? []).map(toEquipment),
      bookings: (bookingResult.data ?? []).map(toBooking),
      schedules: (scheduleResult.data ?? []).map(toSchedule),
    })
  }, [applySnapshot])

  useEffect(() => {
    if (supabaseConfigured) return
    applySnapshot(readLocalSnapshot())
    setLocalReady(true)
  }, [applySnapshot])

  useEffect(() => {
    if (!supabaseConfigured) return
    const client = createClient()
    if (!client) return
    let alive = true
    let version = 0

    const initialize = async (authUser: SupabaseUser | null) => {
      const current = ++version
      if (!alive) return
      setAuthLoading(true)
      setCloudReady(false)
      if (!authUser) {
        setUser(null)
        setRole('member')
        applySnapshot(emptySnapshot)
        setAuthLoading(false)
        return
      }

      try {
        const { data: profile, error } = await client
          .from('profiles').select('role').eq('id', authUser.id).single()
        if (error) throw new Error(error.message)
        const resolvedRole = (profile?.role ?? 'member') as Role
        if (!alive || current !== version) return
        setUser(toAppUser(authUser))
        setRole(resolvedRole)
        await syncData(client, authUser.id, resolvedRole)
        if (!alive || current !== version) return
        setCloudReady(true)
      } catch (error) {
        if (alive && current === version) {
          notify(error instanceof Error ? error.message : '讀取 Supabase 資料失敗')
        }
      } finally {
        if (alive && current === version) setAuthLoading(false)
      }
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      // Avoid awaiting Supabase calls inside its auth event callback.
      window.setTimeout(() => {
        if (alive) void initialize(session?.user ?? null)
      }, 0)
    })
    void client.auth.getUser().then(({ data, error }) => {
      if (!alive) return
      if (error) notify(error.message)
      void initialize(data.user)
    })
    return () => {
      alive = false
      version += 1
      subscription.unsubscribe()
    }
  }, [applySnapshot, notify, syncData])

  useEffect(() => {
    if (!supabaseConfigured || !cloudReady || !user) return
    const client = createClient()
    if (!client) return
    let active = true
    const refresh = () => {
      if (active) void syncData(client, user.uid, role).catch((error: Error) => notify(error.message))
    }
    const channel = client.channel('gymflow-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gyms' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, refresh)
      .subscribe()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
      void client.removeChannel(channel)
    }
  }, [cloudReady, user, role, notify, syncData])

  useEffect(() => {
    if (supabaseConfigured || !localReady) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gyms, equipment, bookings, schedules }))
  }, [gyms, equipment, bookings, schedules, localReady])

  const requireCloud = useCallback(() => {
    const client = createClient()
    if (!client || !user || !cloudReady) throw new Error('請先使用 Google 登入並完成資料同步')
    return { client, currentUser: user }
  }, [user, cloudReady])

  const refresh = useCallback(async (client: Client) => {
    if (user) await syncData(client, user.uid, role)
  }, [user, role, syncData])

  const addGym = useCallback(async (input: Omit<Gym, 'id'>) => {
    if (supabaseConfigured) {
      const { client, currentUser } = requireCloud()
      const { error } = await client.from('gyms').insert({
        name: input.name, address: input.address, open_time: input.openTime,
        close_time: input.closeTime, created_by: currentUser.uid,
      })
      if (error) throw new Error(error.message)
      await refresh(client)
      return
    }
    setGyms((items) => [...items, { ...input, id: crypto.randomUUID() }])
  }, [requireCloud, refresh])

  const addEquipment = useCallback(async (input: Omit<Equipment, 'id'>) => {
    if (supabaseConfigured) {
      const { client } = requireCloud()
      const { error } = await client.from('equipment').insert({
        gym_id: input.gymId, name: input.name, category: input.category,
        zone: input.zone, status: input.status, utilization: input.utilization,
        available_at: input.availableAt ?? null,
      })
      if (error) throw new Error(error.message)
      await refresh(client)
      return
    }
    setEquipment((items) => [...items, { ...input, id: crypto.randomUUID() }])
  }, [requireCloud, refresh])

  const addBooking = useCallback(async (
    input: Omit<Booking, 'id' | 'memberId' | 'memberName' | 'status'>,
  ) => {
    if (supabaseConfigured) {
      const { client, currentUser } = requireCloud()
      const { error } = await client.from('bookings').insert({
        gym_id: input.gymId,
        member_id: currentUser.uid,
        member_name: currentUser.displayName ?? 'GymFlow 會員',
        category: input.category,
        start_at: input.startAt,
        duration_minutes: input.durationMinutes,
        max_delay_minutes: input.maxDelayMinutes,
        priority: 1,
      })
      if (error) throw new Error(error.message)
      await refresh(client)
      return
    }
    setBookings((items) => [...items, {
      ...input, id: crypto.randomUUID(), memberId: 'demo-member',
      memberName: '小宇', status: 'pending',
    }])
  }, [requireCloud, refresh])

  const updateEquipmentStatus = useCallback(async (id: string, status: EquipmentStatus) => {
    if (supabaseConfigured) {
      const { client } = requireCloud()
      const { error } = await client.from('equipment').update({ status }).eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(client)
      return
    }
    setEquipment((items) => items.map((item) => item.id === id ? { ...item, status } : item))
  }, [requireCloud, refresh])

  const cancelBooking = useCallback(async (id: string) => {
    if (supabaseConfigured) {
      const { client } = requireCloud()
      const { error } = await client.rpc('cancel_booking', { p_booking_id: id })
      if (error) throw new Error(error.message)
      await refresh(client)
      return
    }
    setBookings((items) => items.map((item) => item.id === id ? { ...item, status: 'cancelled' } : item))
    setSchedules((items) => items.filter((item) => item.bookingId !== id))
  }, [requireCloud, refresh])

  const optimize = useCallback(async () => {
    const pending = bookings.filter((booking) => booking.status === 'pending')
    const active = schedules.filter((item) => !bookings.some(
      (booking) => booking.id === item.bookingId && booking.status === 'cancelled',
    ))
    const result = await runOptimizer(pending, equipment, active)
    if (supabaseConfigured) {
      const { client } = requireCloud()
      if (role !== 'staff' && role !== 'admin') throw new Error('沒有執行排程的權限')
      if (result.schedules.length) {
        const { error } = await client.rpc('commit_schedule_batch', {
          p_schedules: result.schedules.map((item) => ({
            booking_id: item.bookingId,
            equipment_id: item.equipmentId,
            start_at: item.startAt,
            end_at: item.endAt,
            wait_minutes: item.waitMinutes,
          })),
        })
        if (error) throw new Error(error.message)
      }
      await refresh(client)
    } else {
      const assigned = new Set(result.schedules.map((item) => item.bookingId))
      setSchedules((items) => [...items.filter((item) => !assigned.has(item.bookingId)), ...result.schedules])
      setBookings((items) => items.map((item) => {
        const schedule = result.schedules.find((entry) => entry.bookingId === item.id)
        return schedule ? { ...item, status: 'scheduled', equipmentId: schedule.equipmentId } : item
      }))
    }
    setOptimization(result)
    return result
  }, [bookings, equipment, schedules, requireCloud, role, refresh])

  const resetDemo = useCallback(() => {
    if (supabaseConfigured) return
    applySnapshot(demoSnapshot)
    setOptimization(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [applySnapshot])

  const signInWithGoogle = useCallback(async () => {
    const client = createClient()
    if (!client) throw new Error('尚未設定 Supabase 環境變數')
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw new Error(error.message)
  }, [])

  const logout = useCallback(async () => {
    const client = createClient()
    if (!client) return
    const { error } = await client.auth.signOut()
    if (error) throw new Error(error.message)
  }, [])

  const value = useMemo(() => ({
    gyms, equipment, bookings, schedules, user, role, cloudReady, authLoading,
    supabaseConfigured, optimization, toast, addGym, addEquipment, addBooking,
    updateEquipmentStatus, cancelBooking, optimize, resetDemo, signInWithGoogle,
    logout, setMode, mode, notify,
  }), [
    gyms, equipment, bookings, schedules, user, role, cloudReady, authLoading,
    optimization, toast, addGym, addEquipment, addBooking,
    updateEquipmentStatus, cancelBooking, optimize, resetDemo, signInWithGoogle,
    logout, mode, notify,
  ])

  return <GymFlowContext.Provider value={value}>{children}</GymFlowContext.Provider>
}

export function useGymFlowData() {
  const context = useContext(GymFlowContext)
  if (!context) throw new Error('useGymFlowData must be used within a GymFlowProvider')
  return context
}
