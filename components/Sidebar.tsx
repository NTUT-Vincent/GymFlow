'use client'

import { NavButton } from './NavButton'
import { Doodle } from './Doodle'
import { usePathname } from 'next/navigation'

const navItems: { icon: string; label: string; href: string }[] = [
  { icon: '⌂', label: '我的首頁', href: '/' },
  { icon: '＋', label: '預約器材', href: '/booking' },
  { icon: '◌', label: '器材狀態', href: '/equipment' },
  { icon: '≋', label: '我的排程', href: '/schedule' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="sidebar" aria-label="會員導覽">
      <div className="side-title">今天想怎麼動？</div>
      {navItems.map((item) => (
        <NavButton
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={pathname === item.href}
        />
      ))}
      <div className="sidebar-note">
        <Doodle>☁</Doodle>
        <strong>慢慢來也很好</strong>
        <span>預約會替你留好節奏</span>
      </div>
    </nav>
  )
}
