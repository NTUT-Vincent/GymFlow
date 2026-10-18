'use client'

import Link from 'next/link'

interface NavButtonProps {
  icon: string
  label: string
  href: string
  active: boolean
}

export function NavButton({ icon, label, href, active }: NavButtonProps) {
  return (
    <Link
      href={href}
      className={`nav-button ${active ? 'active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-icon" aria-hidden="true">{icon}</span>
      <span className="nav-label">{label}</span>
    </Link>
  )
}
