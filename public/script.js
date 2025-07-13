document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('theme-checkbox');
    const bodyElement = document.body;

    function applyTheme(theme) {
        if (theme === 'dark') {
            bodyElement.classList.add('dark-mode');
            if (themeCheckbox) themeCheckbox.checked = true;
        } else {
            bodyElement.classList.remove('dark-mode');
            if (themeCheckbox) themeCheckbox.checked = false;
        }
    }

    function toggleTheme() {
        if (themeCheckbox && bodyElement) {
            if (themeCheckbox.checked) {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            }
        }
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', toggleTheme);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    }

    const allViewElements = document.querySelectorAll('.view');
    const sideMenu = document.getElementById('side-menu');
    const homeMenuTriggerIcon = document.getElementById('home-menu-trigger-icon');

    window.showView = function(viewIdToShow) {
        allViewElements.forEach(view => {
            view.style.display = 'none';
        });

        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.style.display = 'flex';
        }

        const isChatView = viewIdToShow.includes('chat') || viewIdToShow.includes('model');
        const topBarModelControls = document.getElementById('top-bar-model-controls-container');
        const topBarGeminiSelector = document.getElementById('top-bar-gemini-selector-wrapper');
        const topBarChatGPTSelector = document.getElementById('top-bar-chatgpt-selector-wrapper');
        const topBarClaudeSelector = document.getElementById('top-bar-claude-selector-wrapper');

        if (isChatView) {
            topBarModelControls.style.display = 'flex';
            if (viewIdToShow === 'gemini-all-model-view') {
                topBarGeminiSelector.style.display = 'flex';
                topBarChatGPTSelector.style.display = 'none';
                topBarClaudeSelector.style.display = 'none';
            } else if (viewIdToShow === 'all-chatgpt-models-view') {
                topBarGeminiSelector.style.display = 'none';
                topBarChatGPTSelector.style.display = 'flex';
                topBarClaudeSelector.style.display = 'none';
            } else if (viewIdToShow === 'claude-all-model-view') {
                topBarGeminiSelector.style.display = 'none';
                topBarChatGPTSelector.style.display = 'none';
                topBarClaudeSelector.style.display = 'flex';
            }
        } else {
            topBarModelControls.style.display = 'none';
        }
    };

    if (homeMenuTriggerIcon) {
        homeMenuTriggerIcon.addEventListener('click', () => {
            sideMenu.classList.toggle('visible');
        });
    }

    if (sideMenu) {
        sideMenu.querySelectorAll('ul li a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) {
                    allViewElements.forEach(view => {
                        view.style.display = 'none';
                    });
                    const viewToShow = document.getElementById(viewId);
                    if(viewToShow) {
                        viewToShow.style.display = 'flex';
                    }
                    sideMenu.classList.remove('visible');
                }
            });
        });
    }
    
    // Initialize with the first view active
    showView('gemini-all-model-view');

    // Chat logic for all models
    setupChatInterface('gemini-all-model', '/api/gemini-all-model');
    setupChatInterface('all-chatgpt-models', '/api/all-chatgpt');
    setupChatInterface('claude-all-model', '/api/claude-all-model');
    setupImageGenerator();
});

function setupChatInterface(modelPrefix, apiEndpoint) {
    const messagesArea = document.getElementById(`${modelPrefix}-chat-messages-area`);
    const inputField = document.getElementById(`${modelPrefix}-chat-input-field`);
    const sendButton = document.getElementById(`${modelPrefix}-chat-send-button`);
    const attachButton = document.getElementById(`${modelPrefix}-attach-file-button`);
    const fileInput = document.getElementById(`${modelPrefix}-file-upload`);
    const filePreview = document.getElementById(`${modelPrefix}-file-preview-container`);
    let currentFile = null;

    if (attachButton) {
        attachButton.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            currentFile = event.target.files[0];
            if (currentFile) {
                filePreview.innerHTML = `<span>${currentFile.name}</span>`;
            } else {
                filePreview.innerHTML = '';
            }
        });
    }

    async function sendMessage() {
        const messageText = inputField.value.trim();
        if (!messageText && !currentFile) return;

        addMessageToChat(messageText, 'user', messagesArea, currentFile);

        const formData = new FormData();
        formData.append('ask', messageText);
        if (currentFile) {
            formData.append('file', currentFile);
        }
        
        // Add other necessary parameters like model, uid, etc.
        const modelSelector = document.getElementById(`top-bar-${modelPrefix.split('-')[0]}-model-selector`);
        if (modelSelector && modelSelector.value) {
            formData.append('model', modelSelector.value);
        }
        formData.append('uid', 'user123'); // Example UID

        inputField.value = '';
        currentFile = null;
        filePreview.innerHTML = '';

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            addMessageToChat(data.response, 'ai', messagesArea);
        } catch (error) {
            console.error('Error:', error);
            addMessageToChat('Sorry, something went wrong.', 'ai', messagesArea);
        }
    }

    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function addMessageToChat(text, sender, messagesArea, file = null) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('chat-message-wrapper', sender);

    const avatar = document.createElement('div');
    avatar.classList.add('chat-avatar');
    // You can set background images for avatars in CSS
    
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('chat-bubble');
    messageBubble.textContent = text;
    if (file) {
        const fileInfo = document.createElement('p');
        fileInfo.textContent = `File: ${file.name}`;
        messageBubble.appendChild(fileInfo);
    }

    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(messageBubble);
    messagesArea.appendChild(messageWrapper);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function setupImageGenerator() {
    const promptField = document.getElementById('image-prompt-field');
    const generateButton = document.getElementById('generate-image-button');
    const displayArea = document.getElementById('image-display-area');
    const downloadButton = document.getElementById('download-image-button');
    let currentImageUrl = null;

    generateButton.addEventListener('click', async () => {
        const prompt = promptField.value.trim();
        if (!prompt) return;

        displayArea.innerHTML = '<p>Generating...</p>';
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const imageBlob = await response.blob();
            currentImageUrl = URL.createObjectURL(imageBlob);
            displayArea.innerHTML = `<img src="${currentImageUrl}" alt="${prompt}">`;
            downloadButton.style.display = 'block';
        } catch (error) {
            console.error('Image generation error:', error);
            displayArea.innerHTML = '<p>Failed to generate image.</p>';
        }
    });

    downloadButton.addEventListener('click', () => {
        if (currentImageUrl) {
            const a = document.createElement('a');
            a.href = currentImageUrl;
            a.download = 'generated-image.png';
            a.click();
        }
    });
}
