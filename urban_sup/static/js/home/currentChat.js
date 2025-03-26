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

    addMessageToChat('user-message', message);
    input.value = '';

    // 🚀 Ждём рендеринг, затем скроллим
    setTimeout(scrollToBottom, 50);

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
            addMessageToChat('bot-message', data.response);
            setTimeout(scrollToBottom, 50); // 🔥 Ждём перед скроллом
        })
        .catch(error => {
            console.error('Error:', error);
            addMessageToChat('bot-message', 'Произошла ошибка');
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

async function loadChatHistory(chatId) {
    try {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;

        // Показываем индикатор загрузки
        chatHistory.innerHTML = '<div class="loading-message">Загрузка сообщений...</div>';

        // Принудительная прокрутка вниз для индикатора загрузки
        scrollToBottomImmediate(chatHistory);

        const response = await fetch(`/langchain_api/get-chat-history/${chatId}/`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
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
            await renderMessages(messages); // Делаем функцию асинхронной
        }

        // Комбинированный подход к прокрутке
        scrollToBottomSmooth(chatHistory);
        setTimeout(scrollToBottom, 50);

    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            chatHistory.innerHTML = `
                <div class="error-message">
                    Ошибка загрузки истории<br>
                    <button onclick="loadChatHistory(${chatId})">Повторить</button>
                </div>
            `;
            scrollToBottomImmediate(chatHistory);
            setTimeout(scrollToBottom, 50);
        }
    }
}

async function renderMessages(messages) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    const fragment = document.createDocumentFragment();
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender}-message`;
        msgDiv.textContent = msg.text;
        fragment.appendChild(msgDiv);
    });

    chatHistory.innerHTML = ''; // Очистка вызывает сброс скролла вверх
    chatHistory.appendChild(fragment);

    // Ждём обновления DOM
    await new Promise(requestAnimationFrame);
    await new Promise(resolve => setTimeout(resolve, 10));

    // 🚀 Запускаем скролл с небольшой задержкой
    setTimeout(() => {
        scrollToBottomSmooth(chatHistory);
    }, 50);
    setTimeout(scrollToBottom, 10);
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