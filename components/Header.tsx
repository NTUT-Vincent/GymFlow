'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useGymFlowData } from './GymFlowProvider'
import { signInWithGoogle, logout } from '@/lib/firebase'

export function Header() {
  const data = useGymFlowData()
  const router = useRouter()
  const pathname = usePathname()
  const canOpenAdmin =
    !data.cloudReady || data.role === 'staff' || data.role === 'admin'

  const changeMode = (next: 'member' | 'admin') => {
    if (next === 'admin' && !canOpenAdmin) return
    data.setMode(next)
    router.push(next === 'admin' ? '/admin' : '/')
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="回到首頁" onClick={() => data.setMode('member')}>
        <span className="brand-mark">GF</span>
        <span>
          <strong>GymFlow</strong>
          <small>move easy, feel good</small>
        </span>
      </Link>

      <div className="mode-switch" aria-label="切換前後台">
        <button
          className={pathname !== '/admin' ? 'active' : ''}
          onClick={() => changeMode('member')}
        >
          會員前台
        </button>
        <button
          className={pathname === '/admin' ? 'active' : ''}
          onClick={() => changeMode('admin')}
          disabled={!canOpenAdmin}
        >
          人員後台
        </button>
      </div>

      <div className="account-area">
        <span className={`sync-dot ${data.cloudReady ? 'online' : ''}`} />
        <span className="account-copy">
          <strong>{data.user?.displayName || (data.cloudReady ? 'GymFlow 會員' : '示範模式')}</strong>
          <small>{data.cloudReady ? 'Firebase 已同步' : '資料存在此裝置'}</small>
        </span>
        {data.firebaseConfigured ? (
          data.user ? (
            <button className="icon-button" onClick={() => data.logout()} title="登出">
              ↗
            </button>
          ) : (
            <button className="soft-button" onClick={() => data.signInWithGoogle()}>
              Google 登入
            </button>
          )
        ) : (
          <span className="avatar">悠</span>
        )}
      </div>
    </header>
  )
}
