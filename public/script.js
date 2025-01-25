const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadOptions = document.getElementById('download-options');
const downloadBtn = document.getElementById('download-btn');
const filenameInput = document.getElementById('filename');
const formatSelect = document.getElementById('format');

let currentImageUrl = ''; // Stocke l'URL de l'image générée

// Fonction pour afficher les messages
function displayMessage(content, sender = 'bot') {
    const message = document.createElement('div');
    message.classList.add('message', sender);

    const avatar = document.createElement('img');
    avatar.src = sender === 'user' ? 'user.jpg' : 'chat.jpg';

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = content;

    message.appendChild(sender === 'user' ? messageContent : avatar);
    message.appendChild(sender === 'user' ? avatar : messageContent);
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fonction pour afficher une image avec les options de téléchargement
function displayImage(url) {
    const image = document.createElement('img');
    image.src = url;
    image.style.maxWidth = '100%';
    chatBox.appendChild(image);

    // Activer les options de téléchargement
    downloadOptions.classList.remove('hidden');
    currentImageUrl = url;
}

// Fonction pour envoyer le message
async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Affiche le message de l'utilisateur
    displayMessage(userMessage, 'user');
    userInput.value = '';

    // Affiche une indication "Typing..."
    const typingMessage = document.createElement('div');
    typingMessage.classList.add('message', 'bot');
    typingMessage.textContent = 'Typing...';
    chatBox.appendChild(typingMessage);

    try {
        // Appeler le backend pour générer une image
        const response = await fetch('/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userMessage }),
        });
        const data = await response.json();
        chatBox.removeChild(typingMessage);

        if (data.success) {
            displayMessage('Voici votre image générée :');
            displayImage(data.imageUrl);
        } else {
            displayMessage("Désolé, je n'ai pas pu générer l'image.");
        }
    } catch (error) {
        console.error('Erreur:', error);
        chatBox.removeChild(typingMessage);
        displayMessage("Une erreur est survenue.");
    }
}

// Fonction pour télécharger l'image
function downloadImage() {
    const filename = filenameInput.value.trim() || 'image';
    const format = formatSelect.value;
    const link = document.createElement('a');

    link.href = currentImageUrl;
    link.download = `${filename}.${format}`;
    link.click();
}

// Événements
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
downloadBtn.addEventListener('click', downloadImage);
