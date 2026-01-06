// Casspr Side Panel Controller

class CassprSidePanel {
  constructor() {
    this.state = {
      isEnabled: true,
      provider: 'openai',
      apiKey: '',
      expertise: [],
      style: 'casual',
      tone: 50,
      length: 'medium',
      includeEmojis: false,
      addHashtags: false
    };

    this.currentTweet = null;
    this.isGenerating = false;

    this.init();
  }

  async init() {
    await this.loadState();
    this.bindEvents();
    this.updateUI();
    this.listenForMessages();
    this.listenForStorageChanges();
  }

  // Listen for storage changes to keep in sync with popup settings
  listenForStorageChanges() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.cassprState) {
        const newState = changes.cassprState.newValue;
        if (newState) {
          this.state = { ...this.state, ...newState };
          this.updateUI();
        }
      }
    });
  }

  async loadState() {
    try {
      const stored = await chrome.storage.local.get('cassprState');
      if (stored.cassprState) {
        this.state = { ...this.state, ...stored.cassprState };
      }
    } catch (error) {
      console.error('[Casspr] Failed to load state:', error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({ cassprState: this.state });
    } catch (error) {
      console.error('[Casspr] Failed to save state:', error);
    }
  }

  bindEvents() {
    // Generate button
    document.getElementById('generateBtn')?.addEventListener('click', () => {
      this.generateFromRoughInput();
    });

    // Regenerate button
    document.getElementById('regenerateBtn')?.addEventListener('click', () => {
      if (this.currentTweet && !this.isGenerating) {
        this.generateSuggestions();
      }
    });

    // Rough input enter key
    document.getElementById('roughInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.generateFromRoughInput();
      }
    });

    // Settings toggle
    document.getElementById('openSettings')?.addEventListener('click', () => {
      this.showSettings();
    });

    document.getElementById('closeSettings')?.addEventListener('click', () => {
      this.hideSettings();
    });

    // Settings changes
    document.getElementById('providerSelect')?.addEventListener('change', async (e) => {
      this.state.provider = e.target.value;
      await this.saveState();
    });

    document.getElementById('styleSelect')?.addEventListener('change', async (e) => {
      this.state.style = e.target.value;
      await this.saveState();
    });

    document.getElementById('toneSlider')?.addEventListener('input', async (e) => {
      this.state.tone = parseInt(e.target.value);
      await this.saveState();
    });

    // Length buttons
    document.querySelectorAll('.btn-option[data-length]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        document.querySelectorAll('.btn-option[data-length]').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        this.state.length = e.target.dataset.length;
        await this.saveState();
      });
    });

    document.getElementById('includeEmojis')?.addEventListener('change', async (e) => {
      this.state.includeEmojis = e.target.checked;
      await this.saveState();
    });

    document.getElementById('addHashtags')?.addEventListener('change', async (e) => {
      this.state.addHashtags = e.target.checked;
      await this.saveState();
    });

    // Edit API key
    document.getElementById('editApiKey')?.addEventListener('click', () => {
      const input = document.getElementById('apiKeyInput');
      if (input) {
        input.readOnly = false;
        input.type = 'text';
        input.value = this.state.apiKey;
        input.focus();
        input.select();

        const saveKey = async () => {
          const newKey = input.value.trim();
          if (newKey) {
            this.state.apiKey = newKey;
            await this.saveState();
          }
          input.readOnly = true;
          input.type = 'password';
          this.updateUI();
          input.removeEventListener('blur', saveKey);
          input.removeEventListener('keydown', handleKeydown);
        };

        const handleKeydown = (e) => {
          if (e.key === 'Enter') saveKey();
          if (e.key === 'Escape') {
            input.readOnly = true;
            input.type = 'password';
            this.updateUI();
          }
        };

        input.addEventListener('blur', saveKey);
        input.addEventListener('keydown', handleKeydown);
      }
    });
  }

  listenForMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TWEET_SELECTED') {
        this.currentTweet = message.tweet;
        this.updateTweetContext();
        // Show loading - content script already triggered generation
        this.isGenerating = true;
        this.showLoading();
      }
      if (message.type === 'SUGGESTIONS_READY') {
        this.displaySuggestions(message.suggestions);
      }
      return true;
    });
  }

  generateFromRoughInput() {
    const roughInput = document.getElementById('roughInput')?.value.trim();
    if (!this.currentTweet && !roughInput) {
      this.showEmptyState();
      return;
    }
    this.generateSuggestions(roughInput);
  }

  generateSuggestions(roughInput = '') {
    if (!this.state.apiKey) {
      alert('Please configure your API key in settings.');
      this.showSettings();
      return;
    }

    if (!this.currentTweet && !roughInput) {
      this.showEmptyState();
      return;
    }

    this.isGenerating = true;
    this.showLoading();

    // Send to service worker - it will broadcast suggestions back
    chrome.runtime.sendMessage({
      type: 'GENERATE_SUGGESTIONS',
      tweet: this.currentTweet || { text: roughInput, author: 'You', handle: 'you' },
      config: {
        provider: this.state.provider,
        apiKey: this.state.apiKey,
        expertise: this.state.expertise || [],
        style: this.state.style,
        tone: this.state.tone,
        length: this.state.length,
        includeEmojis: this.state.includeEmojis,
        addHashtags: this.state.addHashtags,
        roughInput: roughInput
      }
    });
  }

  displaySuggestions(suggestions) {
    this.isGenerating = false;
    this.hideLoading();

    const listEl = document.getElementById('suggestionsList');
    const emptyEl = document.getElementById('emptyState');

    if (!suggestions || suggestions.length === 0) {
      if (listEl) listEl.innerHTML = '';
      if (emptyEl) {
        emptyEl.classList.remove('hidden');
        emptyEl.querySelector('p').textContent = 'Could not generate suggestions. Check your API key.';
      }
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    if (listEl) {
      listEl.innerHTML = suggestions.map((text, i) => `
        <div class="suggestion-item" data-index="${i}">
          <p class="suggestion-text">${this.escapeHtml(text)}</p>
          <div class="suggestion-actions">
            <button class="btn-action btn-copy" data-text="${this.escapeAttr(text)}" title="Copy">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="btn-action btn-use" data-text="${this.escapeAttr(text)}" title="Use">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      // Bind events
      listEl.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', async () => {
          await navigator.clipboard.writeText(btn.dataset.text);
          btn.classList.add('success');
          setTimeout(() => btn.classList.remove('success'), 2000);
        });
      });

      listEl.querySelectorAll('.btn-use').forEach(btn => {
        btn.addEventListener('click', () => {
          this.insertIntoComposer(btn.dataset.text);
        });
      });
    }
  }

  async insertIntoComposer(text) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'INSERT_TEXT', text });
    }
  }

  updateTweetContext() {
    const contextEl = document.getElementById('tweetContext');
    const authorEl = document.querySelector('.tweet-author');
    const textEl = document.querySelector('.tweet-text');
    const emptyEl = document.getElementById('emptyState');

    if (this.currentTweet) {
      if (authorEl) authorEl.textContent = `@${this.currentTweet.handle || 'username'}`;
      if (textEl) textEl.textContent = this.currentTweet.text || 'No tweet text';
      if (contextEl) {
        contextEl.style.display = 'block';
        contextEl.classList.add('has-tweet');
      }
      // Hide empty state when we have a tweet
      if (emptyEl) emptyEl.classList.add('hidden');
    } else {
      if (authorEl) authorEl.textContent = '@username';
      if (textEl) textEl.textContent = 'Select a tweet to reply...';
      if (contextEl) {
        contextEl.classList.remove('has-tweet');
      }
      // Show empty state when no tweet
      if (emptyEl) emptyEl.classList.remove('hidden');
    }
  }

  updateUI() {
    // Update settings values
    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) providerSelect.value = this.state.provider;

    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
      apiKeyInput.value = this.state.apiKey
        ? '••••••••' + this.state.apiKey.slice(-4)
        : '';
    }

    const styleSelect = document.getElementById('styleSelect');
    if (styleSelect) styleSelect.value = this.state.style;

    const toneSlider = document.getElementById('toneSlider');
    if (toneSlider) toneSlider.value = this.state.tone;

    // Length buttons
    document.querySelectorAll('.btn-option[data-length]').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.length === this.state.length);
    });

    const emojisCheckbox = document.getElementById('includeEmojis');
    if (emojisCheckbox) emojisCheckbox.checked = this.state.includeEmojis;

    const hashtagsCheckbox = document.getElementById('addHashtags');
    if (hashtagsCheckbox) hashtagsCheckbox.checked = this.state.addHashtags;

    // Status indicator
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot && statusText) {
      if (this.state.isEnabled && this.state.apiKey) {
        statusDot.classList.remove('inactive');
        statusText.textContent = 'Active';
      } else {
        statusDot.classList.add('inactive');
        statusText.textContent = this.state.apiKey ? 'Paused' : 'Setup needed';
      }
    }
  }

  showLoading() {
    const loadingEl = document.getElementById('loading');
    const emptyEl = document.getElementById('emptyState');
    const listEl = document.getElementById('suggestionsList');

    if (loadingEl) loadingEl.classList.add('active');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (listEl) listEl.innerHTML = '';
  }

  hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.classList.remove('active');
  }

  showEmptyState() {
    const emptyEl = document.getElementById('emptyState');
    if (emptyEl) {
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('p').textContent = 'Click reply on a tweet to get AI suggestions';
    }
  }

  showSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.classList.remove('hidden');
      requestAnimationFrame(() => panel.classList.add('visible'));
    }
  }

  hideSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.classList.remove('visible');
      setTimeout(() => panel.classList.add('hidden'), 200);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new CassprSidePanel();
});
