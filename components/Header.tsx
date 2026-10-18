'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGymFlowData } from './GymFlowProvider'

export function Header() {
  const data = useGymFlowData()
  const router = useRouter()
  const pathname = usePathname()
  const canOpenAdmin =
    !data.supabaseConfigured || (!!data.user && (data.role === 'staff' || data.role === 'admin'))

  const changeMode = (next: 'member' | 'admin') => {
    if (next === 'admin' && !canOpenAdmin) return
    data.setMode(next)
    router.push(next === 'admin' ? '/admin' : '/')
  }

  const handleLogin = () => {
    void data.signInWithGoogle().catch((error: Error) => data.notify(error.message))
  }

  const handleLogout = () => {
    void data.logout().catch((error: Error) => data.notify(error.message))
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
          <small>{data.cloudReady ? 'Supabase 已同步' : '資料存在此裝置'}</small>
        </span>
        {data.supabaseConfigured ? (
          data.user ? (
            <button className="icon-button" onClick={handleLogout} title="登出" aria-label="登出">
              ↗
            </button>
          ) : (
            <button className="soft-button" onClick={handleLogin}>
              Google 登入
            </button>
          )
        ) : (
          <span className="avatar">悠</span>
        )}

        <details className="mobile-account-menu">
          <summary className="mobile-menu-trigger" aria-label="開啟帳號及導航選單">
            <span aria-hidden="true">☰</span>
            <span>選單</span>
          </summary>
          <div className="mobile-menu-panel">
            <div className="mobile-menu-profile">
              <strong>{data.user?.displayName || (data.supabaseConfigured ? '尚未登入' : '示範模式')}</strong>
              <small>{data.cloudReady ? '● Supabase 已同步' : data.authLoading ? '正在連線…' : '尚未同步雲端資料'}</small>
            </div>
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} onClick={() => data.setMode('member')}>
              會員前台
            </Link>
            {canOpenAdmin && (
              <Link href="/admin" aria-current={pathname === '/admin' ? 'page' : undefined} onClick={() => data.setMode('admin')}>
                人員後台
              </Link>
            )}
            {data.supabaseConfigured && (
              data.user ? (
                <button onClick={handleLogout}>登出帳號</button>
              ) : (
                <button onClick={handleLogin}>使用 Google 登入</button>
              )
            )}
          </div>
        </details>
      </div>
    </header>
  )
}
