import type { Metadata } from 'next'
import { GymFlowProvider } from '@/components/GymFlowProvider'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'GymFlow — 輕鬆安排每一次訓練',
  description: 'GymFlow 智慧健身房預約與器材排程',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <GymFlowProvider>{children}</GymFlowProvider>
      </body>
    </html>
  )
}
