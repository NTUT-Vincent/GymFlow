import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { equipmentCategories } from './data/demo'
import { useGymFlowData } from './hooks/useGymFlowData'
import { logout, signInWithGoogle } from './lib/firebase'
import type { Booking, Equipment, EquipmentStatus, Gym, ScheduleItem } from './types'

type MemberPage = 'home' | 'booking' | 'equipment' | 'schedule'
type ViewMode = 'member' | 'admin'

const time = (iso?: string) => iso
  ? new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
  : '—'

const dateLabel = (iso: string) => new Intl.DateTimeFormat('zh-TW', {
  month: 'long', day: 'numeric', weekday: 'short',
}).format(new Date(iso))

const statusLabel: Record<EquipmentStatus, string> = {
  available: '現在可用',
  in_use: '使用中',
  maintenance: '休息維修',
}

const statusIcon: Record<EquipmentStatus, string> = {
  available: '✓',
  in_use: '⌛',
  maintenance: '✎',
}

function Doodle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`doodle ${className}`}>{children}</span>
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="empty-state sketch-card">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function App() {
  const data = useGymFlowData()
  const [mode, setMode] = useState<ViewMode>('member')
  const [page, setPage] = useState<MemberPage>('home')
  const [toast, setToast] = useState('')
  const [working, setWorking] = useState(false)

  const canOpenAdmin = !data.cloudReady || data.role === 'staff' || data.role === 'admin'
  const currentGym = data.gyms[0]

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const changeMode = (next: ViewMode) => {
    if (next === 'admin' && !canOpenAdmin) {
      notify('這個帳號目前是會員角色，請由管理員調整權限。')
      return
    }
    setMode(next)
  }

  const runOptimization = async () => {
    setWorking(true)
    try {
      const result = await data.optimize()
      notify(`排程完成：安排 ${result.schedules.length} 筆，${result.unassignedBookingIds.length} 筆待人工確認。`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '排程失敗，請稍後再試。')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setMode('member'); setPage('home') }} aria-label="回到首頁">
          <span className="brand-mark">GF</span>
          <span>
            <strong>GymFlow</strong>
            <small>move easy, feel good</small>
          </span>
        </button>

        <div className="mode-switch" aria-label="切換前後台">
          <button className={mode === 'member' ? 'active' : ''} onClick={() => changeMode('member')}>會員前台</button>
          <button className={mode === 'admin' ? 'active' : ''} onClick={() => changeMode('admin')}>人員後台</button>
        </div>

        <div className="account-area">
          <span className={`sync-dot ${data.cloudReady ? 'online' : ''}`} />
          <span className="account-copy">
            <strong>{data.user?.displayName || (data.cloudReady ? 'GymFlow 會員' : '示範模式')}</strong>
            <small>{data.cloudReady ? 'Firebase 已同步' : '資料存在此裝置'}</small>
          </span>
          {data.firebaseConfigured ? (
            data.user
              ? <button className="icon-button" onClick={() => logout()} title="登出">↗</button>
              : <button className="soft-button" onClick={() => signInWithGoogle()}>Google 登入</button>
          ) : <span className="avatar">悠</span>}
        </div>
      </header>

      {mode === 'member' ? (
        <div className="workspace">
          <nav className="sidebar">
            <div className="side-title">今天想怎麼動？</div>
            <NavButton icon="⌂" label="我的首頁" active={page === 'home'} onClick={() => setPage('home')} />
            <NavButton icon="＋" label="預約器材" active={page === 'booking'} onClick={() => setPage('booking')} />
            <NavButton icon="◌" label="器材狀態" active={page === 'equipment'} onClick={() => setPage('equipment')} />
            <NavButton icon="≋" label="我的排程" active={page === 'schedule'} onClick={() => setPage('schedule')} />
            <div className="sidebar-note">
              <Doodle>☁</Doodle>
              <strong>慢慢來也很好</strong>
              <span>預約會替你留好節奏</span>
            </div>
          </nav>

          <main className="main-content">
            {page === 'home' && <MemberHome {...data} memberId={data.user?.uid ?? 'demo-member'} memberName={data.user?.displayName || '小宇'} onBook={() => setPage('booking')} />}
            {page === 'booking' && <BookingPage gym={currentGym} onSubmit={data.addBooking} onDone={() => { notify('預約需求已送出，等候排程分配。'); setPage('schedule') }} />}
            {page === 'equipment' && <EquipmentPage equipment={data.equipment} />}
            {page === 'schedule' && <SchedulePage memberId={data.user?.uid ?? 'demo-member'} bookings={data.bookings} schedules={data.schedules} onCancel={async (id) => { await data.cancelBooking(id); notify('已取消這筆預約。') }} />}
          </main>
        </div>
      ) : (
        <main className="admin-content">
          <AdminDashboard
            gyms={data.gyms}
            equipment={data.equipment}
            bookings={data.bookings}
            schedules={data.schedules}
            optimization={data.optimization}
            working={working}
            cloudReady={data.cloudReady}
            onOptimize={runOptimization}
            onAddGym={async (value) => { await data.addGym(value); notify('新場館已加入。') }}
            onAddEquipment={async (value) => { await data.addEquipment(value); notify('器材已加入清單。') }}
            onStatusChange={data.updateEquipmentStatus}
            onResetDemo={() => { data.resetDemo(); notify('已還原示範資料。') }}
          />
        </main>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function NavButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{icon}</span>{label}
    </button>
  )
}

function MemberHome({ gyms, equipment, schedules, bookings, memberId, memberName, onBook }: ReturnType<typeof useGymFlowData> & { memberId: string; memberName: string; onBook: () => void }) {
  const available = equipment.filter((item) => item.status === 'available')
  const mySchedules = schedules.filter((item) => item.memberId === memberId)
  const next = mySchedules.sort((a, b) => a.startAt.localeCompare(b.startAt))[0]
  const pending = bookings.filter((item) => item.memberId === memberId && item.status === 'pending').length

  return (
    <>
      <section className="hero sketch-card">
        <div className="hero-copy">
          <span className="eyebrow">今天也替自己留一點時間</span>
          <h1>嗨，{memberName}！<br /><em>舒服地動起來吧。</em></h1>
          <p>{gyms[0]?.name || 'GymFlow'} 現在有 <strong>{available.length} 台器材</strong> 可以直接使用。</p>
          <button className="primary-button" onClick={onBook}>＋ 預約今天的訓練</button>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <span className="scribble sun">✦</span>
          <div className="person"><i /><b /><span /></div>
          <div className="dumbbell"><i /><b /><i /></div>
          <span className="scribble motion">〰 〰</span>
        </div>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">YOUR FLOW</span><h2>接下來的安排</h2></div>
        <span className="hand-note">照自己的步調就好 ↘</span>
      </div>

      <div className="dashboard-grid">
        <section className="next-session sketch-card">
          {next ? (
            <>
              <div className="card-top"><span className="date-chip">{dateLabel(next.startAt)}</span><span className="confirmed">✓ 已安排</span></div>
              <div className="session-time">{time(next.startAt)} <span>— {time(next.endAt)}</span></div>
              <h3>{next.equipmentName}</h3>
              <p>{next.category}・{next.waitMinutes ? `等待 ${next.waitMinutes} 分鐘` : '準時開始'}</p>
              <div className="session-footer"><span>⌖ {gyms[0]?.name}</span><span>記得帶水壺 ◡̈</span></div>
            </>
          ) : <EmptyState icon="☁" title="還沒有排程" text="選一台喜歡的器材開始吧。" />}
        </section>

        <section className="mini-stats">
          <div className="stat sketch-card"><span>可用器材</span><strong>{available.length}<small> 台</small></strong><i className="trend">即時</i></div>
          <div className="stat sketch-card"><span>待分配</span><strong>{pending}<small> 筆</small></strong><i>排程器會幫忙</i></div>
        </section>
      </div>

      <div className="section-heading compact"><div><span className="eyebrow">AVAILABLE NOW</span><h2>現在可用的器材</h2></div></div>
      <div className="equipment-preview">
        {available.slice(0, 4).map((item) => <EquipmentCard key={item.id} item={item} />)}
      </div>
    </>
  )
}

function BookingPage({ gym, onSubmit, onDone }: {
  gym?: Gym
  onSubmit: (value: Omit<Booking, 'id' | 'memberId' | 'memberName' | 'status'>) => Promise<void>
  onDone: () => void
}) {
  const defaultStart = new Date(Date.now() + 60 * 60 * 1000)
  defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 15) * 15, 0, 0)
  const [category, setCategory] = useState(equipmentCategories[0])
  const [startAt, setStartAt] = useState(defaultStart.toISOString().slice(0, 16))
  const [duration, setDuration] = useState(30)
  const [flexible, setFlexible] = useState(30)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!gym) return
    setSaving(true)
    try {
      await onSubmit({
        gymId: gym.id,
        category,
        startAt: new Date(startAt).toISOString(),
        durationMinutes: duration,
        maxDelayMinutes: flexible,
        priority: 1,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="narrow-page">
      <div className="page-intro"><span className="eyebrow">BOOK A FLOW</span><h1>安排下一次訓練</h1><p>告訴我們想練什麼，排程器會找到最順的器材與時間。</p></div>
      <form className="booking-form sketch-card" onSubmit={submit}>
        <label>想使用的器材
          <div className="category-picker">
            {equipmentCategories.map((item) => <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </label>
        <div className="form-grid">
          <label>希望開始時間<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required /></label>
          <label>訓練時間<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={30}>30 分鐘</option><option value={45}>45 分鐘</option><option value={60}>60 分鐘</option></select></label>
          <label>可接受延後<select value={flexible} onChange={(event) => setFlexible(Number(event.target.value))}><option value={0}>固定時間</option><option value={15}>15 分鐘</option><option value={30}>30 分鐘</option><option value={60}>60 分鐘</option></select></label>
          <label>場館<input value={gym?.name || '尚未建立場館'} disabled /></label>
        </div>
        <div className="form-note"><span>✦</span><p><strong>為什麼保留彈性？</strong><br />多一點彈性通常能顯著降低等待時間，也讓熱門器材分配更公平。</p></div>
        <button className="primary-button wide" disabled={saving || !gym}>{saving ? '送出中…' : '送出預約需求 →'}</button>
      </form>
    </div>
  )
}

function EquipmentPage({ equipment }: { equipment: Equipment[] }) {
  const [filter, setFilter] = useState('全部')
  const categories = ['全部', ...new Set(equipment.map((item) => item.category))]
  const shown = filter === '全部' ? equipment : equipment.filter((item) => item.category === filter)

  return (
    <>
      <div className="page-intro row"><div><span className="eyebrow">LIVE EQUIPMENT</span><h1>器材現在的狀態</h1><p>資訊會跟著現場更新，不用到了才排隊。</p></div><span className="live-badge">● 即時更新</span></div>
      <div className="filter-row">{categories.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="equipment-grid">{shown.map((item) => <EquipmentCard key={item.id} item={item} detailed />)}</div>
    </>
  )
}

function EquipmentCard({ item, detailed = false }: { item: Equipment; detailed?: boolean }) {
  return (
    <article className={`equipment-card sketch-card ${item.status}`}>
      <div className="equipment-drawing"><span>{item.category === '跑步機' ? '⌁' : item.category === '飛輪' ? '◉' : item.category === '深蹲架' ? 'Π' : item.category === '臥推架' ? '⊢' : '⌘'}</span></div>
      <div className="equipment-copy"><span className={`status-pill ${item.status}`}>{statusIcon[item.status]} {statusLabel[item.status]}</span><h3>{item.name}</h3><p>{item.category}・{item.zone}</p>{detailed && <small>最近使用率 {item.utilization}%{item.availableAt ? `・約 ${time(item.availableAt)} 可用` : ''}</small>}</div>
    </article>
  )
}

function SchedulePage({ memberId, bookings, schedules, onCancel }: { memberId: string; bookings: Booking[]; schedules: ScheduleItem[]; onCancel: (id: string) => Promise<void> }) {
  const mine = schedules.filter((item) => item.memberId === memberId)
  const pending = bookings.filter((item) => item.memberId === memberId && item.status === 'pending')

  return (
    <>
      <div className="page-intro"><span className="eyebrow">MY SCHEDULE</span><h1>我的訓練排程</h1><p>排好的節奏會出現在這裡，有變化也可以隨時取消。</p></div>
      <div className="timeline sketch-card">
        {mine.length === 0 && pending.length === 0 ? <EmptyState icon="≋" title="這裡還很安靜" text="預約後，排程就會出現在這裡。" /> : null}
        {pending.map((item) => <div className="timeline-item pending" key={item.id}><div className="timeline-time">{time(item.startAt)}<span>希望時間</span></div><div className="timeline-line"><i /></div><div className="timeline-card"><span className="status-pill in_use">⌛ 等待分配</span><h3>{item.category}</h3><p>{item.durationMinutes} 分鐘・可延後 {item.maxDelayMinutes} 分鐘</p><button className="text-button" onClick={() => onCancel(item.id)}>取消需求</button></div></div>)}
        {mine.map((item) => <div className="timeline-item" key={item.id}><div className="timeline-time">{time(item.startAt)}<span>{dateLabel(item.startAt)}</span></div><div className="timeline-line"><i /></div><div className="timeline-card"><span className="status-pill available">✓ 已安排</span><h3>{item.equipmentName}</h3><p>{item.category}・到 {time(item.endAt)}{item.waitMinutes ? `・等待 ${item.waitMinutes} 分鐘` : ''}</p><button className="text-button" onClick={() => onCancel(item.bookingId)}>取消預約</button></div></div>)}
      </div>
    </>
  )
}

interface AdminProps {
  gyms: Gym[]
  equipment: Equipment[]
  bookings: Booking[]
  schedules: ScheduleItem[]
  optimization: ReturnType<typeof useGymFlowData>['optimization']
  working: boolean
  cloudReady: boolean
  onOptimize: () => Promise<void>
  onAddGym: (value: Omit<Gym, 'id'>) => Promise<void>
  onAddEquipment: (value: Omit<Equipment, 'id'>) => Promise<void>
  onStatusChange: (id: string, status: EquipmentStatus) => Promise<void>
  onResetDemo: () => void
}

function AdminDashboard(props: AdminProps) {
  const [tab, setTab] = useState<'overview' | 'gyms' | 'equipment'>('overview')
  const available = props.equipment.filter((item) => item.status === 'available').length
  const waiting = props.bookings.filter((item) => item.status === 'pending').length

  return (
    <>
      <div className="admin-header">
        <div><span className="eyebrow">GYMFLOW STUDIO</span><h1>場館營運後台</h1><p>早安，今天也讓大家流暢地訓練。</p></div>
        <div className="admin-actions"><span className={`live-badge ${props.cloudReady ? '' : 'demo'}`}>{props.cloudReady ? '● 雲端同步' : '○ 本機示範'}</span><button className="soft-button" onClick={props.onResetDemo}>還原示範</button><button className="primary-button" disabled={props.working} onClick={props.onOptimize}>{props.working ? '正在找最佳安排…' : '✦ 執行最佳化排程'}</button></div>
      </div>

      <div className="admin-tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>營運總覽</button><button className={tab === 'gyms' ? 'active' : ''} onClick={() => setTab('gyms')}>場館管理</button><button className={tab === 'equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>器材管理</button></div>

      {tab === 'overview' && (
        <>
          <div className="admin-stats">
            <Metric label="今日預約" value={String(props.bookings.filter((item) => item.status !== 'cancelled').length)} note="包含待排程需求" icon="▤" />
            <Metric label="現在可用" value={`${available}/${props.equipment.length}`} note="台器材" icon="✓" />
            <Metric label="待排程" value={String(waiting)} note={waiting ? '建議執行最佳化' : '目前都安排好了'} icon="⌛" />
            <Metric label="平均使用率" value={`${Math.round(props.equipment.reduce((sum, item) => sum + item.utilization, 0) / Math.max(1, props.equipment.length))}%`} note="依示範數據" icon="↗" />
          </div>

          {props.optimization && <div className="optimizer-result sketch-card"><span className="optimizer-icon">✦</span><div><strong>本次排程已完成</strong><p>安排 {props.optimization.schedules.length} 筆・未分配 {props.optimization.unassignedBookingIds.length} 筆・求解 {props.optimization.elapsedMs}ms・{props.optimization.optimal ? '已證明最佳解' : '限時最佳可行解'}</p></div><span className="score">score {props.optimization.score}</span></div>}

          <div className="admin-grid">
            <section className="admin-panel sketch-card"><div className="panel-heading"><div><span className="eyebrow">LIVE FLOOR</span><h2>現場器材</h2></div><span>{available} 台可用</span></div><div className="compact-equipment-list">{props.equipment.slice(0, 6).map((item) => <EquipmentRow key={item.id} item={item} onChange={props.onStatusChange} />)}</div></section>
            <section className="admin-panel sketch-card"><div className="panel-heading"><div><span className="eyebrow">SCHEDULE QUEUE</span><h2>排程佇列</h2></div><span>{waiting} 筆等待</span></div><div className="queue-list">{props.bookings.filter((item) => item.status !== 'cancelled').slice(0, 7).map((item) => { const scheduled = props.schedules.find((schedule) => schedule.bookingId === item.id); return <div className="queue-row" key={item.id}><span className="queue-time">{time(item.startAt)}</span><div><strong>{item.memberName}</strong><small>{item.category}・{item.durationMinutes} 分鐘</small></div><span className={`status-pill ${scheduled ? 'available' : 'in_use'}`}>{scheduled ? scheduled.equipmentName : '待分配'}</span></div> })}</div></section>
          </div>
        </>
      )}

      {tab === 'gyms' && <GymManagement gyms={props.gyms} onAdd={props.onAddGym} />}
      {tab === 'equipment' && <EquipmentManagement gyms={props.gyms} equipment={props.equipment} onAdd={props.onAddEquipment} onChange={props.onStatusChange} />}
    </>
  )
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) {
  return <div className="metric sketch-card"><span className="metric-icon">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>
}

function EquipmentRow({ item, onChange }: { item: Equipment; onChange: (id: string, status: EquipmentStatus) => Promise<void> }) {
  return <div className="equipment-row"><span className="row-icon">{statusIcon[item.status]}</span><div><strong>{item.name}</strong><small>{item.category}・{item.zone}</small></div><select value={item.status} onChange={(event) => onChange(item.id, event.target.value as EquipmentStatus)}><option value="available">可用</option><option value="in_use">使用中</option><option value="maintenance">維修</option></select></div>
}

function GymManagement({ gyms, onAdd }: { gyms: Gym[]; onAdd: (value: Omit<Gym, 'id'>) => Promise<void> }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); await onAdd({ name, address, openTime: '06:00', closeTime: '23:00' }); setName(''); setAddress('') }
  return <div className="management-layout"><section className="admin-panel sketch-card"><div className="panel-heading"><div><span className="eyebrow">LOCATIONS</span><h2>目前場館</h2></div><span>{gyms.length} 間</span></div><div className="gym-list">{gyms.map((gym) => <article key={gym.id}><span className="gym-pin">⌖</span><div><h3>{gym.name}</h3><p>{gym.address}</p><small>{gym.openTime} — {gym.closeTime}</small></div></article>)}</div></section><form className="admin-form sketch-card" onSubmit={submit}><span className="eyebrow">NEW LOCATION</span><h2>新增健身房</h2><label>場館名稱<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：GymFlow 大安館" required /></label><label>地址<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="輸入完整地址" required /></label><div className="form-grid"><label>開門<input type="time" value="06:00" readOnly /></label><label>休息<input type="time" value="23:00" readOnly /></label></div><button className="primary-button wide">＋ 新增場館</button></form></div>
}

function EquipmentManagement({ gyms, equipment, onAdd, onChange }: { gyms: Gym[]; equipment: Equipment[]; onAdd: (value: Omit<Equipment, 'id'>) => Promise<void>; onChange: (id: string, status: EquipmentStatus) => Promise<void> }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(equipmentCategories[0])
  const [zone, setZone] = useState('自由重量區')
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!gyms[0]) return; await onAdd({ gymId: gyms[0].id, name, category, zone, status: 'available', utilization: 0 }); setName('') }
  return <div className="management-layout equipment-management"><section className="admin-panel sketch-card"><div className="panel-heading"><div><span className="eyebrow">EQUIPMENT</span><h2>器材清單</h2></div><span>{equipment.length} 台</span></div><div className="compact-equipment-list">{equipment.map((item) => <EquipmentRow key={item.id} item={item} onChange={onChange} />)}</div></section><form className="admin-form sketch-card" onSubmit={submit}><span className="eyebrow">NEW EQUIPMENT</span><h2>新增器材</h2><label>器材名稱<input value={name} onChange={(event) => setName(event.target.value)} placeholder="幫它取個好記的名字" required /></label><label>類型<select value={category} onChange={(event) => setCategory(event.target.value)}>{equipmentCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label>所在區域<input value={zone} onChange={(event) => setZone(event.target.value)} required /></label><button className="primary-button wide" disabled={!gyms.length}>＋ 加入器材</button></form></div>
}

export default App
