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

    // Load saved theme or set based on preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light'); // Default to light if no preference or saved theme
        }
    }

    // AI CHAT ELEMENT SELECTION (CRITICAL DIAGNOSTIC LOGS)
    const chatInputBarForCheck = document.getElementById('chat-input-bar');
    const chatInputFieldForCheck = document.getElementById('chat-input-field');
    const chatSendButtonForCheck = document.getElementById('chat-send-button');
    const webSearchToggleForCheck = document.getElementById('web-search-toggle');
    const webSearchContainerForCheck = document.querySelector('#ai-chat-view .web-search-container');

    console.log('[AI CHAT DIAGNOSTIC] chatInputBar selected on DOMContentLoaded:', chatInputBarForCheck);
    console.log('[AI CHAT DIAGNOSTIC] chatInputField selected on DOMContentLoaded:', chatInputFieldForCheck);
    console.log('[AI CHAT DIAGNOSTIC] chatSendButton selected on DOMContentLoaded:', chatSendButtonForCheck);
    console.log('[AI CHAT DIAGNOSTIC] webSearchToggle selected on DOMContentLoaded:', webSearchToggleForCheck);
    console.log('[AI CHAT DIAGNOSTIC] webSearchContainer selected on DOMContentLoaded:', webSearchContainerForCheck);

    // --- Global Navigation Elements ---
    const allViewElements = document.querySelectorAll('.view');
    const homeBottomAppIcons = document.getElementById('home-bottom-app-icons');
    const featureGrid = document.querySelector('#home-view .feature-grid');
    const subViewMenuTrigger = document.getElementById('sub-view-menu-trigger');
    const sideMenu = document.getElementById('side-menu');
    const homeMenuTriggerIcon = document.getElementById('home-menu-trigger-icon');
    const topBarWeatherDisplay = document.getElementById('weather-display-container');
    let topBarChatTitleDisplay = null; // To be created dynamically

    // Helper to get chat name from view ID or side menu
    function getChatNameForView(viewId) {
        const sideMenuLink = document.querySelector(`#side-menu a[data-view="${viewId}"]`);
        if (sideMenuLink) {
            const titleSpan = sideMenuLink.querySelector('span:not(.menu-item-description)');
            if (titleSpan) return titleSpan.textContent.trim();
        }
        // Fallback names if not found in menu (e.g. if view opened directly)
        const names = {
            'ai-chat-view': 'AI Chat',
            'gemini-chat-view': 'Gemini Vision Chat',
            'gpt4o-chat-view': 'GPT-4o Chat',
            'blackbox-ai-view': 'Blackbox AI',
            'deepseek-ai-view': 'Deepseek AI',
            'claude-haiku-view': 'Claude Haiku AI',
            'gemini-all-model-view': 'Gemini All Models',
            'all-chatgpt-models-view': 'All ChatGPT Models', // Added for completeness
            'claude-all-model-view': 'Claude All Models' // Added for new view
        };
        return names[viewId] || 'Chat';
    }


    // --- Centralized showView Function ---
    let currentView = 'login-view';
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.id = 'logout-button';
    logoutButton.style.display = 'none';
    document.body.appendChild(logoutButton);

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });

    window.showView = function(viewIdToShow, bypassAdminCheck = false) {
        const token = localStorage.getItem('token');
        if (!token && viewIdToShow !== 'login-view' && viewIdToShow !== 'signup-view' && viewIdToShow !== 'admin-panel-view') {
            alert('You must be logged in to access this page.');
            return;
        }
        
        if (viewIdToShow === 'admin-panel-view' && !bypassAdminCheck) {
            const enteredCode = prompt('Enter admin code:');
            if (enteredCode) {
                fetch('/api/verify-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ adminCode: enteredCode }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.showView('admin-panel-view', true);
                    } else {
                        alert(data.message || 'Invalid admin code.');
                    }
                })
                .catch(error => {
                    console.error('Error verifying admin code:', error);
                    alert('Error verifying admin code. Please try again.');
                });
            } else if (enteredCode === null) {
                // User cancelled the prompt, do nothing or show a message
            } else {
                alert('Admin code is required to access this panel.');
            }
            return;
        }

        allViewElements.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.style.display = 'block';
            viewToShow.classList.add('active');
        } else {
            console.warn(`View with ID "${viewIdToShow}" not found. Defaulting to home-view.`);
            document.getElementById('home-view').style.display = 'block';
            document.getElementById('home-view').classList.add('active');
            viewIdToShow = 'home-view';
        }

        const chatViewIds = [
            'gemini-all-model-view', 'all-chatgpt-models-view', 'claude-all-model-view'
        ];
        const isChatView = chatViewIds.includes(viewIdToShow);

        if (viewToShow && isChatView) {
            viewToShow.style.display = 'flex';
        }

        // Handle top bar content (Weather vs Chat Title)
        if (isChatView) {
            if (topBarWeatherDisplay) topBarWeatherDisplay.style.display = 'none';
            if (!topBarChatTitleDisplay) {
                topBarChatTitleDisplay = document.createElement('div');
                topBarChatTitleDisplay.id = 'top-bar-chat-title';
                topBarChatTitleDisplay.className = 'top-bar-chat-title-display';
                const themeToggleContainer = document.getElementById('theme-toggle-container');
                if (themeToggleContainer && themeToggleContainer.parentNode) {
                     themeToggleContainer.parentNode.insertBefore(topBarChatTitleDisplay, themeToggleContainer.nextSibling);
                } else if (topBarWeatherDisplay && topBarWeatherDisplay.parentNode) {
                    topBarWeatherDisplay.parentNode.insertBefore(topBarChatTitleDisplay, topBarWeatherDisplay);
                } else {
                    document.getElementById('top-bar')?.appendChild(topBarChatTitleDisplay);
                }
            }
            topBarChatTitleDisplay.textContent = getChatNameForView(viewIdToShow); 
            topBarChatTitleDisplay.style.display = 'block';
            if (topBarModelNameDisplay) topBarModelNameDisplay.style.display = 'none'; // Hide specific model name display
            // Hide all top-bar model selectors
            if (topBarGeminiSelectorWrapper) topBarGeminiSelectorWrapper.style.display = 'none';
            if (topBarChatGPTSelectorWrapper) topBarChatGPTSelectorWrapper.style.display = 'none';
            if (topBarClaudeSelectorWrapper) topBarClaudeSelectorWrapper.style.display = 'none';

        } else { // Not a chat view
            if (topBarWeatherDisplay) topBarWeatherDisplay.style.display = 'flex'; 
            if (topBarChatTitleDisplay) topBarChatTitleDisplay.style.display = 'none';
            if (topBarModelNameDisplay) topBarModelNameDisplay.style.display = 'none';
             // Hide all top-bar model selectors
            if (topBarGeminiSelectorWrapper) topBarGeminiSelectorWrapper.style.display = 'none';
            if (topBarChatGPTSelectorWrapper) topBarChatGPTSelectorWrapper.style.display = 'none';
            if (topBarClaudeSelectorWrapper) topBarClaudeSelectorWrapper.style.display = 'none';
        }

        // Specific logic for "All Model" views to show their selectors in top bar
        if (viewIdToShow === 'gemini-all-model-view') {
            if (topBarChatTitleDisplay) topBarChatTitleDisplay.style.display = 'none'; // Hide generic chat title
            if (topBarGeminiSelectorWrapper) topBarGeminiSelectorWrapper.style.display = 'flex'; // Show Gemini selector
            if (topBarModelNameDisplay && currentSelectedGeminiModel) { // Update model name display
                topBarModelNameDisplay.textContent = `Gemini: ${currentSelectedGeminiModel}`;
                topBarModelNameDisplay.style.display = 'inline';
            } else if (topBarModelNameDisplay) {
                 topBarModelNameDisplay.textContent = 'Gemini Models'; // Default if no model selected yet
                 topBarModelNameDisplay.style.display = 'inline';
            }
        } else if (viewIdToShow === 'all-chatgpt-models-view') {
            if (topBarChatTitleDisplay) topBarChatTitleDisplay.style.display = 'none';
            if (topBarChatGPTSelectorWrapper) topBarChatGPTSelectorWrapper.style.display = 'flex';
             if (topBarModelNameDisplay && currentSelectedChatGPTModel) {
                topBarModelNameDisplay.textContent = `ChatGPT: ${currentSelectedChatGPTModel}`;
                topBarModelNameDisplay.style.display = 'inline';
            } else if (topBarModelNameDisplay) {
                topBarModelNameDisplay.textContent = 'ChatGPT Models';
                topBarModelNameDisplay.style.display = 'inline';
            }
        } else if (viewIdToShow === 'claude-all-model-view') {
            if (topBarChatTitleDisplay) topBarChatTitleDisplay.style.display = 'none';
            if (topBarClaudeSelectorWrapper) topBarClaudeSelectorWrapper.style.display = 'flex';
            if (topBarModelNameDisplay && currentSelectedClaudeModel) {
                topBarModelNameDisplay.textContent = `Claude: ${currentSelectedClaudeModel}`;
                topBarModelNameDisplay.style.display = 'inline';
            } else if (topBarModelNameDisplay) {
                topBarModelNameDisplay.textContent = 'Claude Models';
                topBarModelNameDisplay.style.display = 'inline';
            }
        }


        if (viewIdToShow === 'home-view') {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'none';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'none';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'inline-flex';
            if (sideMenu && sideMenu.classList.contains('visible')) sideMenu.classList.remove('visible');
            populateFeatureGrid();
        } else {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'none';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'inline-flex';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'none';
        }

        // Feature-specific load calls
        if (viewIdToShow === 'image-generator-view' && typeof loadImagePromptHistory === 'function') {
            loadImagePromptHistory();
        } else if (viewIdToShow === 'admin-panel-view') {
            const adminPanel = document.getElementById('admin-panel-view');
            if (adminPanel) {
                const commentsTabButton = adminPanel.querySelector('.admin-tab-button[data-tab="comments-admin"]');
                const commentsTabContent = adminPanel.querySelector('#comments-admin-tab');
                const analyticsTabButton = adminPanel.querySelector('.admin-tab-button[data-tab="analytics-admin"]');
                const analyticsTabContent = adminPanel.querySelector('#analytics-admin-tab');
                let analyticsWasActive = analyticsTabButton && analyticsTabButton.classList.contains('active');
                adminPanel.querySelectorAll('.admin-tab-button').forEach(b => b.classList.remove('active'));
                adminPanel.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                if (analyticsWasActive && analyticsTabContent) {
                    analyticsTabButton.classList.add('active');
                    analyticsTabContent.classList.add('active');
                    if (typeof loadAdminAnalytics === 'function') loadAdminAnalytics();
                } else {
                    if (commentsTabButton) commentsTabButton.classList.add('active');
                    if (commentsTabContent) commentsTabContent.classList.add('active');
                    if (typeof loadAdminComments === 'function') loadAdminComments();
                }
            } else {
                 if (typeof loadAdminComments === 'function') loadAdminComments();
            }
        } else if (viewIdToShow === 'gemini-all-model-view') {
            if (typeof fetchAndPopulateGeminiModels === "function") fetchAndPopulateGeminiModels();
            const geminiAllModelInputBar = document.getElementById('gemini-all-model-chat-input-bar');
            if (geminiAllModelInputBar) geminiAllModelInputBar.style.display = 'flex';
            const geminiAllModelViewEl = document.getElementById('gemini-all-model-view');
            if (geminiAllModelViewEl && geminiAllModelViewEl.style.display !== 'flex') {
                 geminiAllModelViewEl.style.display = 'flex';
            }
        } else if (viewIdToShow === 'all-chatgpt-models-view') { // Added for new view
            console.log('[ALL CHATGPT MODELS DIAGNOSTIC] showView called for all-chatgpt-models-view.');
            if (typeof fetchAndPopulateChatGPTModels === "function") { fetchAndPopulateChatGPTModels(); }
            const allChatGPTInputBar = document.getElementById('all-chatgpt-chat-input-bar');
            if (allChatGPTInputBar) allChatGPTInputBar.style.display = 'flex';
            const allChatGPTViewEl = document.getElementById('all-chatgpt-models-view');
            if (allChatGPTViewEl && allChatGPTViewEl.style.display !== 'flex') {
                 allChatGPTViewEl.style.display = 'flex';
            }
        } else if (viewIdToShow === 'claude-all-model-view') {
            console.log('[CLAUDE ALL MODELS DIAGNOSTIC] showView called for claude-all-model-view.');
            if (typeof fetchAndPopulateClaudeModels === "function") { fetchAndPopulateClaudeModels(); }
            const claudeAllModelInputBar = document.getElementById('claude-all-model-chat-input-bar');
            if (claudeAllModelInputBar) claudeAllModelInputBar.style.display = 'flex';
            const claudeAllModelViewEl = document.getElementById('claude-all-model-view');
            if (claudeAllModelViewEl && claudeAllModelViewEl.style.display !== 'flex') {
                 claudeAllModelViewEl.style.display = 'flex';
            }
        }


        if(typeof trackActivity === 'function') trackActivity('view_visit', { view: viewIdToShow });
    };

    // --- Navigation Event Listeners ---
    function populateFeatureGrid() {
        if (!featureGrid) return;
        featureGrid.innerHTML = '';
        const features = [
            {
                view: 'gemini-all-model-view',
                title: 'Gemini All Models',
                description: 'Chat with various Gemini models & upload files.',
                icon: 'https://www.gstatic.com/images/branding/product/2x/gemini_48dp.png'
            },
            {
                view: 'all-chatgpt-models-view',
                title: 'All ChatGPT Models',
                description: 'Chat with various ChatGPT models.',
                icon: 'chatgpt.jpg'
            },
            {
                view: 'claude-all-model-view',
                title: 'Claude All Models',
                description: 'Chat with Claude models, with file upload.',
                icon: 'claude.jpg'
            },
            {
                view: 'image-generator-view',
                title: "Générateur d'Images",
                description: 'Create stunning images from text prompts.',
                icon: '<svg viewBox="0 0 24 24" class="icon"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>'
            }
        ];

        features.forEach(feature => {
            const card = document.createElement('div');
            card.className = 'feature-card';
            card.dataset.view = feature.view;

            const icon = feature.icon.startsWith('<svg')
                ? feature.icon
                : `<img src="${feature.icon}" alt="${feature.title}" class="icon">`;

            card.innerHTML = `
                ${icon}
                <h3>${feature.title}</h3>
                <p>${feature.description}</p>
                <a href="#" class="btn" data-view="${feature.view}">Access</a>
            `;
            featureGrid.appendChild(card);
        });

        featureGrid.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = button.dataset.view;
                if (viewId) {
                    window.showView(viewId);
                }
            });
        });
    }
    function toggleSideMenu() { if (sideMenu) sideMenu.classList.toggle('visible'); }
    if (homeMenuTriggerIcon) homeMenuTriggerIcon.addEventListener('click', toggleSideMenu);
    if (subViewMenuTrigger) subViewMenuTrigger.addEventListener('click', toggleSideMenu);
    if (sideMenu) {
        sideMenu.querySelectorAll('ul li a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) { // Removed VIP direct redirect
                    window.showView(viewId);
                    sideMenu.classList.remove('visible');
                }
            });
        });
    }
    document.addEventListener('click', (event) => {
        if (sideMenu && sideMenu.classList.contains('visible')) {
            const isClickInsideSideMenu = sideMenu.contains(event.target);
            const homeMenuIconContainer = document.getElementById('top-left-menu-icon-container');
            const isClickOnHomeMenuTrigger = homeMenuIconContainer && homeMenuIconContainer.contains(event.target.closest('#top-left-menu-icon-container'));
            const isClickOnSubViewMenuTrigger = subViewMenuTrigger && subViewMenuTrigger.contains(event.target);
            if (!isClickInsideSideMenu && !isClickOnHomeMenuTrigger && !isClickOnSubViewMenuTrigger) {
                sideMenu.classList.remove('visible');
            }
        }
    });

    let chatUID = null;
    function getOrCreateUID() {
        let uid = localStorage.getItem('chatPortfolioUID');
        if (!uid) { uid = Date.now().toString(36) + Math.random().toString(36).substr(2); localStorage.setItem('chatPortfolioUID', uid); }
        return uid;
    }
    chatUID = getOrCreateUID();

    // --- User Activity Tracking ---
    async function trackActivity(activityType, detailsObject = {}) {
        if (!chatUID) {
            console.warn("User UID still not available. Activity not tracked.");
            return;
        }
        const activityData = {
            uid: chatUID,
            activityType: activityType,
            details: detailsObject,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        try {
            const response = await fetch('/api/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to track activity:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error sending activity data:', error);
        }
    }

    // --- WEATHER DISPLAY LOGIC ---
    const weatherDisplayContainerRef = document.getElementById('weather-display-container');
    const sunnySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 5c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1zm0 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1zM5.22 6.22l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0L4.51 5.51c-.2.2-.2.51 0 .71.2.19.51.19.71 0zm12.73 12.73l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0l-1.41 1.41c-.2.2-.2.51 0 .71.2.2.51.2.71 0zM4 12c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1zm14 0c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1zm-9.19-6.07L6.22 4.51c-.2-.2-.51-.2-.71 0s-.2.51 0 .71l1.41 1.41c.2.2.51.2.71 0s.2-.51 0-.71zm11.31 11.31l-1.41 1.41c-.2.2-.51-.2-.71 0s-.2-.51 0-.71l1.41-1.41c.2-.2.51-.2.71 0s.2.51 0 .71zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>';
    const cloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>';
    const rainySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 4C9.17 4 6.71 5.32 5.12 7.24C5.08 7.21 5.04 7.19 5 7.17C3.08 7.57 1.5 9.31 1.5 11.5C1.5 13.98 3.52 16 6 16h.5v-1.5H6c-1.38 0-2.5-1.12-2.5-2.5S4.62 9.5 6 9.5h.28l.6-1.38C7.79 6.01 9.78 5 12 5c2.76 0 5 2.24 5 5v.5h1.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-1V18h1c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.46 0-.9.08-1.32.23C16.28 7.29 14.31 5.5 12 5.5V4zm-1 14.5v-4.5h-2L12 10l3 4.5h-2v4.5H11z"/></svg>';
    const snowySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19 13h-2V9h-2v4H9V9H7v4H5l7 7 7-7zm-8 2h2v2H9v-2zm4 0h2v2h-2v-2zm-4-4h2v2H9v-2zm4 0h2v2h-2v-2zm2-2V7H7v2h10zM5.41 6.12L4 7.54l3.03 3.03L12 5.59 8.97 2.56 7.55 4l2.04 2.04L5.41 6.12zM19.99 6.12L15.96 2.08 14.55 3.5l3.03 3.03L12 11.59l4.97-4.97L18.59 5l-2.04-2.04 4.48 4.48c.78.78.78 2.05 0 2.83l-4.48 4.48 2.04 2.04 1.41-1.41-3.03-3.03L20 8.96l-4.97 4.97-1.41-1.41 3.03-3.03c.78-.78.78-2.05 0-2.83l-2.04-2.04z"/></svg>';
    const partlyCloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M17.52 10.31C17.16 7.33 14.83 5 12 5c-2.32 0-4.35 1.32-5.31 3.24C4.32 8.64 2.5 10.61 2.5 13c0 2.48 2.02 4.5 4.5 4.5h10.5c2.21 0 4-1.79 4-4 0-2.06-1.54-3.78-3.48-3.96zM12 7c1.89 0 3.47 1.21 4.01 2.87l.23.67.73.03C17.56 10.6 18 11.03 18 11.5c0 .83-.67 1.5-1.5 1.5H7.21c-.49 0-.9-.35-1.02-.82-.01-.05-.02-.1-.02-.15 0-.74.55-1.36 1.27-1.48l.65-.11.28-.6C8.92 8.47 10.35 7 12 7z"/></svg>';
    const defaultWeatherSvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';

    let currentWeatherData = null;

    function getWeatherSvgIcon(skytext) {
        if (!skytext) return defaultWeatherSvg; const lowerSkytext = skytext.toLowerCase();
        if (lowerSkytext.includes("sun") || lowerSkytext.includes("clear")) return sunnySvg;
        if (lowerSkytext.includes("partly cloudy") || lowerSkytext.includes("mostly clear") || lowerSkytext.includes("partly sunny")) return partlyCloudySvg;
        if (lowerSkytext.includes("cloudy") || lowerSkytext.includes("overcast") || lowerSkytext.includes("mostly cloudy")) return cloudySvg;
        if (lowerSkytext.includes("rain") || lowerSkytext.includes("shower")) return rainySvg;
        if (lowerSkytext.includes("snow") || lowerSkytext.includes("flurr")) return snowySvg; return defaultWeatherSvg;
    }
    function displayWeather(data) {
        if (!weatherDisplayContainerRef) return;
        if (!data || !data.current || !data.location) { weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather data unavailable.</p>`; return; }
        const iconSvg = getWeatherSvgIcon(data.current.skytext);
        const weatherHTML = `${iconSvg}<div class="weather-text"><p class="weather-temp">${data.current.temperature}°${data.location.degreetype}</p><p class="weather-location">${data.location.name.split(',')[0]}</p></div>`;
        weatherDisplayContainerRef.innerHTML = weatherHTML;
    }
    async function fetchWeather(location) {
        if (!weatherDisplayContainerRef) {
            console.warn("Top bar weather display container not found, but fetching weather for detailed view.");
        } else {
            weatherDisplayContainerRef.innerHTML = `<p class="weather-loading">Loading...</p>`;
        }

        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! ${response.statusText}` }));
                throw new Error(errorData.error || `Weather API Error: ${response.statusText}`);
            }
            const data = await response.json();

            currentWeatherData = data;

            if (weatherDisplayContainerRef) {
                displayWeather(currentWeatherData);
            }

            // If the detailed weather view is active, update it too
            const weatherViewActive = document.getElementById('weather-view');
            if (weatherViewActive && weatherViewActive.classList.contains('active')) {
                displayDetailedWeather(currentWeatherData);
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            if (weatherDisplayContainerRef) {
                weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather unavailable</p>`;
            }
            const weatherView = document.getElementById('weather-view');
            if (weatherView && weatherView.classList.contains('active')) {
                weatherView.innerHTML = `<p class="weather-error">Failed to fetch weather: ${error.message}</p>`;
            }
        }
    }
    function initWeatherDisplay() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => { console.log('Geolocation successful. Using default city.'); fetchWeather('Antananarivo'); },
                (error) => { console.error(`Geolocation error: ${error.message}. Using default.`); fetchWeather('Antananarivo'); }
            );
        } else { console.log("Geolocation not supported. Using default."); fetchWeather('Antananarivo'); }
    }
    initWeatherDisplay();
    // --- END OF WEATHER DISPLAY LOGIC ---

    // --- DETAILED WEATHER VIEW FUNCTION ---
    function displayDetailedWeather(data) {
        const weatherView = document.getElementById('weather-view');
        if (!weatherView || !data || !data.current || !data.location) {
            if(weatherView) weatherView.innerHTML = '<p class="weather-error">Detailed weather data is currently unavailable.</p>';
            return;
        }
        const getDayName = (dateString) => {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString(undefined, { weekday: 'long' });
        };
        let forecastHTML = '<p>No forecast data available.</p>';
        if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
            forecastHTML = data.forecast.slice(0, 5).map(day => `
                <div class="forecast-day">
                    <div>${getDayName(day.date)}</div>
                    ${getWeatherSvgIcon(day.skytextday)}
                    <div>${day.high}° / ${day.low}°${data.location.degreetype}</div>
                    <div>${day.skytextday}</div>
                </div>
            `).join('');
        }
        const detailedWeatherHTML = `
            <div class="weather-location-title">Weather in ${data.location.name}</div>
            <div class="current-conditions">
                <div class="current-temp">${data.current.temperature}°${data.location.degreetype}</div>
                <div class="current-sky">${data.current.skytext}</div>
                ${getWeatherSvgIcon(data.current.skytext)}
            </div>
            <div class="weather-details-grid">
                <div>Feels Like: ${data.current.feelslike}°${data.location.degreetype}</div>
                <div>Humidity: ${data.current.humidity}%</div>
                <div>Wind: ${data.current.winddisplay}</div>
                ${data.current.pressure ? `<div>Pressure: ${data.current.pressure} mb</div>` : ''}
                ${data.current.visibility ? `<div>Visibility: ${data.current.visibility} km</div>` : ''}
                <div>Day/Time: ${data.current.day}, ${data.current.observationtime}</div>
            </div>
            <div class="weather-forecast">
                <h4>5-Day Forecast</h4>
                <div class="forecast-grid">
                    ${forecastHTML}
                </div>
            </div>
        `;
        weatherView.innerHTML = detailedWeatherHTML;
    }

    // --- COMMENTS SECTION LOGIC ---
    const commentForm = document.getElementById('comment-form');
    const commentsDisplayArea = document.getElementById('comments-display-area'); // For home page
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');

    // For home page comments
    async function loadComments() {
        if (!commentsDisplayArea) return;
        commentsDisplayArea.innerHTML = '<p>Loading comments...</p>';
        let errorMessage = '';
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                errorMessage = errData?.error || `Failed to fetch comments: ${response.statusText}`;
                throw new Error(errorMessage);
            }
            const comments = await response.json();
            commentsDisplayArea.innerHTML = '';
            if (comments.length === 0) {
                commentsDisplayArea.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            } else {
                 // Display only a few recent comments on home, e.g., latest 5
                const recentComments = comments.slice(0, 5);
                recentComments.forEach(comment => {
                    const item = document.createElement('div');
                    item.className = 'comment-item';
                    item.dataset.commentId = comment._id;
                    const nameEl = document.createElement('strong');
                    nameEl.textContent = escapeHTML(comment.name);
                    const textEl = document.createElement('p');
                    textEl.textContent = escapeHTML(comment.text);
                    const timeEl = document.createElement('small');
                    timeEl.className = 'comment-timestamp';
                    timeEl.textContent = new Date(comment.createdAt).toLocaleString();
                    item.append(nameEl, textEl, timeEl);
                    if (comment.adminReplyText && comment.adminReplyText.trim() !== "") {
                        const replyDiv = document.createElement('div');
                        replyDiv.className = 'admin-reply-public';
                        const replyStrong = document.createElement('strong');
                        replyStrong.textContent = 'Admin Reply:';
                        const replyTextP = document.createElement('p');
                        replyTextP.style.margin = '5px 0 0 0';
                        replyTextP.textContent = escapeHTML(comment.adminReplyText);
                        replyDiv.appendChild(replyStrong);
                        replyDiv.appendChild(replyTextP);
                        if (comment.adminReplyTimestamp) {
                            const replyTimeEl = document.createElement('small');
                            replyTimeEl.className = 'comment-timestamp';
                            replyTimeEl.textContent = new Date(comment.adminReplyTimestamp).toLocaleString();
                            replyDiv.appendChild(replyTimeEl);
                        }
                        item.appendChild(replyDiv);
                    }
                    // No like/dislike buttons on home page comment display for now
                    commentsDisplayArea.appendChild(item);
                });
                 if (comments.length > 5) {
                    const seeMoreLink = document.createElement('a');
                    seeMoreLink.href = '#';
                    seeMoreLink.textContent = 'See all comments...';
                    seeMoreLink.classList.add('see-all-comments-link');
                    seeMoreLink.onclick = (e) => {
                        e.preventDefault();
                        window.showView('comments-view');
                    };
                    commentsDisplayArea.appendChild(seeMoreLink);
                }
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsDisplayArea.innerHTML = `<p class="error-message">${errorMessage || 'Could not load comments. Please try again later.'}</p>`;
        }
    }

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = commentNameInput.value.trim();
            const text = commentTextInput.value.trim();
            const submitButton = commentForm.querySelector('button[type="submit"]');
            let originalButtonText = '';
            if(submitButton) {
                originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
            }
            const existingError = commentForm.querySelector('.error-message');
            if (existingError) existingError.remove();
            if (!name || !text) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Name and comment are required.';
                commentForm.appendChild(errorDiv);
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                return;
            }
            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, text })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    const errorMsg = errData?.error || `Failed to submit comment: ${response.statusText}`;
                    throw new Error(errorMsg);
                }
                commentNameInput.value = '';
                commentTextInput.value = '';
                loadComments(); // Reload home page comments
                // If currently on comments-view, reload that too
                if (document.getElementById('comments-view')?.classList.contains('active') && typeof loadAllCommentsPage === 'function') {
                    loadAllCommentsPage();
                }
                trackActivity('comment_posted', { nameLength: name.length, textLength: text.length });
            } catch (error) {
                console.error('Error submitting comment:', error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = error.message || 'Could not submit comment. Please try again.';
                commentForm.appendChild(errorDiv);
            } finally {
                 if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }
    // --- END OF HOME PAGE COMMENTS SECTION LOGIC ---

    // --- DEDICATED COMMENTS PAGE LOGIC (Phase 4.2) ---
    async function loadAllCommentsPage() {
        const container = document.getElementById('all-comments-list-container');
        if (!container) return;
        container.innerHTML = '<p>Loading all comments...</p>';
        if (!chatUID) {
            console.warn("User UID not available for comment interactions.");
        }

        try {
            const response = await fetch('/api/comments');
            if (!response.ok) throw new Error('Failed to fetch comments.');
            const comments = await response.json();

            container.innerHTML = '';
            if (comments.length === 0) {
                container.innerHTML = '<p>No comments found on the site yet.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.className = 'all-comments-list-ul';
            comments.forEach(comment => {
                const li = document.createElement('li');
                li.className = 'all-comment-item';
                li.dataset.commentId = comment._id;

                const likes = comment.likes || { count: 0, users: [] };
                const dislikes = comment.dislikes || { count: 0, users: [] };
                const userHasLiked = chatUID ? likes.users.includes(chatUID) : false;
                const userHasDisliked = chatUID ? dislikes.users.includes(chatUID) : false;

                let commentHTML = `
                    <div class="comment-content">
                        <strong>${escapeHTML(comment.name)}</strong> (${new Date(comment.createdAt).toLocaleString()}):
                        <p>${escapeHTML(comment.text)}</p>
                    </div>
                `;
                if (comment.adminReplyText && comment.adminReplyText.trim() !== "") {
                    commentHTML += `
                        <div class="admin-reply-public" style="margin-left: 20px; margin-top: 5px;">
                             <p class="admin-reply-public-text">
                                <strong>Admin Reply (${new Date(comment.adminReplyTimestamp || Date.now()).toLocaleString()}):</strong>
                                ${escapeHTML(comment.adminReplyText)}
                            </p>
                        </div>`;
                }
                commentHTML += `
                    <div class="comment-actions">
                        <button class="like-btn ${userHasLiked ? 'active' : ''}" title="Like" ${!chatUID ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" class="icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                            <span class="like-count">${likes.count}</span>
                        </button>
                        <button class="dislike-btn ${userHasDisliked ? 'active' : ''}" title="Dislike" ${!chatUID ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" class="icon"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path></svg>
                            <span class="dislike-count">${dislikes.count}</span>
                        </button>
                    </div>
                `;
                li.innerHTML = commentHTML;
                ul.appendChild(li);

                if(chatUID){ // Only add listeners if UID exists
                    const likeButton = li.querySelector('.like-btn');
                    const dislikeButton = li.querySelector('.dislike-btn');
                    likeButton.addEventListener('click', () => handleCommentVote(comment._id, 'like', li));
                    dislikeButton.addEventListener('click', () => handleCommentVote(comment._id, 'dislike', li));
                }
            });
            container.appendChild(ul);

        } catch (error) {
            console.error('Error loading all comments:', error);
            container.innerHTML = `<p class="error-message">Could not load comments: ${error.message}</p>`;
        }
    }

    async function handleCommentVote(commentId, voteType, commentElement) {
        if (!chatUID) {
            alert("User ID is missing. Cannot vote."); // Should ideally not happen if buttons are disabled
            return;
        }
        try {
            const response = await fetch(`/api/comments/${commentId}/${voteType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: chatUID })
            });
            if (!response.ok) {
                const errData = await response.json().catch(()=>({error:"Failed to vote"}));
                throw new Error(errData.error);
            }
            const updatedComment = await response.json();

            const likes = updatedComment.likes || { count: 0, users: [] };
            const dislikes = updatedComment.dislikes || { count: 0, users: [] };
            commentElement.querySelector('.like-count').textContent = likes.count;
            commentElement.querySelector('.dislike-count').textContent = dislikes.count;

            const likeBtn = commentElement.querySelector('.like-btn');
            const dislikeBtn = commentElement.querySelector('.dislike-btn');
            likeBtn.classList.toggle('active', likes.users.includes(chatUID));
            dislikeBtn.classList.toggle('active', dislikes.users.includes(chatUID));

        } catch (error) {
            console.error(`Error ${voteType}ing comment:`, error);
            alert(`Error ${voteType}ing: ${error.message}`);
        }
    }
    // --- END OF DEDICATED COMMENTS PAGE LOGIC ---


    // --- AI CHAT INTERFACE LOGIC ---
    const chatMessagesArea = document.getElementById('chat-messages-area');
    const chatInputField = document.getElementById('chat-input-field');
    const chatSendButton = document.getElementById('chat-send-button');
    const webSearchToggle = document.getElementById('web-search-toggle');
    const userAvatarSvg = '<svg viewBox="0 0 24 24" class="icon icon-chat-user"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>';
    const aiAvatarSvg = '<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.57-.5 5.07-1.34L20.67 22l-1.41-1.41L17.66 19.07A9.932 9.932 0 0022 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 9c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/></svg>';
    const typingIndicatorHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    let currentTypingIndicator = null;
    function addMessageToChat(message, sender, isTyping = false) {
        if (!chatMessagesArea) return;
        const messageWrapper = document.createElement('div'); messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        const avatarContainer = document.createElement('div'); avatarContainer.classList.add('chat-avatar-container'); avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : aiAvatarSvg;
        const messageBubble = document.createElement('div'); messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'typing-indicator-message';
            currentTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContentEnhanced(message); // Use enhanced formatter
            // Add download button for AI messages in general AI Chat
            if (sender === 'ai') {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(downloadBtn);
                // Copy button can also be added here if desired for general AI chat
                messageBubble.appendChild(controlsDiv);
            }
        }

        messageWrapper.append(avatarContainer, messageBubble); chatMessagesArea.appendChild(messageWrapper);
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
    function removeTypingIndicator() { if (currentTypingIndicator && currentTypingIndicator.parentNode) { currentTypingIndicator.parentNode.removeChild(currentTypingIndicator); currentTypingIndicator = null;}}
    function loadChatHistory() {
        if(!chatMessagesArea || !chatUID) return; chatMessagesArea.innerHTML = "";
        const historyKey = `chatHistory_${chatUID}`; let history = [];
        try{ const stored = localStorage.getItem(historyKey); if(stored) history = JSON.parse(stored); } catch(e){ console.error(e); }
        if(history.length === 0) addMessageToChat("Welcome to AI Chat! How can I help you today?", "ai");
        else history.forEach(item => addMessageToChat(item.message, item.sender));
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
    function saveMessageToHistory(message, sender) {
        if(!chatUID) return; const historyKey = `chatHistory_${chatUID}`; let history = [];
        try{ const stored = localStorage.getItem(historyKey); if(stored) history = JSON.parse(stored); } catch(e){ console.error(e); }
        history.push({message, sender, timestamp: new Date().toISOString()});
        if(history.length > 50) history = history.slice(history.length - 50);
        try{ localStorage.setItem(historyKey, JSON.stringify(history)); } catch(e){ console.error(e); }
    }
    async function handleSendMessage() {
        if (!chatInputField || !chatUID) return; const messageText = chatInputField.value.trim(); if (!messageText) return;
        addMessageToChat(messageText, 'user'); saveMessageToHistory(messageText, 'user');
        trackActivity('ai_chat_message_sent', { messageLength: messageText.length, webSearch: webSearchToggle ? webSearchToggle.checked : false });
        chatInputField.value = '';
        chatInputField.disabled = true; if(chatSendButton) chatSendButton.disabled = true;
        removeTypingIndicator(); addMessageToChat(null, 'ai', true);
        try {
            const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ask: messageText, uid: chatUID, webSearch: webSearchToggle ? webSearchToggle.checked : false }) });
            removeTypingIndicator();
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}`})); throw new Error(errorData.error || `API request failed: ${response.status}`); }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) { addMessageToChat(aiResponse.response, 'ai'); saveMessageToHistory(aiResponse.response, 'ai'); }
            else { throw new Error("Invalid response structure from AI."); }
        } catch (error) { console.error('Error sending message:', error); removeTypingIndicator(); addMessageToChat(`Error: ${error.message || 'Could not connect to AI.'}`, 'ai');
        } finally { chatInputField.disabled = false; if(chatSendButton) chatSendButton.disabled = false; chatInputField.focus(); }
    }
    if (chatSendButton) chatSendButton.addEventListener('click', handleSendMessage);
    if (chatInputField) chatInputField.addEventListener('keypress', e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }});
    const webSearchToggleKey = 'chatWebSearchEnabled';
    function loadWebSearchToggleState() { if (!webSearchToggle) return; webSearchToggle.checked = localStorage.getItem(webSearchToggleKey) === 'true';}
    if (webSearchToggle) webSearchToggle.addEventListener('change', () => localStorage.setItem(webSearchToggleKey, webSearchToggle.checked));
    // --- END OF AI CHAT INTERFACE LOGIC ---

    // --- IMAGE GENERATOR INTERFACE LOGIC ---
    const imagePromptField = document.getElementById('image-prompt-field');
    const generateImageButton = document.getElementById('generate-image-button');
    const imageDisplayArea = document.getElementById('image-display-area');
    const downloadImageButton = document.getElementById('download-image-button');
    const imageHistoryGallery = document.getElementById('image-history-gallery');
    let currentImageUrl = null;
    let currentImagePrompt = "";
    let currentImageBlob = null;
    const imageHistoryKey = 'portfolioImageHistory';

    async function handleImageGeneration() {
        if (!imagePromptField || !imageDisplayArea || !generateImageButton || !downloadImageButton) return;
        const promptValue = imagePromptField.value.trim();
        if (!promptValue) { alert('Please enter a prompt.'); return; }
        trackActivity('image_generation_requested', { promptLength: promptValue.length });
        imageDisplayArea.innerHTML = '<p class="image-loading">Generating image...</p>';
        generateImageButton.disabled = true; imagePromptField.disabled = true; downloadImageButton.style.display = 'none';

        if (currentImageUrl) { URL.revokeObjectURL(currentImageUrl); currentImageUrl = null; }
        currentImageBlob = null;

        try {
            const response = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: promptValue }) });
            if (!response.ok) {
                let errorMsg = `Error: ${response.status} ${response.statusText}`;
                try { const err = await response.json(); errorMsg = err.error || err.message || errorMsg; } catch(e){ /* Ignore if error response not JSON */ }
                throw new Error(errorMsg);
            }

            currentImageBlob = await response.blob();
            currentImageUrl = URL.createObjectURL(currentImageBlob);
            currentImagePrompt = promptValue;

            const img = document.createElement('img');
            img.src = currentImageUrl;
            img.alt = promptValue;
            img.onload = () => {
                saveImagePromptToHistory(promptValue);
                loadImagePromptHistory();
            };
            imageDisplayArea.innerHTML = '';
            imageDisplayArea.appendChild(img);
            downloadImageButton.style.display = 'inline-flex';
        } catch (error) {
            console.error('Image generation error:', error);
            imageDisplayArea.innerHTML = `<p class="image-error">Image generation failed: ${error.message}</p>`;
        } finally {
            generateImageButton.disabled = false;
            imagePromptField.disabled = false;
            if (imagePromptField) imagePromptField.focus();
        }
    }

    function handleImageDownload() {
        if (!currentImageBlob || !currentImagePrompt) {
            alert('No image has been generated yet, or the prompt is missing to name the file.');
            return;
        }
        const temporaryDownloadUrl = URL.createObjectURL(currentImageBlob);
        const a = document.createElement('a');
        a.href = temporaryDownloadUrl;
        let filename = currentImagePrompt.replace(/[^a-z0-9_]/gi, '_').substring(0,30).trim() || 'generated_image';
        const extension = currentImageBlob.type.split('/')[1] || 'png';
        a.download = `${filename}.${extension}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(temporaryDownloadUrl);
    }

    function saveImagePromptToHistory(prompt) {
        if (!localStorage) return;
        let history = JSON.parse(localStorage.getItem(imageHistoryKey)) || [];
        if(history.length > 0 && history[0].prompt === prompt) return;

        history.unshift({ prompt, timestamp: new Date().toISOString() });
        const maxHistoryItems = 10;
        if (history.length > maxHistoryItems) {
            history = history.slice(0, maxHistoryItems);
        }
        localStorage.setItem(imageHistoryKey, JSON.stringify(history));
    }

    function loadImagePromptHistory() {
        if (!imageHistoryGallery || !localStorage) return;

        const titleElement = imageHistoryGallery.querySelector('h4');
        const existingList = imageHistoryGallery.querySelector('.image-history-list');
        if (existingList) existingList.remove();
        const existingEmptyMsg = imageHistoryGallery.querySelector('.history-empty-message');
        if (existingEmptyMsg) existingEmptyMsg.remove();

        let history = JSON.parse(localStorage.getItem(imageHistoryKey)) || [];
        if (history.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No image generation history yet.';
            p.classList.add('history-empty-message');
            if (titleElement) titleElement.insertAdjacentElement('afterend', p); else imageHistoryGallery.appendChild(p);
            return;
        }

        const list = document.createElement('ul');
        list.classList.add('image-history-list');
        history.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add('image-history-item');

            const promptText = document.createElement('span');
            promptText.textContent = item.prompt;
            promptText.title = `Generated on: ${new Date(item.timestamp).toLocaleString()}`;

            const regenerateButton = document.createElement('button');
            regenerateButton.textContent = 'Regenerate';
            regenerateButton.classList.add('btn-history-regenerate');
            regenerateButton.onclick = () => {
                if(imagePromptField) imagePromptField.value = item.prompt;
                handleImageGeneration();
            };

            listItem.appendChild(promptText);
            listItem.appendChild(regenerateButton);
            list.appendChild(listItem);
        });
        imageHistoryGallery.appendChild(list);
    }

    if (generateImageButton) generateImageButton.addEventListener('click', handleImageGeneration);
    if (downloadImageButton) downloadImageButton.addEventListener('click', handleImageDownload);
    // --- END OF IMAGE GENERATOR INTERFACE LOGIC ---

    // --- STORY GENERATOR INTERFACE LOGIC ---
    const storyThemeField = document.getElementById('story-theme-field');
    const generateStoryButton = document.getElementById('generate-story-button');
    const generatedStoryDisplay = document.getElementById('generated-story-display');
    const storyHistoryList = document.getElementById('story-history-list');
    const storyVipControls = document.getElementById('story-vip-controls');
    const storyListenButton = document.getElementById('story-listen-button');
    const storyStopSpeechButton = document.getElementById('story-stop-speech-button'); // Get the new button
    const storyTranslateButton = document.getElementById('story-translate-button');
    const storyDownloadButton = document.getElementById('story-download-button-text');
    const storyHistoryKey = 'portfolioStoryHistory';
    let currentGeneratedStoryContent = "";
    let currentGeneratedStoryTheme = "";

    // --- TRAILER MODAL Elements ---
    const trailerModal = document.getElementById('trailer-modal');
    const trailerIframe = document.getElementById('trailer-iframe');
    const modalCloseButton = document.querySelector('#trailer-modal .modal-close-button');

    // --- TRAILER MODAL Functions ---
    function openTrailerModal(youtubeVideoId) {
        console.log('[TrailerModal] Attempting to open. Video ID:', youtubeVideoId);
        if (!trailerModal || !trailerIframe) {
            console.error('[TrailerModal] ERROR: Modal elements #trailer-modal or #trailer-iframe not found in DOM!');
            // Fallback to new tab if modal elements are missing
            window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank');
            return;
        }
        console.log('[TrailerModal] Modal elements found. Setting iframe src.');
        trailerIframe.src = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`;
        trailerModal.classList.add('visible');
        console.log('[TrailerModal] Modal classList after add:', trailerModal.classList);
        // Forcing a reflow might help in some edge cases with CSS transitions
        // void trailerModal.offsetWidth;
    }

    function closeTrailerModal() {
        console.log('[TrailerModal] Attempting to close.');
        if (!trailerModal || !trailerIframe) {
            console.error('[TrailerModal] ERROR: Modal elements not found on close attempt.');
            return;
        }
        trailerIframe.src = ''; // Clear src to stop video playback
        trailerModal.classList.remove('visible');
        console.log('[TrailerModal] Modal classList after remove:', trailerModal.classList);
    }

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeTrailerModal);
    }

    if (trailerModal) {
        // Close modal if user clicks on the overlay (outside the modal-content)
        trailerModal.addEventListener('click', (event) => {
            if (event.target === trailerModal) { // Check if the click is directly on the overlay
                closeTrailerModal();
            }
        });
    }
    // Add keyboard accessibility for closing modal (Escape key)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && trailerModal && trailerModal.classList.contains('visible')) {
            closeTrailerModal();
        }
    });
    // --- END OF TRAILER MODAL ---

    // --- BOX MOVIE Elements ---
    const boxMovieSearchField = document.getElementById('box-movie-search-field');
    const boxMovieSearchButton = document.getElementById('box-movie-search-button');
    const boxMoviePopularGrid = document.getElementById('box-movie-popular-grid');
    const boxMovieSearchGrid = document.getElementById('box-movie-search-grid');
    const boxMoviePopularSection = document.getElementById('box-movie-popular-section');
    const boxMovieSearchResultsSection = document.getElementById('box-movie-search-results-section');
    const boxMovieDetailsSection = document.getElementById('box-movie-details-section');
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // For posters

    // --- BOX MOVIE Functions ---
    async function fetchFromTMDB(endpoint, params = {}) {
        const baseUrl = '/api/movies'; // Using our backend proxy
        // Construct the full URL using window.location.origin to ensure it's absolute
        const fullUrl = new URL(`${baseUrl}${endpoint}`, window.location.origin);
        Object.keys(params).forEach(key => fullUrl.searchParams.append(key, params[key]));

        try {
            const response = await fetch(fullUrl); // Use the full URL
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                console.error(`Error fetching ${endpoint}:`, errorData.message);
                throw new Error(errorData.message || `Failed to fetch data for ${endpoint}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Network or parsing error fetching ${endpoint}:`, error);
            throw error; // Re-throw to be caught by caller
        }
    }

    async function fetchPopularMovies() {
        if (!boxMoviePopularGrid || !boxMoviePopularSection) return;
        boxMoviePopularGrid.innerHTML = '<p class="loading-movies">Loading popular movies...</p>';
        boxMoviePopularSection.style.display = 'block';
        if (boxMovieSearchResultsSection) boxMovieSearchResultsSection.style.display = 'none';
        if (boxMovieDetailsSection) boxMovieDetailsSection.style.display = 'none';

        try {
            const data = await fetchFromTMDB('/popular');
            renderMovies(data.results, boxMoviePopularGrid);
        } catch (error) {
            boxMoviePopularGrid.innerHTML = `<p class="error-movies">Could not load popular movies: ${error.message}</p>`;
        }
    }

    async function searchMovies(query) {
        if (!query || !boxMovieSearchGrid || !boxMovieSearchResultsSection) return;
        boxMovieSearchGrid.innerHTML = '<p class="loading-movies">Searching movies...</p>';
        if (boxMoviePopularSection) boxMoviePopularSection.style.display = 'none';
        boxMovieSearchResultsSection.style.display = 'block';
        if (boxMovieDetailsSection) boxMovieDetailsSection.style.display = 'none';

        try {
            const data = await fetchFromTMDB('/search', { query });
            renderMovies(data.results, boxMovieSearchGrid);
             if (data.results && data.results.length === 0) {
                boxMovieSearchGrid.innerHTML = `<p class="info-movies">No movies found for "${escapeHTML(query)}".</p>`;
            }
        } catch (error) {
            boxMovieSearchGrid.innerHTML = `<p class="error-movies">Could not perform search: ${error.message}</p>`;
        }
    }

    async function getMovieDetails(movieId) {
        if (!movieId || !boxMovieDetailsSection) return;
        boxMovieDetailsSection.innerHTML = '<p class="loading-movies">Loading movie details...</p>';
        if (boxMoviePopularSection) boxMoviePopularSection.style.display = 'none';
        if (boxMovieSearchResultsSection) boxMovieSearchResultsSection.style.display = 'none';
        boxMovieDetailsSection.style.display = 'block';

        try {
            const movie = await fetchFromTMDB(`/details/${movieId}`);
            renderMovieDetails(movie, boxMovieDetailsSection);
        } catch (error) {
            boxMovieDetailsSection.innerHTML = `<p class="error-movies">Could not load movie details: ${error.message}</p>`;
        }
    }

    function renderMovies(movies, gridElement) {
        if (!movies || !gridElement) return;
        gridElement.innerHTML = ''; // Clear previous content or loading message
        if (movies.length === 0 && gridElement.id === 'box-movie-search-grid') {
            // This case is handled in searchMovies specifically for better message with query
            return;
        } else if (movies.length === 0) {
            gridElement.innerHTML = '<p class="info-movies">No movies to display.</p>';
            return;
        }

        movies.forEach(movie => {
            if (!movie.poster_path) return; // Skip movies without posters for a cleaner look

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.dataset.movieId = movie.id;
            movieCard.innerHTML = `
                <img src="${TMDB_IMAGE_BASE_URL}${movie.poster_path}" alt="${escapeHTML(movie.title)} Poster">
                <div class="movie-card-info">
                    <h4>${escapeHTML(movie.title)} ${movie.release_date ? '(' + movie.release_date.substring(0,4) + ')' : ''}</h4>
                    <p class="movie-rating">Rating: ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} <span class="star-icon">★</span></p>
                </div>
            `;
            movieCard.addEventListener('click', () => getMovieDetails(movie.id));
            gridElement.appendChild(movieCard);
        });
    }

    function renderMovieDetails(movie, detailElement) {
        if (!movie || !detailElement) return;
        const genres = movie.genres && movie.genres.map(g => escapeHTML(g.name)).join(', ');
        const productionCompanies = movie.production_companies && movie.production_companies.slice(0, 3).map(pc => escapeHTML(pc.name)).join(', ');

        detailElement.innerHTML = `
            <button id="box-movie-back-button" class="icon-button box-movie-back-btn">&larr; Back to list</button>
            <div class="movie-detail-header">
                <img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750.png?text=No+Poster'}" alt="${escapeHTML(movie.title)} Poster" class="movie-detail-poster">
                <div class="movie-detail-title-group">
                    <h1>${escapeHTML(movie.title)}</h1>
                    <p class="tagline"><em>${escapeHTML(movie.tagline || '')}</em></p>
                    <p><strong>Release Date:</strong> ${escapeHTML(movie.release_date || 'N/A')}</p>
                    <p><strong>Rating:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} (${movie.vote_count} votes) <span class="star-icon">★</span></p>
                    <p><strong>Runtime:</strong> ${movie.runtime ? movie.runtime + ' minutes' : 'N/A'}</p>
                    <p><strong>Genres:</strong> ${genres || 'N/A'}</p>
                </div>
            </div>
            <div class="movie-detail-overview">
                <h3>Overview</h3>
                <p>${escapeHTML(movie.overview || 'No overview available.')}</p>
            </div>
            <div class="movie-detail-meta">
                <p><strong>Status:</strong> ${escapeHTML(movie.status || 'N/A')}</p>
                <p><strong>Original Language:</strong> ${escapeHTML(movie.original_language ? movie.original_language.toUpperCase() : 'N/A')}</p>
                <p><strong>Budget:</strong> ${movie.budget ? '$' + movie.budget.toLocaleString() : 'N/A'}</p>
                <p><strong>Revenue:</strong> ${movie.revenue ? '$' + movie.revenue.toLocaleString() : 'N/A'}</p>
                <p><strong>Production Companies:</strong> ${productionCompanies || 'N/A'}</p>
            </div>

            <div class="movie-actions">
                <button id="watch-trailer-button-${movie.id}" class="btn-action-movie watch-trailer-btn" data-movie-id="${movie.id}">Watch Trailer</button>
                <button class="btn-action-movie download-movie-btn" title="Functionality not yet implemented" disabled>Download Movie</button>
            </div>
        `;
        const backButton = detailElement.querySelector('#box-movie-back-button');
        const watchTrailerButton = detailElement.querySelector(`#watch-trailer-button-${movie.id}`);

        if (watchTrailerButton) {
            watchTrailerButton.addEventListener('click', (e) => {
                const movieId = e.currentTarget.dataset.movieId;
                fetchAndDisplayTrailer(movieId);
            });
        }
        if (backButton) {
            backButton.addEventListener('click', () => {
                detailElement.style.display = 'none';
                detailElement.innerHTML = '';
                // Show the previously active list (popular or search)
                if (boxMovieSearchGrid && boxMovieSearchGrid.innerHTML !== '' && boxMovieSearchResultsSection && boxMovieSearchResultsSection.style.display === 'block') {
                    // Search results were visible, do nothing to explicitly re-show them as they are already block
                } else if (boxMoviePopularGrid && boxMoviePopularGrid.innerHTML !== '' && boxMoviePopularSection) {
                    boxMoviePopularSection.style.display = 'block';
                } else { // Fallback if neither list has content or popular section isn't found
                    fetchPopularMovies();
                }
            });
        }
    }

    if (boxMovieSearchButton && boxMovieSearchField) {
        boxMovieSearchButton.addEventListener('click', () => {
            const query = boxMovieSearchField.value.trim();
            if (query) {
                searchMovies(query);
            } else {
                fetchPopularMovies(); // If search is empty, show popular movies
            }
        });
        boxMovieSearchField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = boxMovieSearchField.value.trim();
                if (query) {
                    searchMovies(query);
                } else {
                    fetchPopularMovies(); // If search is empty on Enter, show popular movies
                }
            }
        });
    }

    async function fetchAndDisplayTrailer(movieId) {
        if (!movieId) {
            console.log('[TrailerModal] fetchAndDisplayTrailer called with no movieId.');
            return;
        }
        console.log(`[TrailerModal] Fetching trailer for movie ID: ${movieId}`);
        try {
            const videoData = await fetchFromTMDB(`/details/${movieId}/videos`);
            console.log('[TrailerModal] Fetched video data:', videoData);

            if (videoData && videoData.results && videoData.results.length > 0) {
                const officialTrailer = videoData.results.find(video =>
                    video.type === 'Trailer' && video.site === 'YouTube' && video.official === true
                );
                const trailer = officialTrailer || videoData.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
                const teaser = videoData.results.find(video => video.type === 'Teaser' && video.site === 'YouTube');

                let videoToPlay = null;
                if (trailer) {
                    videoToPlay = trailer;
                } else if (teaser) {
                    videoToPlay = teaser;
                } else if (videoData.results.find(video => video.site === 'YouTube')) { // Find first available YouTube video if no trailer/teaser
                    videoToPlay = videoData.results.find(video => video.site === 'YouTube');
                }

                console.log('[TrailerModal] Chosen video to play:', videoToPlay);

                if (videoToPlay && videoToPlay.site === 'YouTube' && videoToPlay.key) {
                    openTrailerModal(videoToPlay.key);
                } else {
                    alert('No suitable YouTube video found for this movie.');
                    console.log('[TrailerModal] No suitable YouTube video. Available videos:', videoData.results);
                }
            } else {
                alert('No trailers or video information found for this movie.');
                console.log('[TrailerModal] No video results in data.');
            }
        } catch (error) {
            console.error('[TrailerModal] Error fetching or displaying trailer:', error);
            alert(`Could not fetch trailer information: ${error.message}`);
        }
    }
    // --- END OF BOX MOVIE ---

    // --- GEMINI CHAT ELEMENTS ---
    const geminiChatMessagesArea = document.getElementById('gemini-chat-messages-area');
    const geminiChatInputField = document.getElementById('gemini-chat-input-field');
    const geminiChatSendButton = document.getElementById('gemini-chat-send-button');
    const geminiChatImageUpload = document.getElementById('gemini-chat-image-upload');
    const geminiChatAttachImageButton = document.getElementById('gemini-chat-attach-image-button');
    const geminiImagePreviewContainer = document.getElementById('gemini-image-preview-container');
    const geminiChatImageUrlField = document.getElementById('gemini-chat-image-url-field');
    let currentGeminiSelectedFile = null;
    // let currentGeminiSelectedImageUrl = ""; // This variable is less relevant now with direct file upload for Gemini

    // --- GPT-4o CHAT ELEMENTS ---
    const gpt4oChatMessagesArea = document.getElementById('gpt4o-chat-messages-area');
    const gpt4oChatInputField = document.getElementById('gpt4o-chat-input-field');
    const gpt4oChatSendButton = document.getElementById('gpt4o-chat-send-button');
    const gpt4oChatImageUpload = document.getElementById('gpt4o-chat-image-upload');
    const gpt4oChatAttachImageButton = document.getElementById('gpt4o-chat-attach-image-button');
    const gpt4oImagePreviewContainer = document.getElementById('gpt4o-image-preview-container');
    let currentGpt4oSelectedFile = null; // To hold the selected file object for GPT-4o

    function checkVIPStatus() { // This function now checks localStorage
        return localStorage.getItem('isUserVIP') === 'true';
    }

    function updateStoryVipControlsVisibility() {
        if (!storyVipControls) return;
        // VIP status is no longer determined locally by 'isUserVIP' in localStorage
        // For now, hide story VIP controls by default.
        // If there's another mechanism to enable them, it would go here.
        storyVipControls.style.display = 'none';

        // Original logic that depended on checkVIPStatus() and currentGeneratedStoryContent:
        // if (checkVIPStatus() && currentGeneratedStoryContent) {
        //     storyVipControls.style.display = 'flex';
        // } else {
        //     storyVipControls.style.display = 'none';
        // }
    }

    function formatTextContent(text) { // Renamed to formatTextContentBasic if needed, but will be replaced by formatTextContentEnhanced
        if (typeof text !== 'string') return '';
        let resultText = text;
        resultText = resultText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        resultText = resultText.replace(/^## (.*$)/gim, '<h4>$1</h4>');
        resultText = resultText.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        resultText = resultText.replace(/\*([^*]+)\*/gim, '<strong>$1</strong>'); // Assuming single * also means bold as per previous logic
        return resultText;
    }

    // formatTextContentEnhanced is now the primary formatter and includes code block handling
    // It's defined further down but will be used by all chat functions.

    async function handleStoryGeneration() {
        if (!storyThemeField || !generatedStoryDisplay || !generateStoryButton) return;
        const theme = storyThemeField.value.trim();
        if (!theme) { alert('Please enter a theme or title for your story.'); return; }
        trackActivity('story_generation_requested', { themeLength: theme.length });
        generatedStoryDisplay.innerHTML = '<p class="story-loading">Crafting your tale... Please hold on.</p>';
        generateStoryButton.disabled = true; storyThemeField.disabled = true;
        currentGeneratedStoryContent = "";
        currentGeneratedStoryTheme = theme;
        updateStoryVipControlsVisibility();

        const storyPrompt = `Create a short story about: ${theme}`;
        if (!chatUID) chatUID = getOrCreateUID();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: storyPrompt, uid: chatUID, webSearch: 'off', isStoryRequestFlag: true })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `Story generation failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                currentGeneratedStoryContent = aiResponse.response;
                generatedStoryDisplay.innerHTML = formatTextContent(currentGeneratedStoryContent);
                saveStoryToHistory(currentGeneratedStoryTheme, currentGeneratedStoryContent);
                loadStoryHistory();
                updateStoryVipControlsVisibility();
            } else {
                throw new Error("Invalid response structure from story AI. Missing 'response' field.");
            }
        } catch (error) {
            console.error('Error generating story:', error);
            generatedStoryDisplay.innerHTML = `<p class="story-error">Error: ${error.message}</p>`;
            currentGeneratedStoryContent = "";
        } finally {
            generateStoryButton.disabled = false; storyThemeField.disabled = false;
            if(storyThemeField) storyThemeField.focus();
        }
    }

    function saveStoryToHistory(theme, content) {
        if (!localStorage) return;
        let history = JSON.parse(localStorage.getItem(storyHistoryKey)) || [];
        if (history.some(item => item.theme === theme && item.content === content)) return;
        history.unshift({ theme, content, timestamp: new Date().toISOString() });
        const maxStoryHistoryItems = 10;
        if (history.length > maxStoryHistoryItems) history = history.slice(0, maxStoryHistoryItems);
        localStorage.setItem(storyHistoryKey, JSON.stringify(history));
    }

    function loadStoryHistory() {
        if (!storyHistoryList || !localStorage) return;
        const storyHistoryArea = document.getElementById('story-history-area');
        if (!storyHistoryArea) return;
        storyHistoryList.innerHTML = '';
        let history = JSON.parse(localStorage.getItem(storyHistoryKey)) || [];
        if (history.length === 0) {
            storyHistoryList.innerHTML = '<p class="history-empty-message">No stories in your collection yet.</p>';
            return;
        }
        history.forEach((story) => {
            const storyItem = document.createElement('div');
            storyItem.classList.add('story-history-item');
            const themeText = document.createElement('span');
            themeText.textContent = story.theme;
            themeText.title = `Saved on: ${new Date(story.timestamp).toLocaleString()}`;
            storyItem.appendChild(themeText);
            storyItem.addEventListener('click', () => {
                if(generatedStoryDisplay) {
                    currentGeneratedStoryContent = story.content;
                    generatedStoryDisplay.innerHTML = formatTextContent(story.content);
                    currentGeneratedStoryTheme = story.theme;
                    if(storyThemeField) storyThemeField.value = story.theme;
                    updateStoryVipControlsVisibility();
                }
            });
            storyHistoryList.appendChild(storyItem);
        });
    }

    if (generateStoryButton) generateStoryButton.addEventListener('click', handleStoryGeneration);
    if (storyListenButton && storyStopSpeechButton) { // Ensure both buttons exist
        storyListenButton.addEventListener('click', () => {
            if (!currentGeneratedStoryContent) {
                alert('No story to listen to.');
                return;
            }
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech before starting a new one
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(currentGeneratedStoryContent);

                utterance.onstart = () => {
                    console.log('Speech started...');
                    storyStopSpeechButton.style.display = 'inline-flex'; // Show stop button
                    storyListenButton.disabled = true; // Disable listen button while speaking
                };

                utterance.onend = () => {
                    console.log('Speech ended...');
                    storyStopSpeechButton.style.display = 'none';   // Hide stop button
                    storyListenButton.disabled = false; // Re-enable listen button
                };

                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event.error);
                    alert('Could not play the story.');
                    storyStopSpeechButton.style.display = 'none';   // Hide stop button on error
                    storyListenButton.disabled = false; // Re-enable listen button
                };

                window.speechSynthesis.speak(utterance);
            } else {
                alert('Sorry, your browser does not support text-to-speech.');
            }
        });

        // Add event listener for the new stop button
        storyStopSpeechButton.addEventListener('click', () => {
            if ('speechSynthesis' in window) {
                console.log('Stop speech button clicked.');
                window.speechSynthesis.cancel(); // Stop any ongoing speech
                // The onend event of the utterance will handle hiding the stop button and re-enabling listen.
            }
        });
    }
    if(storyTranslateButton) {
        storyTranslateButton.addEventListener('click', async () => {
            if (!currentGeneratedStoryContent) { alert('No story to translate.'); return; }
            const targetLanguage = prompt("Enter target language (e.g., French, Spanish, German):");
            if (!targetLanguage || targetLanguage.trim() === "") return;
            const translatePrompt = `Translate the following story into ${targetLanguage.trim()}:\n\n"${currentGeneratedStoryContent}"`;
            if(generatedStoryDisplay) generatedStoryDisplay.innerHTML = `<p class="story-loading">Translating story to ${targetLanguage.trim()}...</p>`;
            if (!chatUID) chatUID = getOrCreateUID();
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ask: translatePrompt, uid: chatUID, webSearch: 'off' })
                });
                if (!response.ok) { const err = await response.json().catch(()=>{}); throw new Error(err?.error || `Translation failed: ${response.status}`);}
                const aiResponse = await response.json();
                if (aiResponse && aiResponse.response) {
                    if(generatedStoryDisplay) generatedStoryDisplay.textContent = aiResponse.response; // No formatTextContent for direct translation
                } else { throw new Error("Invalid response structure from translation AI."); }
            } catch (error) { console.error('Error translating story:', error); if(generatedStoryDisplay) generatedStoryDisplay.innerHTML = `<p class="story-error">Translation error: ${error.message}</p>`; }
        });
    }
    if(storyDownloadButton) {
        storyDownloadButton.addEventListener('click', () => {
            if (!currentGeneratedStoryContent || !currentGeneratedStoryTheme) { alert('No story content or theme.'); return; }
            const filename = (currentGeneratedStoryTheme.replace(/[^a-z0-9_]/gi, '_').substring(0,30).trim() || "generated_story") + ".txt";
            const blob = new Blob([currentGeneratedStoryContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = filename; document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        });
    }
    // --- END OF STORY GENERATOR INTERFACE LOGIC ---

    // --- GEMINI CHAT LOGIC (Initialisation Part) ---
    if (geminiChatAttachImageButton && geminiChatImageUpload) {
        geminiChatAttachImageButton.addEventListener('click', () => {
            geminiChatImageUpload.click(); // Trigger the hidden file input
        });

        geminiChatImageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                currentGeminiSelectedFile = file;
                // Display image preview
                if (geminiImagePreviewContainer) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        geminiImagePreviewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 50px; border-radius: 4px;">`;
                    };
                    reader.readAsDataURL(file);
                }
                // For now, we make the URL input field visible to ask the user for a URL.
                // Later, this part would be replaced by an actual image upload service call.
                if (geminiChatImageUrlField) {
                    // This field is now being phased out for input, ensure it's hidden or remove from HTML later
                    geminiChatImageUrlField.style.display = 'none';
                }
                // currentGeminiSelectedImageUrl = ""; // Not needed as we send the file directly
            } else {
                currentGeminiSelectedFile = null;
                if (geminiImagePreviewContainer) geminiImagePreviewContainer.innerHTML = "";
                if (geminiChatImageUrlField) geminiChatImageUrlField.style.display = 'none';
            }
        });
    }

    // Remove or comment out the logic that shows geminiChatImageUrlField on image selection,
    // as it's not the primary way to send images anymore.
    // The alert asking user to paste URL is also removed.

    let geminiTypingIndicator = null;

    function addGeminiMessageToChat(message, sender, imageUrl = null, isTyping = false) {
        if (!geminiChatMessagesArea) return;

        // Remove existing typing indicator before adding a new message or indicator
        if (geminiTypingIndicator && geminiTypingIndicator.parentNode) {
            geminiTypingIndicator.remove();
            geminiTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai'); // Re-use existing chat-message-wrapper styles

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        if (sender === 'user') {
            avatarContainer.innerHTML = userAvatarSvg;
        } else { // AI (Gemini)
            avatarContainer.innerHTML = `<img src="https://www.gstatic.com/images/branding/product/2x/gemini_48dp.png" alt="Gemini" class="gemini-avatar-logo">`;
        }

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble'); // Re-use

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML; // Re-use existing typing_indicator HTML
            messageWrapper.id = 'gemini-typing-indicator-message'; // Unique ID if needed
            geminiTypingIndicator = messageWrapper;
        } else {
            // Sanitize and format message text
            let formattedMessage = message ? formatTextContentEnhanced(message) : ''; // Use enhanced formatter

            if (imageUrl) {
                formattedMessage += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            messageBubble.innerHTML = formattedMessage;

            // Add download button for AI messages in Gemini Vision Chat
            if (sender === 'gemini') { // Corrected sender condition
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }

        messageWrapper.append(avatarContainer, messageBubble);
        geminiChatMessagesArea.appendChild(messageWrapper);
        geminiChatMessagesArea.scrollTop = geminiChatMessagesArea.scrollHeight;
    }


    async function handleGeminiSendMessage() {
        if (!geminiChatInputField || !chatUID) return;

        const messageText = geminiChatInputField.value.trim();
        // currentGeminiSelectedFile holds the File object if one was selected

        if (!messageText && !currentGeminiSelectedFile) {
            alert("Please type a message or select an image.");
            return;
        }

        // Display user's message in chat - if image selected, create a temporary object URL for display
        let tempPreviewUrl = null;
        if (currentGeminiSelectedFile) {
            tempPreviewUrl = URL.createObjectURL(currentGeminiSelectedFile);
        }
        addGeminiMessageToChat(messageText, 'user', tempPreviewUrl);
        // Note: We save tempPreviewUrl to history for local display. The actual image data is sent to backend.
        saveGeminiMessageToHistory(messageText, 'user', tempPreviewUrl);


        // Track activity
        trackActivity('gemini_chat_message_sent', {
            messageLength: messageText.length,
            hasImage: !!currentGeminiSelectedFile
        });

        const formData = new FormData();
        formData.append('uid', chatUID);
        if (messageText) {
            formData.append('q', messageText);
        }
        if (currentGeminiSelectedFile) {
            formData.append('imageFile', currentGeminiSelectedFile, currentGeminiSelectedFile.name);
        }

        // Clear inputs
        geminiChatInputField.value = '';
        // geminiChatImageUrlField is no longer used for input, so no need to clear or hide it if it's removed from HTML or permanently hidden
        if (geminiChatImageUrlField) geminiChatImageUrlField.style.display = 'none'; // Ensure it's hidden
        if (geminiImagePreviewContainer) geminiImagePreviewContainer.innerHTML = "";
        const oldSelectedFile = currentGeminiSelectedFile; // Keep reference for potential revokeObjectURL
        currentGeminiSelectedFile = null;


        // Disable input while waiting for response
        geminiChatInputField.disabled = true;
        if (geminiChatSendButton) geminiChatSendButton.disabled = true;
        if (geminiChatAttachImageButton) geminiChatAttachImageButton.disabled = true;

        addGeminiMessageToChat(null, 'gemini', null, true); // Show typing indicator for Gemini

        try {
            // const payload = { // Payload is now FormData
            //     q: messageText,
            //     uid: chatUID,
            // };
            // if (currentGeminiSelectedImageUrl) { // This logic is now part of FormData
            //     payload.imageUrl = currentGeminiSelectedImageUrl;
            // }

            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                // headers: { 'Content-Type': 'application/json' }, // Not for FormData
                body: formData // Send FormData directly
            });

            if (geminiTypingIndicator) geminiTypingIndicator.remove();

            // Revoke the object URL for the displayed user image after sending, if one was created
            if (tempPreviewUrl) {
                URL.revokeObjectURL(tempPreviewUrl);
            }
            if (oldSelectedFile && tempPreviewUrl) { // Double check, oldSelectedFile might be more reliable here
                 // URL.revokeObjectURL(URL.createObjectURL(oldSelectedFile)); // This would create a new one
            }


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addGeminiMessageToChat(aiResponse.response, 'gemini');
                // Assuming Gemini response does not contain an image URL to save with its own message
                saveGeminiMessageToHistory(aiResponse.response, 'gemini', null); // Save AI message
            } else {
                throw new Error("Invalid response structure from Gemini AI.");
            }

        } catch (error) {
            console.error('Error sending Gemini message:', error);
            if (geminiTypingIndicator) geminiTypingIndicator.remove();
            addGeminiMessageToChat(`Error: ${error.message || 'Could not connect to Gemini.'}`, 'gemini');
        } finally {
            geminiChatInputField.disabled = false;
            if (geminiChatSendButton) geminiChatSendButton.disabled = false;
            if (geminiChatAttachImageButton) geminiChatAttachImageButton.disabled = false;
            if (geminiChatInputField) geminiChatInputField.focus();
            currentGeminiSelectedImageUrl = ""; // Reset for the next message
        }
    }

    if (geminiChatSendButton) {
        geminiChatSendButton.addEventListener('click', handleGeminiSendMessage);
    }
    if (geminiChatInputField) {
        geminiChatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGeminiSendMessage();
            }
        });
    }

    // --- END OF GEMINI CHAT LOGIC (Initialisation Part) ---

    // --- GEMINI CHAT LOGIC (Part 3: History) ---
    const geminiHistoryKeyPrefix = 'geminiChatHistory_';

    function saveGeminiMessageToHistory(message, sender, imageUrl = null) {
        if (!chatUID) return; // Ensure UID is available
        const historyKey = `${geminiHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing Gemini chat history from localStorage:", e);
            // Potentially clear corrupted history: localStorage.removeItem(historyKey);
        }

        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString() });

        // Limit history size (e.g., to last 50 messages)
        if (history.length > 50) {
            history = history.slice(history.length - 50);
        }

        try {
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) {
            console.error("Error saving Gemini chat history to localStorage:", e);
            // This can happen if localStorage is full
        }
    }

    function loadGeminiChatHistory() {
        if (!geminiChatMessagesArea || !chatUID) return;
        geminiChatMessagesArea.innerHTML = ""; // Clear current messages

        const historyKey = `${geminiHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing Gemini chat history from localStorage on load:", e);
            // localStorage.removeItem(historyKey); // Option: Clear corrupted history
        }

        if (history.length === 0) {
            // Display a welcome message if history is empty
            addGeminiMessageToChat("Welcome to Gemini Chat! Ask me anything or send an image.", 'gemini');
        } else {
            history.forEach(item => {
                addGeminiMessageToChat(item.message, item.sender, item.imageUrl);
            });
        }
        if (geminiChatMessagesArea) geminiChatMessagesArea.scrollTop = geminiChatMessagesArea.scrollHeight;
    }

    // Integrate history saving into handleGeminiSendMessage
    // (This requires modifying the existing handleGeminiSendMessage function)

    // --- END OF GEMINI CHAT LOGIC (Part 3: History) ---

    // --- GPT-4o CHAT LOGIC ---
    let gpt4oTypingIndicator = null;
    const gpt4oHistoryKeyPrefix = 'gpt4oChatHistory_';

    // Placeholder SVG for GPT icon (until gpt.jpg is used)
    const gptAvatarSvg = `<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.57-.5 5.07-1.34L20.67 22l-1.41-1.41L17.66 19.07A9.932 9.932 0 0022 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 9c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/></svg>`;


    function addGpt4oMessageToChat(message, sender, imageUrl = null, isTyping = false) {
        if (!gpt4oChatMessagesArea) return;

        if (gpt4oTypingIndicator && gpt4oTypingIndicator.parentNode) {
            gpt4oTypingIndicator.remove();
            gpt4oTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        if (sender === 'user') {
            avatarContainer.innerHTML = userAvatarSvg;
        } else { // AI (GPT-4o)
            // Replace with <img src="/gpt.jpg" alt="GPT" class="gpt4o-avatar-logo"> when gpt.jpg is available
            avatarContainer.innerHTML = `<img src="/gpt.jpg" alt="GPT" class="gpt4o-avatar-logo" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.innerHTML = '${gptAvatarSvg}'">`;
        }

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'gpt4o-typing-indicator-message';
            gpt4oTypingIndicator = messageWrapper;
        } else {
            let formattedMessage = message ? formatTextContentEnhanced(message) : ''; // Use enhanced formatter
            if (imageUrl) {
                formattedMessage += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            messageBubble.innerHTML = formattedMessage;
            // Add download button for AI messages in GPT-4o Chat
            if (sender === 'ai') { // GPT-4o uses 'ai' as sender for its messages
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }

        messageWrapper.append(avatarContainer, messageBubble);
        gpt4oChatMessagesArea.appendChild(messageWrapper);
        gpt4oChatMessagesArea.scrollTop = gpt4oChatMessagesArea.scrollHeight;
    }

    async function handleGpt4oSendMessage() {
        if (!gpt4oChatInputField || !chatUID) return;

        const messageText = gpt4oChatInputField.value.trim();
        if (!messageText && !currentGpt4oSelectedFile) {
            alert("Please type a message or select an image for GPT-4o chat.");
            return;
        }

        let tempPreviewUrl = null;
        if (currentGpt4oSelectedFile) {
            tempPreviewUrl = URL.createObjectURL(currentGpt4oSelectedFile);
        }
        addGpt4oMessageToChat(messageText, 'user', tempPreviewUrl);
        saveGpt4oMessageToHistory(messageText, 'user', tempPreviewUrl);

        trackActivity('gpt4o_chat_message_sent', {
            messageLength: messageText.length,
            hasImage: !!currentGpt4oSelectedFile
        });

        const formData = new FormData();
        formData.append('uid', chatUID);
        if (messageText) formData.append('q', messageText); // API uses 'ask', but backend route /api/gpt4o-chat expects 'q' from form for consistency with Gemini route
        if (currentGpt4oSelectedFile) {
            formData.append('imageFile', currentGpt4oSelectedFile, currentGpt4oSelectedFile.name);
        }

        gpt4oChatInputField.value = '';
        if (gpt4oImagePreviewContainer) gpt4oImagePreviewContainer.innerHTML = "";
        currentGpt4oSelectedFile = null;

        gpt4oChatInputField.disabled = true;
        if (gpt4oChatSendButton) gpt4oChatSendButton.disabled = true;
        if (gpt4oChatAttachImageButton) gpt4oChatAttachImageButton.disabled = true;

        addGpt4oMessageToChat(null, 'ai', null, true); // Show typing indicator for GPT-4o

        try {
            const response = await fetch('/api/gpt4o-chat', {
                method: 'POST',
                body: formData
            });

            if (gpt4oTypingIndicator) gpt4oTypingIndicator.remove();
            if (tempPreviewUrl) URL.revokeObjectURL(tempPreviewUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `GPT-4o API request failed: ${response.status}`);
            }

            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addGpt4oMessageToChat(aiResponse.response, 'ai');
                saveGpt4oMessageToHistory(aiResponse.response, 'ai', null);
            } else {
                throw new Error("Invalid response structure from GPT-4o AI.");
            }
        } catch (error) {
            console.error('Error sending GPT-4o message:', error);
            if (gpt4oTypingIndicator) gpt4oTypingIndicator.remove();
            addGpt4oMessageToChat(`Error: ${error.message || 'Could not connect to GPT-4o.'}`, 'ai');
        } finally {
            gpt4oChatInputField.disabled = false;
            if (gpt4oChatSendButton) gpt4oChatSendButton.disabled = false;
            if (gpt4oChatAttachImageButton) gpt4oChatAttachImageButton.disabled = false;
            if (gpt4oChatInputField) gpt4oChatInputField.focus();
        }
    }

    if (gpt4oChatAttachImageButton && gpt4oChatImageUpload) {
        gpt4oChatAttachImageButton.addEventListener('click', () => gpt4oChatImageUpload.click());
        gpt4oChatImageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                currentGpt4oSelectedFile = file;
                if (gpt4oImagePreviewContainer) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        gpt4oImagePreviewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 50px; border-radius: 4px;">`;
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                currentGpt4oSelectedFile = null;
                if (gpt4oImagePreviewContainer) gpt4oImagePreviewContainer.innerHTML = "";
            }
        });
    }

    if (gpt4oChatSendButton) gpt4oChatSendButton.addEventListener('click', handleGpt4oSendMessage);
    if (gpt4oChatInputField) {
        gpt4oChatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGpt4oSendMessage();
            }
        });
    }

    function saveGpt4oMessageToHistory(message, sender, imageUrl = null) {
        if (!chatUID) return;
        const historyKey = `${gpt4oHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) { console.error("Error parsing GPT-4o chat history:", e); }
        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(history.length - 50);
        try {
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) { console.error("Error saving GPT-4o chat history:", e); }
    }

    function loadGpt4oChatHistory() {
        if (!gpt4oChatMessagesArea || !chatUID) return;
        gpt4oChatMessagesArea.innerHTML = "";
        const historyKey = `${gpt4oHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) { console.error("Error parsing GPT-4o history on load:", e); }

        if (history.length === 0) {
            addGpt4oMessageToChat("Welcome to GPT-4o Chat! How can I assist you today?", 'ai');
        } else {
            history.forEach(item => addGpt4oMessageToChat(item.message, item.sender, item.imageUrl));
        }
        if (gpt4oChatMessagesArea) gpt4oChatMessagesArea.scrollTop = gpt4oChatMessagesArea.scrollHeight;
    }
    // --- END OF GPT-4o CHAT LOGIC ---

    // --- BLACKBOX AI CHAT LOGIC ---
    const blackboxChatMessagesArea = document.getElementById('blackbox-chat-messages-area');
    const blackboxChatInputField = document.getElementById('blackbox-chat-input-field');
    const blackboxChatSendButton = document.getElementById('blackbox-chat-send-button');
    const blackboxWebSearchToggle = document.getElementById('blackbox-web-search-toggle');
    const blackboxHistoryKeyPrefix = 'blackboxAiChatHistory_';
    let blackboxTypingIndicator = null;

    // Specific avatar for Blackbox AI (example, can be an SVG or img tag)
    const blackboxAvatarSvg = `<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L6 12.07V14h2v-3.09l-1.79-1.79C7.39 8.07 8.63 7 10 7c.74 0 1.38.33 1.81.84L13 9h-2v2h3V9.67l.47-.47C14.64 9.07 14.82 9 15 9c.55 0 1 .45 1 1v1.44c0 .43-.28.81-.68.95L13.5 13H11v2h3.5l1.78-1.78c.4-.4.99-.46 1.45-.13.62.45.97 1.17.97 1.91 0 2.76-2.24 5-5 5-.78 0-1.5-.19-2.15-.52zM12 4c-1.3 0-2.4.84-2.82 2H11V4h2v2h1.82C14.4 4.84 13.3 4 12 4z"/></svg>`; // Example: more complex/blocky icon

    function addBlackboxAiMessageToChat(message, sender, isTyping = false) {
        if (!blackboxChatMessagesArea) return;
        if (blackboxTypingIndicator && blackboxTypingIndicator.parentNode) {
            blackboxTypingIndicator.remove();
            blackboxTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : blackboxAvatarSvg;

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'blackbox-typing-indicator-message';
            blackboxTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContentEnhanced(message); // Use enhanced formatter
            if (sender === 'ai') {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }
        messageWrapper.append(avatarContainer, messageBubble);
        blackboxChatMessagesArea.appendChild(messageWrapper);
        blackboxChatMessagesArea.scrollTop = blackboxChatMessagesArea.scrollHeight;
    }

    function saveBlackboxAiMessageToHistory(message, sender) {
        if (!chatUID) return;
        const historyKey = `${blackboxHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }
        history.push({ message, sender, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(history.length - 50);
        try { localStorage.setItem(historyKey, JSON.stringify(history)); } catch (e) { console.error(e); }
    }

    function loadBlackboxAiChatHistory() {
        if (!blackboxChatMessagesArea || !chatUID) return;
        blackboxChatMessagesArea.innerHTML = "";
        const historyKey = `${blackboxHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }
        if (history.length === 0) {
            addBlackboxAiMessageToChat("Hi! I'm Blackbox AI. Ask me anything or toggle web search.", 'ai');
        } else {
            history.forEach(item => addBlackboxAiMessageToChat(item.message, item.sender));
        }
        if (blackboxChatMessagesArea) blackboxChatMessagesArea.scrollTop = blackboxChatMessagesArea.scrollHeight;
    }

    const blackboxWebSearchToggleKey = 'blackboxWebSearchEnabled';
    function loadBlackboxWebSearchToggleState() {
        if (!blackboxWebSearchToggle) return;
        blackboxWebSearchToggle.checked = localStorage.getItem(blackboxWebSearchToggleKey) === 'true';
    }
    if (blackboxWebSearchToggle) {
        blackboxWebSearchToggle.addEventListener('change', () => {
            localStorage.setItem(blackboxWebSearchToggleKey, blackboxWebSearchToggle.checked);
        });
    }


    async function handleBlackboxAiSendMessage() {
        if (!blackboxChatInputField || !chatUID || !blackboxWebSearchToggle) return;
        const messageText = blackboxChatInputField.value.trim();
        if (!messageText) return;

        addBlackboxAiMessageToChat(messageText, 'user');
        saveBlackboxAiMessageToHistory(messageText, 'user');
        trackActivity('blackbox_ai_message_sent', { messageLength: messageText.length, webSearch: blackboxWebSearchToggle.checked });

        blackboxChatInputField.value = '';
        blackboxChatInputField.disabled = true;
        if (blackboxChatSendButton) blackboxChatSendButton.disabled = true;
        if (blackboxWebSearchToggle) blackboxWebSearchToggle.disabled = true;

        addBlackboxAiMessageToChat(null, 'ai', true); // Typing indicator

        try {
            const response = await fetch('/api/blackbox-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: messageText, uid: chatUID, webSearch: blackboxWebSearchToggle.checked })
            });
            if (blackboxTypingIndicator) blackboxTypingIndicator.remove();

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addBlackboxAiMessageToChat(aiResponse.response, 'ai');
                saveBlackboxAiMessageToHistory(aiResponse.response, 'ai');
            } else {
                throw new Error("Invalid response structure from Blackbox AI.");
            }
        } catch (error) {
            console.error('Error sending Blackbox AI message:', error);
            if (blackboxTypingIndicator) blackboxTypingIndicator.remove();
            addBlackboxAiMessageToChat(`Error: ${error.message || 'Could not connect to Blackbox AI.'}`, 'ai');
        } finally {
            blackboxChatInputField.disabled = false;
            if (blackboxChatSendButton) blackboxChatSendButton.disabled = false;
            if (blackboxWebSearchToggle) blackboxWebSearchToggle.disabled = false;
            if (blackboxChatInputField) blackboxChatInputField.focus();
        }
    }

    if (blackboxChatSendButton) blackboxChatSendButton.addEventListener('click', handleBlackboxAiSendMessage);
    if (blackboxChatInputField) blackboxChatInputField.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBlackboxAiSendMessage(); } });
    // --- END OF BLACKBOX AI CHAT LOGIC ---

    // --- DEEPSEEK AI CHAT LOGIC ---
    const deepseekChatMessagesArea = document.getElementById('deepseek-chat-messages-area');
    const deepseekChatInputField = document.getElementById('deepseek-chat-input-field');
    const deepseekChatSendButton = document.getElementById('deepseek-chat-send-button');
    const deepseekHistoryKeyPrefix = 'deepseekAiChatHistory_';
    let deepseekTypingIndicator = null;
    const deepseekAvatarSvg = `<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2a10 10 0 00-7.07 17.07L12 22l7.07-2.93A10 10 0 0012 2zm0 18a8 8 0 01-5.66-13.66L12 10l5.66-3.66A8 8 0 0112 20zm-2-8v2h4v-2h-4zm0-4v2h4V8h-4z"/></svg>`; // Example: simplified brain/chip icon

    function addDeepseekAiMessageToChat(message, sender, isTyping = false) {
        if (!deepseekChatMessagesArea) return;
        if (deepseekTypingIndicator && deepseekTypingIndicator.parentNode) {
            deepseekTypingIndicator.remove();
            deepseekTypingIndicator = null;
        }
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : deepseekAvatarSvg;
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');
        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'deepseek-typing-indicator-message';
            deepseekTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContentEnhanced(message); // Use enhanced formatter
            if (sender === 'ai') {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }
        messageWrapper.append(avatarContainer, messageBubble);
        deepseekChatMessagesArea.appendChild(messageWrapper);
        deepseekChatMessagesArea.scrollTop = deepseekChatMessagesArea.scrollHeight;
    }

    function saveDeepseekAiMessageToHistory(message, sender) {
        if (!chatUID) return;
        const historyKey = `${deepseekHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }
        history.push({ message, sender, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(history.length - 50);
        try { localStorage.setItem(historyKey, JSON.stringify(history)); } catch (e) { console.error(e); }
    }

    function loadDeepseekAiChatHistory() {
        if (!deepseekChatMessagesArea || !chatUID) return;
        deepseekChatMessagesArea.innerHTML = "";
        const historyKey = `${deepseekHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }
        if (history.length === 0) {
            addDeepseekAiMessageToChat("Hello! I'm Deepseek AI. How can I assist you?", 'ai');
        } else {
            history.forEach(item => addDeepseekAiMessageToChat(item.message, item.sender));
        }
        if (deepseekChatMessagesArea) deepseekChatMessagesArea.scrollTop = deepseekChatMessagesArea.scrollHeight;
    }

    async function handleDeepseekAiSendMessage() {
        if (!deepseekChatInputField || !chatUID) return;
        const messageText = deepseekChatInputField.value.trim();
        if (!messageText) return;

        addDeepseekAiMessageToChat(messageText, 'user');
        saveDeepseekAiMessageToHistory(messageText, 'user');
        trackActivity('deepseek_ai_message_sent', { messageLength: messageText.length });

        deepseekChatInputField.value = '';
        deepseekChatInputField.disabled = true;
        if (deepseekChatSendButton) deepseekChatSendButton.disabled = true;
        addDeepseekAiMessageToChat(null, 'ai', true); // Typing indicator

        try {
            const response = await fetch('/api/deepseek-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: messageText, uid: chatUID }) // uid can be sent for consistency/logging even if API doesn't use it
            });
            if (deepseekTypingIndicator) deepseekTypingIndicator.remove();
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addDeepseekAiMessageToChat(aiResponse.response, 'ai');
                saveDeepseekAiMessageToHistory(aiResponse.response, 'ai');
            } else {
                throw new Error("Invalid response structure from Deepseek AI.");
            }
        } catch (error) {
            console.error('Error sending Deepseek AI message:', error);
            if (deepseekTypingIndicator) deepseekTypingIndicator.remove();
            addDeepseekAiMessageToChat(`Error: ${error.message || 'Could not connect to Deepseek AI.'}`, 'ai');
        } finally {
            deepseekChatInputField.disabled = false;
            if (deepseekChatSendButton) deepseekChatSendButton.disabled = false;
            if (deepseekChatInputField) deepseekChatInputField.focus();
        }
    }
    if (deepseekChatSendButton) deepseekChatSendButton.addEventListener('click', handleDeepseekAiSendMessage);
    if (deepseekChatInputField) deepseekChatInputField.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDeepseekAiSendMessage(); } });
    // --- END OF DEEPSEEK AI CHAT LOGIC ---

    // --- CLAUDE HAIKU AI CHAT LOGIC ---
    const claudeChatMessagesArea = document.getElementById('claude-chat-messages-area');
    const claudeChatInputField = document.getElementById('claude-chat-input-field');
    const claudeChatSendButton = document.getElementById('claude-chat-send-button');
    const claudeHaikuHistoryKeyPrefix = 'claudeHaikuAiChatHistory_';
    let claudeTypingIndicator = null;
    const claudeAvatarSvg = `<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M19.07 4.93a10 10 0 00-14.14 0L2.93 7.07A8 8 0 017.07 2.93L12 7.86l4.93-4.93A8 8 0 0121.07 7.07L19.07 4.93zM4.93 19.07L7.07 21.07A8 8 0 012.93 16.93L7.86 12l-4.93 4.93A10 10 0 004.93 19.07zm14.14 0A10 10 0 0019.07 4.93L16.93 2.93A8 8 0 0121.07 7.07L12 16.14l4.93 4.93z"/></svg>`; // Example: abstract/poetic icon

    function addClaudeHaikuAiMessageToChat(message, sender, isTyping = false) {
        if (!claudeChatMessagesArea) return;
        if (claudeTypingIndicator && claudeTypingIndicator.parentNode) {
            claudeTypingIndicator.remove();
            claudeTypingIndicator = null;
        }
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : claudeAvatarSvg;
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');
        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'claude-typing-indicator-message';
            claudeTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContentEnhanced(message); // Use enhanced formatter
            if (sender === 'ai') {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }
        messageWrapper.append(avatarContainer, messageBubble);
        claudeChatMessagesArea.appendChild(messageWrapper);
        claudeChatMessagesArea.scrollTop = claudeChatMessagesArea.scrollHeight;
    }

    function saveClaudeHaikuAiMessageToHistory(message, sender) {
        if (!chatUID) return;
        const historyKey = `${claudeHaikuHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }
        history.push({ message, sender, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(history.length - 50);
        try { localStorage.setItem(historyKey, JSON.stringify(history)); } catch (e) { console.error(e); }
    }

    function loadClaudeHaikuAiChatHistory() {
        if (!claudeChatMessagesArea || !chatUID) return;
        claudeChatMessagesArea.innerHTML = "";
        const historyKey = `${claudeHaikuHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }
        if (history.length === 0) {
            addClaudeHaikuAiMessageToChat("Greetings, I am Claude Haiku. What shall we discuss?", 'ai');
        } else {
            history.forEach(item => addClaudeHaikuAiMessageToChat(item.message, item.sender));
        }
        if (claudeChatMessagesArea) claudeChatMessagesArea.scrollTop = claudeChatMessagesArea.scrollHeight;
    }

    async function handleClaudeHaikuAiSendMessage() {
        if (!claudeChatInputField || !chatUID) return;
        const messageText = claudeChatInputField.value.trim();
        if (!messageText) return;

        addClaudeHaikuAiMessageToChat(messageText, 'user');
        saveClaudeHaikuAiMessageToHistory(messageText, 'user');
        trackActivity('claude_haiku_ai_message_sent', { messageLength: messageText.length });

        claudeChatInputField.value = '';
        claudeChatInputField.disabled = true;
        if (claudeChatSendButton) claudeChatSendButton.disabled = true;
        addClaudeHaikuAiMessageToChat(null, 'ai', true); // Typing indicator

        try {
            const response = await fetch('/api/claude-haiku-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: messageText, uid: chatUID }) // uid for consistency
            });
            if (claudeTypingIndicator) claudeTypingIndicator.remove();
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addClaudeHaikuAiMessageToChat(aiResponse.response, 'ai');
                saveClaudeHaikuAiMessageToHistory(aiResponse.response, 'ai');
            } else {
                throw new Error("Invalid response structure from Claude Haiku AI.");
            }
        } catch (error) {
            console.error('Error sending Claude Haiku AI message:', error);
            if (claudeTypingIndicator) claudeTypingIndicator.remove();
            addClaudeHaikuAiMessageToChat(`Error: ${error.message || 'Could not connect to Claude Haiku AI.'}`, 'ai');
        } finally {
            claudeChatInputField.disabled = false;
            if (claudeChatSendButton) claudeChatSendButton.disabled = false;
            if (claudeChatInputField) claudeChatInputField.focus();
        }
    }
    if (claudeChatSendButton) claudeChatSendButton.addEventListener('click', handleClaudeHaikuAiSendMessage);
    if (claudeChatInputField) claudeChatInputField.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleClaudeHaikuAiSendMessage(); } });
    // --- END OF CLAUDE HAIKU AI CHAT LOGIC ---

    // --- GEMINI ALL MODEL CHAT LOGIC ---
    const geminiAllModelChatView = document.getElementById('gemini-all-model-view');
    // const geminiAllModelHeaderTitle = geminiAllModelChatView ? geminiAllModelChatView.querySelector('.chat-view-header h2') : null; // No longer in this view's header
    const geminiModelSelector = document.getElementById('top-bar-gemini-model-selector'); // UPDATED ID
    const topBarGeminiSelectorWrapper = document.getElementById('top-bar-gemini-selector-wrapper'); // New wrapper
    const geminiAllModelChatMessagesArea = document.getElementById('gemini-all-model-chat-messages-area');
    const geminiAllModelChatInputField = document.getElementById('gemini-all-model-chat-input-field');
    const geminiAllModelChatSendButton = document.getElementById('gemini-all-model-chat-send-button');
    const geminiAllModelAttachFileButton = document.getElementById('gemini-all-model-attach-file-button');
    const geminiAllModelFileUpload = document.getElementById('gemini-all-model-file-upload');
    const geminiAllModelFilePreviewContainer = document.getElementById('gemini-all-model-file-preview-container');

    const geminiAllModelHistoryKeyPrefix = 'geminiAllModelHistory_';
    let geminiAllModelTypingIndicator = null;
    let currentGeminiAllModelFile = null;
    let supportedGeminiModels = [];
    let currentSelectedGeminiModel = '';
    const GEMINI_ALL_MODEL_DEFAULT_ROLEPLAY = "You're Gemini AI Assistant, a helpful and versatile AI model.";
    const geminiOverallAvatarSvg = `<img src="https://www.gstatic.com/images/branding/product/2x/gemini_48dp.png" alt="Gemini" class="gemini-avatar-logo">`;

    // --- All ChatGPT Models Elements ---
    const allChatGPTModelsView = document.getElementById('all-chatgpt-models-view');
    const allChatGPTModelSelector = document.getElementById('top-bar-all-chatgpt-model-selector'); // UPDATED ID
    const topBarChatGPTSelectorWrapper = document.getElementById('top-bar-chatgpt-selector-wrapper'); // New wrapper
    const allChatGPTChatMessagesArea = document.getElementById('all-chatgpt-chat-messages-area');
    const allChatGPTChatInputField = document.getElementById('all-chatgpt-chat-input-field');
    const allChatGPTChatSendButton = document.getElementById('all-chatgpt-chat-send-button');
    const allChatGPTAttachFileButton = document.getElementById('all-chatgpt-attach-file-button'); // Initially disabled
    const allChatGPTFileUpload = document.getElementById('all-chatgpt-file-upload');
    const allChatGPTFilePreviewContainer = document.getElementById('all-chatgpt-file-preview-container');
    
    const allChatGPTModelsHistoryKeyPrefix = 'allChatGPTModelsHistory_';
    let allChatGPTModelsTypingIndicator = null;
    let currentAllChatGPTModelFile = null; // For future file uploads
    let supportedChatGPTModels = [];
    let currentSelectedChatGPTModel = '';
    const CHATGPT_DEFAULT_ROLEPLAY = "You are ChatGPT, a large language model trained by OpenAI.";
    // Updated to use an img tag for the ChatGPT logo
    const chatGPTAvatarSvg = `<img src="chatgpt.jpg" alt="ChatGPT" class="chatgpt-avatar-logo">`;


    function addGeminiAllModelMessageToChat(message, sender, imageUrl = null, isTyping = false, messageId = null) {
        if (!geminiAllModelChatMessagesArea) return;

        if (geminiAllModelTypingIndicator && geminiAllModelTypingIndicator.parentNode) {
            geminiAllModelTypingIndicator.remove();
            geminiAllModelTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        if (messageId) messageWrapper.dataset.messageId = messageId;


        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : geminiOverallAvatarSvg;

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML; // Reuse existing typing indicator
            messageWrapper.id = 'gemini-all-model-typing-indicator';
            geminiAllModelTypingIndicator = messageWrapper;
        } else {
            // Placeholder for enhanced formatting
            messageBubble.innerHTML = formatTextContentEnhanced(message || ""); // Use enhanced formatter
            if (imageUrl) {
                 messageBubble.innerHTML += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            // Add copy and download icons (basic structure for now)
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'message-controls';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'icon-button message-copy-btn';
            copyBtn.title = translations.copy_button_title || "Copy";
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
            copyBtn.addEventListener('click', () => {
                const textToCopy = messageBubble.textContent || ""; // Or more sophisticated extraction
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg>`; // Checkmark
                    setTimeout(() => {
                         copyBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
                    }, 1500);
                }).catch(err => console.error('Failed to copy text: ', err));
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'icon-button message-download-btn';
            downloadBtn.title = translations.download_button_title || "Download";
            downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from bubbling to message bubble if that has other listeners
                // Pass the content of the message bubble to the modal opener
                // We need to pass the element that contains the formatted content, which is messageBubble itself,
                // but specifically the part that formatTextContentEnhanced generated, excluding controls.
                // A good way is to clone the bubble, remove controls, then pass its innerHTML or the element.
                // For simplicity now, we pass messageBubble. The generation functions will need to be smart.
                const contentContainer = messageBubble.cloneNode(true);
                const existingControls = contentContainer.querySelector('.message-controls');
                if (existingControls) existingControls.remove();
                
                openDownloadFormatModal(contentContainer);
            });

            if (sender === 'ai') { // Only add controls to AI messages
                controlsDiv.appendChild(copyBtn);
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }
        messageWrapper.append(avatarContainer, messageBubble);
        geminiAllModelChatMessagesArea.appendChild(messageWrapper);
        geminiAllModelChatMessagesArea.scrollTop = geminiAllModelChatMessagesArea.scrollHeight;
    }

    function saveGeminiAllModelChatHistory(message, sender, imageUrl, modelName, messageId = null) {
        if (!chatUID || !modelName) return;
        const historyKey = `${geminiAllModelHistoryKeyPrefix}${chatUID}_${modelName}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }

        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString(), messageId: messageId || Date.now().toString() });
        if (history.length > 100) history = history.slice(history.length - 100); // Increased history size
        try { localStorage.setItem(historyKey, JSON.stringify(history)); } catch (e) { console.error(e); }
    }

    function loadGeminiAllModelChatHistory(modelName) {
        if (!geminiAllModelChatMessagesArea || !chatUID || !modelName) {
            if(geminiAllModelChatMessagesArea) geminiAllModelChatMessagesArea.innerHTML = ""; // Clear if no model
            return;
        }
        geminiAllModelChatMessagesArea.innerHTML = ""; // Clear for new model's history
        const historyKey = `${geminiAllModelHistoryKeyPrefix}${chatUID}_${modelName}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error(e); }

        if (history.length === 0) {
            const welcomeMsg = translations.gemini_all_model_welcome_message || `Welcome to Gemini ${modelName}! Ask anything or upload a file.`;
            addGeminiAllModelMessageToChat(welcomeMsg.replace('{modelName}', modelName), 'ai');
        } else {
            history.forEach(item => addGeminiAllModelMessageToChat(item.message, item.sender, item.imageUrl, false, item.messageId));
        }
        if (geminiAllModelChatMessagesArea) geminiAllModelChatMessagesArea.scrollTop = geminiAllModelChatMessagesArea.scrollHeight;
    }

    async function fetchAndPopulateGeminiModels() {
        if (!geminiModelSelector) return;
        // Try to get from localStorage first
        const storedModels = localStorage.getItem('supportedGeminiModels');
        if (storedModels) {
            try {
                supportedGeminiModels = JSON.parse(storedModels);
                populateGeminiModelDropdown();
                // Set selector to last selected model if available
                const lastSelected = localStorage.getItem('lastSelectedGeminiAllModel');
                if (lastSelected && supportedGeminiModels.includes(lastSelected)) {
                    geminiModelSelector.value = lastSelected;
                    currentSelectedGeminiModel = lastSelected;
                } else if (supportedGeminiModels.length > 0) {
                    // Default to a common flash model if available, or the first one
                    const defaultModel = supportedGeminiModels.find(m => m.includes('1.5-flash')) || supportedGeminiModels[0];
                    geminiModelSelector.value = defaultModel;
                    currentSelectedGeminiModel = defaultModel;
                }
                loadGeminiAllModelChatHistory(currentSelectedGeminiModel);
                return; // Models loaded from cache
            } catch (e) {
                console.error("Error parsing stored Gemini models", e);
                localStorage.removeItem('supportedGeminiModels'); // Clear corrupted data
            }
        }

        // If not in localStorage or parsing failed, fetch from API (e.g. by making a dummy call or a dedicated endpoint later)
        // For now, we'll rely on the first chat response to populate this.
        // So, the dropdown might initially be empty or have a "Loading..." state.
        // The first successful call to handleGeminiAllModelSendMessage will populate it.
        geminiModelSelector.innerHTML = `<option value="" data-translate="gemini_model_select_default_option">${translations.gemini_model_select_default_option || 'Loading models...'}</option>`;
    }

    function populateGeminiModelDropdown() {
        if (!geminiModelSelector || !supportedGeminiModels || supportedGeminiModels.length === 0) return;

        // Get the "Loading models..." text for re-adding if no models are selected
        const loadingOptionText = translations.gemini_model_select_default_option || 'Loading models...';
        const currentSelectorValue = geminiModelSelector.value; // Preserve current selection if possible

        geminiModelSelector.innerHTML = ''; // Clear existing options

        supportedGeminiModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            geminiModelSelector.appendChild(option);
        });

        if (supportedGeminiModels.includes(currentSelectorValue)) {
            geminiModelSelector.value = currentSelectorValue;
        } else if (supportedGeminiModels.length > 0) {
             const defaultModel = supportedGeminiModels.find(m => m.includes('1.5-flash')) || supportedGeminiModels[0];
            geminiModelSelector.value = defaultModel;
        } else {
            // Add back the loading/empty option if list is empty after all
            geminiModelSelector.innerHTML = `<option value="">${loadingOptionText}</option>`;
        }
        currentSelectedGeminiModel = geminiModelSelector.value;
        if (currentSelectedGeminiModel) {
            localStorage.setItem('lastSelectedGeminiAllModel', currentSelectedGeminiModel);
        }
    }

    if (geminiModelSelector) {
        geminiModelSelector.addEventListener('change', () => {
            currentSelectedGeminiModel = geminiModelSelector.value;
            if (currentSelectedGeminiModel) {
                localStorage.setItem('lastSelectedGeminiAllModel', currentSelectedGeminiModel);
                loadGeminiAllModelChatHistory(currentSelectedGeminiModel);
                 if(geminiAllModelChatInputField) geminiAllModelChatInputField.placeholder = `Ask ${currentSelectedGeminiModel}...`;
            } else {
                if(geminiAllModelChatMessagesArea) geminiAllModelChatMessagesArea.innerHTML = ""; // Clear chat area
                if(geminiAllModelChatInputField) geminiAllModelChatInputField.placeholder = translations.gemini_all_model_placeholder || "Ask Gemini (any model)...";
            }
        });
    }
    // Initial population attempt (might be empty until first API call)
    // fetchAndPopulateGeminiModels(); // This is called in showView

    async function fetchAndPopulateGeminiModels() {
        if (!geminiModelSelector) return; // Now refers to top-bar-gemini-model-selector

        const cachedModels = localStorage.getItem('supportedGeminiModelsList');
        if (cachedModels) {
            try {
                supportedGeminiModels = JSON.parse(cachedModels);
                if (Array.isArray(supportedGeminiModels) && supportedGeminiModels.length > 0) {
                    populateGeminiModelDropdown();
                    setInitialGeminiModelSelection();
                    return; // Models loaded from cache
                }
            } catch (e) {
                console.error("Error parsing cached supportedGeminiModelsList", e);
                localStorage.removeItem('supportedGeminiModelsList'); // Clear corrupted cache
            }
        }

        // If not cached or cache was invalid, fetch from API
        geminiModelSelector.innerHTML = `<option value="" data-translate="gemini_model_select_default_option">${translations.gemini_model_select_default_option || 'Loading models...'}</option>`;
        try {
            // Make a lightweight call to get models.
            // Using a default cheap model and a simple query.
            // The backend is now designed to return supported_models even if 'answer' isn't the focus.
            const response = await fetch('/api/gemini-all-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ask: "Hello", // A minimal query
                    model: "gemini-1.5-flash-latest", // A known, likely cheap default model
                    uid: chatUID, // UID is required by the backend route
                    roleplay: "System" // Minimal roleplay
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                const errorMsg = errData?.error || `Failed to fetch models list: ${response.statusText}`;
                console.error("Error fetching Gemini models list:", errorMsg);
                geminiModelSelector.innerHTML = `<option value="">${translations.gemini_models_load_error || 'Error loading models'}</option>`;
                return;
            }

            const data = await response.json();
            if (data && Array.isArray(data.supported_models) && data.supported_models.length > 0) {
                supportedGeminiModels = data.supported_models;
                localStorage.setItem('supportedGeminiModelsList', JSON.stringify(supportedGeminiModels));
                populateGeminiModelDropdown();
                setInitialGeminiModelSelection();
            } else {
                console.warn("No supported models returned from API or list is empty.");
                geminiModelSelector.innerHTML = `<option value="">${translations.gemini_no_models_available || 'No models available'}</option>`; // Add this key
            }
        } catch (error) {
            console.error('Error in fetchAndPopulateGeminiModels:', error);
            geminiModelSelector.innerHTML = `<option value="">${translations.gemini_models_load_error || 'Error loading models'}</option>`;
        }
    }

    function setInitialGeminiModelSelection() {
        if (!geminiModelSelector || supportedGeminiModels.length === 0) return;

        const lastSelected = localStorage.getItem('lastSelectedGeminiAllModel');
        if (lastSelected && supportedGeminiModels.includes(lastSelected)) {
            geminiModelSelector.value = lastSelected;
        } else {
            // Default to a common flash model if available, or the first one
            const defaultModel = supportedGeminiModels.find(m => m.includes('gemini-1.5-flash-latest')) ||
                                 supportedGeminiModels.find(m => m.includes('gemini-1.5-flash')) ||
                                 supportedGeminiModels[0];
            geminiModelSelector.value = defaultModel;
        }
        currentSelectedGeminiModel = geminiModelSelector.value;
        if (currentSelectedGeminiModel) {
            localStorage.setItem('lastSelectedGeminiAllModel', currentSelectedGeminiModel);
            loadGeminiAllModelChatHistory(currentSelectedGeminiModel); // Load history for the selected model
            if(geminiAllModelChatInputField && translations.gemini_all_model_placeholder_dynamic) {
                 geminiAllModelChatInputField.placeholder = translations.gemini_all_model_placeholder_dynamic.replace('{modelName}', currentSelectedGeminiModel);
            } else if (geminiAllModelChatInputField) {
                 geminiAllModelChatInputField.placeholder = `Ask ${currentSelectedGeminiModel}...`;
            }
            // Update top bar model name display
            if (topBarModelNameDisplay && document.getElementById('gemini-all-model-view').classList.contains('active')) {
                topBarModelNameDisplay.textContent = `Gemini: ${currentSelectedGeminiModel}`;
                topBarModelNameDisplay.style.display = 'inline';
            }
        }
    }

    if (geminiModelSelector) { // Ensure this listener is correctly attached to the new top-bar selector
        geminiModelSelector.addEventListener('change', () => {
            currentSelectedGeminiModel = geminiModelSelector.value;
            if (currentSelectedGeminiModel) {
                localStorage.setItem('lastSelectedGeminiAllModel', currentSelectedGeminiModel);
                loadGeminiAllModelChatHistory(currentSelectedGeminiModel);
                if(geminiAllModelChatInputField) geminiAllModelChatInputField.placeholder = `Ask ${currentSelectedGeminiModel}...`;
                if (topBarModelNameDisplay && document.getElementById('gemini-all-model-view').classList.contains('active')) {
                    topBarModelNameDisplay.textContent = `Gemini: ${currentSelectedGeminiModel}`;
                }
            } else {
                if(geminiAllModelChatMessagesArea) geminiAllModelChatMessagesArea.innerHTML = ""; 
                if(geminiAllModelChatInputField) geminiAllModelChatInputField.placeholder = translations.gemini_all_model_placeholder || "Ask Gemini (any model)...";
                if (topBarModelNameDisplay && document.getElementById('gemini-all-model-view').classList.contains('active')) {
                    topBarModelNameDisplay.textContent = 'Gemini Models';
                }
            }
        });
    }

    // Enhanced text formatting (initial version, can be expanded)
    function formatTextContentEnhanced(text) {
        if (typeof text !== 'string') return '';
        let resultText = text;

        // Code blocks ( ```[lang]\ncode\n``` or ```\ncode\n``` )
        resultText = resultText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const languageClass = lang ? `language-${lang}` : 'language-plaintext';
            const escapedCode = escapeHTML(code.trim());
            // data-code attribute for easy copying later
            return `<div class="code-block-wrapper"><pre><code class="${languageClass}" data-code="${escapeHTML(code.trim())}">${escapedCode}</code></pre><button class="copy-code-btn" title="${translations.copy_code_button_title || 'Copy Code'}"><svg viewBox="0 0 24 24" class="icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg></button></div>`;
        });
         // Simpler inline code `code`
        resultText = resultText.replace(/`([^`]+)`/g, '<code>$1</code>');


        // Headings (Markdown-like)
        resultText = resultText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        resultText = resultText.replace(/^## (.*$)/gim, '<h4>$1</h4>');
        resultText = resultText.replace(/^# (.*$)/gim, '<h2>$1</h2>'); // Added H1 support

        // Bold text (**)
        resultText = resultText.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        // Italics text (*) - ensure it doesn't conflict if single * was meant for bold
        resultText = resultText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/gim, '<em>$1</em>');


        // Basic table formatting (very simplified, assumes simple pipe tables)
        // This is a rudimentary attempt and might need a proper Markdown library for complex tables.
        if (resultText.includes('|')) {
            resultText = resultText.split('\n').map(line => {
                if (line.startsWith('|') && line.endsWith('|')) {
                    const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
                    if (line.includes('---')) { // Header separator
                        return ''; // Skip rendering separator line directly, CSS will handle it
                    }
                    // Heuristic: If it's the first such line or after a separator, assume header
                    // This logic is imperfect. A full Markdown parser is better.
                    const cellTag = (prevLineWasHeaderSeparator || !isInsideTable) ? 'th' : 'td';
                    // For simplicity, let's assume all are td for now and rely on CSS for first row styling
                    return `<tr>${cells.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`;
                }
                return line;
            }).join('\n');
            // Wrap recognized table rows in a table tag
            if (resultText.includes('<tr>')) {
                 resultText = resultText.replace(/((?:<tr>.*?<\/tr>\s*)+)/g, '<table><tbody>$1</tbody></table>');
            }
        }
        // Line breaks
        resultText = resultText.replace(/\n/g, '<br>');


        return resultText;
    }
    // Add event listener for dynamically created copy code buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('copy-code-btn') || event.target.closest('.copy-code-btn')) {
            const button = event.target.closest('.copy-code-btn');
            const codeWrapper = button.closest('.code-block-wrapper');
            const codeElement = codeWrapper.querySelector('code');
            const codeToCopy = codeElement.dataset.code || codeElement.innerText; // Use data-code for original
            navigator.clipboard.writeText(codeToCopy).then(() => {
                button.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg>`; // Checkmark
                 setTimeout(() => {
                    button.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;
                    button.title = translations.copy_code_button_title || 'Copy Code';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
                // Optionally, provide user feedback about the copy failure
            });
        }
    });


    // File attachment logic for Gemini All Model
    if (geminiAllModelAttachFileButton && geminiAllModelFileUpload) {
        geminiAllModelAttachFileButton.addEventListener('click', () => geminiAllModelFileUpload.click());
        geminiAllModelFileUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                currentGeminiAllModelFile = file;
                if (geminiAllModelFilePreviewContainer) {
                    let previewHTML = `<span class="file-preview-name">${escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>`;
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            previewHTML += `<img src="${e.target.result}" alt="Preview" class="file-preview-image">`;
                            geminiAllModelFilePreviewContainer.innerHTML = previewHTML;
                        };
                        reader.readAsDataURL(file);
                    } else {
                         geminiAllModelFilePreviewContainer.innerHTML = previewHTML;
                    }
                }
            } else {
                currentGeminiAllModelFile = null;
                if (geminiAllModelFilePreviewContainer) geminiAllModelFilePreviewContainer.innerHTML = "";
            }
        });
    }

    async function handleGeminiAllModelSendMessage() {
        if (!geminiAllModelChatInputField || !chatUID || !currentSelectedGeminiModel) {
            if (!currentSelectedGeminiModel) alert(translations.gemini_select_model_alert || "Please select a Gemini model first.");
            return;
        }
        const messageText = geminiAllModelChatInputField.value.trim();
        if (!messageText && !currentGeminiAllModelFile) {
            alert(translations.gemini_type_message_or_attach_file_alert || "Please type a message or attach a file.");
            return;
        }

        let tempPreviewUrl = null;
        if (currentGeminiAllModelFile && currentGeminiAllModelFile.type.startsWith('image/')) {
            tempPreviewUrl = URL.createObjectURL(currentGeminiAllModelFile);
        }
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        addGeminiAllModelMessageToChat(messageText || (currentGeminiAllModelFile ? `File: ${currentGeminiAllModelFile.name}`: ""), 'user', tempPreviewUrl, false, messageId);
        saveGeminiAllModelChatHistory(messageText || (currentGeminiAllModelFile ? `File: ${currentGeminiAllModelFile.name}`: ""), 'user', tempPreviewUrl, currentSelectedGeminiModel, messageId);

        trackActivity('gemini_all_model_sent', {
            messageLength: messageText.length,
            hasFile: !!currentGeminiAllModelFile,
            model: currentSelectedGeminiModel,
            fileName: currentGeminiAllModelFile ? currentGeminiAllModelFile.name : null,
            fileType: currentGeminiAllModelFile ? currentGeminiAllModelFile.type : null
        });

        const formData = new FormData();
        formData.append('uid', chatUID);
        formData.append('model', currentSelectedGeminiModel);
        if (messageText) formData.append('ask', messageText);
        if (currentGeminiAllModelFile) formData.append('file', currentGeminiAllModelFile, currentGeminiAllModelFile.name);
        formData.append('roleplay', GEMINI_ALL_MODEL_DEFAULT_ROLEPLAY); // Or make this configurable

        geminiAllModelChatInputField.value = '';
        geminiAllModelFileUpload.value = null; // Reset file input
        const oldFile = currentGeminiAllModelFile; // To revoke object URL later if it was an image
        currentGeminiAllModelFile = null;
        if (geminiAllModelFilePreviewContainer) geminiAllModelFilePreviewContainer.innerHTML = "";

        geminiAllModelChatInputField.disabled = true;
        if (geminiAllModelChatSendButton) geminiAllModelChatSendButton.disabled = true;
        if (geminiAllModelAttachFileButton) geminiAllModelAttachFileButton.disabled = true;
        if (geminiModelSelector) geminiModelSelector.disabled = true;

        addGeminiAllModelMessageToChat(null, 'ai', null, true);

        try {
            const response = await fetch('/api/gemini-all-model', { method: 'POST', body: formData });
            if (geminiAllModelTypingIndicator) geminiAllModelTypingIndicator.remove();
             if (tempPreviewUrl && oldFile && oldFile.type.startsWith('image/')) { // Revoke only if it was an image object URL
                URL.revokeObjectURL(tempPreviewUrl);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json();

            if (aiResponse.supported_models && Array.isArray(aiResponse.supported_models)) {
                supportedGeminiModels = aiResponse.supported_models;
                localStorage.setItem('supportedGeminiModels', JSON.stringify(supportedGeminiModels));
                populateGeminiModelDropdown(); // Repopulate with potentially new list, preserving selection
            }

            if (aiResponse && aiResponse.response) {
                const aiMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                addGeminiAllModelMessageToChat(aiResponse.response, 'ai', null, false, aiMessageId); // No image URL from AI here
                saveGeminiAllModelChatHistory(aiResponse.response, 'ai', null, aiResponse.model_used || currentSelectedGeminiModel, aiMessageId);
            } else {
                throw new Error(translations.invalid_response_from_ai.replace('{aiName}', 'Gemini All Model') || "Invalid response structure from Gemini All Model AI.");
            }
        } catch (error) {
            console.error('Error with Gemini All Model:', error);
            if (geminiAllModelTypingIndicator) geminiAllModelTypingIndicator.remove();
            const errorMsg = translations.error_ai_connection || "Error: {error} Could not connect to {aiName}.";
            addGeminiAllModelMessageToChat(errorMsg.replace('{error}', error.message).replace('{aiName}', 'Gemini All Model'), 'ai');
        } finally {
            geminiAllModelChatInputField.disabled = false;
            if (geminiAllModelChatSendButton) geminiAllModelChatSendButton.disabled = false;
            if (geminiAllModelAttachFileButton) geminiAllModelAttachFileButton.disabled = false;
            if (geminiModelSelector) geminiModelSelector.disabled = false;
            if (geminiAllModelChatInputField) geminiAllModelChatInputField.focus();
        }
    }

    if (geminiAllModelChatSendButton) geminiAllModelChatSendButton.addEventListener('click', handleGeminiAllModelSendMessage);
    if (geminiAllModelChatInputField) geminiAllModelChatInputField.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGeminiAllModelSendMessage(); }});
    // --- END OF GEMINI ALL MODEL CHAT LOGIC ---

    // --- ALL CHATGPT MODELS CHAT LOGIC ---

    function addChatGPTAllModelMessageToChat(message, sender, imageUrl = null, isTyping = false, messageId = null) {
        if (!allChatGPTChatMessagesArea) return;

        if (allChatGPTModelsTypingIndicator && allChatGPTModelsTypingIndicator.parentNode) {
            allChatGPTModelsTypingIndicator.remove();
            allChatGPTModelsTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        if (messageId) messageWrapper.dataset.messageId = messageId;

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : chatGPTAvatarSvg; // Use ChatGPT avatar

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'all-chatgpt-typing-indicator'; // Unique ID
            allChatGPTModelsTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContentEnhanced(message || "");
            if (imageUrl) { // For future image support
                 messageBubble.innerHTML += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            // Add Download button (Copy button can be added similarly if desired)
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'message-controls';
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'icon-button message-download-btn';
            downloadBtn.title = translations.download_button_title || "Download";
            downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const contentContainer = messageBubble.cloneNode(true);
                const existingControls = contentContainer.querySelector('.message-controls');
                if (existingControls) existingControls.remove();
                openDownloadFormatModal(contentContainer);
            });
            if (sender === 'ai') { // Only for AI messages
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }
        messageWrapper.append(avatarContainer, messageBubble);
        allChatGPTChatMessagesArea.appendChild(messageWrapper);
        allChatGPTChatMessagesArea.scrollTop = allChatGPTChatMessagesArea.scrollHeight;
    }

    function saveChatGPTAllModelChatHistory(message, sender, imageUrl, modelName, messageId = null) {
        if (!chatUID || !modelName) return;
        const historyKey = `${allChatGPTModelsHistoryKeyPrefix}${chatUID}_${modelName}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error("Error parsing ChatGPT All Models history:", e); }
        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString(), messageId: messageId || Date.now().toString() });
        if (history.length > 100) history = history.slice(history.length - 100);
        try { localStorage.setItem(historyKey, JSON.stringify(history)); } catch (e) { console.error("Error saving ChatGPT All Models history:", e); }
    }

    function loadChatGPTAllModelChatHistory(modelName) {
        if (!allChatGPTChatMessagesArea || !chatUID || !modelName) {
            if(allChatGPTChatMessagesArea) allChatGPTChatMessagesArea.innerHTML = "";
            return;
        }
        allChatGPTChatMessagesArea.innerHTML = ""; 
        const historyKey = `${allChatGPTModelsHistoryKeyPrefix}${chatUID}_${modelName}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error("Error loading ChatGPT All Models history:", e); }

        if (history.length === 0) {
            const welcomeMsg = (translations.all_chatgpt_welcome_message || "Welcome to ChatGPT ({modelName})! Ask me anything.").replace('{modelName}', modelName);
            addChatGPTAllModelMessageToChat(welcomeMsg, 'ai');
        } else {
            history.forEach(item => addChatGPTAllModelMessageToChat(item.message, item.sender, item.imageUrl, false, item.messageId));
        }
        if (allChatGPTChatMessagesArea) allChatGPTChatMessagesArea.scrollTop = allChatGPTChatMessagesArea.scrollHeight;
    }
    
    async function fetchAndPopulateChatGPTModels() {
        if (!allChatGPTModelSelector) return;
        const cachedModels = localStorage.getItem('supportedChatGPTModelsList');
        if (cachedModels) {
            try {
                supportedChatGPTModels = JSON.parse(cachedModels);
                if (Array.isArray(supportedChatGPTModels) && supportedChatGPTModels.length > 0) {
                    populateChatGPTModelDropdown();
                    setInitialChatGPTModelSelection();
                    return; 
                }
            } catch (e) { console.error("Error parsing cached supportedChatGPTModelsList", e); localStorage.removeItem('supportedChatGPTModelsList');}
        }

        allChatGPTModelSelector.innerHTML = `<option value="" data-translate="all_chatgpt_model_select_default_option">${translations.all_chatgpt_model_select_default_option || 'Loading models...'}</option>`;
        try {
            // Use a common/default model for the initial API call to get the list
            const defaultModelForListing = "gpt-3.5-turbo"; // Or any known valid model
            const response = await fetch('/api/all-chatgpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: "List available models", model: defaultModelForListing, uid: chatUID, roleplay: "System" })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `Failed to fetch ChatGPT models list: ${response.statusText}` }));
                throw new Error(errData.error);
            }
            const data = await response.json();
            if (data && Array.isArray(data.supported_models) && data.supported_models.length > 0) {
                supportedChatGPTModels = data.supported_models;
                localStorage.setItem('supportedChatGPTModelsList', JSON.stringify(supportedChatGPTModels));
                populateChatGPTModelDropdown();
                setInitialChatGPTModelSelection();
            } else {
                console.warn("No supported ChatGPT models returned from API or list is empty.");
                allChatGPTModelSelector.innerHTML = `<option value="">${translations.all_chatgpt_no_models_available || 'No models available'}</option>`;
            }
        } catch (error) {
            console.error('Error in fetchAndPopulateChatGPTModels:', error);
            allChatGPTModelSelector.innerHTML = `<option value="">${translations.all_chatgpt_models_load_error || 'Error loading models'}</option>`;
        }
    }

    function populateChatGPTModelDropdown() {
        if (!allChatGPTModelSelector || !supportedChatGPTModels || supportedChatGPTModels.length === 0) return;
        const loadingOptionText = translations.all_chatgpt_model_select_default_option || 'Loading models...';
        const currentSelectorValue = allChatGPTModelSelector.value; 
        allChatGPTModelSelector.innerHTML = ''; 
        supportedChatGPTModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            allChatGPTModelSelector.appendChild(option);
        });
        if (supportedChatGPTModels.includes(currentSelectorValue)) {
            allChatGPTModelSelector.value = currentSelectorValue;
        } else if (supportedChatGPTModels.length > 0) {
            const defaultModel = supportedChatGPTModels.find(m => m.includes('gpt-4o-mini') || m.includes('gpt-4o')) || 
                                 supportedChatGPTModels.find(m => m.includes('gpt-3.5-turbo')) || 
                                 supportedChatGPTModels[0];
            allChatGPTModelSelector.value = defaultModel;
        } else {
            allChatGPTModelSelector.innerHTML = `<option value="">${loadingOptionText}</option>`;
        }
        currentSelectedChatGPTModel = allChatGPTModelSelector.value;
        if (currentSelectedChatGPTModel) {
            localStorage.setItem('lastSelectedChatGPTAllModel', currentSelectedChatGPTModel);
        }
    }
    
    function setInitialChatGPTModelSelection() {
        if (!allChatGPTModelSelector || supportedChatGPTModels.length === 0) return;
        const lastSelected = localStorage.getItem('lastSelectedChatGPTAllModel');
        if (lastSelected && supportedChatGPTModels.includes(lastSelected)) {
            allChatGPTModelSelector.value = lastSelected;
        } else {
            const defaultModel = supportedChatGPTModels.find(m => m.includes('gpt-4o-mini') || m.includes('gpt-4o')) ||
                                 supportedChatGPTModels.find(m => m.includes('gpt-3.5-turbo')) || 
                                 supportedChatGPTModels[0];
            allChatGPTModelSelector.value = defaultModel;
        }
        currentSelectedChatGPTModel = allChatGPTModelSelector.value;
        if (currentSelectedChatGPTModel) {
            localStorage.setItem('lastSelectedChatGPTAllModel', currentSelectedChatGPTModel);
            loadChatGPTAllModelChatHistory(currentSelectedChatGPTModel);
            if(allChatGPTChatInputField && translations.all_chatgpt_placeholder_dynamic) {
                 allChatGPTChatInputField.placeholder = translations.all_chatgpt_placeholder_dynamic.replace('{modelName}', currentSelectedChatGPTModel);
            } else if (allChatGPTChatInputField) {
                 allChatGPTChatInputField.placeholder = `Ask ${currentSelectedChatGPTModel}...`;
            }
            // Update top bar model name display
            if (topBarModelNameDisplay && document.getElementById('all-chatgpt-models-view').classList.contains('active')) {
                topBarModelNameDisplay.textContent = `ChatGPT: ${currentSelectedChatGPTModel}`;
                topBarModelNameDisplay.style.display = 'inline';
            }
        }
    }

    if (allChatGPTModelSelector) { // Attached to top-bar-all-chatgpt-model-selector
        allChatGPTModelSelector.addEventListener('change', () => {
            currentSelectedChatGPTModel = allChatGPTModelSelector.value;
            if (currentSelectedChatGPTModel) {
                localStorage.setItem('lastSelectedChatGPTAllModel', currentSelectedChatGPTModel);
                loadChatGPTAllModelChatHistory(currentSelectedChatGPTModel);
                if(allChatGPTChatInputField) allChatGPTChatInputField.placeholder = `Ask ${currentSelectedChatGPTModel}...`;
                if (topBarModelNameDisplay && document.getElementById('all-chatgpt-models-view').classList.contains('active')) {
                    topBarModelNameDisplay.textContent = `ChatGPT: ${currentSelectedChatGPTModel}`;
                }
            } else {
                if(allChatGPTChatMessagesArea) allChatGPTChatMessagesArea.innerHTML = "";
                if(allChatGPTChatInputField) allChatGPTChatInputField.placeholder = translations.all_chatgpt_placeholder || "Ask ChatGPT (any model)...";
                if (topBarModelNameDisplay && document.getElementById('all-chatgpt-models-view').classList.contains('active')) {
                    topBarModelNameDisplay.textContent = 'ChatGPT Models';
                }
            }
        });
    }

    async function handleChatGPTAllModelSendMessage() {
        if (!allChatGPTChatInputField || !chatUID || !currentSelectedChatGPTModel) {
            if (!currentSelectedChatGPTModel && translations.all_chatgpt_select_model_alert) alert(translations.all_chatgpt_select_model_alert);
            else if (!currentSelectedChatGPTModel) alert("Please select a ChatGPT model first.");
            return;
        }
        const messageText = allChatGPTChatInputField.value.trim();
        // currentAllChatGPTModelFile is for future image upload, not used yet for this API
        if (!messageText /* && !currentAllChatGPTModelFile */) { // Adjusted condition
            alert(translations.all_chatgpt_type_message_alert || "Please type a message.");
            return;
        }

        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        addChatGPTAllModelMessageToChat(messageText, 'user', null, false, messageId); // No image URL for now
        saveChatGPTAllModelChatHistory(messageText, 'user', null, currentSelectedChatGPTModel, messageId);

        trackActivity('all_chatgpt_model_sent', {
            messageLength: messageText.length,
            model: currentSelectedChatGPTModel,
        });

        // Prepare payload (text-only for now)
        const payload = {
            ask: messageText,
            model: currentSelectedChatGPTModel,
            uid: chatUID,
            roleplay: CHATGPT_DEFAULT_ROLEPLAY, // Default roleplay
            // img_url: will be added if file support is implemented
        };
        
        allChatGPTChatInputField.value = '';
        // currentAllChatGPTModelFile = null; // Reset if file handling was used
        // if (allChatGPTFilePreviewContainer) allChatGPTFilePreviewContainer.innerHTML = "";

        allChatGPTChatInputField.disabled = true;
        if (allChatGPTChatSendButton) allChatGPTChatSendButton.disabled = true;
        // if (allChatGPTAttachFileButton) allChatGPTAttachFileButton.disabled = true; // Keep disabled for now
        if (allChatGPTModelSelector) allChatGPTModelSelector.disabled = true;

        addChatGPTAllModelMessageToChat(null, 'ai', null, true); // Typing indicator

        try {
            const response = await fetch('/api/all-chatgpt', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) 
            });
            if (allChatGPTModelsTypingIndicator) allChatGPTModelsTypingIndicator.remove();

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json();

            // Update supported models list if it changed (though less likely for OpenAI API via Haji)
            if (aiResponse.supported_models && Array.isArray(aiResponse.supported_models) && 
                JSON.stringify(supportedChatGPTModels) !== JSON.stringify(aiResponse.supported_models)) {
                supportedChatGPTModels = aiResponse.supported_models;
                localStorage.setItem('supportedChatGPTModelsList', JSON.stringify(supportedChatGPTModels));
                populateChatGPTModelDropdown(); 
            }

            if (aiResponse && aiResponse.answer) {
                const aiMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                addChatGPTAllModelMessageToChat(aiResponse.answer, 'ai', null, false, aiMessageId);
                saveChatGPTAllModelChatHistory(aiResponse.answer, 'ai', null, aiResponse.model_used || currentSelectedChatGPTModel, aiMessageId);
            } else {
                throw new Error((translations.invalid_response_from_ai || "Invalid response structure from {aiName} AI.").replace('{aiName}', 'ChatGPT'));
            }
        } catch (error) {
            console.error('Error with All ChatGPT Models:', error);
            if (allChatGPTModelsTypingIndicator) allChatGPTModelsTypingIndicator.remove();
            const errorMsg = (translations.error_ai_connection || "Error: {error} Could not connect to {aiName}.").replace('{error}', error.message).replace('{aiName}', 'ChatGPT');
            addChatGPTAllModelMessageToChat(errorMsg, 'ai');
        } finally {
            allChatGPTChatInputField.disabled = false;
            if (allChatGPTChatSendButton) allChatGPTChatSendButton.disabled = false;
            // if (allChatGPTAttachFileButton) allChatGPTAttachFileButton.disabled = false; // Keep disabled
            if (allChatGPTModelSelector) allChatGPTModelSelector.disabled = false;
            if (allChatGPTChatInputField) allChatGPTChatInputField.focus();
        }
    }

    if (allChatGPTChatSendButton) allChatGPTChatSendButton.addEventListener('click', handleChatGPTAllModelSendMessage);
    if (allChatGPTChatInputField) {
        allChatGPTChatInputField.addEventListener('keypress', e => { 
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                handleChatGPTAllModelSendMessage(); 
            }
        });
    }
    // Note: File attachment logic for allChatGPTAttachFileButton is intentionally omitted for now.
    // --- END OF ALL CHATGPT MODELS CHAT LOGIC ---

    // --- CLAUDE ALL MODEL CHAT LOGIC ---
    const claudeAllModelChatView = document.getElementById('claude-all-model-view');
    const claudeModelSelector = document.getElementById('top-bar-claude-model-selector'); // UPDATED ID
    const topBarClaudeSelectorWrapper = document.getElementById('top-bar-claude-selector-wrapper'); // New wrapper
    const topBarModelNameDisplay = document.getElementById('top-bar-model-name-display'); // New top bar model name display
    const claudeAllModelChatMessagesArea = document.getElementById('claude-all-model-chat-messages-area');
    const claudeAllModelChatInputField = document.getElementById('claude-all-model-chat-input-field');
    const claudeAllModelChatSendButton = document.getElementById('claude-all-model-chat-send-button');
    const claudeAllModelAttachFileButton = document.getElementById('claude-all-model-attach-file-button');
    const claudeAllModelFileUpload = document.getElementById('claude-all-model-file-upload');
    const claudeAllModelFilePreviewContainer = document.getElementById('claude-all-model-file-preview-container');

    const claudeAllModelHistoryKeyPrefix = 'claudeAllModelHistory_';
    let claudeAllModelTypingIndicator = null;
    let currentClaudeAllModelFile = null;
    let supportedClaudeModels = []; // Will be populated from API
    let currentSelectedClaudeModel = '';
    const CLAUDE_ALL_MODEL_DEFAULT_ROLEPLAY = "You are a helpful and versatile AI assistant from Anthropic, known as Claude.";
    // Using an img tag for the Claude AI logo
    const claudeOverallAvatarSvg = `<img src="claude.jpg" alt="Claude AI" class="claude-avatar-logo">`;


    function addClaudeAllModelMessageToChat(message, sender, imageUrl = null, isTyping = false, messageId = null) {
        if (!claudeAllModelChatMessagesArea) return;

        if (claudeAllModelTypingIndicator && claudeAllModelTypingIndicator.parentNode) {
            claudeAllModelTypingIndicator.remove();
            claudeAllModelTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        if (messageId) messageWrapper.dataset.messageId = messageId;

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : claudeOverallAvatarSvg;

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'claude-all-model-typing-indicator';
            claudeAllModelTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContentEnhanced(message || "");
            if (imageUrl) {
                 messageBubble.innerHTML += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            // Add copy and download controls for AI messages
            if (sender === 'ai') {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'message-controls';

                const copyBtn = document.createElement('button');
                copyBtn.className = 'icon-button message-copy-btn';
                copyBtn.title = translations.copy_button_title || "Copy";
                copyBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
                copyBtn.addEventListener('click', () => {
                    const textToCopy = messageBubble.textContent || "";
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg>`;
                        setTimeout(() => {
                             copyBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
                        }, 1500);
                    }).catch(err => console.error('Failed to copy text: ', err));
                });

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'icon-button message-download-btn';
                downloadBtn.title = translations.download_button_title || "Download";
                downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const contentContainer = messageBubble.cloneNode(true);
                    const existingControls = contentContainer.querySelector('.message-controls');
                    if (existingControls) existingControls.remove();
                    openDownloadFormatModal(contentContainer);
                });
                controlsDiv.appendChild(copyBtn);
                controlsDiv.appendChild(downloadBtn);
                messageBubble.appendChild(controlsDiv);
            }
        }
        messageWrapper.append(avatarContainer, messageBubble);
        claudeAllModelChatMessagesArea.appendChild(messageWrapper);
        claudeAllModelChatMessagesArea.scrollTop = claudeAllModelChatMessagesArea.scrollHeight;
    }

    function saveClaudeAllModelChatHistory(message, sender, imageUrl, modelName, messageId = null) {
        if (!chatUID || !modelName) return;
        const historyKey = `${claudeAllModelHistoryKeyPrefix}${chatUID}_${modelName}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error("Error parsing Claude All Model history:", e); }
        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString(), messageId: messageId || Date.now().toString() });
        if (history.length > 100) history = history.slice(history.length - 100);
        try { localStorage.setItem(historyKey, JSON.stringify(history)); } catch (e) { console.error("Error saving Claude All Model history:", e); }
    }

    function loadClaudeAllModelChatHistory(modelName) {
        if (!claudeAllModelChatMessagesArea || !chatUID || !modelName) {
            if(claudeAllModelChatMessagesArea) claudeAllModelChatMessagesArea.innerHTML = "";
            return;
        }
        claudeAllModelChatMessagesArea.innerHTML = "";
        const historyKey = `${claudeAllModelHistoryKeyPrefix}${chatUID}_${modelName}`;
        let history = [];
        try { const stored = localStorage.getItem(historyKey); if (stored) history = JSON.parse(stored); } catch (e) { console.error("Error loading Claude All Model history:", e); }

        if (history.length === 0) {
            const welcomeMsg = (translations.claude_all_model_welcome_message || "Welcome to Claude ({modelName})! Ask anything or upload a file.").replace('{modelName}', modelName);
            addClaudeAllModelMessageToChat(welcomeMsg, 'ai');
        } else {
            history.forEach(item => addClaudeAllModelMessageToChat(item.message, item.sender, item.imageUrl, false, item.messageId));
        }
        if (claudeAllModelChatMessagesArea) claudeAllModelChatMessagesArea.scrollTop = claudeAllModelChatMessagesArea.scrollHeight;
    }

    async function fetchAndPopulateClaudeModels() {
        if (!claudeModelSelector) return;
        const cachedModels = localStorage.getItem('supportedClaudeModelsList');
        if (cachedModels) {
            try {
                supportedClaudeModels = JSON.parse(cachedModels);
                if (Array.isArray(supportedClaudeModels) && supportedClaudeModels.length > 0) {
                    populateClaudeModelDropdown();
                    setInitialClaudeModelSelection();
                    return;
                }
            } catch (e) { console.error("Error parsing cached supportedClaudeModelsList", e); localStorage.removeItem('supportedClaudeModelsList'); }
        }

        claudeModelSelector.innerHTML = `<option value="" data-translate="claude_model_select_default_option">${translations.claude_model_select_default_option || 'Loading models...'}</option>`;
        try {
            const response = await fetch('/api/claude-all-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: "List available models", model: "claude-3-haiku-20240307", uid: chatUID, roleplay: "System" }) // Use a known default model
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `Failed to fetch Claude models list: ${response.statusText}` }));
                throw new Error(errData.error);
            }
            const data = await response.json();
            if (data && Array.isArray(data.supported_models) && data.supported_models.length > 0) {
                supportedClaudeModels = data.supported_models;
                localStorage.setItem('supportedClaudeModelsList', JSON.stringify(supportedClaudeModels));
                populateClaudeModelDropdown();
                setInitialClaudeModelSelection();
            } else {
                console.warn("No supported Claude models returned from API or list is empty.");
                claudeModelSelector.innerHTML = `<option value="">${translations.claude_no_models_available || 'No models available'}</option>`;
            }
        } catch (error) {
            console.error('Error in fetchAndPopulateClaudeModels:', error);
            claudeModelSelector.innerHTML = `<option value="">${translations.claude_models_load_error || 'Error loading models'}</option>`;
        }
    }

    function populateClaudeModelDropdown() {
        if (!claudeModelSelector || !supportedClaudeModels || supportedClaudeModels.length === 0) return;
        const loadingOptionText = translations.claude_model_select_default_option || 'Loading models...';
        const currentSelectorValue = claudeModelSelector.value;
        claudeModelSelector.innerHTML = '';
        supportedClaudeModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model; // Display the model ID, can be prettified if needed
            claudeModelSelector.appendChild(option);
        });
        if (supportedClaudeModels.includes(currentSelectorValue)) {
            claudeModelSelector.value = currentSelectorValue;
        } else if (supportedClaudeModels.length > 0) {
            // Default to a common/recommended Claude model or the first one
            const defaultModel = supportedClaudeModels.find(m => m.includes('claude-3-haiku') || m.includes('claude-3-sonnet') || m.includes('claude-3-opus')) || supportedClaudeModels[0];
            claudeModelSelector.value = defaultModel;
        } else {
            claudeModelSelector.innerHTML = `<option value="">${loadingOptionText}</option>`;
        }
        currentSelectedClaudeModel = claudeModelSelector.value;
        if (currentSelectedClaudeModel) {
            localStorage.setItem('lastSelectedClaudeAllModel', currentSelectedClaudeModel);
        }
    }

    function setInitialClaudeModelSelection() {
        if (!claudeModelSelector || supportedClaudeModels.length === 0) return;
        const lastSelected = localStorage.getItem('lastSelectedClaudeAllModel');
        if (lastSelected && supportedClaudeModels.includes(lastSelected)) {
            claudeModelSelector.value = lastSelected;
        } else {
            const defaultModel = supportedClaudeModels.find(m => m.includes('claude-3-haiku') || m.includes('claude-3-sonnet') || m.includes('claude-3-opus')) || supportedClaudeModels[0];
            claudeModelSelector.value = defaultModel;
        }
        currentSelectedClaudeModel = claudeModelSelector.value;
        if (currentSelectedClaudeModel) {
            localStorage.setItem('lastSelectedClaudeAllModel', currentSelectedClaudeModel);
            loadClaudeAllModelChatHistory(currentSelectedClaudeModel);
            if(claudeAllModelChatInputField && translations.claude_all_model_placeholder_dynamic) {
                 claudeAllModelChatInputField.placeholder = translations.claude_all_model_placeholder_dynamic.replace('{modelName}', currentSelectedClaudeModel);
            } else if (claudeAllModelChatInputField) {
                 claudeAllModelChatInputField.placeholder = `Ask ${currentSelectedClaudeModel}...`;
            }
            // Update top bar model name display
            if (topBarModelNameDisplay && document.getElementById('claude-all-model-view').classList.contains('active')) {
                topBarModelNameDisplay.textContent = `Claude: ${currentSelectedClaudeModel}`;
                topBarModelNameDisplay.style.display = 'inline';
            }
        }
    }

    if (claudeModelSelector) { // Attached to top-bar-claude-model-selector
        claudeModelSelector.addEventListener('change', () => {
            currentSelectedClaudeModel = claudeModelSelector.value;
            if (currentSelectedClaudeModel) {
                localStorage.setItem('lastSelectedClaudeAllModel', currentSelectedClaudeModel);
                loadClaudeAllModelChatHistory(currentSelectedClaudeModel);
                if(claudeAllModelChatInputField) claudeAllModelChatInputField.placeholder = `Ask ${currentSelectedClaudeModel}...`;
                if (topBarModelNameDisplay && document.getElementById('claude-all-model-view').classList.contains('active')) {
                    topBarModelNameDisplay.textContent = `Claude: ${currentSelectedClaudeModel}`;
                }
            } else {
                if(claudeAllModelChatMessagesArea) claudeAllModelChatMessagesArea.innerHTML = "";
                if(claudeAllModelChatInputField) claudeAllModelChatInputField.placeholder = translations.claude_all_model_placeholder || "Ask Claude (any model)...";
                if (topBarModelNameDisplay && document.getElementById('claude-all-model-view').classList.contains('active')) {
                    topBarModelNameDisplay.textContent = 'Claude Models';
                }
            }
        });
    }

    if (claudeAllModelAttachFileButton && claudeAllModelFileUpload) {
        claudeAllModelAttachFileButton.addEventListener('click', () => claudeAllModelFileUpload.click());
        claudeAllModelFileUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                currentClaudeAllModelFile = file;
                if (claudeAllModelFilePreviewContainer) {
                    let previewHTML = `<span class="file-preview-name">${escapeHTML(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>`;
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            previewHTML += `<img src="${e.target.result}" alt="Preview" class="file-preview-image">`;
                            claudeAllModelFilePreviewContainer.innerHTML = previewHTML;
                        };
                        reader.readAsDataURL(file);
                    } else {
                         claudeAllModelFilePreviewContainer.innerHTML = previewHTML; // Show name for non-images
                    }
                }
            } else {
                currentClaudeAllModelFile = null;
                if (claudeAllModelFilePreviewContainer) claudeAllModelFilePreviewContainer.innerHTML = "";
            }
        });
    }

    async function handleClaudeAllModelSendMessage() {
        if (!claudeAllModelChatInputField || !chatUID || !currentSelectedClaudeModel) {
            if (!currentSelectedClaudeModel) alert(translations.claude_select_model_alert || "Please select a Claude model first.");
            return;
        }
        const messageText = claudeAllModelChatInputField.value.trim();
        if (!messageText && !currentClaudeAllModelFile) {
            alert(translations.claude_type_message_or_attach_file_alert || "Please type a message or attach a file for Claude.");
            return;
        }

        let tempPreviewUrl = null;
        if (currentClaudeAllModelFile && currentClaudeAllModelFile.type.startsWith('image/')) {
            tempPreviewUrl = URL.createObjectURL(currentClaudeAllModelFile);
        }
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        addClaudeAllModelMessageToChat(messageText || (currentClaudeAllModelFile ? `File: ${currentClaudeAllModelFile.name}`: ""), 'user', tempPreviewUrl, false, messageId);
        saveClaudeAllModelChatHistory(messageText || (currentClaudeAllModelFile ? `File: ${currentClaudeAllModelFile.name}`: ""), 'user', tempPreviewUrl, currentSelectedClaudeModel, messageId);

        trackActivity('claude_all_model_sent', {
            messageLength: messageText.length, hasFile: !!currentClaudeAllModelFile, model: currentSelectedClaudeModel,
            fileName: currentClaudeAllModelFile ? currentClaudeAllModelFile.name : null,
            fileType: currentClaudeAllModelFile ? currentClaudeAllModelFile.type : null
        });

        const formData = new FormData();
        formData.append('uid', chatUID);
        formData.append('model', currentSelectedClaudeModel);
        if (messageText) formData.append('ask', messageText);
        if (currentClaudeAllModelFile) formData.append('file', currentClaudeAllModelFile, currentClaudeAllModelFile.name);
        formData.append('roleplay', CLAUDE_ALL_MODEL_DEFAULT_ROLEPLAY);
        // max_tokens can be added here if a UI element for it exists: formData.append('max_tokens', value);

        claudeAllModelChatInputField.value = '';
        claudeAllModelFileUpload.value = null;
        const oldFile = currentClaudeAllModelFile;
        currentClaudeAllModelFile = null;
        if (claudeAllModelFilePreviewContainer) claudeAllModelFilePreviewContainer.innerHTML = "";

        claudeAllModelChatInputField.disabled = true;
        if (claudeAllModelChatSendButton) claudeAllModelChatSendButton.disabled = true;
        if (claudeAllModelAttachFileButton) claudeAllModelAttachFileButton.disabled = true;
        if (claudeModelSelector) claudeModelSelector.disabled = true;

        addClaudeAllModelMessageToChat(null, 'ai', null, true); // Typing indicator

        try {
            const response = await fetch('/api/claude-all-model', { method: 'POST', body: formData });
            if (claudeAllModelTypingIndicator) claudeAllModelTypingIndicator.remove();
            if (tempPreviewUrl && oldFile && oldFile.type.startsWith('image/')) {
                URL.revokeObjectURL(tempPreviewUrl);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json(); 

            if (aiResponse.supported_models && Array.isArray(aiResponse.supported_models) && 
                JSON.stringify(supportedClaudeModels) !== JSON.stringify(aiResponse.supported_models)) {
                supportedClaudeModels = aiResponse.supported_models;
                localStorage.setItem('supportedClaudeModelsList', JSON.stringify(supportedClaudeModels));
                populateClaudeModelDropdown();
            }

            // Backend sends the main content in the 'response' field of its payload
            if (aiResponse && aiResponse.response) { 
                const aiMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                addClaudeAllModelMessageToChat(aiResponse.response, 'ai', null, false, aiMessageId); // Use aiResponse.response
                saveClaudeAllModelChatHistory(aiResponse.response, 'ai', null, aiResponse.model_used || currentSelectedClaudeModel, aiMessageId);
            } else if (aiResponse.error) { 
                 // If the backend explicitly sent an error field in its JSON response
                 throw new Error(aiResponse.error);
            }
            else {
                // This case means the backend response was parsed as JSON, but it's not structured as expected
                // (e.g., missing 'response' and 'error' fields).
                // The backend's more robust checks for 'data.answer' should make this less likely for Claude.
                console.warn('Claude All Model: Unexpected payload structure from backend:', aiResponse);
                throw new Error((translations.invalid_response_from_ai || "Invalid response structure from {aiName} AI.").replace('{aiName}', 'Claude'));
            }
        } catch (error) {
            // This catch block handles:
            // 1. Network errors from fetch('/api/claude-all-model').
            // 2. Cases where response.ok was false (backend returned non-2xx status).
            // 3. Errors thrown from the 'if/else if/else' block above (e.g., invalid structure, explicit aiResponse.error).
            console.error('Error with Claude All Model:', error);
            if (claudeAllModelTypingIndicator) claudeAllModelTypingIndicator.remove();
            const errorMsg = (translations.error_ai_connection || "Error: {error} Could not connect to {aiName}.").replace('{error}', error.message).replace('{aiName}', 'Claude');
            addClaudeAllModelMessageToChat(errorMsg, 'ai');
        } finally {
            claudeAllModelChatInputField.disabled = false;
            if (claudeAllModelChatSendButton) claudeAllModelChatSendButton.disabled = false;
            if (claudeAllModelAttachFileButton) claudeAllModelAttachFileButton.disabled = false;
            if (claudeModelSelector) claudeModelSelector.disabled = false;
            if (claudeAllModelChatInputField) claudeAllModelChatInputField.focus();
        }
    }

    if (claudeAllModelChatSendButton) claudeAllModelChatSendButton.addEventListener('click', handleClaudeAllModelSendMessage);
    if (claudeAllModelChatInputField) {
        claudeAllModelChatInputField.addEventListener('keypress', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleClaudeAllModelSendMessage();
            }
        });
    }
    // --- END OF CLAUDE ALL MODEL CHAT LOGIC ---

    // --- EMAIL GENERATOR LOGIC ---
    const generateTempEmailButton = document.getElementById('generate-temp-email-button');
    const generatedEmailAddressContainer = document.getElementById('generated-email-address-container');
    const generatedEmailAddressSpan = document.getElementById('generated-email-address');
    const emailCountdownTimerSpan = document.getElementById('email-countdown-timer');
    const copyEmailButton = document.getElementById('copy-email-button');
    const emailInboxMessagesContainer = document.getElementById('email-inbox-messages-container');
    const refreshInboxButton = document.getElementById('refresh-inbox-button');
    const emailInboxMessagesDiv = document.getElementById('email-inbox-messages');
    const emailExpiredMessageDiv = document.getElementById('email-expired-message');

    let currentTempEmailData = null; // To store { address, token }
    let emailTimerInterval = null;
    let inboxCheckInterval = null;
    const EMAIL_LIFESPAN_SECONDS = 10 * 60; // 10 minutes

    function initializeEmailGeneratorView() {
        if (!generateTempEmailButton) return; // Ensure elements are present

        // Reset UI to initial state
        generateTempEmailButton.disabled = false;
        generateTempEmailButton.textContent = 'Générer un Email Temporaire';
        if (generatedEmailAddressContainer) generatedEmailAddressContainer.style.display = 'none';
        if (generatedEmailAddressSpan) generatedEmailAddressSpan.textContent = '';
        if (emailCountdownTimerSpan) emailCountdownTimerSpan.textContent = '10:00';
        if (emailInboxMessagesContainer) emailInboxMessagesContainer.style.display = 'none';
        if (emailInboxMessagesDiv) emailInboxMessagesDiv.innerHTML = '<p>Aucun message pour le moment. Cliquez sur "Actualiser" pour vérifier.</p>';
        if (emailExpiredMessageDiv) emailExpiredMessageDiv.style.display = 'none';
        if (copyEmailButton) copyEmailButton.style.display = 'inline-flex';


        currentTempEmailData = null;
        if (emailTimerInterval) clearInterval(emailTimerInterval);
        if (inboxCheckInterval) clearInterval(inboxCheckInterval);
        emailTimerInterval = null;
        inboxCheckInterval = null;
    }

    async function generateTemporaryEmail() {
        if (!generateTempEmailButton || !generatedEmailAddressSpan || !emailCountdownTimerSpan || !generatedEmailAddressContainer || !emailInboxMessagesContainer || !emailExpiredMessageDiv) return;

        initializeEmailGeneratorView(); // Reset view before generating new email
        generateTempEmailButton.disabled = true;
        generateTempEmailButton.textContent = 'Génération en cours...';

        try {
            const response = await fetch('/api/tempmail/create');
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `Erreur ${response.status}` }));
                throw new Error(errData.error || `Impossible de générer l'e-mail: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.address && data.token) {
                currentTempEmailData = { address: data.address, token: data.token };
                generatedEmailAddressSpan.textContent = data.address;
                generatedEmailAddressContainer.style.display = 'block';
                emailInboxMessagesContainer.style.display = 'block';
                emailExpiredMessageDiv.style.display = 'none';
                startEmailTimer(EMAIL_LIFESPAN_SECONDS);
                // Initial check for inbox, then set interval
                fetchInboxMessages();
                inboxCheckInterval = setInterval(fetchInboxMessages, 30000); // Check every 30 seconds
                trackActivity('temp_email_generated', { address: data.address.split('@')[1] }); // Track domain for privacy
            } else {
                throw new Error("Réponse invalide de l'API de génération d'e-mail.");
            }
        } catch (error) {
            console.error("Erreur lors de la génération de l'e-mail temporaire:", error);
            if (generatedEmailAddressContainer) generatedEmailAddressContainer.style.display = 'block'; // Show container to display error
            generatedEmailAddressSpan.innerHTML = `<span class="error-message">Erreur: ${error.message}</span>`;
            generateTempEmailButton.disabled = false;
            generateTempEmailButton.textContent = 'Générer un Email Temporaire';
        }
    }

    function startEmailTimer(durationSeconds) {
        let timer = durationSeconds;
        if (emailTimerInterval) clearInterval(emailTimerInterval);

        emailTimerInterval = setInterval(() => {
            const minutes = Math.floor(timer / 60);
            const seconds = timer % 60;
            if (emailCountdownTimerSpan) {
                emailCountdownTimerSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            timer--;
            if (timer < 0) {
                clearInterval(emailTimerInterval);
                emailTimerInterval = null;
                if (inboxCheckInterval) clearInterval(inboxCheckInterval);
                inboxCheckInterval = null;
                currentTempEmailData = null; // Invalidate email data

                if (generatedEmailAddressContainer) generatedEmailAddressContainer.style.display = 'none';
                if (emailInboxMessagesContainer) emailInboxMessagesContainer.style.display = 'none';
                if (emailExpiredMessageDiv) emailExpiredMessageDiv.style.display = 'block';
                if (generateTempEmailButton) {
                    generateTempEmailButton.disabled = false;
                    generateTempEmailButton.textContent = 'Générer un Email Temporaire';
                }
                trackActivity('temp_email_expired');
            }
        }, 1000);
    }

    async function fetchInboxMessages() {
        if (!currentTempEmailData || !currentTempEmailData.token || !emailInboxMessagesDiv) {
            // console.log("Pas d'e-mail actif ou token manquant pour vérifier la boîte de réception.");
            if (emailInboxMessagesDiv && !currentTempEmailData) { // Only update if no active email
                 // emailInboxMessagesDiv.innerHTML = '<p>Générez un e-mail pour voir la boîte de réception.</p>';
            }
            return;
        }
        if (refreshInboxButton) refreshInboxButton.disabled = true;

        try {
            const response = await fetch(`/api/tempmail/inbox?token=${encodeURIComponent(currentTempEmailData.token)}`);
            if (!response.ok) {
                // Handle non-critical errors like "no messages" or "token expired" differently if API provides codes
                const errData = await response.json().catch(() => ({error: `Erreur ${response.status}`}));
                 // If token is invalid or expired, the main timer will handle UI reset.
                if (response.status === 404 || response.status === 400) { // Example: token invalid/expired
                    console.warn("Token invalide ou expiré lors de la vérification de la boîte de réception:", errData.error);
                    // Do not display error directly in inbox, let main timer handle it
                } else {
                    throw new Error(errData.error || `Impossible de récupérer les messages: ${response.statusText}`);
                }
                emailInboxMessagesDiv.innerHTML = `<p>Impossible de charger les messages: ${errData.error || response.statusText}.</p>`;
            } else {
                 const messages = await response.json();
                if (Array.isArray(messages) && messages.length > 0) {
                    emailInboxMessagesDiv.innerHTML = messages.map(msg => `
                        <div class="email-message-item">
                            <strong>De:</strong> ${escapeHTML(msg.from || 'Inconnu')}<br>
                            <strong>Sujet:</strong> ${escapeHTML(msg.subject || '(Pas de sujet)')}<br>
                            <small>Reçu: ${escapeHTML(new Date(msg.date || Date.now()).toLocaleString())}</small>
                            <hr>
                            <p>${escapeHTML(msg.body_text || msg.body_html || '(Message vide)')}</p>
                        </div>
                    `).join('');
                    trackActivity('temp_email_inbox_checked', { messages_found: messages.length });
                } else {
                    emailInboxMessagesDiv.innerHTML = '<p>Aucun nouveau message. Cliquez sur "Actualiser" pour revérifier.</p>';
                }
            }

        } catch (error) {
            console.error("Erreur lors de la récupération des messages de la boîte de réception:", error);
            emailInboxMessagesDiv.innerHTML = `<p class="error-message">Erreur: ${error.message}</p>`;
        } finally {
            if (refreshInboxButton) refreshInboxButton.disabled = false;
        }
    }

    if (generateTempEmailButton) {
        generateTempEmailButton.addEventListener('click', generateTemporaryEmail);
    }
    if (refreshInboxButton) {
        refreshInboxButton.addEventListener('click', fetchInboxMessages);
    }
    if (copyEmailButton && generatedEmailAddressSpan) {
        copyEmailButton.addEventListener('click', () => {
            const emailToCopy = generatedEmailAddressSpan.textContent;
            if (emailToCopy && navigator.clipboard) {
                navigator.clipboard.writeText(emailToCopy)
                    .then(() => {
                        const originalText = copyEmailButton.innerHTML;
                        copyEmailButton.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg> Copié!';
                        setTimeout(() => { copyEmailButton.innerHTML = originalText; }, 2000);
                        trackActivity('temp_email_copied');
                    })
                    .catch(err => {
                        console.error('Impossible de copier l\'e-mail:', err);
                        alert('Impossible de copier l\'e-mail. Veuillez le faire manuellement.');
                    });
            }
        });
    }
    // --- FIN DE LA LOGIQUE DU GÉNÉRATEUR D'EMAIL ---

    // --- I18N Basic Setup ---
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'fr'; // Default to French
    let translations = {};

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                console.error(`Could not load translations for ${lang}. Status: ${response.status}`);
                // Fallback to English if current lang fails, but not if English itself fails
                if (lang !== 'en') {
                    console.warn(`Falling back to English translations.`);
                    await loadTranslations('en'); // Attempt to load English as a fallback
                } else {
                    translations = {}; // No translations available
                }
                return;
            }
            translations = await response.json();
            applyTranslations();
            updateLanguageDropdown(); // Ensure dropdown reflects the loaded language
        } catch (error) {
            console.error('Error loading or parsing translation file:', error);
            if (lang !== 'en') {
                console.warn(`Falling back to English translations due to error.`);
                await loadTranslations('en');
            } else {
                translations = {};
            }
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            if (translations[key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.placeholder) element.placeholder = translations[key];
                } else if (element.title) {
                     element.title = translations[key];
                }
                // For elements like <span> in sidebar, direct textContent is fine
                // Check if the element is a direct child of a an 'a' tag in the side menu for description
                else if (element.classList.contains('menu-item-description')) {
                     element.textContent = translations[key];
                }
                // For sidebar main titles, they are usually the first span if description exists or only span
                else if (element.parentElement?.tagName === 'A' && element.parentElement.closest('#side-menu') && !element.classList.contains('menu-item-description')) {
                    element.textContent = translations[key];
                }
                else {
                    element.textContent = translations[key];
                }
            } else {
                console.warn(`Translation key not found: ${key} for lang: ${currentLanguage}`);
            }
        });
        // Update dynamic content if needed, e.g., default chat messages
        // This would require modifying functions like loadChatHistory, loadGeminiChatHistory etc.
        // Example for a default message (conceptual)
        // if (translations.ai_chat_welcome_message && chatMessagesArea.children.length === 0) {
        //     addMessageToChat(translations.ai_chat_welcome_message, "ai");
        // }
        // Update specific placeholders not covered by data-translate, if any
        // For example, the ones set dynamically in JS
        const chatInputField = document.getElementById('chat-input-field');
        if (chatInputField && translations.ai_chat_placeholder) chatInputField.placeholder = translations.ai_chat_placeholder;

        const geminiChatInputField = document.getElementById('gemini-chat-input-field');
        if (geminiChatInputField && translations.gemini_chat_placeholder) geminiChatInputField.placeholder = translations.gemini_chat_placeholder;

        const gpt4oChatInputField = document.getElementById('gpt4o-chat-input-field');
        if (gpt4oChatInputField && translations.gpt4o_chat_placeholder) gpt4oChatInputField.placeholder = translations.gpt4o_chat_placeholder;

        const blackboxChatInputField = document.getElementById('blackbox-chat-input-field');
        if (blackboxChatInputField && translations.blackbox_ai_placeholder) blackboxChatInputField.placeholder = translations.blackbox_ai_placeholder;

        const deepseekChatInputField = document.getElementById('deepseek-chat-input-field');
        if (deepseekChatInputField && translations.deepseek_ai_placeholder) deepseekChatInputField.placeholder = translations.deepseek_ai_placeholder;

        const claudeChatInputField = document.getElementById('claude-chat-input-field');
        if (claudeChatInputField && translations.claude_haiku_placeholder) claudeChatInputField.placeholder = translations.claude_haiku_placeholder;

        // Update welcome messages for new AIs if their chat history is empty
        if (blackboxChatMessagesArea && blackboxChatMessagesArea.children.length === 0 && translations.blackbox_welcome_message) {
            addBlackboxAiMessageToChat(translations.blackbox_welcome_message, 'ai');
        }
        if (deepseekChatMessagesArea && deepseekChatMessagesArea.children.length === 0 && translations.deepseek_welcome_message) {
            addDeepseekAiMessageToChat(translations.deepseek_welcome_message, 'ai');
        }
        if (claudeChatMessagesArea && claudeChatMessagesArea.children.length === 0 && translations.claude_welcome_message) {
            addClaudeHaikuAiMessageToChat(translations.claude_welcome_message, 'ai');
        }
    }

    function updateLanguageDropdown() {
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = currentLanguage;
        }
    }

    const languageSelectElement = document.getElementById('language-select');
    if (languageSelectElement) {
        // Add Malagasy to dropdown
        let mgOption = languageSelectElement.querySelector('option[value="mg"]');
        if (!mgOption) {
            mgOption = document.createElement('option');
            mgOption.value = 'mg';
            // The textContent will be set by applyTranslations if a key like "language_mg" exists
            mgOption.setAttribute('data-translate', 'language_mg');
            languageSelectElement.appendChild(mgOption);
        }

        languageSelectElement.addEventListener('change', (event) => {
            currentLanguage = event.target.value;
            localStorage.setItem('selectedLanguage', currentLanguage);
            loadTranslations(currentLanguage);
        });
    }
    // Initial load
    loadTranslations(currentLanguage);

    // Make feature descriptions on home page clickable
    document.querySelectorAll('#welcome-description-section .feature-highlight-item').forEach(item => {
        const viewId = item.dataset.view;
        if (viewId) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function(event) {
                if (window.getSelection().toString()) return;
                if (event.target.tagName === 'A' && event.target.href) return;
                window.showView(viewId);
            });
            const descriptionP = item.querySelector('p');
            if (descriptionP) descriptionP.classList.add('clickable-description');
        }
    });

    // Add "All ChatGPT Models" to relevant view checks in showView
    // This is done by modifying the existing showView function where chatViewIds and flex view checks occur.
    // No specific code block here, as it's an adjustment within the large showView function.
    // The viewId 'all-chatgpt-models-view' will be added to the 'chatViewIds' array
    // and to the condition for applying 'display: flex'.

    // --- END OF I18N Basic Setup ---

    // --- Download Format Modal Logic ---
    const downloadFormatModal = document.getElementById('download-format-modal');
    const closeDownloadFormatModalButton = document.getElementById('close-download-format-modal');
    const downloadOptionsContainer = document.getElementById('download-options-container');
    const downloadFormatStatus = document.getElementById('download-format-status');
    let currentMessageBubbleForDownload = null; // To store the message bubble content

    function openDownloadFormatModal(bubbleElement) {
        if (!downloadFormatModal || !downloadFormatStatus) return;
        currentMessageBubbleForDownload = bubbleElement;
        downloadFormatStatus.textContent = ''; // Clear previous status
        // Disable buttons initially if needed, or enable all
        downloadOptionsContainer.querySelectorAll('.download-option-btn').forEach(btn => btn.disabled = false);
        downloadFormatModal.style.display = 'flex'; // Show modal
        downloadFormatModal.classList.add('visible');
    }

    function closeDownloadFormatModal() {
        if (!downloadFormatModal) return;
        downloadFormatModal.style.display = 'none';
        downloadFormatModal.classList.remove('visible');
        currentMessageBubbleForDownload = null;
    }

    if (closeDownloadFormatModalButton) {
        closeDownloadFormatModalButton.addEventListener('click', closeDownloadFormatModal);
    }
    if (downloadFormatModal) { // Close on overlay click
        downloadFormatModal.addEventListener('click', (event) => {
            if (event.target === downloadFormatModal) {
                closeDownloadFormatModal();
            }
        });
    }

    if (downloadOptionsContainer) {
        downloadOptionsContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('download-option-btn')) {
                const format = event.target.dataset.format;
                if (!currentMessageBubbleForDownload || !format) return;

                downloadFormatStatus.textContent = `Préparation du téléchargement en ${format.toUpperCase()}...`;
                event.target.disabled = true; // Disable clicked button

                try {
                    const filename = `chat_message_${Date.now()}`;
                    if (format === 'txt') {
                        await generateTxtFromBubble(currentMessageBubbleForDownload, filename);
                    } else if (format === 'pdf') {
                        // await generatePdfFromBubble(currentMessageBubbleForDownload, filename); // To be implemented
                        downloadFormatStatus.textContent = 'La génération PDF sera bientôt disponible !';
                        console.warn("PDF generation not yet implemented.");
                        // Re-enable button after message
                        setTimeout(() => { event.target.disabled = false; downloadFormatStatus.textContent = '';}, 2000);
                        return; // Prevent closing modal yet
                    } else if (format === 'docx') {
                        // await generateDocxFromBubble(currentMessageBubbleForDownload, filename); // To be implemented
                        downloadFormatStatus.textContent = 'La génération DOCX sera bientôt disponible !';
                        console.warn("DOCX generation not yet implemented.");
                        setTimeout(() => { event.target.disabled = false; downloadFormatStatus.textContent = '';}, 2000);
                        return; // Prevent closing modal yet
                    }
                    downloadFormatStatus.textContent = `Téléchargement en ${format.toUpperCase()} terminé !`;
                    setTimeout(() => {
                        closeDownloadFormatModal();
                        event.target.disabled = false; // Re-enable button for next time
                    }, 1500);
                } catch (error) {
                    console.error(`Error generating ${format}:`, error);
                    downloadFormatStatus.textContent = `Erreur lors de la génération ${format.toUpperCase()}: ${error.message}`;
                    event.target.disabled = false; // Re-enable on error
                }
            }
        });
    }

    async function generateTxtFromBubble(bubbleElement, baseFilename) {
        let markdownContent = '';
        const listLevelCounters = {}; // To manage numbering for nested OLs

        function htmlToMarkdown(node, currentListInfo = { type: null, level: 0 }) {
            let md = '';
            if (node.nodeType === Node.TEXT_NODE) {
                // Replace multiple spaces/newlines with a single space for inline text,
                // but preserve newlines if they are significant (e.g. inside PRE)
                if (node.parentNode.tagName === 'PRE' || node.parentNode.tagName === 'CODE') {
                    md = node.textContent;
                } else {
                    md = node.textContent.replace(/\s+/g, ' ');
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toUpperCase();
                let childrenMd = '';
                
                // Special handling for LI content before processing its children for nested lists
                if (tagName === 'LI') {
                    Array.from(node.childNodes).forEach(child => {
                         // If child is UL/OL, it's a nested list. Otherwise, process as normal content.
                        if (child.nodeType === Node.ELEMENT_NODE && (child.tagName === 'UL' || child.tagName === 'OL')) {
                             // Process nested list separately after current LI content line
                        } else {
                            childrenMd += htmlToMarkdown(child, currentListInfo);
                        }
                    });
                } else { // For other elements, process all children first
                    Array.from(node.childNodes).forEach(child => {
                        childrenMd += htmlToMarkdown(child, currentListInfo);
                    });
                }


                switch (tagName) {
                    // For TXT output, convert Hx tags to their text content, potentially with line breaks for separation,
                    // but without Markdown '#' or emphasis like '**'.
                    case 'H1': 
                    case 'H2': 
                    case 'H3': 
                    case 'H4': 
                    case 'H5': 
                    case 'H6': 
                        md = `\n${childrenMd.trim().toUpperCase()}\n\n`; // Titles in uppercase, surrounded by newlines
                        break;
                    case 'P': md = `${childrenMd.trim()}\n\n`; break;
                    // For TXT, strong/em might just be plain text or kept if distinction is important.
                    // If they are used for titles (as implied by user), they should be plain text.
                    // For now, let's keep them as Markdown emphasis, assuming they are not the primary way to make titles.
                    // If a `<strong>` on its own line should be a title, that's a more complex heuristic.
                    case 'STRONG': case 'B': md = `**${childrenMd.trim()}**`; break;
                    case 'EM': case 'I': md = `*${childrenMd.trim()}*`; break;
                    case 'BR': md = '\n'; break;
                    case 'PRE':
                        // Assuming the actual code is in a <code> child, possibly from dataset.code
                        const codeEl = node.querySelector('code');
                        const lang = codeEl ? (codeEl.className.match(/language-(\w+)/)?.[1] || '') : '';
                        // Prioritize dataset.code for raw original code if available
                        const rawCode = codeEl ? (codeEl.dataset.code || codeEl.textContent) : node.textContent;
                        md = `\`\`\`${lang}\n${rawCode.trim()}\n\`\`\`\n\n`;
                        break;
                    case 'CODE':
                        if (!node.closest('PRE')) md = `\`${childrenMd.trim()}\``;
                        else md = childrenMd.trim(); // Text content of <code> inside <pre>
                        break;
                    case 'UL':
                        let ulContent = '';
                        Array.from(node.children).filter(c => c.tagName === 'LI').forEach(li => {
                            ulContent += htmlToMarkdown(li, { type: 'UL', level: currentListInfo.level + 1 });
                        });
                        md = ulContent + (currentListInfo.level === 0 ? '\n' : ''); // Add extra newline after top-level list
                        break;
                    case 'OL':
                        let olContent = '';
                        listLevelCounters[currentListInfo.level + 1] = 0; // Reset counter for this level
                        Array.from(node.children).filter(c => c.tagName === 'LI').forEach(li => {
                             listLevelCounters[currentListInfo.level + 1]++;
                            olContent += htmlToMarkdown(li, { type: 'OL', level: currentListInfo.level + 1, counter: listLevelCounters[currentListInfo.level + 1] });
                        });
                        md = olContent + (currentListInfo.level === 0 ? '\n' : '');
                        break;
                    case 'LI':
                        const indent = '  '.repeat(currentListInfo.level -1 > 0 ? currentListInfo.level -1 : 0);
                        if (currentListInfo.type === 'OL') {
                            md = `${indent}${currentListInfo.counter}. ${childrenMd.trim()}\n`;
                        } else { // UL
                            md = `${indent}* ${childrenMd.trim()}\n`; // Using * for UL consistently
                        }
                        // Process nested lists if any, after the current LI's main content
                        Array.from(node.childNodes).forEach(child => {
                            if (child.nodeType === Node.ELEMENT_NODE && (child.tagName === 'UL' || child.tagName === 'OL')) {
                                md += htmlToMarkdown(child, { type: child.tagName, level: currentListInfo.level }); // Pass current level, it will be incremented by UL/OL
                            }
                        });
                        break;
                    case 'TABLE':
                        // Basic Markdown table conversion
                        let tableMd = '';
                        const rows = Array.from(node.querySelectorAll('tr'));
                        rows.forEach((row, rowIndex) => {
                            const cells = Array.from(row.querySelectorAll('th, td'));
                            tableMd += `| ${cells.map(cell => htmlToMarkdown(cell).trim()).join(' | ')} |\n`;
                            if (rowIndex === 0 && row.querySelector('th')) { // Header row
                                tableMd += `| ${cells.map(() => '---').join(' | ')} |\n`;
                            }
                        });
                        md = tableMd + '\n';
                        break;
                    default:
                        // For other elements (like DIV, SPAN), just process children.
                        // If it's an unknown block element, add newlines.
                        if (window.getComputedStyle(node).display === 'block' && tagName !== 'LI') {
                            md = `${childrenMd.trim()}\n\n`;
                        } else {
                            md = childrenMd;
                        }
                        break;
                }
            }
            return md;
        }

        markdownContent = htmlToMarkdown(bubbleElement).trim();
        
        // Final cleanup: ensure consistent newlines, max 2 consecutive.
        markdownContent = markdownContent.replace(/\n\s*\n/g, '\n\n');

        const blob = new Blob([markdownContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFilename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function generatePdfFromBubble(bubbleElement, baseFilename) {
        if (typeof jspdf === 'undefined' || !jspdf.jsPDF) { // Check for jsPDF constructor
            console.error("jsPDF is not loaded or 'jspdf.jsPDF' is not available. Make sure the CDN link is correct in index.html.");
            if(downloadFormatStatus) downloadFormatStatus.textContent = 'Erreur : La bibliothèque PDF n\'a pas pu être chargée.';
            return Promise.reject("jsPDF not loaded or not available as constructor");
        }
        const { jsPDF } = jspdf; // If jspdf is the global, jsPDF is a property.
        const pdf = new jsPDF({ // Correct instantiation
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        let yPos = 40; 
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 40;
        const maxLineWidth = pageWidth - 2 * margin;

        // Embed a standard font that supports a wider range of characters if possible
        // For jsPDF, this usually means using a built-in one like 'Helvetica' or 'Times'
        // or embedding a custom font (which is more complex with CDN usage).
        // Defaulting to Helvetica as it's generally good.
        pdf.setFont('Helvetica', 'normal'); 
        pdf.setFontSize(11); // Default font size
        
        const getLineHeight = (size, multiplier = 1.2) => size * multiplier; 

        async function processNodePdf(node, currentX, currentY, currentOptions) {
            let newY = currentY;
            const defaultOptions = { 
                fontName: 'Helvetica', 
                fontStyle: 'normal', 
                fontSize: 11,
                // listPrefix is dynamically built during list processing
            };
            let options = { ...defaultOptions, ...currentOptions }; 

            if (node.nodeType === Node.TEXT_NODE) {
                const trimmedText = node.textContent.replace(/\s+/g, ' ').trim();
                if (trimmedText) {
                    pdf.setFont(options.fontName, options.fontStyle);
                    pdf.setFontSize(options.fontSize);
                    const textToSplit = (options.listPrefix || '') + trimmedText;
                    // Calculate available width for text splitting based on currentX
                    const availableWidth = maxLineWidth - (currentX - margin);
                    const textLines = pdf.splitTextToSize(textToSplit, availableWidth > 0 ? availableWidth : maxLineWidth);
                    
                    textLines.forEach(line => {
                        if (newY + getLineHeight(options.fontSize) > pageHeight - margin) {
                            pdf.addPage();
                            newY = margin;
                             // Reset font after page break
                            pdf.setFont(options.fontName, options.fontStyle);
                            pdf.setFontSize(options.fontSize);
                        }
                        pdf.text(line, currentX, newY);
                        newY += getLineHeight(options.fontSize);
                    });
                    if(options.listPrefix) options.listPrefix = ' '.repeat((options.listPrefix || '').length); // Indent subsequent lines
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toUpperCase();
                let newNestedOptions = { ...options }; 
                // Reset listPrefix for children unless it's part of LI content that continues
                if (tagName !== 'LI' && tagName !== 'SPAN' && tagName !== 'STRONG' && tagName !== 'EM' && tagName !== 'B' && tagName !== 'I' && tagName !== 'CODE') {
                    newNestedOptions.listPrefix = ''; 
                }

                switch (tagName) {
                    case 'H1': newNestedOptions = {...newNestedOptions, fontSize: 18, fontStyle: 'bold'}; break;
                    case 'H2': newNestedOptions = {...newNestedOptions, fontSize: 16, fontStyle: 'bold'}; break;
                    case 'H3': newNestedOptions = {...newNestedOptions, fontSize: 14, fontStyle: 'bold'}; break;
                    case 'H4': case 'H5': case 'H6': newNestedOptions = {...newNestedOptions, fontSize: 12, fontStyle: 'bold'}; break;
                    case 'STRONG': case 'B': newNestedOptions.fontStyle = 'bold'; break;
                    case 'EM': case 'I': newNestedOptions.fontStyle = 'italic'; break;
                    case 'BR':
                        newY += getLineHeight(options.fontSize, 0.8); // Smaller gap for BR
                        if (newY > pageHeight - margin) { pdf.addPage(); newY = margin; }
                        return newY; 
                    case 'PRE':
                        const codeEl = node.querySelector('code');
                        const rawCode = codeEl ? (codeEl.dataset.code || codeEl.innerText) : node.innerText;
                        const codeFontSize = 9;
                        const codeLineHeight = getLineHeight(codeFontSize, 1.15); // Slightly more for code
                        
                        const codeLines = pdf.splitTextToSize(rawCode.trim(), maxLineWidth - 10); 
                        const boxHeight = (codeLines.length * codeLineHeight) + 10; // Padding for box

                        if (newY + boxHeight > pageHeight - margin) { pdf.addPage(); newY = margin; }
                        
                        pdf.setFillColor(245, 245, 245); 
                        pdf.setDrawColor(220, 220, 220); 
                        pdf.rect(margin - 5, newY - codeLineHeight * 0.1, maxLineWidth + 10, boxHeight, 'FD'); 
                        
                        pdf.setFont('Courier', 'normal');
                        pdf.setFontSize(codeFontSize);
                        let codeTextY = newY + 5; // Start text with padding
                        codeLines.forEach(line => {
                            if (codeTextY + codeLineHeight > pageHeight - margin) { 
                                pdf.addPage(); newY = margin; codeTextY = newY + 5;
                                // Redraw box header if split? For now, no.
                                pdf.setFillColor(245, 245, 245); 
                                pdf.setDrawColor(220, 220, 220); 
                                // Estimate remaining box height or full if new page
                                const remainingBoxHeight = pageHeight - margin - newY > boxHeight ? boxHeight : pageHeight - margin - newY -5;
                                pdf.rect(margin - 5, newY - codeLineHeight * 0.1, maxLineWidth + 10, remainingBoxHeight , 'FD');
                            }
                            pdf.text(line, margin, codeTextY); 
                            codeTextY += codeLineHeight;
                        });
                        newY = codeTextY - codeLineHeight + (getLineHeight(options.fontSize) * 0.5); // Position after the code block
                        pdf.setFont(options.fontName, options.fontStyle); // Reset font
                        pdf.setFontSize(options.fontSize);
                        return newY; 
                    case 'CODE':
                         if (!node.closest('PRE')) { 
                            newNestedOptions.fontName = 'Courier';
                            newNestedOptions.fontSize = options.fontSize * 0.9; 
                         } else { return newY; } // Handled by PRE's text extraction
                        break;
                    case 'UL': case 'OL':
                        const items = Array.from(node.children).filter(child => child.tagName === 'LI');
                        const listDepth = (options.listDepth || 0) + 1; // Current depth for items of this list
                        let listCounter = 0;

                        items.forEach(async (li) => {
                            listCounter++;
                            const itemPrefix = (tagName === 'OL') ? `${listCounter}. ` : '• ';
                            let liOptions = { 
                                ...options, // Inherit current styles like font size for LI text
                                listPrefix: itemPrefix, 
                                listDepth: listDepth, // Pass depth for potential nested lists within this LI
                            };
                            
                            // Process children of LI. The first text node will get the prefix.
                            let firstTextNodeProcessed = false;
                            for(const childNode of li.childNodes) {
                                if(childNode.nodeType === Node.TEXT_NODE && childNode.textContent.trim() && !firstTextNodeProcessed){
                                   newY = await processNodePdf(childNode, currentX + (20 * listDepth), newY, liOptions);
                                   firstTextNodeProcessed = true;
                                   liOptions.listPrefix = ' '.repeat(itemPrefix.length); // Indent further lines of same LI item
                                } else {
                                   newY = await processNodePdf(childNode, currentX + (20 * listDepth), newY, liOptions);
                                }
                            }
                        });
                        newY += getLineHeight(options.fontSize) * 0.2; 
                        return newY; 
                    case 'TABLE':
                        if (typeof pdf.autoTable === 'function') {
                            const head = [];
                            const body = [];
                            const headerRow = node.querySelector('thead tr, tr:first-child');
                            if (headerRow) {
                                head.push(Array.from(headerRow.querySelectorAll('th, td')).map(cell => cell.textContent.trim()));
                            }
                            const bodyRows = Array.from(node.querySelectorAll('tbody tr, tr' + (headerRow ? ':not(:first-child)' : '')));
                            bodyRows.forEach(row => {
                                body.push(Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim()));
                            });
                            
                            if (newY + 20 > pageHeight - margin) { pdf.addPage(); newY = margin; }
                            pdf.autoTable({
                                head: head.length > 0 ? head : null,
                                body: body,
                                startY: newY,
                                margin: { left: margin, right: margin },
                                theme: 'grid', 
                                styles: { font: 'Helvetica', fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
                                headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
                                didDrawPage: (data) => { newY = data.cursor.y + 10; } // Update yPos after table
                            });
                            newY = pdf.previousAutoTable.finalY ? pdf.previousAutoTable.finalY + 15 : newY + (20 * (body.length + (head.length > 0 ? 1:0))); 
                        } else { 
                             newY = await processNodePdf(document.createTextNode("[Aperçu du tableau non disponible sans le module externe jsPDF-AutoTable]"), margin, newY, {...options, fontStyle: 'italic'});
                        }
                        return newY; 
                    case 'DIV': case 'P': 
                        // Add a small space before block if not first element on page
                        if (newY > margin + getLineHeight(options.fontSize, 0.5) && (node.previousSibling || node.parentElement.firstChild !==node) ) {
                           newY += getLineHeight(options.fontSize) * 0.1; 
                        }
                        for(const child of Array.from(node.childNodes)) {
                           newY = await processNodePdf(child, currentX, newY, newNestedOptions);
                        }
                        // Add a bit more space after P or DIV if it's a block, unless it's the last element.
                        if (node.nextSibling || (node.parentElement && node.parentElement.lastChild !== node) ) {
                           newY += getLineHeight(options.fontSize) * 0.3; 
                        }
                        return newY;
                }

                // Generic child processing for elements that mainly apply style (e.g., SPAN)
                // or unhandled block elements that should just pass content through.
                if (node.childNodes && node.childNodes.length > 0 && !node.classList.contains('message-controls')) {
                    for(const child of Array.from(node.childNodes)) {
                       newY = await processNodePdf(child, currentX, newY, newNestedOptions);
                    }
                } else if (node.textContent.trim() && !['BR', 'PRE', 'UL', 'OL', 'TABLE', 'DIV', 'P', 'LI'].includes(tagName)) { 
                    // If it's an unhandled element with text content (e.g. SPAN directly)
                    pdf.setFont(newNestedOptions.fontName, newNestedOptions.fontStyle);
                    pdf.setFontSize(newNestedOptions.fontSize);
                    const textLinesToPrint = pdf.splitTextToSize((newNestedOptions.listPrefix || '') + node.textContent.trim(), maxLineWidth - (currentX - margin));
                    textLinesToPrint.forEach(line => {
                        if (newY + getLineHeight(newNestedOptions.fontSize) > pageHeight - margin) {
                            pdf.addPage();
                            newY = margin;
                             pdf.setFont(newNestedOptions.fontName, newNestedOptions.fontStyle); // Reset font on new page
                             pdf.setFontSize(newNestedOptions.fontSize);
                        }
                        pdf.text(line, currentX, newY);
                        newY += getLineHeight(newNestedOptions.fontSize);
                    });
                }
            }
            return newY; // Return the updated Y position
        }

        // Start processing with initial listDepth and an empty counter object
        for(const childNode of Array.from(bubbleElement.childNodes)) {
            yPos = await processNodePdf(childNode, margin, yPos, { listDepth: 0 });
        }

        pdf.save(`${baseFilename}.pdf`);
        return Promise.resolve(); 
    }

    async function generateDocxFromBubble(bubbleElement, baseFilename) {
        if (typeof docx === 'undefined' || !docx.Document) { 
            console.error("docx library is not loaded or not client-side compatible. Make sure the CDN link is correct.");
            if(downloadFormatStatus) downloadFormatStatus.textContent = 'Erreur : La bibliothèque DOCX n\'a pas pu être chargée ou n\'est pas compatible.';
            return Promise.reject("DOCX library not loaded or incompatible");
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, BorderStyle, ShadingType, convertInchesToTwip, PageOrientation, Indent } = docx;
        const docChildren = []; 

        const defaultParagraphSpacing = { after: 100, before: 50 };

        // Recursive function to process HTML nodes and convert them to docx elements
        function processHtmlNodeToDocx(node, currentTextProps = { size: 22, font: "Calibri" }, listInfo = { level: 0, type: null, counter: 0 }) {
            const elements = []; 

            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                // Add text only if it's not just whitespace, or if parent is PRE/CODE
                if (text.trim().length > 0 || (node.parentNode && ['CODE', 'PRE'].includes(node.parentNode.tagName))) {
                    elements.push(new TextRun({ text, ...currentTextProps }));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toUpperCase();
                let newTextProps = JSON.parse(JSON.stringify(currentTextProps)); 
                let paragraphChildren = [];

                // Block-level elements usually create new Paragraphs or Tables
                if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'UL', 'OL', 'TABLE', 'DIV', 'BR'].includes(tagName)) {
                    
                    // Process children first for P, DIV to gather TextRuns for a single Paragraph
                    if (tagName === 'P' || tagName === 'DIV') {
                         Array.from(node.childNodes).forEach(child => {
                            paragraphChildren.push(...processHtmlNodeToDocx(child, newTextProps, listInfo));
                        });
                    }

                    switch (tagName) {
                        case 'H1': elements.push(new Paragraph({ children: [new TextRun({text: node.textContent, bold: true, size: 32})], heading: HeadingLevel.HEADING_1, spacing: { after: 240, before: 120 } })); break;
                        case 'H2': elements.push(new Paragraph({ children: [new TextRun({text: node.textContent, bold: true, size: 28})], heading: HeadingLevel.HEADING_2, spacing: { after: 220, before: 110 } })); break;
                        case 'H3': elements.push(new Paragraph({ children: [new TextRun({text: node.textContent, bold: true, size: 26})], heading: HeadingLevel.HEADING_3, spacing: { after: 200, before: 100 } })); break;
                        case 'H4': elements.push(new Paragraph({ children: [new TextRun({text: node.textContent, bold: true, size: 24})], heading: HeadingLevel.HEADING_4, spacing: { after: 180, before: 90 } })); break;
                        case 'H5': elements.push(new Paragraph({ children: [new TextRun({text: node.textContent, bold: true, size: 22})], heading: HeadingLevel.HEADING_5, spacing: { after: 160, before: 80 } })); break;
                        case 'H6': elements.push(new Paragraph({ children: [new TextRun({text: node.textContent, bold: true, size: 22})], heading: HeadingLevel.HEADING_6, spacing: { after: 140, before: 70 } })); break;
                        case 'P': if (paragraphChildren.length > 0) elements.push(new Paragraph({ children: paragraphChildren, spacing: defaultParagraphSpacing })); break;
                        case 'DIV': 
                            if (paragraphChildren.length > 0) { // If DIV contained inline content, wrap it
                                elements.push(new Paragraph({ children: paragraphChildren, spacing: defaultParagraphSpacing }));
                            } // If DIV contained other block elements, they are already in 'elements' from recursive calls
                            break;
                        case 'BR': elements.push(new Paragraph({children: [new TextRun({break:1})], spacing:{after:0, before:0}})); break;
                        case 'PRE':
                            const codeEl = node.querySelector('code');
                            const rawCode = codeEl ? (codeEl.dataset.code || codeEl.innerText) : node.innerText;
                            elements.push(new Paragraph({
                                children: [new TextRun({ text: "--- CODE BLOCK ---", bold: true, font: "Consolas", size: 20 })], // size in half-points
                                spacing: { before: 150, after: 50 },
                                shading: { type: ShadingType.SOLID, color: "F0F0F0", fill: "F0F0F0" },
                            }));
                            rawCode.trim().split('\n').forEach(line => {
                                elements.push(new Paragraph({
                                    children: [new TextRun({ text: line, font: "Courier New", size: 18 })],
                                    indentation: { left: convertInchesToTwip(0.2) }, // Basic indent for code
                                    spacing: { after: 0, line: 200 }, // Tighter line spacing
                                    shading: { type: ShadingType.SOLID, color: "F0F0F0", fill: "F0F0F0" }
                                }));
                            });
                            elements.push(new Paragraph({
                                children: [new TextRun({ text: "--- END CODE BLOCK ---", bold: true, font: "Consolas", size: 20 })],
                                spacing: { before: 50, after: 150 },
                                shading: { type: ShadingType.SOLID, color: "F0F0F0", fill: "F0F0F0" },
                            }));
                            break;
                        case 'UL': case 'OL':
                            let itemCounter = 0;
                            Array.from(node.children).filter(child => child.tagName === 'LI').forEach(li => {
                                itemCounter++;
                                const liContentRuns = [];
                                Array.from(li.childNodes).forEach(child => liContentRuns.push(...processHtmlNodeToDocx(child, newTextProps, {level: listInfo.level + 1, type: tagName, counter: itemCounter })));
                                
                                elements.push(new Paragraph({ 
                                    children: liContentRuns, 
                                    numbering: { reference: tagName === 'OL' ? "default-numbering" : "default-bullet", level: listInfo.level },
                                    spacing: {after: 50}
                                }));
                            });
                            break;
                        case 'TABLE':
                            const tableRows = [];
                            Array.from(node.querySelectorAll('tr')).forEach(trNode => {
                                const tableCells = [];
                                Array.from(trNode.querySelectorAll('th, td')).forEach(tdNode => {
                                    const cellParagraphs = [];
                                    Array.from(tdNode.childNodes).forEach(child => cellParagraphs.push(...processHtmlNodeToDocx(child, {size:18})));
                                    
                                    tableCells.push(new TableCell({ 
                                        children: cellParagraphs.length > 0 ? cellParagraphs : [new Paragraph("")], 
                                        borders: {
                                            top: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" }, 
                                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" },
                                            left: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" },
                                            right: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" },
                                        },
                                        shading: tdNode.tagName === 'TH' ? {type: ShadingType.SOLID, color: "E0E0E0", fill: "E0E0E0"} : undefined,
                                    }));
                                });
                                if(tableCells.length > 0) tableRows.push(new TableRow({ children: tableCells }));
                            });
                            if (tableRows.length > 0) {
                                 elements.push(new Table({ rows: tableRows, width: { size: 90, type: WidthType.PERCENT }, alignment: AlignmentType.CENTER }));
                            }
                            break;
                    }
                } else { // Inline-level elements modify currentTextProps and recurse
                    if (tagName === 'STRONG' || tagName === 'B') newTextProps.bold = true;
                    else if (tagName === 'EM' || tagName === 'I') newTextProps.italics = true;
                    else if (tagName === 'CODE' && !node.closest('PRE')) {
                        newTextProps.font = "Courier New";
                        newTextProps.size = (currentTextProps.size || 22) * 0.9; 
                    }
                    
                    if (node.childNodes && node.childNodes.length > 0 && !node.classList.contains('message-controls')) {
                        Array.from(node.childNodes).forEach(child => {
                            elements.push(...processHtmlNodeToDocx(child, newTextProps, listInfo));
                        });
                    } else if (node.textContent.trim() && !['BR', 'PRE', 'UL', 'OL', 'TABLE', 'DIV', 'P', 'LI'].includes(tagName)) {
                         if(node.textContent.trim().length > 0) elements.push(new TextRun({ text: node.textContent.trim(), ...newTextProps }));
                    }
                }
            }
            return elements; 
        }
        
        Array.from(bubbleElement.childNodes).forEach(childNode => {
            docChildren.push(...processHtmlNodeToDocx(childNode));
        });

        const finalDocChildren = docChildren.reduce((acc, curr) => {
            if (curr instanceof Paragraph) {
                // Ensure children of Paragraph are actual TextRun instances, not nested arrays
                let flatChildren = [];
                function flatten(arr) {
                    arr.forEach(item => {
                        if (Array.isArray(item)) flatten(item);
                        else if (item instanceof TextRun) flatChildren.push(item);
                        // If item is a Paragraph (e.g. from nested DIV), it should have been handled by processHtmlNodeToDocx to be a top-level element
                    });
                }
                flatten(curr.options.children);
                
                // Filter out TextRuns that are solely whitespace
                curr.options.children = flatChildren.filter(run => run instanceof TextRun && run.options.text.trim() !== "");

                if (curr.options.children.length > 0) acc.push(curr);
            } else {
                acc.push(curr); 
            }
            return acc;
        }, []);


        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: { orientation: PageOrientation.PORTRAIT, width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                        margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) },
                    }
                },
                children: finalDocChildren,
            }],
            numbering: { // Define numbering schemes
                config: [
                    { // For Ordered Lists (OL)
                        reference: "default-numbering",
                        levels: [
                            { level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }}}},
                            { level: 1, format: "lowerLetter", text: "%2)", alignment: AlignmentType.START, style: { paragraph: { indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.25) }}}},
                            { level: 2, format: "lowerRoman", text: "%3.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) }}}},
                        ]
                    },
                    { // For Unordered Lists (UL)
                        reference: "default-bullet",
                        levels: [
                             { level: 0, format: "bullet", text: "•", alignment: AlignmentType.START, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }}}},
                             { level: 1, format: "bullet", text: "◦", alignment: AlignmentType.START, style: { paragraph: { indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.25) }}}},
                             { level: 2, format: "bullet", text: "▪", alignment: AlignmentType.START, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) }}}},
                        ]
                    }
                ]
            },
             styles: { // Define default document and paragraph styles
                default: {
                    document: { run: { size: 22, font: "Calibri" } }, // Default 11pt Calibri
                    paragraph: { spacing: { after: 120, line: 276 } }, // Default spacing after paragraphs (6pt), line spacing 1.15
                },
             }
        });

        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseFilename}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if(downloadFormatStatus) downloadFormatStatus.textContent = 'Téléchargement DOCX terminé !';
            return Promise.resolve();
        }).catch(err => {
            console.error("Error packing DOCX:", err);
            if(downloadFormatStatus) downloadFormatStatus.textContent = 'Erreur de génération DOCX.';
            return Promise.reject(err);
        });
    }

    // --- END Download Format Modal Logic ---


    function formatActivityUrl(url) {
        if (!url) return 'N/A';
        try {
            const currentOrigin = window.location.origin;
            if (url.startsWith(currentOrigin)) {
                const path = url.substring(currentOrigin.length);
                return `Site: ${escapeHTML(path || '/')}`;
            } else {
                const urlObj = new URL(url);
                return `External: ${escapeHTML(urlObj.hostname)}`;
            }
        } catch (e) {
            // If URL parsing fails, return the escaped original URL (truncated if too long)
            const maxLength = 50;
            return escapeHTML(url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url);
        }
    }

    // --- VIP AREA LOGIC (REMOVED) ---
    // const vipAccessArea = document.getElementById('vip-access-area'); // Element will be removed from HTML
    // const vipCodeInput = document.getElementById('vip-code-input');
    // const vipCodeSubmit = document.getElementById('vip-code-submit');
    // const vipStatusMessage = document.getElementById('vip-status-message');
    // const vipIframeContainer = document.getElementById('vip-iframe-container'); // Element will be removed

    // function handleVipAccess() { ... } // REMOVED
    // function checkInitialVipStatus() { ... } // REMOVED
    // Event listeners for vipCodeSubmit and vipCodeInput also removed as elements will be gone.
    // --- END OF VIP AREA LOGIC ---


    // --- PREMIUM AI TOOLS (VIP SECTION) LOGIC ---
    // This section might be removed if vip-tools-container is fully removed from HTML
    // For now, keeping it but it might not be reachable if the iframe takes over the VIP view.
    const vipAiTools = [
        { name: 'gemini', inputId: 'gemini-input', buttonId: 'gemini-send-btn', responseId: 'gemini-response' },
        { name: 'claude-haiku', inputId: 'claude-haiku-input', buttonId: 'claude-haiku-send-btn', responseId: 'claude-haiku-response' },
        { name: 'deepseek', inputId: 'deepseek-input', buttonId: 'deepseek-send-btn', responseId: 'deepseek-response' },
        { name: 'rtm-ai', inputId: 'rtm-ai-input', buttonId: 'rtm-ai-send-btn', responseId: 'rtm-ai-response' }
    ];
    async function handleVipAiRequest(aiName, inputEl, responseEl, buttonEl) {
        // ... (rest of the function remains the same, but consider if it's needed)
    }
    vipAiTools.forEach(tool => {
        // ... (event listeners remain the same, but consider if needed)
    });
    // --- END OF PREMIUM AI TOOLS (VIP SECTION) LOGIC ---

    // --- VIP FILE READER TOOL LOGIC ---
    // This section also might be removed/unreachable.
    const fileReaderInput = document.getElementById('file-reader-input');
    // ... (rest of file reader logic, consider if needed)
    // --- END OF VIP FILE READER TOOL LOGIC ---

    // --- Helper function to escape HTML for security ---
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    }

    // --- Admin Panel Logic ---
    async function loadAdminAnalytics() {
        const summaryDiv = document.getElementById('admin-analytics-summary');
        const recentActivitiesDiv = document.getElementById('admin-recent-activities');
        if (!summaryDiv || !recentActivitiesDiv) {
            console.warn("Analytics display elements not found.");
            return;
        }
        summaryDiv.innerHTML = '<p>Loading analytics...</p>';
        recentActivitiesDiv.innerHTML = '<p>Loading recent activities...</p>';
        try {
            const response = await fetch('/api/activities?limit=15');
            if (!response.ok) {
                const errData = await response.json().catch(()=>null);
                throw new Error(errData?.error || `Failed to fetch analytics: ${response.statusText}`);
            }
            const data = await response.json();
            summaryDiv.innerHTML = `
                <p><strong>Total Unique Visitors:</strong> ${data.uniqueVisitors !== undefined ? data.uniqueVisitors : 'N/A'}</p>
                <p><strong>Total Tracked Activities:</strong> ${data.totalActivities}</p>
            `;
            if (data.activities && data.activities.length > 0) {
                let activitiesHTML = '<ul>';
                data.activities.forEach(activity => {
                    activitiesHTML += `
                        <li>
                            <strong>${escapeHTML(activity.activityType)}</strong> by user <span class="activity-uid">${escapeHTML(activity.uid.slice(0,8))}...</span>
                            <br><span class="activity-details">Details: ${escapeHTML(JSON.stringify(activity.details))}</span>
                            <br><span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                            <br><span class="activity-url-styled">Source: ${formatActivityUrl(activity.url)}</span>
                        </li>`;
                });
                activitiesHTML += '</ul>';
                recentActivitiesDiv.innerHTML = activitiesHTML;
            } else {
                recentActivitiesDiv.innerHTML = '<p>No recent activities found.</p>';
            }
        } catch (error) {
            console.error('Error loading admin analytics:', error);
            if(summaryDiv) summaryDiv.innerHTML = `<p class="error-message">Error loading summary: ${error.message}</p>`;
            if(recentActivitiesDiv) recentActivitiesDiv.innerHTML = `<p class="error-message">Error loading activities: ${error.message}</p>`;
        }
    }

    async function loadAdminComments() {
        const adminCommentsList = document.getElementById('admin-comments-list');
        if (!adminCommentsList) return;
        adminCommentsList.innerHTML = '<p>Loading comments...</p>';
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || `Failed to fetch comments: ${response.statusText}`);
            }
            const comments = await response.json();
            if (comments.length === 0) {
                adminCommentsList.innerHTML = '<p>No comments to display.</p>';
                return;
            }
            adminCommentsList.innerHTML = '';
            comments.forEach(comment => {
                const item = document.createElement('div');
                item.className = 'admin-comment-item';
                item.dataset.commentId = comment._id;
                const replyTimestamp = comment.adminReplyTimestamp ? new Date(comment.adminReplyTimestamp).toLocaleString() : '';
                const existingReplyText = comment.adminReplyText || '';
                item.innerHTML = `
                    <div class="comment-header">
                        <strong>${escapeHTML(comment.name)}</strong> -
                        <span class="comment-timestamp">${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="comment-text-admin">${escapeHTML(comment.text)}</p>
                    <div class="admin-reply-display">
                        ${existingReplyText ? `<p class="admin-reply-text"><strong>Admin Reply (${replyTimestamp}):</strong> ${escapeHTML(existingReplyText)}</p>` : '<p>No admin reply yet.</p>'}
                    </div>
                    <div class="admin-actions">
                        <textarea class="admin-reply-input" placeholder="Type your reply...">${escapeHTML(existingReplyText)}</textarea>
                        <button class="btn-admin-reply icon-button" title="Save Reply">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M21 3H3c-1.11 0-2 .89-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 16H5V7h14v12zm-2-7H7v-2h10v2z"></path></svg>
                        </button>
                        <button class="btn-admin-delete icon-button" title="Delete Comment">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </button>
                    </div>
                    <hr>
                `;
                adminCommentsList.appendChild(item);
                item.querySelector('.btn-admin-reply').addEventListener('click', async () => {
                    const replyInput = item.querySelector('.admin-reply-input');
                    const replyText = replyInput.value;
                    try {
                        const replyResponse = await fetch(`/api/comments/${comment._id}/reply`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ replyText: replyText })
                        });
                        if (!replyResponse.ok) {
                            const errData = await replyResponse.json().catch(()=>null);
                            throw new Error(errData?.error || `Failed to save reply: ${replyResponse.statusText}`);
                        }
                        loadAdminComments();
                    } catch (err) {
                        console.error('Error saving reply:', err);
                        alert(`Error saving reply: ${err.message}`);
                    }
                });
                item.querySelector('.btn-admin-delete').addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
                        return;
                    }
                    try {
                        const deleteResponse = await fetch(`/api/comments/${comment._id}`, { method: 'DELETE' });
                        if (!deleteResponse.ok) {
                             const errData = await deleteResponse.json().catch(()=>null);
                            throw new Error(errData?.error || `Failed to delete comment: ${deleteResponse.statusText}`);
                        }
                        loadAdminComments();
                    } catch (err) {
                        console.error('Error deleting comment:', err);
                        alert(`Error deleting comment: ${err.message}`);
                    }
                });
            });
        } catch (error) {
            console.error('Failed to load admin comments:', error);
            adminCommentsList.innerHTML = `<p class="weather-error">Error loading comments: ${error.message}</p>`;
        }
    }

    const adminPanel = document.getElementById('admin-panel-view');
    if (adminPanel) {
        const tabButtons = adminPanel.querySelectorAll('.admin-tab-button');
        const tabContents = adminPanel.querySelectorAll('.admin-tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const tabId = button.dataset.tab;
                tabContents.forEach(content => {
                    if (content.id === tabId + '-tab') {
                        content.classList.add('active');
                        if (tabId === 'analytics-admin' && typeof loadAdminAnalytics === 'function') {
                            loadAdminAnalytics();
                        }
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
    }

    const adminLoginTrigger = document.getElementById('admin-login-trigger-icon');
    if (adminLoginTrigger) {
        adminLoginTrigger.addEventListener('click', () => {
            window.showView('admin-panel-view'); // This will now use the updated showView with the prompt
        });
    }

    async function loadUserActivityHistory() {
        const activityListContainer = document.getElementById('user-activity-list-container');
        if (!activityListContainer) {
            console.error("User activity list container not found.");
            return;
        }
        if (!chatUID) {
            activityListContainer.innerHTML = '<p>User ID not found. Cannot load history.</p>';
            return;
        }
        activityListContainer.innerHTML = '<p>Loading your activity...</p>';
        try {
            const response = await fetch(`/api/activities?uid=${encodeURIComponent(chatUID)}&limit=100`);
            if (!response.ok) {
                const errData = await response.json().catch(()=>null);
                throw new Error(errData?.error || `Failed to fetch your activity: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.activities && data.activities.length > 0) {
                let activitiesHTML = '<ul>';
                data.activities.forEach(activity => {
                    let detailsStr = '';
                    if (activity.details && typeof activity.details === 'object' && Object.keys(activity.details).length > 0) {
                        detailsStr = Object.entries(activity.details)
                                         .map(([key, value]) => `${escapeHTML(key)}: ${escapeHTML(String(value))}`)
                                         .join(', ');
                        detailsStr = ` (${detailsStr})`;
                    } else if (activity.details && typeof activity.details === 'string' && activity.details.trim() !== '') {
                        detailsStr = ` (${escapeHTML(activity.details)})`;
                    }
                    activitiesHTML += `
                        <li>
                            <span class="user-activity-type">${escapeHTML(activity.activityType.replace(/_/g, ' '))}</span>
                            <span class="user-activity-details">${detailsStr}</span>
                            <div class="user-activity-meta">
                                <span class="user-activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                                <span class="user-activity-url">on ${escapeHTML(activity.url.replace(window.location.origin, '')) || '/'}</span>
                            </div>
                        </li>`;
                });
                activitiesHTML += '</ul>';
                activityListContainer.innerHTML = activitiesHTML;
            } else {
                activityListContainer.innerHTML = '<p>No activities recorded for you yet.</p>';
            }
        } catch (error) {
            console.error('Error loading user activity history:', error);
            activityListContainer.innerHTML = `<p class="error-message">Could not load your activity: ${error.message}</p>`;
        }
    }

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('login-name').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    window.showView('home-view');
                    document.getElementById('logout-button').style.display = 'block';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login.');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const password = document.getElementById('signup-password').value;

            try {
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, password })
                });
                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    window.showView('login-view');
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('An error occurred during signup.');
            }
        });
    }

    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            window.showView('signup-view');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            window.showView('login-view');
        });
    }

    async function loadAdminUsers() {
        const adminUsersList = document.getElementById('admin-users-list');
        if (!adminUsersList) return;
        adminUsersList.innerHTML = '<p>Loading users...</p>';
        try {
            const adminCode = prompt('Enter admin code:');
            const response = await fetch('/api/admin/users', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminCode })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || `Failed to fetch users: ${response.statusText}`);
            }
            const users = await response.json();
            if (users.length === 0) {
                adminUsersList.innerHTML = '<p>No users to display.</p>';
                return;
            }
            adminUsersList.innerHTML = '';
            users.forEach(user => {
                const item = document.createElement('div');
                item.className = 'admin-user-item';
                item.dataset.userId = user._id;
                item.innerHTML = `
                    <div>
                        <strong>${escapeHTML(user.name)}</strong>
                        <br>
                        <span>Approved: ${user.approved}</span> | <span>Active: ${user.active}</span>
                    </div>
                    <div>
                        <button class="btn-admin-approve" ${user.approved ? 'disabled' : ''}>Approve</button>
                        <button class="btn-admin-toggle-active">${user.active ? 'Deactivate' : 'Activate'}</button>
                        <button class="btn-admin-delete">Delete</button>
                    </div>
                `;
                adminUsersList.appendChild(item);

                item.querySelector('.btn-admin-approve').addEventListener('click', () => approveUser(user._id));
                item.querySelector('.btn-admin-toggle-active').addEventListener('click', () => toggleUserActive(user._id));
                item.querySelector('.btn-admin-delete').addEventListener('click', () => deleteUser(user._id));
            });
        } catch (error) {
            console.error('Failed to load admin users:', error);
            adminUsersList.innerHTML = `<p class="error-message">Error loading users: ${error.message}</p>`;
        }
    }

    async function approveUser(userId) {
        try {
            const adminCode = prompt('Enter admin code:');
            const response = await fetch(`/api/admin/users/${userId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminCode })
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                loadAdminUsers();
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('An error occurred while approving the user.');
        }
    }

    async function toggleUserActive(userId) {
        try {
            const adminCode = prompt('Enter admin code:');
            const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminCode })
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                loadAdminUsers();
            }
        } catch (error) {
            console.error('Error toggling user active state:', error);
            alert('An error occurred while toggling the user active state.');
        }
    }

    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            const adminCode = prompt('Enter admin code:');
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminCode })
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                loadAdminUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('An error occurred while deleting the user.');
        }
    }

    const originalShowView = window.showView;
    window.showView = function(viewIdToShow, bypassAdminCheck = false) {
        originalShowView(viewIdToShow, bypassAdminCheck);
        if (viewIdToShow === 'admin-panel-view') {
            const usersTabButton = document.querySelector('.admin-tab-button[data-tab="users-admin"]');
            if (usersTabButton) {
                usersTabButton.classList.add('active');
            }
            const usersTabContent = document.getElementById('users-admin-tab');
            if (usersTabContent) {
                usersTabContent.classList.add('active');
            }
            loadAdminUsers();
        }
    };

    const token = localStorage.getItem('token');
    if (token) {
        window.showView('home-view');
        document.getElementById('logout-button').style.display = 'block';
    } else {
        window.showView('login-view');
    }
});
