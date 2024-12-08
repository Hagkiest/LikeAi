import { useEffect, useState } from 'react'
import styles from '@/styles/Pricing.module.css'

export default function Pricing() {
  const [activation, setActivation] = useState(null)

  useEffect(() => {
    checkActivation()
  }, [])

  const checkActivation = () => {
    const storedActivation = localStorage.getItem('activation')
    if (storedActivation) {
      setActivation(JSON.parse(storedActivation))
    }
  }

  const activateCode = (code: string) => {
    const mockActivation = {
      'PERSONAL2024': { version: '个人版', days: 30 },
      'PRO2024': { version: '专业版', days: 30 },
      'DESKTOP2024': { version: '桌面版', days: 36500 }
    }

    const activationData = mockActivation[code]
    if (activationData) {
      const now = new Date().getTime()
      const expireTime = now + (activationData.days * 24 * 60 * 60 * 1000)
      const newActivation = {
        version: activationData.version,
        expireTime: expireTime
      }
      localStorage.setItem('activation', JSON.stringify(newActivation))
      setActivation(newActivation)
      alert('激活成功！')
    } else {
      alert('无效的激活码')
    }
  }

  return (
    <div className={styles.pricingContainer}>
      {/* 保持原有的价格表UI结构 */}
      <div className={styles.pricingHeader}>
        <h1>选择适合您的套餐</h1>
        <p>为您的需求找到完美的解决方案</p>
      </div>

      <div className={styles.pricingTable}>
        {/* 试用版 */}
        <div className={styles.pricingCard}>
          {/* 保持原有的价格卡片内容 */}
        </div>
        {/* 其他价格卡片... */}
      </div>

      <div className={styles.activationSection}>
        <div className={styles.activationStatus}>
          {activation ? (
            <>
              当前版本: {activation.version}<br/>
              到期时间: {new Date(activation.expireTime).toLocaleDateString()}
            </>
          ) : '当前未激活任何付费版本'}
        </div>
        <div className={styles.activationInput}>
          <input
            type="text"
            placeholder="请输入激活码"
            onChange={(e) => activateCode(e.target.value)}
          />
          <button onClick={() => activateCode}>激活</button>
        </div>
      </div>
    </div>
  )
} 