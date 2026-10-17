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
      onClick={(e) => {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('gymflow-navigate', { detail: { href } }))
      }}
    >
      <span>{icon}</span>{label}
    </Link>
  )
}
