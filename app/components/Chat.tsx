'use client';

import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import katex from 'katex';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  // 处理发送消息
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 添加用户消息
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'lite',
          messages: [
            {
              role: "system",
              content: "你是一个知识渊博的AI助手，现在你的名字叫LikeXF，请记住这一点。"
            },
            ...newMessages
          ],
          stream: false
        })
      });

      const data = await response.json();
      
      if (data.code === 0 && data.choices && data.choices[0].message) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.choices[0].message.content
        }]);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 聊天消息区域 */}
      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="给'LikeXF'发送消息"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
} 