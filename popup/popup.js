/**
 * Popup Script for YouTube Chat Extension
 * Manages extension settings and configuration
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Element references
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const connectionStatus = document.getElementById('connectionStatus');
  const languageSelect = document.getElementById('language');
  const themeSelect = document.getElementById('theme');
  const clearAllBtn = document.getElementById('clearAllChats');
  const exportAllBtn = document.getElementById('exportAllChats');

  // Load current settings
  await loadSettings();
  
  // Check context and update UI
  await updateUIBasedOnContext();

  // Event listeners
  saveApiKeyBtn.addEventListener('click', saveApiKey);
  languageSelect.addEventListener('change', saveSettings);
  themeSelect.addEventListener('change', saveSettings);
  clearAllBtn.addEventListener('click', clearAllChats);
  exportAllBtn.addEventListener('click', exportAllChats);

  // Load settings from storage
  async function loadSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    const localResult = await chrome.storage.local.get(['apiKey']);
    
    const settings = result.settings || {
      language: 'en',
      theme: 'auto'
    };
    
    // Set values in UI
    languageSelect.value = settings.language;
    themeSelect.value = settings.theme;
    
    // Check if API key exists
    if (localResult.apiKey) {
      apiKeyInput.value = '••••••••••••••••••••••••';
      checkConnection(localResult.apiKey);
    } else {
      updateConnectionStatus('not-configured', 'Not configured');
    }
  }

  // Save API key
  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    // Don't save if it's the placeholder
    if (!apiKey || apiKey === '••••••••••••••••••••••••') {
      showMessage('Please enter a valid API key', 'error');
      return;
    }
    
    saveApiKeyBtn.disabled = true;
    saveApiKeyBtn.textContent = 'Saving...';
    
    try {
      // Test the API key first
      const isValid = await testApiKey(apiKey);
      
      if (isValid) {
        // Save to storage
        await chrome.storage.local.set({ apiKey });
        
        // Initialize Gemini client in background
        await chrome.runtime.sendMessage({
          action: 'initializeGemini',
          apiKey: apiKey
        });
        
        showMessage('API key saved successfully!', 'success');
        updateConnectionStatus('connected', 'Connected');
        
        // Replace input with placeholder
        apiKeyInput.value = '••••••••••••••••••••••••';
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
      updateConnectionStatus('error', 'Invalid key');
    } finally {
      saveApiKeyBtn.disabled = false;
      saveApiKeyBtn.textContent = 'Save';
    }
  }

  // Test API key validity
  async function testApiKey(apiKey) {
    try {
      // First, let's try to list available models to test the key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.error('API test response:', response.status, response.statusText);
        return false;
      }
      
      // If that works, try a simple generation
      const genResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: 'Hi' }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10
            }
          })
        }
      );
      
      return genResponse.ok;
    } catch (error) {
      console.error('API test error:', error);
      // Show more detailed error
      if (error.message) {
        showMessage(`Connection error: ${error.message}`, 'error');
      }
      return false;
    }
  }

  // Check connection status
  async function checkConnection(apiKey) {
    updateConnectionStatus('checking', 'Checking...');
    
    const isValid = await testApiKey(apiKey);
    if (isValid) {
      updateConnectionStatus('connected', 'Connected');
    } else {
      updateConnectionStatus('error', 'Connection failed');
    }
  }

  // Update connection status UI
  function updateConnectionStatus(status, text) {
    connectionStatus.textContent = text;
    connectionStatus.className = status;
  }

  // Save general settings
  async function saveSettings() {
    const settings = {
      language: languageSelect.value,
      theme: themeSelect.value,
      modelName: 'models/gemini-2.5-flash-preview-05-20'
    };
    
    await chrome.storage.sync.set({ settings });
    showMessage('Settings saved', 'success');
  }

  // Clear all chats
  async function clearAllChats() {
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      return;
    }
    
    try {
      // Get all keys that start with 'chat_'
      const allData = await chrome.storage.local.get(null);
      const chatKeys = Object.keys(allData).filter(key => key.startsWith('chat_'));
      
      // Remove all chat keys
      await chrome.storage.local.remove(chatKeys);
      
      showMessage(`Cleared ${chatKeys.length} chat(s)`, 'success');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    }
  }

  // Export all chats
  async function exportAllChats() {
    try {
      // Get all chat data
      const allData = await chrome.storage.local.get(null);
      const chats = {};
      
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith('chat_')) {
          chats[key] = value;
        }
      }
      
      if (Object.keys(chats).length === 0) {
        showMessage('No chats to export', 'error');
        return;
      }
      
      // Create export data
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        chats: chats
      };
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-chat-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage(`Exported ${Object.keys(chats).length} chat(s)`, 'success');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    }
  }

  // Show message to user
  function showMessage(text, type) {
    // Remove existing message
    const existing = document.querySelector('.message');
    if (existing) {
      existing.remove();
    }
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type} visible`;
    message.textContent = text;
    
    // Insert after API key section
    const apiSection = document.querySelector('.settings-section');
    apiSection.appendChild(message);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      message.classList.remove('visible');
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

  // Check if on YouTube and show appropriate UI
  async function updateUIBasedOnContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isYouTube = tab?.url?.includes('youtube.com/watch');
      const localResult = await chrome.storage.local.get(['apiKey']);
      const hasApiKey = !!localResult.apiKey;
      
      const chatControlSection = document.getElementById('chatControlSection');
      const openChatBtn = document.getElementById('openChat');
      
      if (hasApiKey && isYouTube) {
        chatControlSection.style.display = 'block';
        
        // Add click listener only once
        if (!openChatBtn.hasAttribute('data-listener-added')) {
          openChatBtn.addEventListener('click', openChatAssistant);
          openChatBtn.setAttribute('data-listener-added', 'true');
        }
      } else if (!hasApiKey && isYouTube) {
        // Show helpful message in API section
        const helpText = document.querySelector('.help-text');
        if (helpText) {
          helpText.innerHTML = 'Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a> to start chatting!';
        }
      }
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }

  // Open chat assistant on current tab
  async function openChatAssistant() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.id) {
        // Send message to content script to open chat
        chrome.tabs.sendMessage(tab.id, { action: 'openChat' }, (response) => {
          // Check for errors
          if (chrome.runtime.lastError) {
            // Content script might not be loaded, try reloading the tab
            showMessage('Reloading page to activate chat...', 'info');
            chrome.tabs.reload(tab.id);
          } else {
            // Success - close popup
            window.close();
          }
        });
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      showMessage('Error opening chat', 'error');
    }
  }
});