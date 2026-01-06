// popup/popup.js
// Casspr Extension - Popup Controller

class CassprPopup {
  constructor() {
    this.state = {
      isConfigured: false,
      isEnabled: true,
      provider: 'openai',
      apiKey: '',
      apiKeyValid: null,
      expertise: [],
      style: 'casual',
      tone: 50,
      length: 'medium',
      autoShow: true,
      includeEmojis: false,
      addHashtags: false,
      useSidePanel: false,
      stats: {
        repliesGenerated: 0,
        tweetsAnalyzed: 0,
        lastReset: new Date().toDateString()
      }
    };

    this.init();
  }

  async init() {
    await this.loadState();
    this.bindEvents();
    this.render();
  }

  // Storage Methods
  async loadState() {
    try {
      const stored = await chrome.storage.local.get('cassprState');
      if (stored.cassprState) {
        this.state = { ...this.state, ...stored.cassprState };
      }
      // Check if we need to reset daily stats
      this.checkDailyReset();
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({ cassprState: this.state });
      // Notify content script of state change
      this.notifyContentScript();
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  async notifyContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && (tab.url?.includes('twitter.com') || tab.url?.includes('x.com') || tab.url?.includes('linkedin.com'))) {
        chrome.tabs.sendMessage(tab.id, { type: 'STATE_UPDATED', state: this.state }).catch(() => {});
      }
    } catch (error) {
      // Content script might not be loaded, that's okay
    }
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.state.stats.lastReset !== today) {
      this.state.stats = {
        repliesGenerated: 0,
        tweetsAnalyzed: 0,
        lastReset: today
      };
    }
  }

  // Event Binding
  bindEvents() {
    // Onboarding Step 1
    this.on('startSetup', 'click', () => this.showStep(2));

    // Provider selection (onboarding)
    this.onAll('.provider-btn', 'click', (e) => {
      this.selectProvider(e.currentTarget.dataset.provider);
    });

    // API Key (onboarding)
    this.on('saveApiKey', 'click', () => this.handleSaveApiKey());
    this.on('toggleKeyVisibility', 'click', () => this.toggleVisibility('apiKeyInput'));
    this.on('apiKeyInput', 'keypress', (e) => {
      if (e.key === 'Enter') this.handleSaveApiKey();
    });

    // Expertise tags
    this.onAll('#expertiseTags .tag', 'click', (e) => {
      e.currentTarget.classList.toggle('selected');
    });

    this.on('addCustomTag', 'click', () => this.addCustomTag());
    this.on('customTagInput', 'keypress', (e) => {
      if (e.key === 'Enter') this.addCustomTag();
    });

    this.on('continueToStyle', 'click', () => {
      this.updateExpertise();
      this.showStep(4);
    });

    // Style selection
    this.onAll('.style-btn', 'click', (e) => {
      this.selectButton('.style-btn', e.currentTarget, 'style');
    });

    // Tone slider
    this.on('toneSlider', 'input', (e) => {
      this.state.tone = parseInt(e.target.value);
    });

    // Length selection
    this.onAll('.length-btn', 'click', (e) => {
      this.selectButton('.length-btn', e.currentTarget, 'length');
    });

    // Complete setup
    this.on('completeSetup', 'click', async () => {
      this.state.isConfigured = true;
      await this.saveState();
      this.showView('dashboard');
      this.showToast('Setup complete! Casspr is ready.', 'success');
    });

    // Dashboard
    this.on('enableToggle', 'change', async (e) => {
      this.state.isEnabled = e.target.checked;
      await this.saveState();
      this.updateStatusIndicator();
    });

    this.on('openSettings', 'click', () => this.showView('settings'));

    // Quick settings chips
    this.on('currentStyle', 'click', () => this.showView('settings'));
    this.on('currentProvider', 'click', () => this.showView('settings'));

    // Settings
    this.on('backToDashboard', 'click', () => this.showView('dashboard'));

    this.on('providerSelect', 'change', async (e) => {
      this.state.provider = e.target.value;
      await this.saveState();
    });

    this.on('styleSelect', 'change', async (e) => {
      this.state.style = e.target.value;
      await this.saveState();
    });

    this.on('autoShowSuggestions', 'change', async (e) => {
      this.state.autoShow = e.target.checked;
      await this.saveState();
    });

    this.on('includeEmojis', 'change', async (e) => {
      this.state.includeEmojis = e.target.checked;
      await this.saveState();
    });

    this.on('addHashtags', 'change', async (e) => {
      this.state.addHashtags = e.target.checked;
      await this.saveState();
    });

    this.on('useSidePanel', 'change', async (e) => {
      this.state.useSidePanel = e.target.checked;
      await this.saveState();
      if (e.target.checked) {
        // Open side panel when enabled - get current window first
        try {
          const currentWindow = await chrome.windows.getCurrent();
          await chrome.runtime.sendMessage({
            type: 'OPEN_SIDE_PANEL',
            windowId: currentWindow.id
          }).catch(() => {});
        } catch (err) {
          // Service worker might not be ready, ignore
        }
      }
    });

    this.on('changeApiKey', 'click', () => this.showApiKeyModal());

    this.on('testApiKey', 'click', () => this.testApiKey());

    this.on('resetExtension', 'click', async () => {
      if (confirm('This will delete all your settings and data. Are you sure?')) {
        await chrome.storage.local.clear();
        window.location.reload();
      }
    });

    // API Key Modal
    this.on('cancelApiKey', 'click', () => this.hideApiKeyModal());
    this.on('saveNewApiKey', 'click', () => this.handleUpdateApiKey());
    this.on('toggleNewKeyVisibility', 'click', () => this.toggleVisibility('newApiKeyInput'));
    this.on('newApiKeyInput', 'keypress', (e) => {
      if (e.key === 'Enter') this.handleUpdateApiKey();
    });

    // Close modal on overlay click
    this.on('apiKeyModal', 'click', (e) => {
      if (e.target.id === 'apiKeyModal') this.hideApiKeyModal();
    });
  }

  // Helper methods for event binding
  on(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  onAll(selector, event, handler) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener(event, handler);
    });
  }

  // UI Methods
  showStep(step) {
    document.querySelectorAll('.onboarding-step').forEach(el => {
      el.classList.add('hidden');
    });
    const stepEl = document.querySelector(`.onboarding-step[data-step="${step}"]`);
    if (stepEl) {
      stepEl.classList.remove('hidden');
    }
  }

  showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const view = document.getElementById(viewId);
    if (view) {
      view.classList.remove('hidden');
    }

    // Update view-specific content
    if (viewId === 'dashboard') {
      this.updateDashboard();
    } else if (viewId === 'settings') {
      this.updateSettings();
    }
  }

  selectProvider(provider) {
    document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.provider-btn[data-provider="${provider}"]`)?.classList.add('selected');
    this.state.provider = provider;
  }

  selectButton(selector, target, stateKey) {
    document.querySelectorAll(selector).forEach(b => b.classList.remove('selected'));
    target.classList.add('selected');
    this.state[stateKey] = target.dataset[stateKey];
  }

  toggleVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input?.nextElementSibling;
    if (input && button) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.querySelector('.eye-open')?.classList.toggle('hidden', !isPassword);
      button.querySelector('.eye-closed')?.classList.toggle('hidden', isPassword);
    }
  }

  // API Key Handling
  handleSaveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input?.value.trim();

    if (!key) {
      this.showToast('Please enter an API key', 'error');
      return;
    }

    if (!this.validateApiKey(key)) {
      this.showToast('Invalid API key format', 'error');
      return;
    }

    this.state.apiKey = key;
    this.showStep(3);
  }

  validateApiKey(key) {
    // Basic validation for common API key formats
    if (this.state.provider === 'openai') {
      return key.startsWith('sk-') && key.length > 20;
    } else if (this.state.provider === 'anthropic') {
      return key.startsWith('sk-ant-') && key.length > 20;
    } else if (this.state.provider === 'groq') {
      return key.startsWith('gsk_') && key.length > 20;
    }
    return key.length > 10;
  }

  showApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    const input = document.getElementById('newApiKeyInput');
    if (modal && input) {
      input.value = '';
      input.type = 'password';
      modal.classList.remove('hidden');
      input.focus();
    }
  }

  hideApiKeyModal() {
    document.getElementById('apiKeyModal')?.classList.add('hidden');
  }

  async handleUpdateApiKey() {
    const input = document.getElementById('newApiKeyInput');
    const key = input?.value.trim();

    if (!key) {
      this.showToast('Please enter an API key', 'error');
      return;
    }

    if (!this.validateApiKey(key)) {
      this.showToast('Invalid API key format', 'error');
      return;
    }

    this.state.apiKey = key;
    await this.saveState();
    this.hideApiKeyModal();
    this.updateSettings();
    this.showToast('API key updated', 'success');
    // Auto-test new key
    this.testApiKey();
  }

  // API Key Testing
  async testApiKey() {
    if (!this.state.apiKey) {
      this.updateApiKeyStatus('error', 'No API key configured');
      return;
    }

    const testBtn = document.getElementById('testApiKey');
    if (testBtn) {
      testBtn.disabled = true;
      testBtn.textContent = 'Testing...';
    }

    this.updateApiKeyStatus('loading', 'Testing connection...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_API_KEY',
        provider: this.state.provider,
        apiKey: this.state.apiKey
      }).catch(() => null);

      if (!response) {
        this.updateApiKeyStatus('error', 'Service unavailable - reload extension');
        return;
      }

      if (response?.success) {
        this.updateApiKeyStatus('success', 'Connected');
        this.state.apiKeyValid = true;
        await this.saveState();
      } else {
        this.updateApiKeyStatus('error', response?.error || 'Connection failed');
        this.state.apiKeyValid = false;
        await this.saveState();
      }
    } catch (error) {
      this.updateApiKeyStatus('error', error.message || 'Test failed');
      this.state.apiKeyValid = false;
    }

    if (testBtn) {
      testBtn.disabled = false;
      testBtn.textContent = 'Test';
    }
  }

  updateApiKeyStatus(status, message) {
    const icon = document.getElementById('apiKeyStatusIcon');
    const msg = document.getElementById('apiKeyStatusMsg');

    if (icon) {
      icon.className = 'status-icon ' + status;
    }
    if (msg) {
      msg.className = 'status-message ' + status;
      msg.textContent = message;
    }
  }

  // Tag Management
  updateExpertise() {
    const selected = Array.from(document.querySelectorAll('#expertiseTags .tag.selected'))
      .map(t => t.dataset.tag);
    this.state.expertise = selected;
  }

  addCustomTag() {
    const input = document.getElementById('customTagInput');
    const value = input?.value.trim();

    if (!value) return;
    if (value.length > 30) {
      this.showToast('Tag too long (max 30 chars)', 'error');
      return;
    }

    const tagCloud = document.getElementById('expertiseTags');
    const tagId = value.toLowerCase().replace(/\s+/g, '-');

    // Check for duplicates
    if (document.querySelector(`#expertiseTags .tag[data-tag="${tagId}"]`)) {
      this.showToast('Tag already exists', 'error');
      return;
    }

    const tag = document.createElement('button');
    tag.className = 'tag selected';
    tag.dataset.tag = tagId;
    tag.textContent = value;
    tag.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('selected');
    });

    tagCloud?.appendChild(tag);
    if (input) input.value = '';
  }

  // Status Indicator
  updateStatusIndicator() {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');

    if (this.state.isEnabled) {
      dot?.classList.remove('inactive');
      if (text) text.textContent = 'Active';
    } else {
      dot?.classList.add('inactive');
      if (text) text.textContent = 'Paused';
    }
  }

  // Dashboard Updates
  updateDashboard() {
    const toggle = document.getElementById('enableToggle');
    if (toggle) toggle.checked = this.state.isEnabled;

    const repliesEl = document.getElementById('repliesGenerated');
    if (repliesEl) repliesEl.textContent = this.state.stats.repliesGenerated;

    const analyzedEl = document.getElementById('tweetsAnalyzed');
    if (analyzedEl) analyzedEl.textContent = this.state.stats.tweetsAnalyzed;

    const styleEl = document.getElementById('currentStyle');
    if (styleEl) {
      styleEl.textContent = this.capitalizeFirst(this.state.style);
    }

    const providerEl = document.getElementById('currentProvider');
    if (providerEl) {
      const names = { openai: 'OpenAI', anthropic: 'Anthropic', groq: 'Groq', gemini: 'Gemini' };
      providerEl.textContent = names[this.state.provider] || this.state.provider;
    }

    this.updateStatusIndicator();
  }

  // Settings Updates
  updateSettings() {
    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) providerSelect.value = this.state.provider;

    const apiDisplay = document.getElementById('apiKeyDisplay');
    if (apiDisplay) {
      apiDisplay.value = this.state.apiKey
        ? '••••••••••••' + this.state.apiKey.slice(-4)
        : 'No API key set';
    }

    const styleSelect = document.getElementById('styleSelect');
    if (styleSelect) styleSelect.value = this.state.style;

    const autoShow = document.getElementById('autoShowSuggestions');
    if (autoShow) autoShow.checked = this.state.autoShow;

    const emojis = document.getElementById('includeEmojis');
    if (emojis) emojis.checked = this.state.includeEmojis;

    const hashtags = document.getElementById('addHashtags');
    if (hashtags) hashtags.checked = this.state.addHashtags;

    const sidePanel = document.getElementById('useSidePanel');
    if (sidePanel) sidePanel.checked = this.state.useSidePanel;

    // Show API key status
    if (this.state.apiKey) {
      if (this.state.apiKeyValid === true) {
        this.updateApiKeyStatus('success', 'Connected');
      } else if (this.state.apiKeyValid === false) {
        this.updateApiKeyStatus('error', 'Connection failed');
      } else {
        this.updateApiKeyStatus('', 'Not tested');
      }
    } else {
      this.updateApiKeyStatus('', 'No API key');
    }

    // Render editable tags
    const tagsContainer = document.getElementById('editableTags');
    if (tagsContainer) {
      if (this.state.expertise.length > 0) {
        tagsContainer.innerHTML = this.state.expertise.map(tag =>
          `<span class="tag">${this.capitalizeFirst(tag)}</span>`
        ).join('');
      } else {
        tagsContainer.innerHTML = '<span class="tag" style="opacity: 0.5">No topics selected</span>';
      }
    }
  }

  // Toast Notification
  showToast(message, type = 'info') {
    // Remove existing toast
    document.querySelector('.toast')?.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // Utility
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Initial Render
  render() {
    if (this.state.isConfigured) {
      this.showView('dashboard');
    } else {
      this.showView('onboarding');
      this.showStep(1);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CassprPopup();
});
