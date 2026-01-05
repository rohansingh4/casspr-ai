// content/content.js
// Casspr Extension - Twitter/X Content Script

(function() {
  'use strict';

  // Twitter/X DOM Selectors (updated for current Twitter structure)
  const SELECTORS = {
    tweet: 'article[data-testid="tweet"]',
    tweetText: '[data-testid="tweetText"]',
    userName: '[data-testid="User-Name"]',
    timestamp: 'time[datetime]',
    replyBtn: '[data-testid="reply"]',
    retweetBtn: '[data-testid="retweet"]',
    likeBtn: '[data-testid="like"]',
    replyComposer: '[data-testid="tweetTextarea_0"]',
    tweetButton: '[data-testid="tweetButtonInline"]',
    // Modal and dialog selectors
    replyModal: '[aria-labelledby="modal-header"]',
    composerRoot: '[data-testid="toolBar"]'
  };

  // Extension State
  let state = {
    isEnabled: true,
    provider: 'openai',
    apiKey: '',
    expertise: [],
    style: 'casual',
    tone: 50,
    length: 'medium',
    autoShow: true,
    includeEmojis: false,
    addHashtags: false
  };

  let currentTweet = null;
  let suggestionPanel = null;
  let isGenerating = false;

  // Load state from storage
  async function loadState() {
    try {
      const stored = await chrome.storage.local.get('cassprState');
      if (stored.cassprState) {
        state = { ...state, ...stored.cassprState };
      }
    } catch (error) {
      console.error('[Casspr] Failed to load state:', error);
    }
  }

  // Listen for state updates from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATE_UPDATED') {
      state = { ...state, ...message.state };
      if (!state.isEnabled && suggestionPanel) {
        hideSuggestionPanel();
      }
    }
    if (message.type === 'SUGGESTIONS_READY') {
      displaySuggestions(message.suggestions);
    }
    return true;
  });

  // Create suggestion panel
  function createSuggestionPanel() {
    const panel = document.createElement('div');
    panel.id = 'casspr-suggestion-panel';
    panel.innerHTML = `
      <div class="casspr-panel-header">
        <div class="casspr-logo">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect width="24" height="24" rx="5" fill="#000000"/>
            <g transform="translate(12, 12)">
              <path
                d="M 5.2 -3.3
                   A 6.3 6.3 0 1 0 5.2 3.3"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </g>
          </svg>
          <span>Casspr</span>
        </div>
        <button class="casspr-close-btn" id="casspr-close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="casspr-panel-content">
        <div class="casspr-loading" id="casspr-loading">
          <div class="casspr-spinner"></div>
          <span>Crafting suggestions...</span>
        </div>
        <div class="casspr-suggestions" id="casspr-suggestions"></div>
      </div>
      <div class="casspr-panel-footer">
        <button class="casspr-regenerate-btn" id="casspr-regenerate">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Regenerate
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('#casspr-close').addEventListener('click', hideSuggestionPanel);
    panel.querySelector('#casspr-regenerate').addEventListener('click', () => {
      if (currentTweet && !isGenerating) {
        requestSuggestions(currentTweet);
      }
    });

    return panel;
  }

  // Show suggestion panel
  function showSuggestionPanel(tweet, anchorElement) {
    if (!suggestionPanel) {
      suggestionPanel = createSuggestionPanel();
    }

    currentTweet = tweet;

    // Position panel near the reply button
    positionPanel(anchorElement);
    suggestionPanel.classList.add('casspr-visible');

    // Show loading state
    const loadingEl = suggestionPanel.querySelector('#casspr-loading');
    const suggestionsEl = suggestionPanel.querySelector('#casspr-suggestions');
    if (loadingEl) loadingEl.style.display = 'flex';
    if (suggestionsEl) suggestionsEl.innerHTML = '';

    // Request suggestions
    requestSuggestions(tweet);
  }

  // Position the panel
  function positionPanel(anchorElement) {
    if (!suggestionPanel || !anchorElement) return;

    const rect = anchorElement.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const panelWidth = 340;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX - (panelWidth / 2) + (rect.width / 2);

    // Keep within viewport horizontally
    left = Math.max(20, Math.min(left, viewportWidth - panelWidth - 20));

    // If panel would go below viewport, show above
    const panelHeight = 350; // Approximate height
    if (rect.bottom + panelHeight > viewportHeight) {
      top = rect.top + scrollY - panelHeight - 8;
    }

    suggestionPanel.style.top = `${top}px`;
    suggestionPanel.style.left = `${left}px`;
  }

  // Hide suggestion panel
  function hideSuggestionPanel() {
    if (suggestionPanel) {
      suggestionPanel.classList.remove('casspr-visible');
    }
    currentTweet = null;
    isGenerating = false;
  }

  // Request suggestions from service worker
  function requestSuggestions(tweet) {
    if (!state.apiKey) {
      displayError('Please configure your API key in the Casspr extension popup.');
      return;
    }

    isGenerating = true;

    // Show loading
    const loadingEl = suggestionPanel?.querySelector('#casspr-loading');
    const suggestionsEl = suggestionPanel?.querySelector('#casspr-suggestions');
    if (loadingEl) loadingEl.style.display = 'flex';
    if (suggestionsEl) suggestionsEl.innerHTML = '';

    chrome.runtime.sendMessage({
      type: 'GENERATE_SUGGESTIONS',
      tweet: {
        text: tweet.text,
        author: tweet.displayName,
        handle: tweet.handle
      },
      config: {
        provider: state.provider,
        apiKey: state.apiKey,
        expertise: state.expertise,
        style: state.style,
        tone: state.tone,
        length: state.length,
        includeEmojis: state.includeEmojis,
        addHashtags: state.addHashtags
      }
    });
  }

  // Display suggestions in panel
  function displaySuggestions(suggestions) {
    isGenerating = false;

    if (!suggestionPanel) return;

    const loadingEl = suggestionPanel.querySelector('#casspr-loading');
    const suggestionsEl = suggestionPanel.querySelector('#casspr-suggestions');

    if (loadingEl) loadingEl.style.display = 'none';

    if (!suggestions || suggestions.length === 0) {
      displayError('Could not generate suggestions. Please check your API key and try again.');
      return;
    }

    if (suggestionsEl) {
      suggestionsEl.innerHTML = suggestions.map((suggestion, i) => `
        <div class="casspr-suggestion" data-index="${i}">
          <p class="casspr-suggestion-text">${escapeHtml(suggestion)}</p>
          <div class="casspr-suggestion-actions">
            <button class="casspr-copy-btn" data-suggestion="${escapeAttr(suggestion)}" title="Copy to clipboard">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
            <button class="casspr-use-btn" data-suggestion="${escapeAttr(suggestion)}" title="Insert into reply">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Use
            </button>
          </div>
        </div>
      `).join('');

      // Bind click events
      bindSuggestionEvents(suggestionsEl);
    }

    // Update stats
    updateStats();
  }

  // Display error in panel
  function displayError(message) {
    if (!suggestionPanel) return;

    const loadingEl = suggestionPanel.querySelector('#casspr-loading');
    const suggestionsEl = suggestionPanel.querySelector('#casspr-suggestions');

    if (loadingEl) loadingEl.style.display = 'none';

    if (suggestionsEl) {
      suggestionsEl.innerHTML = `
        <div class="casspr-error">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${escapeHtml(message)}</span>
        </div>
      `;
    }
  }

  // Bind events to suggestion buttons
  function bindSuggestionEvents(container) {
    container.querySelectorAll('.casspr-copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.suggestion;
        try {
          await navigator.clipboard.writeText(text);
          showButtonFeedback(btn, 'Copied!');
        } catch (error) {
          console.error('[Casspr] Copy failed:', error);
        }
      });
    });

    container.querySelectorAll('.casspr-use-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.suggestion;
        insertIntoComposer(text);
        hideSuggestionPanel();
      });
    });
  }

  // Show button feedback
  function showButtonFeedback(btn, text) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ${text}
    `;
    btn.classList.add('casspr-btn-success');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('casspr-btn-success');
    }, 2000);
  }

  // Insert text into Twitter's reply composer
  function insertIntoComposer(text) {
    // Wait for composer to appear (Twitter uses modal for replies)
    const maxAttempts = 30;
    let attempts = 0;

    const checkComposer = setInterval(() => {
      attempts++;

      // Find the composer - try multiple selectors
      const composer = document.querySelector(SELECTORS.replyComposer) ||
                      document.querySelector('[data-testid="tweetTextarea_0RichTextInputContainer"]') ||
                      document.querySelector('[role="textbox"][data-testid]');

      if (composer) {
        clearInterval(checkComposer);

        // Find the editable div
        const editableDiv = composer.querySelector('[contenteditable="true"]') ||
                           composer.closest('[contenteditable="true"]') ||
                           composer;

        if (editableDiv) {
          // Focus the element
          editableDiv.focus();

          // Clear existing content
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editableDiv);
          selection.removeAllRanges();
          selection.addRange(range);

          // Use execCommand for better React compatibility
          document.execCommand('insertText', false, text);

          // Dispatch input event
          editableDiv.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text
          }));
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkComposer);
        console.warn('[Casspr] Could not find composer');
      }
    }, 100);
  }

  // Update usage stats
  async function updateStats() {
    try {
      const stored = await chrome.storage.local.get('cassprState');
      const cassprState = stored.cassprState || {};

      const today = new Date().toDateString();
      const stats = cassprState.stats || { repliesGenerated: 0, tweetsAnalyzed: 0, lastReset: today };

      // Reset if new day
      if (stats.lastReset !== today) {
        stats.repliesGenerated = 0;
        stats.tweetsAnalyzed = 0;
        stats.lastReset = today;
      }

      stats.repliesGenerated++;

      await chrome.storage.local.set({
        cassprState: { ...cassprState, stats }
      });
    } catch (error) {
      console.error('[Casspr] Failed to update stats:', error);
    }
  }

  // Utility: Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Escape for data attribute
  function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Parse tweet data from element
  function parseTweetFromElement(article) {
    const tweetText = article.querySelector(SELECTORS.tweetText);
    const userName = article.querySelector(SELECTORS.userName);
    const timeEl = article.querySelector(SELECTORS.timestamp);

    const authorFull = userName?.innerText || '';
    const authorLines = authorFull.split('\n');
    const displayName = authorLines[0] || 'Unknown';
    const handle = authorLines.find(line => line.startsWith('@')) || authorLines[1] || '';

    return {
      text: tweetText?.innerText || '',
      displayName,
      handle: handle.replace('@', ''),
      timestamp: timeEl?.getAttribute('datetime') || '',
      element: article
    };
  }

  // Handle reply button clicks
  function handleReplyClick(e) {
    if (!state.isEnabled || !state.apiKey) return;

    const replyBtn = e.target.closest(SELECTORS.replyBtn);
    if (!replyBtn) return;

    const article = replyBtn.closest(SELECTORS.tweet);
    if (!article) return;

    const tweet = parseTweetFromElement(article);

    // Only show if there's actual tweet content
    if (!tweet.text.trim()) return;

    // Show suggestion panel
    if (state.autoShow) {
      // Small delay to let Twitter's reply modal start opening
      setTimeout(() => {
        showSuggestionPanel(tweet, replyBtn);
      }, 100);
    }
  }

  // Initialize
  async function init() {
    await loadState();

    // Add click listener for reply buttons (capture phase)
    document.addEventListener('click', handleReplyClick, true);

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (suggestionPanel &&
          suggestionPanel.classList.contains('casspr-visible') &&
          !suggestionPanel.contains(e.target) &&
          !e.target.closest(SELECTORS.replyBtn)) {
        hideSuggestionPanel();
      }
    });

    // Close panel on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && suggestionPanel?.classList.contains('casspr-visible')) {
        hideSuggestionPanel();
      }
    });

    // Reposition panel on scroll (with debounce)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (suggestionPanel?.classList.contains('casspr-visible')) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (currentTweet?.element) {
            const replyBtn = currentTweet.element.querySelector(SELECTORS.replyBtn);
            if (replyBtn) {
              positionPanel(replyBtn);
            }
          }
        }, 50);
      }
    }, { passive: true });

    // Reposition on window resize
    window.addEventListener('resize', () => {
      if (suggestionPanel?.classList.contains('casspr-visible') && currentTweet?.element) {
        const replyBtn = currentTweet.element.querySelector(SELECTORS.replyBtn);
        if (replyBtn) {
          positionPanel(replyBtn);
        }
      }
    });

    console.log('%c[Casspr] Content script loaded', 'color: #FFFFFF; background: #000000; padding: 2px 6px; border-radius: 3px; font-weight: bold;');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
