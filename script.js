document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const newChatButton = document.querySelector('.new-chat');
    const conversationList = document.querySelector('.conversation-group');

    // Cookie 相关函数
    const COOKIE_CONSENT_KEY = 'cookie_consent';
    const CONVERSATIONS_KEY = 'conversations';
    
    // 添加游客消息限制相关函数
    const GUEST_MESSAGE_KEY = 'guest_messages';
    const GUEST_RESET_TIME_KEY = 'guest_reset_time';
    const MAX_GUEST_MESSAGES = 7;

    // 添加自动保存计时器变量
    let autoSaveTimer = null;

    // 检查cookie权限
    function checkCookieConsent() {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent === null) {
            document.getElementById('cookieConsent').style.display = 'flex';
        }
        return consent === 'accepted';
    }

    // 保存对话到cookie
    function saveConversation(id, title, messages) {
        if (!checkCookieConsent()) return;
        
        let conversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '{}');
        conversations[id] = {
            title: title,
            messages: messages,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }

    // 加载对话
    function loadConversations() {
        if (!checkCookieConsent()) return {};
        return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '{}');
    }

    // 创建新对话
    function createNewChat(initialMessage = null) {
        const id = 'chat_' + new Date().getTime();
        const newConversationItem = document.createElement('div');
        newConversationItem.className = 'conversation-item';
        newConversationItem.dataset.id = id;
        newConversationItem.innerHTML = `<span>${initialMessage || '新对话'}</span>`;
        
        // 移除其他active类
        document.querySelectorAll('.conversation-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        newConversationItem.classList.add('active');
        const newChatElement = document.querySelector('.new-chat');
        newChatElement.insertAdjacentElement('afterend', newConversationItem);
        
        if (!initialMessage) {
            chatMessages.innerHTML = '';
        }
        
        // 保存新对话
        saveConversation(id, initialMessage || '新对话', getCurrentMessages());
        
        // 添加右键菜单
        addContextMenu(newConversationItem);
        
        // 添加点击事件
        addConversationClickHandler(newConversationItem);
    }

    // 添加右键菜单
    function addContextMenu(element) {
        element.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.innerHTML = `
                <div class="context-menu-item rename">重命名</div>
                <div class="context-menu-item delete">删除对话</div>
            `;
            
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            document.body.appendChild(menu);
            
            // 重命名功能
            menu.querySelector('.rename').addEventListener('click', function() {
                const newTitle = prompt('请输入新的对��名称:', element.querySelector('span').textContent);
                if (newTitle) {
                    element.querySelector('span').textContent = newTitle;
                    saveConversation(element.dataset.id, newTitle, getCurrentMessages());
                }
                menu.remove();
            });
            
            // 删除功能
            menu.querySelector('.delete').addEventListener('click', function() {
                if (confirm('确定要删除这个对话吗？')) {
                    let conversations = loadConversations();
                    delete conversations[element.dataset.id];
                    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
                    element.remove();
                }
                menu.remove();
            });
            
            // 点击其他地方关闭菜单
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        });
    }

    // 获取当前消息列表
    function getCurrentMessages() {
        const messages = [];
        chatMessages.querySelectorAll('.message').forEach(msg => {
            messages.push({
                text: msg.querySelector('.message-text').textContent,
                sender: msg.classList.contains('user-message') ? 'user' : 'assistant'
            });
        });
        return messages;
    }

    // 加载对话内容
    function loadConversation(id) {
        const conversations = loadConversations();
        const conversation = conversations[id];
        if (conversation) {
            chatMessages.innerHTML = '';
            conversation.messages.forEach(msg => {
                addMessage(msg.text, msg.sender);
            });
        }
    }

    // 添加对话点击事件处理
    function addConversationClickHandler(element) {
        element.addEventListener('click', function() {
            // 保存当前对话
            const currentActive = document.querySelector('.conversation-item.active');
            if (currentActive) {
                saveConversation(
                    currentActive.dataset.id,
                    currentActive.querySelector('span').textContent,
                    getCurrentMessages()
                );
            }

            // 切换到新对话
            document.querySelectorAll('.conversation-item.active').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');
            loadConversation(element.dataset.id);
        });
    }

    // 添加加密解密函数
    function encryptApiKey(key) {
        // 使用 Base64 编码并添加混淆
        const encoded = btoa(key);
        return encoded.split('').reverse().join('') + 'LIKE_AI';
    }

    function decryptApiKey(encryptedKey) {
        // 移除混淆并解码
        const encoded = encryptedKey.replace('LIKE_AI', '').split('').reverse().join('');
        return atob(encoded);
    }

    // 修改 API 配置
    const API_CONFIG = {
        url: '/api/chat',
        apiKey: 'FlNLoixiykbsGXdAemOC:rkRUvDmPbNJPBaHboopD'
    };

    // 修改 API 请求函数
    async function sendToAI(messages) {
        try {
            const response = await fetch(API_CONFIG.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'lite',
                    messages: [
                        {
                            role: "system",
                            content: "你是一个知识渊博的AI助手，现在你的名字叫LikeXF，请记住这一点。"
                        },
                        ...messages
                    ],
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // 用于调试

            if (data.code === 0 && data.choices && data.choices[0].message) {
                let aiResponse = data.choices[0].message.content;
                
                // 对游客用户限制回复长度
                if (localStorage.getItem('username') === 'guest') {
                    if (aiResponse.length > 600) {
                        aiResponse = aiResponse.substring(0, 600) + '\n\n[剩余内容请登录后查看...]';
                    }
                }
                
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message assistant-message';
                
                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                avatar.textContent = 'AI';

                const content = document.createElement('div');
                content.className = 'message-content';
                
                const messageText = document.createElement('div');
                messageText.className = 'message-text';
                
                content.appendChild(messageText);
                messageDiv.appendChild(avatar);
                messageDiv.appendChild(content);
                chatMessages.appendChild(messageDiv);

                // 逐字显示处理后的内容
                let processedText = '';
                let index = 0;
                
                function typeText() {
                    if (index < aiResponse.length) {
                        processedText += aiResponse[index];
                        // 处理数学公式和Markdown
                        const mathProcessed = renderMath(processedText);
                        messageText.innerHTML = marked.parse(mathProcessed);
                        index++;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        setTimeout(typeText, 50);
                    }
                }
                typeText();

                return aiResponse;
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            console.error('API请求失败:', error);
            addMessage('抱歉，我遇到了一些问题，请稍后再试。', 'assistant');
            return '抱歉，我遇到了一些问题，请稍后再试。';
        }
    }

    // 检查游客消息限制
    function checkGuestMessageLimit() {
        if (localStorage.getItem('username') !== 'guest') return true;

        const now = new Date().getTime();
        const resetTime = localStorage.getItem(GUEST_RESET_TIME_KEY);
        const messageCount = JSON.parse(localStorage.getItem(GUEST_MESSAGE_KEY) || '0');

        // 检查是否需要重置计数（新的一天）
        if (resetTime && now - parseInt(resetTime) >= 24 * 60 * 60 * 1000) {
            localStorage.setItem(GUEST_MESSAGE_KEY, '0');
            localStorage.setItem(GUEST_RESET_TIME_KEY, now.toString());
            return true;
        }

        // 如果第一次发送消息，设置重置时间
        if (!resetTime) {
            localStorage.setItem(GUEST_RESET_TIME_KEY, now.toString());
        }

        // 检查消息数量
        if (messageCount >= MAX_GUEST_MESSAGES) {
            addMessage('游客用户每天只能发送3条消息，请登录后继续使用。', 'assistant');
            return false;
        }

        return true;
    }

    // 更新游客消息计数
    function updateGuestMessageCount() {
        if (localStorage.getItem('username') === 'guest') {
            const count = parseInt(localStorage.getItem(GUEST_MESSAGE_KEY) || '0');
            localStorage.setItem(GUEST_MESSAGE_KEY, (count + 1).toString());
        }
    }

    // 修改发送消息函数
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // 检查游客消息限制
            if (!checkGuestMessageLimit()) {
                messageInput.value = '';
                return;
            }

            // 如果是第一条消息，创建新对话
            if (!document.querySelector('.conversation-item.active')) {
                createNewChat(message);
            }

            // 添加用户消息
            addMessage(message, 'user');
            
            // 更新游客消息计数
            updateGuestMessageCount();
            
            const activeChat = document.querySelector('.conversation-item.active');
            if (activeChat) {
                if (activeChat.querySelector('span').textContent === '新对话') {
                    activeChat.querySelector('span').textContent = message;
                }
            }
            
            messageInput.value = '';

            try {
                // 获取当前对话的所有消息
                const messages = getCurrentMessages().map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));

                // 发送到AI并获取响应
                await sendToAI(messages);
                
                // 保存对话
                if (activeChat) {
                    saveConversation(
                        activeChat.dataset.id,
                        activeChat.querySelector('span').textContent,
                        getCurrentMessages()
                    );
                }

                // 更新游客剩余次数显示
                if (localStorage.getItem('username') === 'guest') {
                    const remainingMessages = MAX_GUEST_MESSAGES - 
                        (parseInt(localStorage.getItem(GUEST_MESSAGE_KEY) || '0'));
                    updateModelVersionDisplay(remainingMessages);
                }
            } catch (error) {
                console.error('发送消息失败:', error);
            }
        }
    }

    // Cookie consent 处理
    document.getElementById('acceptCookies').addEventListener('click', function() {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        document.getElementById('cookieConsent').style.display = 'none';
        loadSavedConversations();
    });

    document.getElementById('declineCookies').addEventListener('click', function() {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        document.getElementById('cookieConsent').style.display = 'none';
    });

    // 修改 Markdown 渲染配置
    const renderer = new marked.Renderer();
    renderer.code = function(code, language) {
        // 确保代码块有语言标识
        language = language || 'plaintext';
        try {
            // 使用 highlight.js ��行代码高亮
            const highlighted = hljs.highlight(code, {
                language: language,
                ignoreIllegals: true
            }).value;
            return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
        } catch (e) {
            console.error('代码高亮失败:', e);
            // 如果高亮失败，返回普通代码块
            return `<pre><code class="hljs">${code}</code></pre>`;
        }
    };

    // 配置 marked
    marked.setOptions({
        renderer: renderer,
        highlight: null, // 我们使用自定义的renderer.code，所以这里设为null
        gfm: true, // 启用 GitHub 风格的 Markdown
        breaks: true, // 允许回车换行
        pedantic: false,
        sanitize: false, // 不要转义 HTML
        smartLists: true,
        smartypants: false
    });

    // 处理数学公式
    function renderMath(text) {
        return text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex, { displayMode: true });
            } catch (e) {
                console.error('KaTeX error:', e);
                return tex;
            }
        }).replace(/\$([\s\S]+?)\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex, { displayMode: false });
            } catch (e) {
                console.error('KaTeX error:', e);
                return tex;
            }
        });
    }

    // 修改消息显示函数
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '我' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';

        // 处理数学公式和代码块
        if (sender === 'assistant') {
            try {
                // 先处理数学公式
                const mathProcessed = renderMath(text);
                // 再处理 Markdown，确保代码块被正确处理
                messageText.innerHTML = marked.parse(mathProcessed);
                
                // 手动触发代码高亮
                messageText.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            } catch (e) {
                console.error('渲染失败:', e);
                messageText.textContent = text;
            }
        } else {
            messageText.textContent = text;
        }

        content.appendChild(messageText);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        
        // 滚动到最新消息
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 修改加载保存的对话函数
    function loadSavedConversations() {
        if (checkCookieConsent()) {
            const conversations = loadConversations();
            const sortedConversations = Object.entries(conversations)
                .sort(([,a], [,b]) => b.timestamp - a.timestamp);

            // 加载所有对话到侧边栏
            sortedConversations.forEach(([id, conv]) => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.id = id;
                item.innerHTML = `<span>${conv.title}</span>`;
                document.querySelector('.new-chat').insertAdjacentElement('afterend', item);
                addContextMenu(item);
                addConversationClickHandler(item);
            });

            // 如果有对话，加载最新的一个对话内容
            if (sortedConversations.length > 0) {
                const [latestId, latestConv] = sortedConversations[0];
                const latestItem = document.querySelector(`[data-id="${latestId}"]`);
                if (latestItem) {
                    latestItem.classList.add('active');
                    latestConv.messages.forEach(msg => {
                        addMessage(msg.text, msg.sender);
                    });
                }
            }
        }
    }

    // 修改初始欢迎消息
    function showWelcomeMessage() {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message assistant-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        content.appendChild(messageText);
        welcomeMessage.appendChild(avatar);
        welcomeMessage.appendChild(content);
        chatMessages.appendChild(welcomeMessage);

        // 逐字显示欢迎消息
        const text = '你好！我是LikeXF，有什么需要吗？';
        let index = 0;
        
        function typeText() {
            if (index < text.length) {
                messageText.textContent += text[index];
                index++;
                setTimeout(typeText, 50);
            }
        }
        
        typeText();
    }

    // 修改初始化部分
    function initialize() {
        checkCookieConsent();
        const conversations = loadConversations();
        
        // 添加欢迎弹窗
        const username = localStorage.getItem('username');
        if (username && username !== 'guest') {
            showWelcomePopup(username);
        }
        
        if (Object.keys(conversations).length > 0) {
            loadSavedConversations();
        } else {
            showWelcomeMessage();
        }

        // 如果是游客，显示消息限制提示
        if (localStorage.getItem('username') === 'guest') {
            const remainingMessages = MAX_GUEST_MESSAGES - 
                (parseInt(localStorage.getItem(GUEST_MESSAGE_KEY) || '0'));
            updateModelVersionDisplay(remainingMessages);
            addMessage(`您正在以游客身份使用，每天可发送${MAX_GUEST_MESSAGES}条消息，今天还剩${remainingMessages}条。`, 'assistant');
        }

        // 设置自动保存定时器
        setupAutoSave();
    }

    // 初始化
    initialize();

    // 添加事件监听器
    newChatButton.addEventListener('click', () => createNewChat());
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 修改输入框占位符
    messageInput.placeholder = "给'LikeXF'发送消息";

    // 添加用户菜单功能
    const userAvatar = document.getElementById('userAvatar');
    let userDropdown = null;

    function createUserDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <div class="user-dropdown-item" onclick="logout()">退出登录</div>
            <div class="user-dropdown-item" onclick="window.open('pricing.html', '_blank')">购买套餐</div>
        `;
        return dropdown;
    }

    userAvatar.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        
        // 移除已存在的下拉菜单
        if (userDropdown) {
            userDropdown.remove();
        }

        // 建新的下拉菜单
        userDropdown = createUserDropdown();
        document.body.appendChild(userDropdown);
        
        // 设置位置
        const rect = userAvatar.getBoundingClientRect();
        userDropdown.style.position = 'fixed';
        userDropdown.style.top = `${rect.bottom + 5}px`;
        userDropdown.style.right = `${window.innerWidth - rect.right}px`;
        userDropdown.classList.add('show');
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (userDropdown && !userAvatar.contains(e.target)) {
            userDropdown.remove();
            userDropdown = null;
        }
    });

    // 添加退出登录函数
    window.logout = function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    };

    // 设置用户头像显示
    const username = localStorage.getItem('username');
    userAvatar.textContent = username === 'guest' ? '游' : username[0].toUpperCase();

    // 修改升级提示的点击事件
    document.querySelector('.upgrade-prompt').addEventListener('click', function() {
        window.open('pricing.html', '_blank');
    });

    // 添加自动保存功能
    function setupAutoSave() {
        // 清除之前定时器
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }

        // 每分钟保存一次
        autoSaveTimer = setInterval(() => {
            const activeChat = document.querySelector('.conversation-item.active');
            if (activeChat) {
                saveConversation(
                    activeChat.dataset.id,
                    activeChat.querySelector('span').textContent,
                    getCurrentMessages()
                );
            }
        }, 60000); // 60秒
    }

    // 修改更新模型版本显示的函数
    function updateModelVersionDisplay(remainingMessages) {
        const modelVersionElement = document.querySelector('.model-version');
        if (!modelVersionElement) {
            const versionDisplay = document.createElement('div');
            versionDisplay.className = 'model-version';
            versionDisplay.style.position = 'fixed';
            // 修改位置到左上角
            versionDisplay.style.top = '10px';
            versionDisplay.style.left = '10px';  // 改为左对齐
            versionDisplay.style.padding = '5px 10px';
            versionDisplay.style.backgroundColor = '#f0f0f0';
            versionDisplay.style.borderRadius = '5px';
            versionDisplay.style.zIndex = '1000'; // 确保显示在最上层
            versionDisplay.style.fontSize = '14px'; // 设置合适的字体大小
            document.body.appendChild(versionDisplay);
        }
        
        const displayText = localStorage.getItem('username') === 'guest' 
            ? `模型版本: 2 (剩余次数: ${remainingMessages})` 
            : '模型版本: 2';
        
        document.querySelector('.model-version').textContent = displayText;
    }

    // 修改欢迎弹窗函数
    function showWelcomePopup(username) {
        const popup = document.createElement('div');
        popup.className = 'welcome-popup';
        popup.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-icon">✨</div>
                <div class="welcome-text">${username} 欢迎您！</div>
            </div>
        `;
        
        // 添加弹窗样式
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = '#4CAF50';  // 使用绿色背景
        popup.style.padding = '30px 60px';        // 增大内边距
        popup.style.borderRadius = '12px';        // 增大圆角
        popup.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        popup.style.zIndex = '10000';
        popup.style.animation = 'welcomeFade 2.5s forwards';
        popup.style.minWidth = '300px';          // 设置最小宽度
        popup.style.textAlign = 'center';        // 文字居中
        
        // 设置文字样式
        const welcomeText = popup.querySelector('.welcome-text');
        welcomeText.style.color = '#ffffff';     // 白色文字
        welcomeText.style.fontSize = '24px';     // 更大的字体
        welcomeText.style.fontWeight = 'bold';   // 加粗文字
        welcomeText.style.marginTop = '10px';    // 添加上边距
        
        // 设置图标样式
        const welcomeIcon = popup.querySelector('.welcome-icon');
        welcomeIcon.style.fontSize = '36px';     // 更大的图标
        welcomeIcon.style.color = '#ffffff';     // 白色图标
        welcomeIcon.style.marginBottom = '10px'; // 添加下边距
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes welcomeFade {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -60%) scale(0.8); 
                }
                20% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1); 
                }
                80% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1); 
                }
                100% { 
                    opacity: 0; 
                    transform: translate(-50%, -40%) scale(0.8); 
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(popup);
        
        // 2.5秒后自动移除弹窗
        setTimeout(() => {
            popup.remove();
            style.remove();
        }, 2500);
    }

    // 监听输入框内容变化
    messageInput.addEventListener('input', function() {
        sendButton.disabled = !this.value.trim();
    });

    // 初始状态设置
    sendButton.disabled = true;
}); 