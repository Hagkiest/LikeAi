class ChatManager {
    constructor() {
        this.chats = this.loadChats();
        this.currentChatId = null;
        this.setupEventListeners();
        this.renderChatList();
        this.updateUserPoints();
        if (this.chats.length === 0) {
            this.createNewChat();
        }
    }

    setCookie(name, value, days = 30) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + ";" + expires + ";path=/";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    loadChats() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const userChats = this.getCookie(`chats_${user.id}`);
            if (userChats) {
                return userChats;
            }
        }
        return [];
    }

    saveChats() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            this.setCookie(`chats_${user.id}`, this.chats);
        }
    }

    createNewChat() {
        const chatId = Date.now().toString();
        const newChat = {
            id: chatId,
            name: '新对话',
            messages: []
        };
        this.chats.unshift(newChat);
        this.saveChats();
        this.renderChatList();
        this.selectChat(chatId);
    }

    selectChat(chatId) {
        this.currentChatId = chatId;
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === chatId) {
                item.classList.add('active');
            }
        });
        this.renderMessages();
    }

    renameChat(chatId, newName) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.name = newName;
            this.saveChats();
            this.renderChatList();
        }
    }

    deleteChat(chatId) {
        this.chats = this.chats.filter(c => c.id !== chatId);
        this.saveChats();
        this.renderChatList();
        if (this.currentChatId === chatId) {
            this.currentChatId = this.chats[0]?.id || null;
            this.renderMessages();
        }
    }

    renderChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = this.chats.map(chat => `
            <div class="chat-item ${chat.id === this.currentChatId ? 'active' : ''}" 
                 data-id="${chat.id}">
                ${chat.name}
            </div>
        `).join('');
    }

    formatMessage(content) {
        // 处理代码块
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre class="code-block"><code>${code}</code></pre>`;
        });

        // 处理数学公式 $...$
        content = content.replace(/\$(.*?)\$/g, (match, formula) => {
            return `<span class="math-formula">${formula}</span>`;
        });

        return content;
    }

    async typeMessage(element, text, speed = 50) {
        let index = 0;
        const formattedText = this.formatMessage(text);
        element.innerHTML = '';  // 使用 innerHTML 而不是 textContent
        
        // 创建临时 div 来解析 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedText;
        const textContent = tempDiv.textContent;
        
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (index < textContent.length) {
                    // 逐字显示，但保持 HTML 标签
                    element.innerHTML = this.formatMessage(textContent.substring(0, index + 1));
                    index++;
                } else {
                    clearInterval(interval);
                    // 最后设置完整的格式化文本
                    element.innerHTML = formattedText;
                    resolve();
                }
            }, speed);
        });
    }

    async renderMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        const currentChat = this.chats.find(c => c.id === this.currentChatId);
        if (currentChat) {
            messagesContainer.innerHTML = currentChat.messages.map(msg => {
                const content = msg.content || '';
                const formattedContent = msg.type === 'user' ? content : this.formatMessage(content);
                return `
                    <div class="message ${msg.type}">
                        <div class="message-avatar">${msg.type === 'user' ? '朕' : 'AI'}</div>
                        <div class="message-content">${msg.type === 'user' ? content : ''}</div>
                    </div>
                `;
            }).join('');

            // 如果最后一条消息是 AI 的回复，添加打字机效果
            const lastMessage = currentChat.messages[currentChat.messages.length - 1];
            if (lastMessage && lastMessage.type === 'assistant') {
                const lastMessageElement = messagesContainer.lastElementChild.querySelector('.message-content');
                await this.typeMessage(lastMessageElement, lastMessage.content);
            }

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            messagesContainer.innerHTML = '';
        }
    }

    setupEventListeners() {
        // 创建新对话
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.createNewChat();
        });

        // 发送消息
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        const sendMessage = async () => {
            await this.sendMessage();
        };

        sendButton.addEventListener('click', sendMessage);

        messageInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await sendMessage();
            }
        });

        // 右键菜单
        this.setupContextMenus();

        // 点击对话列表项
        document.getElementById('chatList').addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-item');
            if (chatItem) {
                this.selectChat(chatItem.dataset.id);
            }
        });
    }

    setupContextMenus() {
        const chatContextMenu = document.getElementById('chatContextMenu');
        const avatarContextMenu = document.getElementById('avatarContextMenu');

        // 对话列表右键菜单
        document.getElementById('chatList').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const chatItem = e.target.closest('.chat-item');
            if (chatItem) {
                chatContextMenu.style.display = 'block';
                
                // 计算菜单位置
                const rect = chatItem.getBoundingClientRect();
                chatContextMenu.style.left = `${rect.right + 5}px`;
                chatContextMenu.style.top = `${rect.top}px`;
                
                chatContextMenu.dataset.chatId = chatItem.dataset.id;
            }
        });

        // 用户头像右键菜单
        document.getElementById('userAvatar').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const avatar = e.target.closest('.user-profile');
            if (avatar) {
                avatarContextMenu.style.display = 'flex';
                
                // 计算菜单位置
                const rect = avatar.getBoundingClientRect();
                const menuWidth = avatarContextMenu.offsetWidth;
                const menuHeight = avatarContextMenu.offsetHeight;
                
                // 检查右边界
                let leftPos = rect.left + (rect.width / 2);
                if (leftPos + menuWidth > window.innerWidth) {
                    leftPos = window.innerWidth - menuWidth - 10;
                }
                
                // 检查下边界
                let topPos = rect.bottom + 5;
                if (topPos + menuHeight > window.innerHeight) {
                    topPos = rect.top - menuHeight - 5;
                }
                
                avatarContextMenu.style.left = `${leftPos}px`;
                avatarContextMenu.style.top = `${topPos}px`;
            }
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.user-profile')) {
                chatContextMenu.style.display = 'none';
                avatarContextMenu.style.display = 'none';
            }
        });

        // 处理右键菜单项点击
        chatContextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const chatId = chatContextMenu.dataset.chatId;

            if (action === 'rename') {
                const newName = prompt('请输入新的对话名称：');
                if (newName) {
                    this.renameChat(chatId, newName);
                }
            } else if (action === 'delete') {
                if (confirm('确定要删除这个对话吗？')) {
                    this.deleteChat(chatId);
                }
            }
        });
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (content && this.currentChatId) {
            const chat = this.chats.find(c => c.id === this.currentChatId);
            
            // 获取用户信息
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('请先登录');
                window.location.href = '/login.html';
                return;
            }

            // 添加用户消息
            const userMessage = {
                type: 'user',
                content: content
            };
            chat.messages.push(userMessage);
            this.renderMessages();
            messageInput.value = '';

            // 显示AI正在输入的动画
            this.showTypingIndicator();

            try {
                // 准备发送给API的消息历史
                const messages = chat.messages.map(msg => ({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }));

                // 发送请求到后端
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Api-Key': ENCRYPTED_API_KEY
                    },
                    body: JSON.stringify({ 
                        messages,
                        model: "lite",
                        userId: user.id
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '请求失败');
                }

                const data = await response.json();
                
                if (data.code === 0 && data.choices && data.choices[0] && data.choices[0].message) {
                    // 从服务器获取最新积分
                    await this.updateUserPoints();
                    
                    // 创建新的AI消息
                    const aiMessage = {
                        type: 'assistant',
                        content: data.choices[0].message.content || ''
                    };
                    chat.messages.push(aiMessage);
                    await this.renderMessages();
                    this.saveChats();
                    
                    // 滚动到底部
                    const messagesContainer = document.getElementById('chatMessages');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                } else {
                    throw new Error('Invalid response from API');
                }

                this.hideTypingIndicator();
            } catch (error) {
                console.error('Error:', error);
                this.hideTypingIndicator();
                // 显示错误消息
                const errorMessage = {
                    type: 'assistant',
                    content: error.message || '抱歉，发生了一些错误，请稍后重试。'
                };
                chat.messages.push(errorMessage);
                this.renderMessages();
                this.saveChats();
            }
        }
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message';
        typingIndicator.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator')?.parentElement;
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updatePointsDisplay() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const messageInput = document.getElementById('messageInput');
            messageInput.placeholder = `输入消息，Shift + Enter 换行（基础积分：${user.normal_points} 高级积分：${user.premium_points}）`;
        }
    }

    async updateUserPoints() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                const response = await fetch(`/api/user/points?userId=${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    user.normal_points = data.normal_points;
                    user.premium_points = data.premium_points;
                    localStorage.setItem('user', JSON.stringify(user));
                    this.updatePointsDisplay();
                }
            } catch (error) {
                console.error('Failed to update points:', error);
            }
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
}); 