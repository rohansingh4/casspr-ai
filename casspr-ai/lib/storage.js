// lib/storage.js
// Shared storage utilities for Casspr extension

const CassprStorage = {
  async get(key) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  },

  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },

  async getState() {
    return await this.get('cassprState') || {};
  },

  async setState(updates) {
    const current = await this.getState();
    await this.set('cassprState', { ...current, ...updates });
  },

  async clearAll() {
    await chrome.storage.local.clear();
  }
};

// Make available globally for content scripts
if (typeof window !== 'undefined') {
  window.CassprStorage = CassprStorage;
}
