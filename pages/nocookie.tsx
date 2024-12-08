import { useRouter } from 'next/router'
import styles from '@/styles/NoCookie.module.css'

export default function NoCookie() {
  const router = useRouter()

  const handleRetry = () => {
    localStorage.removeItem('cookieConsent')
    router.push('/')
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <img src="/images/cookies.png" alt="Cookie" />
        </div>
        <div className={styles.iconFallback}>Cookie</div>
        <h1>需要启用Cookie</h1>
        <p>
          很抱歉，我们需要使用Cookie来为您提供更好的服务体验。
          Cookie帮助我们保存您的对话记录和登录状态，这对于网站的正常运行是必需的。
          如果您改变主意了，可以点击下方按钮重新选择。
        </p>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.primary}`}
            onClick={handleRetry}
          >
            重新选择
          </button>
          <button 
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => router.push('/')}
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  )
} 