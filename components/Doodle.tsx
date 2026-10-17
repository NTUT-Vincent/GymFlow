'use client'

import type { ReactNode } from 'react'

export function Doodle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`doodle ${className}`}>{children}</span>
}
