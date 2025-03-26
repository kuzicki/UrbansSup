// Глобальные переменные
let chats = []; // Храним все чаты в памяти
let nextTempId = -1; // Для временных ID до сохранения на сервере
let currentActiveChatId = null; // Текущий активный чат

// 1. Вспомогательные функции
function showLoadingState(isLoading) {
    const btn = document.getElementById('newChatBtn');
    if (btn) {
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = 'Создание...';
        } else {
            btn.disabled = false;
            btn.innerHTML = 'Новый чат';
        }
    }
}

function showEmptyChatMessage() {
    const chatHistory = document.getElementById('chatHistory');
    if (chatHistory) {
        chatHistory.innerHTML = '<div class="empty-message">Выберите чат или создайте новый</div>';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    const container = document.getElementById('chatContainer') || document.body;
    container.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// 2. Функции работы с чатами
async function loadChats() {
    try {
        showLoadingState(true);
        const response = await fetch('/langchain_api/chats/', {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        chats = await response.json();
        updateChatListUI();

        if (chats.length > 0) {
            // Активируем первый чат
            currentActiveChatId = chats[0].id;
            setActiveChat(currentActiveChatId);
            await loadChatHistory(currentActiveChatId);
        } else {
            showEmptyChatMessage();
        }
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        showError('Не удалось загрузить список чатов');
    } finally {
        showLoadingState(false);
    }
}

async function createNewChat() {
    if (!jwtToken) {
        showError('Требуется авторизация');
        return;
    }

    // Создаем временный объект чата
    const tempId = nextTempId--;
    const newChat = {
        id: tempId,
        title: 'Новый чат',
        isTemp: true
    };

    // Оптимистичное обновление UI
    chats.unshift(newChat);
    updateChatListUI();
    setActiveChat(tempId);
    showLoadingState(true);

    try {
        const response = await fetch('/langchain_api/chats/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ title: 'Новый чат' })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Ошибка сервера');
        }

        const serverChat = await response.json();

        // Заменяем временный чат на серверный
        const index = chats.findIndex(c => c.id === tempId);
        if (index !== -1) {
            chats[index] = serverChat;
            chats[index].isTemp = false;
        }

        // Обновляем UI
        updateChatListUI();
        currentActiveChatId = serverChat.id;
        setActiveChat(serverChat.id);
        await loadChatHistory(serverChat.id);

    } catch (error) {
        console.error('Ошибка создания чата:', error);
        const index = chats.findIndex(c => c.id === tempId);
        if (index !== -1) {
            chats[index].error = true;
            chats[index].title = 'Ошибка создания';
            updateChatListUI();
        }
        showError('Не удалось создать чат');
    } finally {
        showLoadingState(false);
    }
}

// 3. Функции работы с UI
function updateChatListUI() {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    chatList.innerHTML = '';

    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.error ? 'error' : ''} ${chat.isTemp ? 'temp' : ''} ${chat.id === currentActiveChatId ? 'active' : ''}`;
        chatItem.textContent = chat.title;
        chatItem.dataset.chatId = chat.id;

        if (chat.isTemp) {
            chatItem.innerHTML += ' <span class="loading-dots">...</span>';
        }

        chatItem.addEventListener('click', () => {
            if (!chat.error && !chat.isTemp) {
                currentActiveChatId = chat.id;
                setActiveChat(chat.id);
                loadChatHistory(chat.id);
            }
        });

        chatList.appendChild(chatItem);
    });
}

function setActiveChat(chatId) {
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.chatId == chatId);
    });
    currentActiveChatId = chatId;
}

// 4. Функции работы с историей сообщений
async function loadChatHistory(chatId) {
    try {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;

        chatHistory.innerHTML = '<div class="loading-message">Загрузка сообщений...</div>';

        const response = await fetch(`/get-chat-history/${chatId}/`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messages = await response.json();
        renderMessages(messages);
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            chatHistory.innerHTML = '<div class="error-message">Не удалось загрузить историю чата</div>';
        }
    }
}

function renderMessages(messages) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    chatHistory.innerHTML = '';

    if (messages.length === 0) {
        chatHistory.innerHTML = '<div class="empty-message">Нет сообщений</div>';
        return;
    }

    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender}`;
        msgDiv.textContent = msg.text;
        chatHistory.appendChild(msgDiv);
    });

    // Прокручиваем вниз
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 5. Инициализация приложения
function initializeChatApp() {
    // Проверяем необходимые элементы DOM
    if (!document.getElementById('chatList') ||
        !document.getElementById('newChatBtn') ||
        !document.getElementById('chatHistory')) {
        console.error('Не найдены необходимые элементы DOM');
        return;
    }

    // Назначаем обработчики событий
    document.getElementById('newChatBtn').addEventListener('click', createNewChat);

    // Загружаем чаты
    loadChats();
}

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', initializeChatApp);