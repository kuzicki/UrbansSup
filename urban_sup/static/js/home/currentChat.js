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

// 4. Функции работы с историей сообщений
async function loadChatHistory(chatId) {
    try {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;

        chatHistory.innerHTML = '<div class="loading-message">Загрузка сообщений...</div>';

        const response = await fetch(`/langchain_api/get-chat-history/${chatId}/`, {
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