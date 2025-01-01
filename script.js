document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        navigateTo('login.html');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const newChatButton = document.querySelector('.new-chat');
    const conversationList = document.querySelector('.conversation-group');
    const userAvatar = document.querySelector('.user-avatar');

    // Cookie 相关函数
    const COOKIE_CONSENT_KEY = 'cookie_consent';
    const CONVERSATIONS_KEY = 'conversations';
    
    // API 配置
    const API_CONFIG = {
        url: '/api/chat'
    };

    // 显示用户菜单
    function showUserMenu(event) {
        event.preventDefault();
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="checkIn()">签到</div>
            <div class="menu-item" onclick="window.location.href='pricing.html'">积分说明</div>
            <div class="menu-item" onclick="window.location.href='points-convert.html'">积分转换</div>
            <div class="menu-item" onclick="logout()">退出登录</div>
        `;
        
        // 移除现有菜单
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        document.body.appendChild(menu);
        menu.style.position = 'absolute';
        menu.style.top = `${event.pageY}px`;
        menu.style.left = `${event.pageX}px`;
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== userAvatar) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    // 显示思考中的消息
    function showThinkingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message thinking';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = '思考中...';
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    // 添加消息到聊天界面
    function addMessage(content, role = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '我' : 'AI';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (role === 'assistant') {
            messageText.innerHTML = marked.parse(renderMath(content));
        } else {
            messageText.textContent = content;
        }
        
        messageContent.appendChild(messageText);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    // 渲染数学公式
    function renderMath(text) {
        return text.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula);
            } catch (e) {
                console.error('Math rendering error:', e);
                return match;
            }
        });
    }

    // 发送消息到 AI
    async function sendToAI(messages) {
        try {
            const response = await fetch(API_CONFIG.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'lite',
                    messages: messages,
                    stream: false
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message || '请求失败');
            }

            if (data.code === 0 && data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error('无效的响应格式');
            }
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 保存对话
    function saveConversation() {
        if (!checkCookieConsent()) return;
        
        const messages = Array.from(chatMessages.children).map(msg => ({
            role: msg.classList.contains('user-message') ? 'user' : 'assistant',
            content: msg.querySelector('.message-text').textContent
        }));

        const conversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
        conversations.push({
            id: Date.now(),
            messages: messages,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
        loadConversationList();
    }

    // 加载对话列表
    function loadConversationList() {
        if (!checkCookieConsent() || !conversationList) return;

        const conversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
        conversationList.innerHTML = '';

        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.textContent = conv.messages[0]?.content?.substring(0, 20) || '新对话';
            item.onclick = () => loadConversation(conv);
            conversationList.appendChild(item);
        });
    }

    // 加载特定对话
    function loadConversation(conversation) {
        chatMessages.innerHTML = '';
        conversation.messages.forEach(msg => {
            addMessage(msg.content, msg.role);
        });
    }

    // 开始新对话
    function startNewChat() {
        chatMessages.innerHTML = '';
        saveConversation();
    }

    // 检查cookie权限
    function checkCookieConsent() {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent === null) {
            document.getElementById('cookieConsent').style.display = 'flex';
        }
        return consent === 'accepted';
    }

    // 绑定事件监听器
    function bindEvents() {
        if (sendButton) {
            sendButton.addEventListener('click', handleSend);
        }

        if (messageInput) {
            messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            });
        }

        if (newChatButton) {
            newChatButton.addEventListener('click', startNewChat);
        }

        if (userAvatar) {
            userAvatar.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showUserMenu(e);
            });
        }
    }

    // 初始化函数
    function initialize() {
        bindEvents();
        updatePointsDisplay();
        loadConversationList();
    }

    // 页面加载时初始化
    initialize();
}); 