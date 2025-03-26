function loadChats() {
    if (!jwtToken) {
        console.error('JWT токен отсутствует. Требуется авторизация.');
        return;
    }

    fetch('/api/chats/', {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${jwtToken}`  // Используем JWT
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка загрузки чатов');
        return response.json();
    })
    .then(chats => {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.textContent = chat.title;
            chatItem.dataset.chatId = chat.id;

            chatItem.addEventListener('click', () => {
                document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
                chatItem.classList.add('active');
                loadChatHistory(chat.id);
            });

            chatList.appendChild(chatItem);
        });
    })
    .catch(error => console.error('Error:', error));
}


document.getElementById('newChatBtn').addEventListener('click', () => {
    if (!jwtToken) {
        console.error('JWT токен отсутствует. Требуется авторизация.');
        return;
    }

    fetch('/api/chats/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`  // Используем JWT
        },
        body: JSON.stringify({
            title: `Новый чат ${new Date().toLocaleTimeString()}`
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка создания чата');
        return response.json();
    })
    .then(() => loadChats())
    .catch(error => console.error('Error:', error));
});


document.addEventListener('DOMContentLoaded', () => {
    loadChats();
});
