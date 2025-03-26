document.getElementById('sendBtn').addEventListener('click', sendMessage);

document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function scrollToBottom() {
    const chatHistory = document.getElementById('chatHistory');
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    addMessageToChat('user-message', message);
    input.value = '';
    scrollToBottom();

    // Отправка на сервер
    fetch('/your-api-endpoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({message: message})
    })
        .then(response => response.json())
        .then(data => {
            // Добавляем ответ бота
            addMessageToChat('bot-message', data.response);
            scrollToBottom(); // Прокручиваем после получения ответа
        })
        .catch(error => {
            console.error('Error:', error);
            addMessageToChat('bot-message', 'Произошла ошибка');
            scrollToBottom();
        });
}

function addMessageToChat(className, text) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    chatHistory.appendChild(messageDiv);
}

async function loadChatHistory(chatId) {
    try {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;

        // Показываем индикатор загрузки
        chatHistory.innerHTML = '<div class="loading-message">Загрузка сообщений...</div>';

        const response = await fetch(`/langchain_api/get-chat-history/${chatId}/`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Если чат не найден (404) - показываем приветственное сообщение
            if (response.status === 404) {
                showWelcomeMessage();
                return;
            }
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        const messages = await response.json();

        if (messages.length === 0) {
            showWelcomeMessage();
        } else {
            renderMessages(messages);
        }

    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            // Для других ошибок показываем сообщение с возможностью повторить
            chatHistory.innerHTML = `
                <div class="error-message">
                    Ошибка загрузки истории<br>
                    <button onclick="loadChatHistory(${chatId})">Повторить</button>
                </div>
            `;
        }
    }
}

function showWelcomeMessage() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    chatHistory.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-header">
                <h3>Добро пожаловать в чат!</h3>
                <p>Я ваш виртуальный помощник. Давайте начнём общение!</p>
            </div>
            
            <div class="suggestions-container">
                <p class="suggestion-title">Выберите один из примеров вопросов:</p>
                <div class="suggestion-items">
                    <div class="suggestion-item">Как мне начать работу с системой?</div>
                    <div class="suggestion-item">Какие основные функции доступны?</div>
                    <div class="suggestion-item">Можешь показать пример использования?</div>
                    <div class="suggestion-item">Как я могу решить свою задачу?</div>
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчики клика на примеры вопросов
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const inputField = document.getElementById('chatInput');
            inputField.value = item.textContent;
            inputField.focus();
        });
    });
}

function renderMessages(messages) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    // Очищаем чат
    chatHistory.innerHTML = '';

    // Если нет сообщений
    if (messages.length === 0) {
        chatHistory.innerHTML = '<div class="empty-message">Нет сообщений</div>';
        return;
    }

    // Создаем контейнер для сообщений
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';

    // Добавляем сообщения
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = msg.text;

        messageDiv.appendChild(bubble);
        messagesContainer.appendChild(messageDiv);
    });

    chatHistory.appendChild(messagesContainer);

    // Прокручиваем вниз
    chatHistory.scrollTop = chatHistory.scrollHeight;
}