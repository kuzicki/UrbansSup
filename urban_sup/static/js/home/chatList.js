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
        const response = await fetch(SESSIONS_API, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        const data = await response.json();
        chats = data.sessions.map(session => ({
            id: session.session_id,
            title: session.first_message || 'Новый диалог'
        }));
        
        updateChatListUI();
    } catch (error) {
        showError('Ошибка загрузки диалогов');
    }
}

async function createNewChat() {
    try {
        const response = await fetch(CHAT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ user_query: "Начнём диалог" })
        });
        
        const data = await response.json();
        const newChat = {
            id: data.session_id,
            title: data.response.substring(0, 50)  // Обрезаем длинный текст
        };
        
        chats.unshift(newChat);
        updateChatListUI();
        setActiveChat(newChat.id);
    } catch (error) {
        showError('Ошибка создания диалога');
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