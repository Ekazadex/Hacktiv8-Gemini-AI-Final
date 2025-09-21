const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// A history of messages to send to the backend
const chatHistory = [];

function appendMessage(sender, text) {
    // Create a row to hold avatar and message bubble
    const row = document.createElement('div');
    row.classList.add('message-row', sender);

    const avatar = document.createElement('div');
    avatar.classList.add('avatar', sender);
    avatar.textContent = sender === 'user' ? 'You' : 'G';

    const bubble = document.createElement('div');
    bubble.classList.add('message', sender);

    if (sender === 'bot') {
        // Format bot text: convert double newlines to paragraphs for readability
        // Split on two or more newlines
        const paragraphs = String(text).split(/\n{2,}/g);
        paragraphs.forEach((p, idx) => {
            const para = document.createElement('div');
            para.textContent = p.trim();
            if (idx !== paragraphs.length - 1) para.style.marginBottom = '8px';
            bubble.appendChild(para);
        });
    } else {
        // For user messages keep plain text (single line)
        bubble.textContent = text;
    }

    // Order depends on sender
    if (sender === 'user') {
        row.appendChild(bubble);
        row.appendChild(avatar);
    } else {
        row.appendChild(avatar);
        row.appendChild(bubble);
    }

    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
    return bubble; // Return the bubble element to allow modification
}

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // 1. Add the user's message to the chat box and history.
    appendMessage('user', userMessage);
    chatHistory.push({ role: 'user', content: userMessage });
    input.value = '';

    // 2. Show a temporary "Thinking..." bot message.
    const thinkingMessage = appendMessage('bot', 'Gemini is thinking...');

    try {
        // 3. Send the message history as a POST request to /api/chat.
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: chatHistory,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok.');
        }

        const data = await response.json();

        // 4. When the response arrives, replace the "Thinking..." message with the AI's reply.
        if (data && data.result) {
            thinkingMessage.textContent = data.result;
            // Add AI's response to history for conversation context
            chatHistory.push({ role: 'model', content: data.result });
        } else {
            thinkingMessage.textContent = 'Sorry, no response received.';
        }
    } catch (error) {
        // 5. If an error occurs, show an error message.
        console.error('Fetch Error:', error);
        thinkingMessage.textContent = `Failed to get response from server: ${error.message}`;
    }
});
