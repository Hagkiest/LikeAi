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

    // Cookie 相关函数
    const COOKIE_CONSENT_KEY = 'cookie_consent';
    const CONVERSATIONS_KEY = 'conversations';
    
    // 添加自动保存计时器变量
    let autoSaveTimer = null;

    // 添加积分相关常量
    const POINTS_KEY = 'user_points';
    const LAST_CHECKIN_KEY = 'last_checkin';
    const BASIC_POINTS_COST = 3; // 每次对话消耗的基础积分

    // 初始化积分系统
    function initializePoints() {
        const username = localStorage.getItem('username');
        const points = JSON.parse(localStorage.getItem(POINTS_KEY) || '{}');
        
        if (!points[username]) {
            points[username] = {
                basic: 10,
                advanced: 1
            };
            localStorage.setItem(POINTS_KEY, JSON.stringify(points));
        }
    }

    // 获取用户积分
    function getUserPoints() {
        const username = localStorage.getItem('username');
        const points = JSON.parse(localStorage.getItem(POINTS_KEY) || '{}');
        return points[username] || { basic: 0, advanced: 0 };
    }

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
        
        document.querySelectorAll('.conversation-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        newConversationItem.classList.add('active');
        const newChatElement = document.querySelector('.new-chat');
        newChatElement.insertAdjacentElement('afterend', newConversationItem);
        
        if (!initialMessage) {
            chatMessages.innerHTML = '';
        }
        
        saveConversation(id, initialMessage || '新对话', getCurrentMessages());
        addContextMenu(newConversationItem);
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
            
            menu.querySelector('.rename').addEventListener('click', function() {
                const newTitle = prompt('请输入新的对话名称:', element.querySelector('span').textContent);
                if (newTitle) {
                    element.querySelector('span').textContent = newTitle;
                    saveConversation(element.dataset.id, newTitle, getCurrentMessages());
                }
                menu.remove();
            });
            
            menu.querySelector('.delete').addEventListener('click', function() {
                if (confirm('确定要删除这个对话吗？')) {
                    let conversations = loadConversations();
                    delete conversations[element.dataset.id];
                    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
                    element.remove();
                }
                menu.remove();
            });
            
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        });
    }

    // 添加上下文限制配置
    const CONTEXT_LIMITS = {
        guest: {
            free: 0,        // 游客试用版不支持上下文
            paid: 1024      // 游客付费版支持1024字上下文
        },
        user: 4096         // 登录用户支持4096字上下文
    };

    // 添加提醒标记
    let hasShownContextLimitWarning = false;

    // 修改获取当前消息列表函数
    function getCurrentMessages() {
        return Array.from(chatMessages.querySelectorAll('.message')).map(msg => {
            const messageText = msg.querySelector('.message-text');
            return {
                role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                content: messageText ? messageText.textContent.trim() : ''
            };
        }).filter(msg => msg.content); // 过滤掉空消息
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
            const currentActive = document.querySelector('.conversation-item.active');
            if (currentActive) {
                saveConversation(
                    currentActive.dataset.id,
                    currentActive.querySelector('span').textContent,
                    getCurrentMessages()
                );
            }

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
            // 获取用户输入的消息
            const userMessage = messages.find(msg => msg.role === 'user');
            if (!userMessage || !userMessage.content.trim()) {
                throw new Error('消息内容不能为空');
            }

            const response = await fetch(API_CONFIG.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'lite',
                    messages: [{
                        role: 'user',
                        content: userMessage.content.trim()
                    }],
                    stream: false
                })
            });

            const data = await response.json();
            console.log('API Response:', data);

            // 处理错误响应
            if (data.error) {
                throw new Error(data.error.message || '请求失败');
            }

            // 处理成功响应
            if (data.code === 0 && data.choices && data.choices[0] && data.choices[0].message) {
                let aiResponse = data.choices[0].message.content;
                
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
                throw new Error('无效的响应格式');
            }
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 修改更新积分显示函数
    function updatePointsDisplay() {
        const points = getUserPoints();
        const username = localStorage.getItem('username');
        
        // 只显示积分，不显示模型版本
        const modelVersionElement = document.querySelector('.model-version');
        if (!modelVersionElement) {
            const pointsDisplay = document.createElement('div');
            pointsDisplay.className = 'model-version';
            pointsDisplay.style.position = 'fixed';
            pointsDisplay.style.top = '10px';
            pointsDisplay.style.left = '10px';
            pointsDisplay.style.padding = '5px 10px';
            pointsDisplay.style.backgroundColor = '#f0f0f0';
            pointsDisplay.style.borderRadius = '5px';
            pointsDisplay.style.zIndex = '1000';
            pointsDisplay.style.fontSize = '14px';
            document.body.appendChild(pointsDisplay);
        }
        
        // 只对非管理员显示积分
        if (username !== 'admin') {
            document.querySelector('.model-version').textContent = 
                `基础积分: ${points.basic} | 高级积分: ${points.advanced}`;
        } else {
            // 管理员不显示任何内容
            document.querySelector('.model-version').style.display = 'none';
        }
    }

    // 修改检查并扣除积分函数
    function checkAndDeductPoints() {
        const username = localStorage.getItem('username');
        if (username === 'admin') return true;

        const points = JSON.parse(localStorage.getItem(POINTS_KEY) || '{}');
        if (!points[username]) {
            points[username] = { basic: 0, advanced: 0 };
        }

        // 检查积分是否足够
        if (points[username].basic >= BASIC_POINTS_COST) {
            // 扣除积分
            points[username].basic -= BASIC_POINTS_COST;
            localStorage.setItem(POINTS_KEY, JSON.stringify(points));
            updatePointsDisplay();
            return true;
        }
        
        addMessage('积分不足，请签到获取更多积分。', 'assistant');
        return false;
    }

    // 签到功能
    window.checkIn = function() {
        const username = localStorage.getItem('username');
        const lastCheckin = localStorage.getItem(LAST_CHECKIN_KEY);
        const today = new Date().toDateString();

        if (lastCheckin === today) {
            alert('今天已经签到过了，明天再来吧！');
            return;
        }

        const points = JSON.parse(localStorage.getItem(POINTS_KEY) || '{}');
        if (!points[username]) {
            points[username] = { basic: 0, advanced: 0 };
        }
        points[username].basic += 10;
        points[username].advanced += 1;
        localStorage.setItem(POINTS_KEY, JSON.stringify(points));
        localStorage.setItem(LAST_CHECKIN_KEY, today);
        
        updatePointsDisplay();
        alert('签到成功！获得10个基础积分和1个高级积分');
    };

    // 添加等待提示函数
    function showThinkingMessage() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message assistant-message thinking';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.innerHTML = '<div class="thinking-dots"><span>.</span><span>.</span><span>.</span></div>';
        
        content.appendChild(messageText);
        thinkingDiv.appendChild(avatar);
        thinkingDiv.appendChild(content);
        chatMessages.appendChild(thinkingDiv);
        
        // 滚动到底
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return thinkingDiv;
    }

    // 修改发送消息函数
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        try {
            // 检查积分
            if (!checkAndDeductPoints()) {
                return;
            }

            // 如果是第一条消息，创建新对话
            if (!document.querySelector('.conversation-item.active')) {
                createNewChat(message);
            }

            // 添加用户消息并立即保存
            addMessage(message, 'user');
            autoSaveCurrentChat();
            
            // 添加思考中提示
            const thinkingMessage = showThinkingMessage();
            messageInput.value = '';

            // 构造消息对象
            const messages = [{
                role: 'user',
                content: message
            }];

            // 发送到AI并获取响应
            await sendToAI(messages);
            
            // 移除思考中提示
            thinkingMessage.remove();
            
            // 再次保存对话（包含AI回复）
            autoSaveCurrentChat();
        } catch (error) {
            console.error('发送消息失败:', error);
            thinkingMessage.remove();
            addMessage(error.message || '抱歉，我遇到了一些问题，请稍后再试。', 'assistant');
            // 出错时也保存对话
            autoSaveCurrentChat();
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
            // 使用 highlight.js 进行代码高亮
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

        if (sender === 'assistant') {
            try {
                const mathProcessed = renderMath(text);
                messageText.innerHTML = marked.parse(mathProcessed);
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
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 每次添加消息后立即保存
        autoSaveCurrentChat();
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

    // 修改初始化部分
    function initialize() {
        checkCookieConsent();
        initializePoints();
        updatePointsDisplay();
        
        // 添加欢迎弹窗
        const username = localStorage.getItem('username');
        if (username && username !== 'guest') {
            showWelcomePopup(username);
        }
        
        // 加载保存的对话
        if (checkCookieConsent()) {
            loadSavedConversations();
        } else {
            showWelcomeMessage();
        }

        // 设置自动保存
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
            <div class="user-dropdown-item" onclick="checkIn()">每日签到</div>
            <div class="user-dropdown-item" onclick="window.open('points-convert.html', '_blank')">积分转换</div>
            <div class="user-dropdown-item" onclick="logout()">退出登录</div>
            <div class="user-dropdown-item" onclick="window.open('pricing.html', '_blank')">积分说明</div>
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
        navigateTo('login.html');
    };

    // 设置用户头像显示
    const username = localStorage.getItem('username');
    userAvatar.textContent = username === 'guest' ? '游' : username[0].toUpperCase();

    // 修改升级提示的点击事件
    document.querySelector('.upgrade-prompt').addEventListener('click', function() {
        window.open('pricing.html', '_blank');
    });

    // 修改自动保存设置
    function setupAutoSave() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
        // 每30秒自动保存一次
        autoSaveTimer = setInterval(autoSaveCurrentChat, 30000);
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
        
        // 加弹窗样式
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
        welcomeText.style.fontWeight = 'bold';   // 加粗字体
        welcomeText.style.marginTop = '10px';    // 添加上边距
        
        // 设置图标样式
        const welcomeIcon = popup.querySelector('.welcome-icon');
        welcomeIcon.style.fontSize = '36px';     // 更大图标
        welcomeIcon.style.color = '#ffffff';     // 白色图标
        welcomeIcon.style.marginBottom = '10px'; // 添加下边距
        
        // 添动画样式
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
        
        // 2.5秒后动移除弹窗
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

    // 模型选择功能
    const modelDropdown = document.getElementById('modelDropdown');
    const modelMenu = document.getElementById('modelMenu');

    modelDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        modelMenu.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        modelMenu.classList.remove('show');
    });

    // 更新说明弹窗功能
    const updateLink = document.getElementById('updateLink');
    const updateModal = document.getElementById('updateModal');
    const closeModal = document.getElementById('closeModal');

    updateLink.addEventListener('click', function() {
        updateModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', function() {
        updateModal.style.display = 'none';
    });

    updateModal.addEventListener('click', function(e) {
        if (e.target === updateModal) {
            updateModal.style.display = 'none';
        }
    });

    // 输入框换行支持
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            
            this.value = value.substring(0, start) + '\n' + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            
            // 调整输入框高度
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 输入框自动调整高度
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        // 限制最大高度
        if (this.scrollHeight > 200) {
            this.style.height = '200px';
            this.style.overflowY = 'auto';
        }
    });

    // 修改模型选择功能
    const modalOverlay = document.getElementById('modalOverlay');

    modelDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        modelMenu.classList.toggle('show');
        modalOverlay.classList.toggle('show');
    });

    // 点击遮罩层关闭菜单
    modalOverlay.addEventListener('click', function() {
        modelMenu.classList.remove('show');
        modalOverlay.classList.remove('show');
    });

    // 修改原的点击事件监听器
    document.addEventListener('click', function(e) {
        if (!modelMenu.contains(e.target) && !modelDropdown.contains(e.target)) {
            modelMenu.classList.remove('show');
            modalOverlay.classList.remove('show');
        }
    });

    // 初始化积分系统
    initializePoints();
    updatePointsDisplay();

    // 添加自动保存函数
    function autoSaveCurrentChat() {
        const activeChat = document.querySelector('.conversation-item.active');
        if (activeChat) {
            const messages = Array.from(chatMessages.querySelectorAll('.message')).map(msg => ({
                text: msg.querySelector('.message-text').textContent,
                sender: msg.classList.contains('user-message') ? 'user' : 'assistant'
            }));

            saveConversation(
                activeChat.dataset.id,
                activeChat.querySelector('span').textContent,
                messages
            );
        }
    }

    // 添加更多自动保存触发点
    chatMessages.addEventListener('input', autoSaveCurrentChat);  // 编辑消息时
    chatMessages.addEventListener('paste', autoSaveCurrentChat);  // 粘贴内容时
    window.addEventListener('beforeunload', autoSaveCurrentChat); // 页面关闭前

    // 添加页面过渡函数
    function navigateTo(url) {
        // 创建过渡元素
        const transition = document.createElement('div');
        transition.className = 'page-transition';
        document.body.appendChild(transition);

        // 触发过渡动画
        setTimeout(() => {
            transition.classList.add('active');
        }, 50);

        // 等待动画完成后跳转
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    }

    // 修改所有跳转代码
    userAvatar.onclick = () => navigateTo('login.html');

    // 修改登录提示弹窗中的跳转
    loginPrompt.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #333;">提示</h3>
        <p style="margin-bottom: 20px; color: #666;">您暂未登录，即将跳转到登录页面...</p>
        <button onclick="navigateTo('login.html')" style="
            padding: 8px 30px;
            background: #1a8cff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 15px;
        ">立即登录</button>
    `;

    // 修改自动跳转
    setTimeout(() => {
        navigateTo('login.html');
    }, 3000);
}); 