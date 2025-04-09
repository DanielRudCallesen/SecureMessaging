document.addEventListener('DOMContentLoaded', () => {
    // Initialize services
    const authService = new AuthService();
    const cryptoService = new CryptoService();
    const chatService = new ChatService(authService, cryptoService);

    // DOM Elements
    const loginContainer = document.getElementById('login-container');
    const chatContainer = document.getElementById('chat-container');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const usersList = document.getElementById('users-list');
    const recipientHeader = document.getElementById('recipient-header');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    let userListInterval;

    async function refreshUsersList() {
        try {
            const users = await authService.getUsers();
            const currentUser = authService.getCurrentUser();
            
            usersList.innerHTML = '';
            
            // Add each user except the current one
            users.forEach(username => {
                if (username !== currentUser) {
                    const userElement = document.createElement('div');
                    userElement.className = 'user-item';
                    userElement.textContent = username;
                    userElement.addEventListener('click', () => {
                        document.querySelectorAll('.user-item').forEach(el => {
                            el.classList.remove('active');
                        });
                        
                        userElement.classList.add('active');
                        chatService.setActiveRecipient(username);
                    });
                    usersList.appendChild(userElement);
                }
            });
        } catch (error) {
            console.error('Load users error:', error);
        }
    }

    function startUserListRefresh() {
        refreshUsersList();
        
        userListInterval = setInterval(refreshUsersList, 15000);
    }

    function stopUserListRefresh() {
        if (userListInterval) {
            clearInterval(userListInterval);
            userListInterval = null;
        }
    }
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    chatService.onMessageReceived = (sender, message) => {
        if (sender === chatService.activeRecipient) {
            displayMessages(chatService.getMessagesForUser(sender));
        }
    };

    chatService.onUserSelected = (username, messages) => {
        displayMessages(messages);
        recipientHeader.innerHTML = `<h2>Chat with ${username}</h2>`;
        messageInput.disabled = false;
        sendBtn.disabled = false;
    };

    chatService.onUserListUpdate = refreshUsersList;

    async function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showError('Username and password are required');
            return;
        }

        try {
            loginError.textContent = '';
            await authService.login(username, password);
            
            await cryptoService.init();
            await chatService.initConnection();
            
            startUserListRefresh();
            showChatUI();
        } catch (error) {
            showError(error.message || 'Login failed');
        }
    }

    async function handleLogout() {
        try {
            stopUserListRefresh();
            chatService.disconnect();
            await authService.logout();
            showLoginUI();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async function handleSendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        try {
            await chatService.sendMessage(message);
            messageInput.value = '';
            
            displayMessages(chatService.getMessagesForUser(chatService.activeRecipient));
        } catch (error) {
            console.error('Send message error:', error);
            alert('Failed to send message: ' + error.message);
        }
    }

    function displayMessages(messages) {
        chatMessages.innerHTML = '';
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.isSent ? 'sent' : 'received'}`;
            
            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            messageText.textContent = msg.message;
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = new Date(msg.timestamp).toLocaleTimeString();
            
            messageElement.appendChild(messageText);
            messageElement.appendChild(messageTime);
            chatMessages.appendChild(messageElement);
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showError(message, type = 'error') {
        loginError.textContent = message;
        loginError.style.color = type === 'success' ? '#16a085' : '#e74c3c';
    }

    function showLoginUI() {
        loginContainer.classList.remove('hidden');
        chatContainer.classList.add('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        loginError.textContent = '';
    }

    function showChatUI() {
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        messageInput.disabled = true;
        sendBtn.disabled = true;
        recipientHeader.innerHTML = '<h2>Select a user to chat with</h2>';
        chatMessages.innerHTML = '';
    }

    showLoginUI();
}); 