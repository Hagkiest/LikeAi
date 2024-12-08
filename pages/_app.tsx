import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 在客户端加载时执行的全局初始化
  }, [])

  return <Component {...pageProps} />
} 