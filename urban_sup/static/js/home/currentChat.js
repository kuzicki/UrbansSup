// --- Event Listener for Send Button ---
document.getElementById('sendBtn').addEventListener('click', sendMessage);

// --- Event Listener for Enter Key in Input ---
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    console.log("Отправка 1"); // Original console log
    if (e.key === 'Enter' && !e.shiftKey) {
        console.log("Отправка"); // Original console log
        e.preventDefault();
        sendMessage();
    }
});

// --- Function to Send a Message ---
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message) {
        const chatHistory = document.getElementById('chatHistory');

        // --- Используем исправленную структуру с bubble ---
        const userMsgWrapper = document.createElement('div');
        userMsgWrapper.className = 'message human-message';
        const userMsgBubble = document.createElement('div');
        userMsgBubble.className = 'message-bubble';
        userMsgBubble.textContent = message;
        userMsgWrapper.appendChild(userMsgBubble);
        chatHistory.appendChild(userMsgWrapper);
        // --- Конец исправления структуры ---

        input.value = '';
        input.style.height = 'auto';
        document.getElementById('sendBtn').disabled = true;
        await scrollToBottom(); // Прокручиваем после добавления сообщения пользователя

        let indicatorElement = null; // Переменная для хранения ссылки на индикатор

        try {
            // --- ИЗМЕНЕНИЕ: Показываем индикатор и сохраняем ссылку ---
            indicatorElement = showTypingIndicator(chatHistory);
            console.log("SEND DATA");

            // Отправляем запрос (ждем именно этот ответ)
            const response = await fetch('/langchain_api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtToken()}`
                },
                body: JSON.stringify({ session_id: chat_id, user_query: message })
            });

            // --- ИЗМЕНЕНИЕ: Убираем 'await typingPromise' отсюда ---
            // Оно больше не нужно, так как showTypingIndicator не возвращает Promise таймера

            if (!response.ok) { // Важная проверка ответа сервера
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("PRINT DATA");
            console.log(data);

            // --- ИЗМЕНЕНИЕ: Индикатор УДАЛИТСЯ В БЛОКЕ finally ---
            // Здесь мы просто обрабатываем ответ

            let text = formatMarkdownToHtml(data.response || '');
            addMessageToChat('ai-message', text); // Используем исправленную addMessageToChat
            if (data && data.session_id) {
                chat_id = data.session_id;
            }

        } catch (error) {
            console.error('Error:', error);
            // --- ИЗМЕНЕНИЕ: Индикатор УДАЛИТСЯ В БЛОКЕ finally ---
             // Добавляем сообщение об ошибке (используя исправленную addMessageToChat)
             addMessageToChat('ai-message error-message', 'Произошла ошибка');

        } finally {
            // --- ИЗМЕНЕНИЕ: Блок finally выполнится ВСЕГДА ---
            // Надежно удаляем индикатор, если он был создан
            if (indicatorElement && indicatorElement.parentNode === chatHistory) {
                indicatorElement.remove();
            }
            // Прокручиваем чат в самый низ ПОСЛЕ добавления ответа ИИ или ошибки
            await scrollToBottom();
        }
    }
}

// --- Function to Format Markdown (Only image alt text translated) ---
function formatMarkdownToHtml(markdownText) {
    if (!markdownText) return '';

    // Basic transformations keeping readable format (Original Logic)
    let result = markdownText
        // Headers - add newlines before and after
        .replace(/^#+\s*(.*)/gm, '\n$1\n')
        // Bold/italic - keep only text
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Strikethrough - remove
        .replace(/~~(.*?)~~/g, '$1')
        // Code - add padding and newlines
        .replace(/`([^`]+)`/g, ' $1 ')
        .replace(/```([^`]*?)```/gs, '\n\n$1\n\n')
        // Lists - add newline before each item
        .replace(/(\n|^)\s*[\*\-+]\s+(.*)/g, '\n• $2')
        .replace(/(\n|^)\s*\d+\.\s+(.*)/g, '\n$2')
        // Links - keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Images - replace with text (Translated alt text)
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]') // Was: '[Изображение: $1]'
        // Horizontal lines - add newlines
        .replace(/^[-*_]{3,}$/gm, '\n――――――\n')
        // Remove extra blank lines (more than 2)
        .replace(/\n{3,}/g, '\n\n')
        // Trim whitespace at start/end
        .trim();

    // Guarantee return string (Original Logic)
    return result || '';
}

// --- Function to Show Typing Indicator (Original Structure) ---
function showTypingIndicator(chatHistory) {
    // Удаляем предыдущий индикатор, если он вдруг остался
    const existingIndicator = chatHistory.querySelector('.typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // 1. Создаем внешний div-контейнер
    const typingIndicatorWrapper = document.createElement('div');
    typingIndicatorWrapper.className = 'message ai-message typing-indicator'; // Классы для позиционирования и идентификации

    // 2. Создаем внутренний div-"пузырь"
    const typingIndicatorBubble = document.createElement('div');
    typingIndicatorBubble.className = 'message-bubble'; // Класс для стилей пузыря
    typingIndicatorBubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    // 3. Помещаем пузырь внутрь контейнера
    typingIndicatorWrapper.appendChild(typingIndicatorBubble);

    // 4. Добавляем контейнер в историю чата
    chatHistory.appendChild(typingIndicatorWrapper);

    // 5. Прокручиваем вниз, чтобы индикатор был виден
    scrollToBottom(); // Вызываем прокрутку СРАЗУ после добавления

    // 6. Возвращаем ссылку на созданный элемент!
    return typingIndicatorWrapper;
}

// --- Function to Add Message to Chat (Original Structure) ---
function addMessageToChat(className, text) { // className может быть 'ai-message' или 'ai-message error-message'
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    // 1. Создаем внешний div-контейнер
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message ${className}`; // Назначаем классы

    // 2. Создаем внутренний div-"пузырь"
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

    // Используем textContent, если formatMarkdownToHtml возвращает чистый текст
    // Если он может возвращать HTML (напр. <br>), используйте innerHTML
    messageBubble.textContent = text; // Или messageBubble.innerHTML = text;

    // 3. Помещаем пузырь внутрь контейнера
    messageWrapper.appendChild(messageBubble);

    // 4. Добавляем контейнер в историю чата
    chatHistory.appendChild(messageWrapper);
}

// --- Function to Load Chat History ---
async function loadChatHistory(sessionId) {
    try {
        // Ensure CHAT_API and jwtToken are defined elsewhere!
        const response = await fetch(`${CHAT_API}${sessionId}/`, { // Uses CHAT_API
            headers: {
                'Authorization': `Bearer ${getJwtToken()}` // Uses jwtToken
            }
        });
        // Basic check if response is ok (consider adding response.ok check here)
        const data = await response.json();
        renderMessages(data.messages); // Original render call
    } catch (error) {
        console.error("Error loading history:", error); // Log error in English
        // Ensure showError is defined elsewhere! This will cause an error if not.
        showError('Error loading history'); // English error message, calls potentially undefined showError
    }
}



// --- Function to Render Messages (Original Structure) ---
function renderMessages(messages) {
    console.log(messages);
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return; // Добавим проверку

    chatHistory.innerHTML = '';

    if (messages && messages.length > 0) { // Добавим проверку на messages
        messages.forEach(msg => {
            // Определяем тип сообщения
            const messageType = (msg.role === 'user' || msg.role === 'human') ? 'human-message' : 'ai-message';

            // --- ИСПРАВЛЕНИЕ НАЧАЛО ---
            // 1. Создаем внешний div-контейнер
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `message ${messageType}`;

            // 2. Создаем внутренний div-"пузырь"
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';

            // 3. Форматируем и помещаем текст внутрь пузыря
            let data = formatMarkdownToHtml(msg.content || ''); // Добавим || ''
            // Используем textContent или innerHTML в зависимости от вывода formatMarkdownToHtml
            messageBubble.textContent = data; // Или messageBubble.innerHTML = data;

            // 4. Помещаем пузырь внутрь контейнера
            messageWrapper.appendChild(messageBubble);

            // 5. Добавляем контейнер в историю чата
            chatHistory.appendChild(messageWrapper);
            // --- ИСПРАВЛЕНИЕ КОНЕЦ ---
        });
    } else {
        // Можно показать сообщение о пустой истории или welcome message
        showWelcomeMessage(); // Или showEmptyChatMessage();
    }


    // Прокрутка должна быть здесь, а не внутри forEach
    scrollToBottom(); // Вызываем после добавления ВСЕХ сообщений
}

// --- Original Scrolling Functions ---
async function scrollToBottomImmediate(element = document.getElementById('chatHistory')) {
    if (!element) return;

    return new Promise(resolve => {
        // 1. Force reflow (Original technique)
        void element.offsetHeight;

        // 2. Set position
        element.scrollTop = element.scrollHeight;

        // 3. Check via microtask (Original technique)
        Promise.resolve().then(() => {
            element.scrollTop = element.scrollHeight;
            resolve();
        });
    });
}

async function scrollToBottomSmooth(element) { // Consider adding default element here too
    if (!element) return;

    return new Promise(resolve => {
        requestAnimationFrame(() => {
            element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
            setTimeout(resolve, 300); // Original delay
        });
    });
}

async function scrollToBottom() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    // Original sequence
    await scrollToBottomImmediate(chatHistory);
    await scrollToBottomSmooth(chatHistory); // Pass element explicitly?

    // Original window scroll logic
    // 🚀 Additionally scroll the entire page down
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// --- Function to Show Welcome Message (Translated, Cooking Theme) ---
function showWelcomeMessage() {
    const chatHistory = document.getElementById('chatHistory');
    console.log("SHOW WELCOME MESSAGE"); // Original console log
    chat_id = ''; // Reset chat_id (ensure chat_id is defined elsewhere)
    if (!chatHistory) return;

    // Original innerHTML structure with translated text and cooking suggestions
    chatHistory.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-header">
                <h3>Добро пожаловать!</h3>
                <p>Я ваш виртуальный ассистент по ЖКХ. Я готов ответить на вопросы. Давайте начнем общение!</p>
            </div>
            <div class="suggestions-container">
                <p class="suggestion-title">Выберите один из вопросов:</p>
                <div class="suggestion-items">
                    <div class="suggestion-item">Что ты можешь рассказаать про жилищно-коммунальное хозяйство?</div>
                    <div class="suggestion-item">Из чего состоит устройство промывки днища?</div>
                    <div class="suggestion-item">Что такое капитальный ремонт?</div>
                    <div class="suggestion-item">Что такое содержание и ремонт жилья?</div>
                </div>
            </div>
        </div>
    `;

    // Original logic for adding event listeners to suggestion items
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const inputField = document.getElementById('chatInput');
            inputField.value = item.textContent;
            inputField.focus();

            // Activate send button
            const sendBtn = document.getElementById('sendBtn');
            if (sendBtn) {
                sendBtn.disabled = false;
            }

            // Simulate input event
            const event = new Event('input', { bubbles: true });
            inputField.dispatchEvent(event);
        });
    });

    // Ensure input is clear and button disabled when welcome message is shown
     const inputField = document.getElementById('chatInput');
     const sendBtn = document.getElementById('sendBtn');
     if (inputField) inputField.value = '';
     if (sendBtn) sendBtn.disabled = true;
     if (inputField) inputField.style.height = 'auto';
}

// --- Initial Setup ---
// IMPORTANT: Define jwtToken, chat_id, CHAT_API, and showError somewhere before this script runs!
// Example placeholders (replace with your actual logic):
// let jwtToken = 'YOUR_JWT_TOKEN';
// let chat_id = '';
// const CHAT_API = '/api/chat/'; // Example API endpoint base
// function showError(message) { console.error("SHOW ERROR:", message); /* Add UI update */ }

// Add input listener for send button state and text area height (useful addition)
const chatInput = document.getElementById('chatInput');
if (chatInput) {
    chatInput.addEventListener('input', function() {
        const sendBtn = document.getElementById('sendBtn');
        if (this.value.trim() !== '') {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
        // Adjust textarea height dynamically
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}


// Show welcome message on page load (Original listener)
document.addEventListener('DOMContentLoaded', () => {
    showWelcomeMessage();
    // Add any other initialization logic here if needed
    // e.g., loadChats(); // (make sure loadChats is defined if you use it)
});