import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LikeAI - 智能AI助手',
  description: 'LikeAI是一个智能AI聊天助手，提供智能对话、文本生成、代码编写、数学解答等多功能服务。',
  keywords: 'LikeAI, AI聊天, 人工智能对话, AI助手, 智能问答, AI模型, LikeXF'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <link rel="icon" href="/images/logo.ico" type="image/x-icon" />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 