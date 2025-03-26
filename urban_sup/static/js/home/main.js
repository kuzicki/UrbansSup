document.getElementById('sidebarToggle').addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
        });

        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', function() {
                chatItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });

        const textarea = document.getElementById('chatInput');
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            document.getElementById('sendBtn').disabled = this.value.trim() === '';
        });

        document.getElementById('sendBtn').addEventListener('click', sendMessage);

        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();

            if (message) {
                const chatHistory = document.getElementById('chatHistory');

                const userMsg = document.createElement('div');
                userMsg.className = 'message user-message';
                userMsg.textContent = message;
                chatHistory.appendChild(userMsg);

                input.value = '';
                input.style.height = 'auto';
                document.getElementById('sendBtn').disabled = true;

                const typingIndicator = document.createElement('div');
                typingIndicator.className = 'typing-indicator';
                typingIndicator.innerHTML = `
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                `;
                chatHistory.appendChild(typingIndicator);

                chatHistory.scrollTop = chatHistory.scrollHeight;

                setTimeout(() => {
                    chatHistory.removeChild(typingIndicator);

                    const botMsg = document.createElement('div');
                    botMsg.className = 'message bot-message';
                    botMsg.textContent = "Это пример ответа. В реальном приложении здесь был бы ответ от вашего бэкенда.";
                    chatHistory.appendChild(botMsg);

                    chatHistory.scrollTop = chatHistory.scrollHeight;
                }, 1500);
            }
        }

        document.getElementById('chatInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });