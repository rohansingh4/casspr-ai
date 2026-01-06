# Plume AI - Chrome Extension Execution Plan

## Project Overview

**Product Name:** Plume  
**Tagline:** "Craft thoughthat resonate"  
**Description:** A client-side Chrome extension that helps users grow their Twitter/X presence by generating AI-powered reply and quote tweet suggestions based on their interests, expertise, and communication style.

---

## Brand Identity

### Name Rationale
"Plume" - A feather used as a writing instrument. Connects subtly to bird imagery (Twitter) while emphasizing crafted, thoughtful writing. Elegant, memorable, brandable.

### Color Palette
```
Primary Gradient: #6366F1 → #8B5CF6 (Indigo to Violet)
Background Dark: #0F0F14
Surface Dark: #1A1A24  
Surface Elevated: #252532
Border: #2E2E3E
Text Primary: #FFFFFF
Text Secondary: #A0A0B0
Text Muted: #6B6B7B
Success: #10B981
Warning: #F59E0B
Error: #EF4444
```

### Logo Concept
A minimalist feather quill with a subtle gradient, angled as if writing. The tip has a soft glow suggesting AI/intelligence. Simple enough to work as 16x16, 48x48, and 128x128 icons.

---

## Technical Architecture

### Manifest V3 Structure
```
plume-extension/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   ├── content.js
│   └── content.css
├── background/
│   └── service-worker.js
├── lib/
│   └── storage.js
└── assets/
    └── logo.svg
```

### Permissions Required
```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://twitter.com/*",
    "https://x.com/*",
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://api.groq.com/*"
  ]
}
```

---

## Complete File Specifications

### 1. manifest.json
```json
{
  "manifest_version": 3,
  "name": "Plume - AI Tweet Engagement",
  "version": "1.0.0",
  "description": "Craft replies that resonate. AI-powered engagement suggestions for Twitter/X.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://twitter.com/*", "https://x.com/*"],
      "js": ["lib/storage.js", "content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_idle"
    }
  ],
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://twitter.com/*",
    "https://x.com/*",
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://api.groq.com/*"
  ]
}
```

### 2. popup/popup.html
Complete popup interface with:
- Onboarding flow for first-time users
- API key configuration (OpenAI, Anthropic, Groq selector)
- User profile setup:
  - Expertise/interests (multi-select tags: "Software Dev", "Blockchain", "AI/ML", "Sports", "Finance", "Crypto", "Startups", "Design", custom)
  - Communication style (Professional, Casual, Witty, Thoughtful, Provocative)
  - Tone slider (Friendly ←→ Authoritative)
  - Response length preference (Concise, Medium, Detailed)
- Enable/disable toggle
- Stats display (replies generated today, engagement score)
- Dark mode UI matching Twitter's dark theme

Structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plume</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header class="plume-header">
      <div class="logo-container">
        <svg class="logo" viewBox="0 0 32 32"><!-- Feather icon --></svg>
        <span class="logo-text">Plume</span>
      </div>
      <div class="status-indicator" id="statusIndicator">
        <span class="status-dot"></span>
        <span class="status-text">Active</span>
      </div>
    </header>

    <!-- Onboarding View (shown if not configured) -->
    <section id="onboarding" class="view">
      <div class="onboarding-step" data-step="1">
        <h2>Welcome to Plume</h2>
        <p>Craft replies that resonate with your audience.</p>
        <button class="btn-primary" id="startSetup">Get Started</button>
      </div>
      
      <div class="onboarding-step hidden" data-step="2">
        <h3>Connect Your AI</h3>
        <p>Plume runs 100% in your browser. Add your API key:</p>
        <div class="provider-select">
          <button class="provider-btn" data-provider="openai">
            <span class="provider-icon">◯</span>
            OpenAI
          </button>
          <button class="provider-btn" data-provider="anthropic">
            <span class="provider-icon">◎</span>
            Anthropic
          </button>
          <button class="provider-btn" data-provider="groq">
            <span class="provider-icon">⚡</span>
            Groq
          </button>
        </div>
        <div class="api-input-container">
          <input type="password" id="apiKeyInput" placeholder="Paste your API key" />
          <button class="btn-icon" id="toggleKeyVisibility">👁</button>
        </div>
        <button class="btn-primary" id="saveApiKey">Continue</button>
      </div>
      
      <div class="onboarding-step hidden" data-step="3">
        <h3>Your Expertise</h3>
        <p>What topics do you engage with?</p>
        <div class="tag-cloud" id="expertiseTags">
          <button class="tag" data-tag="software">Software Dev</button>
          <button class="tag" data-tag="blockchain">Blockchain</button>
          <button class="tag" data-tag="defi">DeFi</button>
          <button class="tag" data-tag="ai">AI/ML</button>
          <button class="tag" data-tag="startups">Startups</button>
          <button class="tag" data-tag="finance">Finance</button>
          <button class="tag" data-tag="design">Design</button>
          <button class="tag" data-tag="crypto">Crypto</button>
          <button class="tag" data-tag="sports">Sports</button>
          <button class="tag" data-tag="gaming">Gaming</button>
        </div>
        <div class="custom-tag-input">
          <input type="text" id="customTagInput" placeholder="Add custom topic..." />
          <button class="btn-icon" id="addCustomTag">+</button>
        </div>
        <button class="btn-primary" id="continueToStyle">Continue</button>
      </div>
      
      <div class="onboarding-step hidden" data-step="4">
        <h3>Your Voice</h3>
        <div class="style-option">
          <label>Communication Style</label>
          <div class="style-buttons" id="styleButtons">
            <button class="style-btn" data-style="professional">Professional</button>
            <button class="style-btn" data-style="casual">Casual</button>
            <button class="style-btn" data-style="witty">Witty</button>
            <button class="style-btn" data-style="thoughtful">Thoughtful</button>
            <button class="style-btn" data-style="provocative">Provocative</button>
          </div>
        </div>
        <div class="style-option">
          <label>Tone</label>
          <div class="slider-container">
            <span>Friendly</span>
            <input type="range" id="toneSlider" min="0" max="100" value="50" />
            <span>Authoritative</span>
          </div>
        </div>
        <div class="style-option">
          <label>Response Length</label>
          <div class="length-buttons" id="lengthButtons">
            <button class="length-btn" data-length="concise">Concise</button>
            <button class="length-btn selected" data-length="medium">Medium</button>
            <button class="length-btn" data-length="detailed">Detailed</button>
          </div>
        </div>
        <button class="btn-primary" id="completeSetup">Start Using Plume</button>
      </div>
    </section>

    <!-- Main Dashboard View -->
    <section id="dashboard" class="view hidden">
      <div class="toggle-container">
        <span>Plume Active</span>
        <label class="toggle">
          <input type="checkbox" id="enableToggle" checked />
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value" id="repliesGenerated">0</span>
          <span class="stat-label">Replies Today</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="tweetsAnalyzed">0</span>
          <span class="stat-label">Tweets Analyzed</span>
        </div>
      </div>
      
      <div class="quick-settings">
        <h4>Quick Settings</h4>
        <div class="setting-row">
          <span>Current Style</span>
          <button class="chip" id="currentStyle">Casual</button>
        </div>
        <div class="setting-row">
          <span>AI Provider</span>
          <button class="chip" id="currentProvider">OpenAI</button>
        </div>
      </div>
      
      <button class="btn-secondary" id="openSettings">Settings</button>
    </section>

    <!-- Settings View -->
    <section id="settings" class="view hidden">
      <div class="settings-header">
        <button class="btn-back" id="backToDashboard">←</button>
        <h3>Settings</h3>
      </div>
      
      <div class="settings-section">
        <h4>AI Configuration</h4>
        <div class="provider-select-inline">
          <select id="providerSelect">
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="groq">Groq (Llama)</option>
          </select>
        </div>
        <div class="api-key-display">
          <input type="password" id="apiKeyDisplay" readonly />
          <button class="btn-icon" id="changeApiKey">Edit</button>
        </div>
      </div>
      
      <div class="settings-section">
        <h4>Your Profile</h4>
        <div class="editable-tags" id="editableTags">
          <!-- Populated by JS -->
        </div>
        <div class="style-edit">
          <select id="styleSelect">
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="witty">Witty</option>
            <option value="thoughtful">Thoughtful</option>
            <option value="provocative">Provocative</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h4>Behavior</h4>
        <label class="checkbox-row">
          <input type="checkbox" id="autoShowSuggestions" checked />
          <span>Auto-show suggestions on reply click</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" id="includeEmojis" />
          <span>Include emojis in suggestions</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" id="addHashtags" />
          <span>Suggest relevant hashtags</span>
        </label>
      </div>
      
      <div class="settings-footer">
        <button class="btn-danger" id="resetExtension">Reset All Data</button>
        <span class="version">Plume v1.0.0</span>
      </div>
    </section>
  </div>
  <script src="popup.js" type="module"></script>
</body>
</html>
```

### 3. popup/popup.css
Full styling with:
- CSS custom properties for theming
- Smooth transitions and micro-interactions
- Twitter dark mode matching aesthetic
- Responsive design for popup constraints (400px max width)
- Focus states for accessibility
- Loading states and animations

```css
:root {
  --gradient-start: #6366F1;
  --gradient-end: #8B5CF6;
  --bg-primary: #0F0F14;
  --bg-surface: #1A1A24;
  --bg-elevated: #252532;
  --border-color: #2E2E3E;
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0B0;
  --text-muted: #6B6B7B;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --transition: 150ms ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 380px;
  min-height: 500px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

#app {
  padding: 20px;
}

/* Header */
.plume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-surface);
  border-radius: 20px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 2s infinite;
}

.status-dot.inactive {
  background: var(--text-muted);
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Views */
.view {
  animation: fadeIn 200ms ease;
}

.view.hidden {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Onboarding */
.onboarding-step {
  text-align: center;
}

.onboarding-step.hidden {
  display: none;
}

.onboarding-step h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.onboarding-step h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.onboarding-step p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  width: 100%;
  padding: 12px 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition);
}

.btn-secondary:hover {
  background: var(--bg-elevated);
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition);
}

.btn-icon:hover {
  background: var(--border-color);
}

.btn-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}

.btn-back:hover {
  background: var(--bg-surface);
}

.btn-danger {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--error);
  border-radius: var(--radius-sm);
  color: var(--error);
  font-size: 13px;
  cursor: pointer;
  transition: background var(--transition);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Provider Selection */
.provider-select {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.provider-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bg-surface);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.provider-btn:hover {
  border-color: var(--gradient-start);
  color: var(--text-primary);
}

.provider-btn.selected {
  border-color: var(--gradient-start);
  background: rgba(99, 102, 241, 0.1);
  color: var(--text-primary);
}

.provider-icon {
  font-size: 24px;
}

/* API Input */
.api-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.api-input-container input {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  font-family: monospace;
}

.api-input-container input:focus {
  outline: none;
  border-color: var(--gradient-start);
}

/* Tags */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.tag {
  padding: 8px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition);
}

.tag:hover {
  border-color: var(--gradient-start);
}

.tag.selected {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border-color: transparent;
  color: white;
}

.custom-tag-input {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.custom-tag-input input {
  flex: 1;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
}

.custom-tag-input input:focus {
  outline: none;
  border-color: var(--gradient-start);
}

/* Style Buttons */
.style-option {
  margin-bottom: 20px;
  text-align: left;
}

.style-option label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.style-buttons, .length-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-btn, .length-btn {
  padding: 10px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition);
}

.style-btn:hover, .length-btn:hover {
  border-color: var(--gradient-start);
  color: var(--text-primary);
}

.style-btn.selected, .length-btn.selected {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border-color: transparent;
  color: white;
}

/* Slider */
.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-container span {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 70px;
}

.slider-container span:last-child {
  text-align: right;
}

input[type="range"] {
  flex: 1;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  appearance: none;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition);
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Dashboard */
.toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.toggle {
  position: relative;
  width: 50px;
  height: 28px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--bg-elevated);
  border-radius: 14px;
  cursor: pointer;
  transition: background var(--transition);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 22px;
  height: 22px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all var(--transition);
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(22px);
  background: white;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Quick Settings */
.quick-settings {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.quick-settings h4 {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.setting-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.chip {
  padding: 6px 12px;
  background: var(--bg-elevated);
  border: none;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: background var(--transition);
}

.chip:hover {
  background: var(--border-color);
}

/* Settings View */
.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.settings-header h3 {
  font-size: 18px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section h4 {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.provider-select-inline select,
.style-edit select {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 12px;
}

.api-key-display {
  display: flex;
  gap: 8px;
}

.api-key-display input {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  font-family: monospace;
}

.editable-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
}

.checkbox-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.checkbox-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--gradient-start);
}

.settings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.version {
  font-size: 11px;
  color: var(--text-muted);
}

/* Loading State */
.loading {
  position: relative;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(15, 15, 20, 0.8);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--bg-elevated);
  border-top-color: var(--gradient-start);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 4. popup/popup.js
Complete popup logic with:
- State management
- View routing
- Chrome storage integration
- API key validation
- Settings persistence

```javascript
// popup/popup.js

class PlumePopup {
  constructor() {
    this.state = {
      isConfigured: false,
      isEnabled: true,
      provider: 'openai',
      apiKey: '',
      expertise: [],
      style: 'casual',
      tone: 50,
      length: 'medium',
      autoShow: true,
      includeEmojis: false,
      addHashtags: false,
      stats: {
        repliesGenerated: 0,
        tweetsAnalyzed: 0
      }
    };
    
    this.init();
  }
  
  async init() {
    await this.loadState();
    this.bindEvents();
    this.render();
  }
  
  async loadState() {
    const stored = await chrome.storage.local.get('plumeState');
    if (stored.plumeState) {
      this.state = { ...this.state, ...stored.plumeState };
    }
  }
  
  async saveState() {
    await chrome.storage.local.set({ plumeState: this.state });
    // Notify content script of state change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'STATE_UPDATED', state: this.state });
    }
  }
  
  bindEvents() {
    // Onboarding Step 1
    document.getElementById('startSetup')?.addEventListener('click', () => {
      this.showStep(2);
    });
    
    // Provider selection
    document.querySelectorAll('.provider-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.state.provider = e.currentTarget.dataset.provider;
      });
    });
    
    // API Key
    document.getElementById('saveApiKey')?.addEventListener('click', () => {
      const key = document.getElementById('apiKeyInput').value.trim();
      if (key) {
        this.state.apiKey = key;
        this.showStep(3);
      }
    });
    
    document.getElementById('toggleKeyVisibility')?.addEventListener('click', () => {
      const input = document.getElementById('apiKeyInput');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
    
    // Expertise tags
    document.querySelectorAll('#expertiseTags .tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('selected');
        this.updateExpertise();
      });
    });
    
    document.getElementById('addCustomTag')?.addEventListener('click', () => {
      const input = document.getElementById('customTagInput');
      const value = input.value.trim();
      if (value) {
        this.addCustomTag(value);
        input.value = '';
      }
    });
    
    document.getElementById('continueToStyle')?.addEventListener('click', () => {
      this.updateExpertise();
      this.showStep(4);
    });
    
    // Style selection
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.state.style = e.currentTarget.dataset.style;
      });
    });
    
    // Tone slider
    document.getElementById('toneSlider')?.addEventListener('input', (e) => {
      this.state.tone = parseInt(e.target.value);
    });
    
    // Length selection
    document.querySelectorAll('.length-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.state.length = e.currentTarget.dataset.length;
      });
    });
    
    // Complete setup
    document.getElementById('completeSetup')?.addEventListener('click', async () => {
      this.state.isConfigured = true;
      await this.saveState();
      this.showView('dashboard');
    });
    
    // Dashboard
    document.getElementById('enableToggle')?.addEventListener('change', async (e) => {
      this.state.isEnabled = e.target.checked;
      await this.saveState();
      this.updateStatusIndicator();
    });
    
    document.getElementById('openSettings')?.addEventListener('click', () => {
      this.showView('settings');
    });
    
    // Settings
    document.getElementById('backToDashboard')?.addEventListener('click', () => {
      this.showView('dashboard');
    });
    
    document.getElementById('providerSelect')?.addEventListener('change', async (e) => {
      this.state.provider = e.target.value;
      await this.saveState();
    });
    
    document.getElementById('styleSelect')?.addEventListener('change', async (e) => {
      this.state.style = e.target.value;
      await this.saveState();
    });
    
    document.getElementById('autoShowSuggestions')?.addEventListener('change', async (e) => {
      this.state.autoShow = e.target.checked;
      await this.saveState();
    });
    
    document.getElementById('includeEmojis')?.addEventListener('change', async (e) => {
      this.state.includeEmojis = e.target.checked;
      await this.saveState();
    });
    
    document.getElementById('addHashtags')?.addEventListener('change', async (e) => {
      this.state.addHashtags = e.target.checked;
      await this.saveState();
    });
    
    document.getElementById('resetExtension')?.addEventListener('click', async () => {
      if (confirm('This will delete all your settings and data. Are you sure?')) {
        await chrome.storage.local.clear();
        window.location.reload();
      }
    });
  }
  
  showStep(step) {
    document.querySelectorAll('.onboarding-step').forEach(el => {
      el.classList.add('hidden');
    });
    document.querySelector(`.onboarding-step[data-step="${step}"]`)?.classList.remove('hidden');
  }
  
  showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
    
    if (viewId === 'dashboard') {
      this.updateDashboard();
    } else if (viewId === 'settings') {
      this.updateSettings();
    }
  }
  
  updateExpertise() {
    const selected = Array.from(document.querySelectorAll('#expertiseTags .tag.selected'))
      .map(t => t.dataset.tag);
    this.state.expertise = selected;
  }
  
  addCustomTag(value) {
    const tagCloud = document.getElementById('expertiseTags');
    const tag = document.createElement('button');
    tag.className = 'tag selected';
    tag.dataset.tag = value.toLowerCase().replace(/\s+/g, '-');
    tag.textContent = value;
    tag.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('selected');
      this.updateExpertise();
    });
    tagCloud.appendChild(tag);
    this.updateExpertise();
  }
  
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
  
  updateDashboard() {
    const toggle = document.getElementById('enableToggle');
    if (toggle) toggle.checked = this.state.isEnabled;
    
    const repliesEl = document.getElementById('repliesGenerated');
    if (repliesEl) repliesEl.textContent = this.state.stats.repliesGenerated;
    
    const analyzedEl = document.getElementById('tweetsAnalyzed');
    if (analyzedEl) analyzedEl.textContent = this.state.stats.tweetsAnalyzed;
    
    const styleEl = document.getElementById('currentStyle');
    if (styleEl) styleEl.textContent = this.state.style.charAt(0).toUpperCase() + this.state.style.slice(1);
    
    const providerEl = document.getElementById('currentProvider');
    if (providerEl) {
      const names = { openai: 'OpenAI', anthropic: 'Anthropic', groq: 'Groq' };
      providerEl.textContent = names[this.state.provider] || this.state.provider;
    }
    
    this.updateStatusIndicator();
  }
  
  updateSettings() {
    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) providerSelect.value = this.state.provider;
    
    const apiDisplay = document.getElementById('apiKeyDisplay');
    if (apiDisplay) apiDisplay.value = this.state.apiKey ? '••••••••••••' + this.state.apiKey.slice(-4) : '';
    
    const styleSelect = document.getElementById('styleSelect');
    if (styleSelect) styleSelect.value = this.state.style;
    
    const autoShow = document.getElementById('autoShowSuggestions');
    if (autoShow) autoShow.checked = this.state.autoShow;
    
    const emojis = document.getElementById('includeEmojis');
    if (emojis) emojis.checked = this.state.includeEmojis;
    
    const hashtags = document.getElementById('addHashtags');
    if (hashtags) hashtags.checked = this.state.addHashtags;
    
    // Render editable tags
    const tagsContainer = document.getElementById('editableTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = this.state.expertise.map(tag => 
        `<span class="tag selected">${tag}</span>`
      ).join('');
    }
  }
  
  render() {
    if (this.state.isConfigured) {
      this.showView('dashboard');
    } else {
      this.showView('onboarding');
      this.showStep(1);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new PlumePopup();
});
```

### 5. content/content.js
Complete content script with:
- Tweet detection via MutationObserver
- Reply/Quote button click interception
- Floating suggestion panel UI
- Reply box injection
- Message passing to service worker

```javascript
// content/content.js

(function() {
  'use strict';

  // Selectors
  const SELECTORS = {
    tweet: 'article[data-testid="tweet"]',
    tweetText: '[data-testid="tweetText"]',
    userName: '[data-testid="User-Name"]',
    timestamp: 'time[datetime]',
    replyBtn: '[data-testid="reply"]',
    retweetBtn: '[data-testid="retweet"]',
    likeBtn: '[data-testid="like"]',
    replyComposer: '[data-testid="tweetTextarea_0"]',
    tweetButton: '[data-testid="tweetButtonInline"]'
  };

  // State
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

  let seenTweets = new Set();
  let currentTweet = null;
  let suggestionPanel = null;

  // Load state from storage
  async function loadState() {
    const stored = await chrome.storage.local.get('plumeState');
    if (stored.plumeState) {
      state = { ...state, ...stored.plumeState };
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
  });

  // Parse tweet data from element
  function parseTweet(article) {
    const tweetText = article.querySelector(SELECTORS.tweetText);
    const userName = article.querySelector(SELECTORS.userName);
    const timeEl = article.querySelector(SELECTORS.timestamp);

    const authorFull = userName?.innerText || '';
    const authorLines = authorFull.split('\n');
    const displayName = authorLines[0] || 'Unknown';
    const handle = authorLines[1] || '';
    const timestamp = timeEl?.getAttribute('datetime') || new Date().toISOString();

    const id = `${handle}-${timestamp}`;

    if (seenTweets.has(id)) return null;
    seenTweets.add(id);

    return {
      id,
      text: tweetText?.innerText || '',
      displayName,
      handle,
      timestamp,
      element: article
    };
  }

  // Create suggestion panel
  function createSuggestionPanel() {
    const panel = document.createElement('div');
    panel.id = 'plume-suggestion-panel';
    panel.innerHTML = `
      <div class="plume-panel-header">
        <div class="plume-logo">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76zM16.95 7.05a4 4 0 0 1 0 5.66L11.29 18.5H7v-4.29l5.79-5.79a4 4 0 0 1 5.66 0z"/>
          </svg>
          <span>Plume</span>
        </div>
        <button class="plume-close-btn" id="plume-close">×</button>
      </div>
      <div class="plume-panel-content">
        <div class="plume-loading" id="plume-loading">
          <div class="plume-spinner"></div>
          <span>Crafting suggestions...</span>
        </div>
        <div class="plume-suggestions" id="plume-suggestions"></div>
      </div>
      <div class="plume-panel-footer">
        <button class="plume-regenerate-btn" id="plume-regenerate">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Regenerate
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('#plume-close').addEventListener('click', hideSuggestionPanel);
    panel.querySelector('#plume-regenerate').addEventListener('click', () => {
      if (currentTweet) {
        requestSuggestions(currentTweet);
      }
    });

    return panel;
  }

  // Show suggestion panel near the tweet
  function showSuggestionPanel(tweet, anchorElement) {
    if (!suggestionPanel) {
      suggestionPanel = createSuggestionPanel();
    }

    currentTweet = tweet;

    // Position panel
    const rect = anchorElement.getBoundingClientRect();
    const scrollY = window.scrollY;
    
    suggestionPanel.style.top = `${rect.bottom + scrollY + 8}px`;
    suggestionPanel.style.left = `${Math.max(rect.left - 100, 20)}px`;
    suggestionPanel.classList.add('plume-visible');

    // Show loading state
    suggestionPanel.querySelector('#plume-loading').style.display = 'flex';
    suggestionPanel.querySelector('#plume-suggestions').innerHTML = '';

    // Request suggestions
    requestSuggestions(tweet);
  }

  // Hide suggestion panel
  function hideSuggestionPanel() {
    if (suggestionPanel) {
      suggestionPanel.classList.remove('plume-visible');
    }
    currentTweet = null;
  }

  // Request suggestions from service worker
  function requestSuggestions(tweet) {
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
    if (!suggestionPanel) return;

    const loadingEl = suggestionPanel.querySelector('#plume-loading');
    const suggestionsEl = suggestionPanel.querySelector('#plume-suggestions');

    loadingEl.style.display = 'none';

    if (!suggestions || suggestions.length === 0) {
      suggestionsEl.innerHTML = `
        <div class="plume-error">
          <span>Couldn't generate suggestions. Check your API key.</span>
        </div>
      `;
      return;
    }

    suggestionsEl.innerHTML = suggestions.map((suggestion, i) => `
      <div class="plume-suggestion" data-index="${i}">
        <p class="plume-suggestion-text">${escapeHtml(suggestion)}</p>
        <div class="plume-suggestion-actions">
          <button class="plume-copy-btn" data-suggestion="${escapeAttr(suggestion)}">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy
          </button>
          <button class="plume-use-btn" data-suggestion="${escapeAttr(suggestion)}">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            Use
          </button>
        </div>
      </div>
    `).join('');

    // Bind click events
    suggestionsEl.querySelectorAll('.plume-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.suggestion;
        navigator.clipboard.writeText(text);
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy
          `;
        }, 2000);
      });
    });

    suggestionsEl.querySelectorAll('.plume-use-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.suggestion;
        insertIntoComposer(text);
        hideSuggestionPanel();
      });
    });
  }

  // Insert text into Twitter's reply composer
  function insertIntoComposer(text) {
    // Wait for composer to appear (Twitter uses modal for replies)
    const checkComposer = setInterval(() => {
      const composer = document.querySelector(SELECTORS.replyComposer);
      if (composer) {
        clearInterval(checkComposer);
        
        // Find the editable div inside
        const editableDiv = composer.querySelector('[contenteditable="true"]') || composer;
        
        // Focus and insert text
        editableDiv.focus();
        
        // Clear existing content
        editableDiv.innerHTML = '';
        
        // Insert text using execCommand for proper React state sync
        document.execCommand('insertText', false, text);
        
        // Trigger input event for React to pick up
        editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);

    // Stop checking after 3 seconds
    setTimeout(() => clearInterval(checkComposer), 3000);
  }

  // Escape HTML for safe insertion
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Escape for data attribute
  function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Handle reply button clicks
  function handleReplyClick(e) {
    if (!state.isEnabled || !state.apiKey) return;

    const replyBtn = e.target.closest(SELECTORS.replyBtn);
    if (!replyBtn) return;

    const article = replyBtn.closest(SELECTORS.tweet);
    if (!article) return;

    // Parse the tweet
    const tweetText = article.querySelector(SELECTORS.tweetText);
    const userName = article.querySelector(SELECTORS.userName);
    const timeEl = article.querySelector(SELECTORS.timestamp);

    const authorFull = userName?.innerText || '';
    const authorLines = authorFull.split('\n');

    const tweet = {
      text: tweetText?.innerText || '',
      displayName: authorLines[0] || 'Unknown',
      handle: authorLines[1] || '',
      timestamp: timeEl?.getAttribute('datetime') || '',
      element: article
    };

    // Show suggestion panel
    if (state.autoShow) {
      showSuggestionPanel(tweet, replyBtn);
    }
  }

  // Initialize
  async function init() {
    await loadState();

    // Add click listener for reply buttons
    document.addEventListener('click', handleReplyClick, true);

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (suggestionPanel && 
          suggestionPanel.classList.contains('plume-visible') &&
          !suggestionPanel.contains(e.target) &&
          !e.target.closest(SELECTORS.replyBtn)) {
        hideSuggestionPanel();
      }
    });

    // Close panel on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (suggestionPanel && suggestionPanel.classList.contains('plume-visible')) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(hideSuggestionPanel, 150);
      }
    }, { passive: true });

    console.log('🪶 Plume content script loaded');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### 6. content/content.css
Styling for the floating suggestion panel:

```css
/* content/content.css */

#plume-suggestion-panel {
  position: absolute;
  width: 340px;
  background: #1A1A24;
  border: 1px solid #2E2E3E;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 150ms ease;
}

#plume-suggestion-panel.plume-visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.plume-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #2E2E3E;
}

.plume-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
}

.plume-logo svg {
  color: #8B5CF6;
}

.plume-close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #6B6B7B;
  font-size: 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 150ms ease;
}

.plume-close-btn:hover {
  background: #252532;
  color: #FFFFFF;
}

.plume-panel-content {
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
}

.plume-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  color: #A0A0B0;
  font-size: 13px;
}

.plume-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #252532;
  border-top-color: #8B5CF6;
  border-radius: 50%;
  animation: plume-spin 0.8s linear infinite;
}

@keyframes plume-spin {
  to { transform: rotate(360deg); }
}

.plume-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plume-suggestion {
  background: #252532;
  border-radius: 12px;
  padding: 12px;
  transition: all 150ms ease;
}

.plume-suggestion:hover {
  background: #2E2E3E;
}

.plume-suggestion-text {
  color: #FFFFFF;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 10px 0;
}

.plume-suggestion-actions {
  display: flex;
  gap: 8px;
}

.plume-copy-btn,
.plume-use-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.plume-copy-btn {
  background: #2E2E3E;
  color: #A0A0B0;
}

.plume-copy-btn:hover {
  background: #3E3E4E;
  color: #FFFFFF;
}

.plume-use-btn {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #FFFFFF;
}

.plume-use-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.plume-panel-footer {
  padding: 12px 16px;
  border-top: 1px solid #2E2E3E;
}

.plume-regenerate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #2E2E3E;
  border-radius: 8px;
  color: #A0A0B0;
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease;
}

.plume-regenerate-btn:hover {
  border-color: #6366F1;
  color: #FFFFFF;
}

.plume-error {
  text-align: center;
  padding: 16px;
  color: #EF4444;
  font-size: 13px;
}

/* Scrollbar */
.plume-panel-content::-webkit-scrollbar {
  width: 6px;
}

.plume-panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.plume-panel-content::-webkit-scrollbar-thumb {
  background: #3E3E4E;
  border-radius: 3px;
}

.plume-panel-content::-webkit-scrollbar-thumb:hover {
  background: #4E4E5E;
}
```

### 7. background/service-worker.js
Service worker handling AI API calls:

```javascript
// background/service-worker.js

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_SUGGESTIONS') {
    generateSuggestions(message.tweet, message.config, sender.tab.id);
  }
  return true;
});

// Generate suggestions using AI
async function generateSuggestions(tweet, config, tabId) {
  const { provider, apiKey, expertise, style, tone, length, includeEmojis, addHashtags } = config;

  if (!apiKey) {
    sendSuggestions(tabId, []);
    return;
  }

  const prompt = buildPrompt(tweet, { expertise, style, tone, length, includeEmojis, addHashtags });

  try {
    let suggestions;
    
    switch (provider) {
      case 'openai':
        suggestions = await callOpenAI(apiKey, prompt);
        break;
      case 'anthropic':
        suggestions = await callAnthropic(apiKey, prompt);
        break;
      case 'groq':
        suggestions = await callGroq(apiKey, prompt);
        break;
      default:
        suggestions = [];
    }

    sendSuggestions(tabId, suggestions);
    
    // Update stats
    updateStats();
    
  } catch (error) {
    console.error('Plume AI Error:', error);
    sendSuggestions(tabId, []);
  }
}

// Build the prompt
function buildPrompt(tweet, config) {
  const { expertise, style, tone, length, includeEmojis, addHashtags } = config;

  const toneDescription = tone < 33 ? 'friendly and approachable' : 
                          tone > 66 ? 'authoritative and expert' : 
                          'balanced and conversational';

  const lengthGuide = length === 'concise' ? '1-2 sentences, under 100 characters' :
                      length === 'detailed' ? '2-4 sentences, can be up to 280 characters' :
                      '1-3 sentences, around 150 characters';

  const expertiseStr = expertise.length > 0 
    ? `The user is knowledgeable about: ${expertise.join(', ')}.` 
    : '';

  return `You are a Twitter engagement assistant. Generate 3 different reply suggestions for the following tweet.

Tweet from @${tweet.handle} (${tweet.author}):
"${tweet.text}"

Requirements:
- Style: ${style}
- Tone: ${toneDescription}
- Length: ${lengthGuide}
${expertiseStr}
${includeEmojis ? '- Include 1-2 relevant emojis' : '- No emojis'}
${addHashtags ? '- Include 1-2 relevant hashtags if appropriate' : '- No hashtags'}

Generate replies that:
1. Add value to the conversation
2. Show genuine engagement with the content
3. Are authentic and not generic
4. Could spark further discussion

Return ONLY a JSON array with 3 reply strings. No explanation, just the JSON array.
Example format: ["reply 1", "reply 2", "reply 3"]`;
}

// OpenAI API call
async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful Twitter engagement assistant. Always respond with valid JSON arrays only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';
  
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from response
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

// Anthropic API call
async function callAnthropic(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || '[]';
  
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

// Groq API call
async function callGroq(apiKey, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a helpful Twitter engagement assistant. Always respond with valid JSON arrays only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';
  
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

// Send suggestions back to content script
function sendSuggestions(tabId, suggestions) {
  chrome.tabs.sendMessage(tabId, {
    type: 'SUGGESTIONS_READY',
    suggestions
  });
}

// Update usage stats
async function updateStats() {
  const stored = await chrome.storage.local.get('plumeState');
  const state = stored.plumeState || {};
  
  const today = new Date().toDateString();
  const stats = state.stats || { repliesGenerated: 0, tweetsAnalyzed: 0, lastReset: today };
  
  // Reset daily stats if new day
  if (stats.lastReset !== today) {
    stats.repliesGenerated = 0;
    stats.tweetsAnalyzed = 0;
    stats.lastReset = today;
  }
  
  stats.repliesGenerated++;
  
  await chrome.storage.local.set({
    plumeState: { ...state, stats }
  });
}

console.log('🪶 Plume service worker loaded');
```

### 8. lib/storage.js
Shared storage utilities:

```javascript
// lib/storage.js

const PlumeStorage = {
  async get(key) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  },
  
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },
  
  async getState() {
    return await this.get('plumeState') || {};
  },
  
  async setState(updates) {
    const current = await this.getState();
    await this.set('plumeState', { ...current, ...updates });
  }
};

// Make available globally for content scripts
window.PlumeStorage = PlumeStorage;
```

### 9. Icons
Generate SVG icons for the extension:

**icons/icon.svg** (base logo):
```svg
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="plume-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path fill="url(#plume-gradient)" filter="url(#glow)" d="M98 18c-12-8-28-4-38 8L24 76c-4 5-6 12-4 18l4 16c2 6 8 10 14 10h8l50-50c14-14 16-36 2-52z"/>
  <path fill="#FFFFFF" opacity="0.9" d="M76 46c-8-8-20-10-30-4l-20 20c-2 2-2 6 2 8l12 12c2 2 6 2 8 0l24-24c6-6 8-16 4-24z"/>
  <circle cx="88" cy="28" r="6" fill="#FFFFFF" opacity="0.6"/>
</svg>
```

---

## Execution Instructions

### For Claude Code Opus 4.5 with Ultrathink:

```
Create a complete Chrome extension called "Plume" following this specification exactly.

PROJECT STRUCTURE:
Create all files in a folder called "plume-extension" with the structure defined above.

REQUIREMENTS:
1. Create all files with the exact content provided in this spec
2. Generate PNG icons from the SVG at sizes 16x16, 48x48, and 128x128
3. Ensure all JavaScript is ES6+ compatible
4. Test that the extension loads without errors in chrome://extensions
5. Verify all event listeners are properly bound
6. Ensure the floating panel positions correctly on Twitter

ICON GENERATION:
Use a canvas-based approach or sharp/imagemagick to convert the SVG to required PNG sizes.

TESTING CHECKLIST:
- [ ] Extension loads in Chrome developer mode
- [ ] Popup opens and displays onboarding
- [ ] API key can be saved
- [ ] Preferences can be selected
- [ ] Content script injects on twitter.com
- [ ] Reply button clicks are detected
- [ ] Suggestion panel appears
- [ ] AI API calls work with valid key
- [ ] Copy button copies text
- [ ] Use button inserts into composer

DELIVERABLES:
1. Complete extension folder ready to load
2. All files created per spec
3. Icons generated in all sizes
4. Brief README with load instructions
```

---

## Local Testing Instructions

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `plume-extension` folder
5. Open Twitter/X in a new tab
6. Click the Plume icon to configure
7. Add your API key (OpenAI, Anthropic, or Groq)
8. Set your preferences
9. Click the reply button on any tweet
10. Suggestion panel should appear with AI-generated replies

---

## Notes

- All AI calls happen client-side via the service worker
- No data leaves the browser except to the AI provider chosen by user
- API keys are stored in chrome.storage.local (browser-local, not synced)
- The extension uses Manifest V3 for Chrome Web Store compatibility
- The suggestion panel uses absolute positioning based on reply button location
- Stats are daily-reset for simple tracking

---

*Generated for Claude Code execution - Plume v1.0.0*
