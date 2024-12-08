import { useEffect, useState, useRef } from 'react'
import { marked } from 'marked'
import katex from 'katex'
import hljs from 'highlight.js'

// 保持原有的常量
const COOKIE_CONSENT_KEY = 'cookie_consent'
const CONVERSATIONS_KEY = 'conversations'
const GUEST_MESSAGE_KEY = 'guest_messages'
const GUEST_RESET_TIME_KEY = 'guest_reset_time'
const MAX_GUEST_MESSAGES = 7

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [autoSaveTimer, setAutoSaveTimer] = useState(null)
  const chatMessagesRef = useRef(null)
  
  // 保持原有的cookie检查逻辑
  const checkCookieConsent = () => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (consent === null) {
      document.getElementById('cookieConsent').style.display = 'flex'
    }
    return consent === 'accepted'
  }

  // 保持原有的对话保存逻辑
  const saveConversation = (id, title, messages) => {
    if (!checkCookieConsent()) return
    
    let conversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '{}')
    conversations[id] = {
      title: title,
      messages: messages,
      timestamp: new Date().getTime()
    }
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
  }

  // 继续原有的其他功能...
  // 这里会包含script.js中的所有功能，但转换为React的方式

  return (
    <div className="chat-container">
      <div className="model-selector">
        <span className="model-name">LikeXF</span>
        <button className="model-dropdown">▼</button>
        <div className="user-menu">
          <div className="user-avatar" id="userAvatar">我</div>
        </div>
      </div>

      <div className="chat-area">
        <div className="chat-messages" ref={chatMessagesRef}>
          {/* 消息列表 */}
        </div>
        
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="给'LikeXF'发送消息"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            ↑
          </button>
        </div>
      </div>

      {/* 保持原有的功能按钮 */}
      <div className="function-buttons">
        <button className="function-btn">创建图片</button>
        <button className="function-btn">总结文本</button>
        <button className="function-btn">快捷键帮助</button>
        <button className="function-btn">代码</button>
        <button className="function-btn">提供建议</button>
        <button className="function-btn more-btn">更多</button>
      </div>
    </div>
  )
} 