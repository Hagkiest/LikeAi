import './globals.scss'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '您的网站名称',
  description: '网站描述',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
} 