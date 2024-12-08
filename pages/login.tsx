import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '@/styles/Login.module.css'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      router.push('/')
    }
  }, [])

  const handleLogin = () => {
    if (!username || !password) {
      alert('请输入账户名和密码')
      return
    }

    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', username)
      router.push('/')
    } else {
      alert('账户名或密码错误')
    }
  }

  const handleGuestLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', 'guest')
    router.push('/')
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginContainer}>
        <h1 className={styles.loginTitle}>欢迎回来</h1>
        <div className={styles.loginForm}>
          <div className={styles.formGroup}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="账户名"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
            />
            <span 
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>
          <button 
            className={styles.loginButton}
            onClick={handleLogin}
          >
            继续
          </button>
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          <div className={styles.loginOptions}>
            没有账户？
            <a href="#" onClick={handleGuestLogin}>游客登录</a>
          </div>
        </div>
      </div>
    </div>
  )
} 