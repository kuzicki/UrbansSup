document.getElementById('sendBtn').addEventListener('click', sendMessage);

document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    addMessageToChat('human-message', message);
    input.value = '';

    // 🚀 Ждём рендеринг, затем скроллим
    setTimeout(scrollToBottom, 50);

    // Отправка на сервер
    fetch('', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({message: message})
    })
        .then(response => response.json())
        .then(data => {
            addMessageToChat('ai-message', data.response);
            setTimeout(scrollToBottom, 50); // 🔥 Ждём перед скроллом
        })
        .catch(error => {
            console.error('Error:', error);
            addMessageToChat('ai-message', 'Произошла ошибка');
            setTimeout(scrollToBottom, 50);
        });
}


function addMessageToChat(className, text) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    chatHistory.appendChild(messageDiv);
}

async function loadChatHistory(sessionId) { 
    try {
        const response = await fetch(`${CHAT_API}${sessionId}/`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        const data = await response.json();
        renderMessages(data.messages);
    } catch (error) {
        showError('Ошибка загрузки истории');
    }
}

function renderMessages(messages) {
    console.log(messages);
    
    const chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML = '';
    
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.role}-message`;
        div.textContent = msg.content;
        chatHistory.appendChild(div);
    });
    
    scrollToBottom();
}

async function scrollToBottomImmediate(element = document.getElementById('chatHistory')) {
    if (!element) return;

    return new Promise(resolve => {
        // 1. Принудительный reflow
        void element.offsetHeight;

        // 2. Установка позиции
        element.scrollTop = element.scrollHeight;

        // 3. Проверка через микротаск
        Promise.resolve().then(() => {
            element.scrollTop = element.scrollHeight;
            resolve();
        });
    });
}

async function scrollToBottomSmooth(element) {
    if (!element) return;

    return new Promise(resolve => {
        requestAnimationFrame(() => {
            element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
            setTimeout(resolve, 300);
        });
    });
}

async function scrollToBottom() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    await scrollToBottomImmediate(chatHistory);
    await scrollToBottomSmooth(chatHistory);

    // 🚀 Дополнительно скроллим всю страницу вниз
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

    document.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
        const inputField = document.getElementById('chatInput');
        inputField.value = item.textContent;
        inputField.focus();

        // Активируем кнопку отправки
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.disabled = false;
        }

        // Имитируем ввод для активации кнопки
        const event = new Event('input', { bubbles: true });
        inputField.dispatchEvent(event);
    });
});
}