import { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Chat from '@/components/Chat'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn')
    if (loginStatus !== 'true') {
      window.location.href = '/login'
    } else {
      setIsLoggedIn(true)
    }
  }, [])

  if (!isLoggedIn) return null

  return (
    <>
      <Head>
        <title>LikeAI - 智能AI助手</title>
        <meta name="description" content="LikeAI是一个智能AI聊天助手" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/logo.ico" />
      </Head>
      <main className={styles.main}>
        <Chat />
      </main>
    </>
  )
} 