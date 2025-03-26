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
        const response = await fetch(`/get-chat-history/${chatId}/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки истории');

        const messages = await response.json();
        const chatHistory = document.getElementById('chatHistory');
        chatHistory.innerHTML = '';

        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = msg.sender === 'user' ? 'user-message' : 'bot-message';
            messageDiv.textContent = msg.text;
            chatHistory.appendChild(messageDiv);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}