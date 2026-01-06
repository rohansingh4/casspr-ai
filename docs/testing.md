# Casspr Extension - Manual Test Checklist

This document provides a comprehensive manual test checklist for the Casspr Chrome extension. Complete all tests before releasing a new version.

---

## Pre-Test Setup

1. **Load the extension in Chrome**
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `plume-ai` folder
   - Note the extension ID

2. **Configure API keys**
   - Click the Casspr extension icon
   - Add at least one API key (Groq recommended for testing)
   - Save settings

3. **Open Twitter/X**
   - Navigate to https://twitter.com or https://x.com
   - Log in if needed
   - Have the side panel available (Chrome > View > Show Side Panel)

---

## Test Categories

### Category 1: State Persistence Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 1.1 | API key persists across reload | 1. Save API key<br>2. Reload extension in chrome://extensions<br>3. Open popup | API key still present (masked) | [ ] |
| 1.2 | useSidePanel persists | 1. Enable "Open in side panel"<br>2. Reload extension<br>3. Check popup | Toggle still enabled | [ ] |
| 1.3 | Provider persists | 1. Change to Groq<br>2. Reload extension<br>3. Check popup | Provider is Groq | [ ] |
| 1.4 | Style persists | 1. Change to "Witty"<br>2. Reload extension<br>3. Check popup | Style is Witty | [ ] |
| 1.5 | All settings persist | 1. Change all settings<br>2. Reload extension<br>3. Check popup | All settings preserved | [ ] |

### Category 2: API Key Validation Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 2.1 | Valid OpenAI key format | 1. Enter "sk-abc123..." (50+ chars)<br>2. Save | Key saved successfully | [ ] |
| 2.2 | Valid Groq key format | 1. Enter "gsk_abc123..."<br>2. Save | Key saved successfully | [ ] |
| 2.3 | Valid Anthropic key format | 1. Enter "sk-ant-api03-..."<br>2. Save | Key saved successfully | [ ] |
| 2.4 | Valid Gemini key format | 1. Enter "AIzaSy..."<br>2. Save | Key saved successfully | [ ] |
| 2.5 | Empty key rejected | 1. Clear API key<br>2. Try to generate | Shows "configure API key" error | [ ] |
| 2.6 | Test button works (Groq) | 1. Enter valid Groq key<br>2. Click Test | Shows "Connected" | [ ] |
| 2.7 | Test button works (Gemini) | 1. Enter valid Gemini key<br>2. Click Test | Shows "Connected" | [ ] |
| 2.8 | Invalid key error | 1. Enter "invalid-key"<br>2. Click Test | Shows error message | [ ] |

### Category 3: Side Panel Mode Tests (CRITICAL)

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 3.1 | Floating panel hidden when side panel enabled | 1. Enable "Open in side panel"<br>2. Refresh Twitter<br>3. Click reply on tweet | NO floating panel appears | [ ] |
| 3.2 | Side panel receives tweet data | 1. Open Chrome side panel<br>2. Enable side panel mode<br>3. Click reply on tweet | Tweet appears in side panel | [ ] |
| 3.3 | Suggestions appear in side panel | 1. Side panel mode enabled<br>2. Click reply on tweet<br>3. Wait for generation | 3 suggestions in side panel | [ ] |
| 3.4 | Floating panel shows when disabled | 1. Disable "Open in side panel"<br>2. Click reply on tweet | Floating panel appears | [ ] |
| 3.5 | Toggle takes effect immediately | 1. Toggle side panel setting<br>2. Immediately click reply | Correct panel shows | [ ] |
| 3.6 | State persists after page refresh | 1. Enable side panel mode<br>2. Refresh Twitter page<br>3. Click reply | Side panel mode still active | [ ] |

### Category 4: Suggestion Generation Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 4.1 | Generate 3 suggestions | 1. Click reply on tweet<br>2. Wait for generation | Exactly 3 suggestions appear | [ ] |
| 4.2 | Suggestions are unique | 1. Generate suggestions<br>2. Compare all 3 | All 3 are different | [ ] |
| 4.3 | Rough input affects output | 1. Type "I disagree" in rough input<br>2. Generate | Suggestions reflect disagreement | [ ] |
| 4.4 | Emoji setting works | 1. Enable emojis<br>2. Generate suggestions | Suggestions contain emojis | [ ] |
| 4.5 | Hashtag setting works | 1. Enable hashtags<br>2. Generate suggestions | Suggestions contain hashtags | [ ] |
| 4.6 | Style affects output | 1. Set style to Professional<br>2. Generate | Professional tone | [ ] |
| 4.7 | Regenerate gives new suggestions | 1. Generate suggestions<br>2. Click Regenerate | Different suggestions appear | [ ] |
| 4.8 | Loading spinner shows | 1. Click reply<br>2. Observe panel | Spinner visible during generation | [ ] |

### Category 5: Copy/Use Button Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 5.1 | Copy button copies text | 1. Generate suggestions<br>2. Click copy<br>3. Paste somewhere | Text matches suggestion | [ ] |
| 5.2 | Copy shows success feedback | 1. Click copy button | Button shows checkmark briefly | [ ] |
| 5.3 | Use button inserts text | 1. Click Use button | Text appears in composer | [ ] |
| 5.4 | Panel closes after use | 1. Click Use button | Floating panel closes | [ ] |

### Category 6: Provider Switching Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 6.1 | Switch to Groq | 1. Select Groq<br>2. Enter Groq key<br>3. Generate | Uses Groq API (fast) | [ ] |
| 6.2 | Switch to Gemini | 1. Select Gemini<br>2. Enter Gemini key<br>3. Generate | Uses Gemini API | [ ] |
| 6.3 | Provider persists | 1. Change provider<br>2. Refresh page | Same provider selected | [ ] |
| 6.4 | API key per provider | 1. Switch provider<br>2. Save key<br>3. Switch back | Keys retained per provider | [ ] |

### Category 7: Error Handling Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 7.1 | No API key error | 1. Clear API key<br>2. Try to generate | Shows "configure API key" message | [ ] |
| 7.2 | Invalid API key error | 1. Enter "invalid"<br>2. Try to generate | Shows error message | [ ] |
| 7.3 | Network error handling | 1. Go offline<br>2. Try to generate | Shows error gracefully | [ ] |
| 7.4 | Empty tweet ignored | 1. Click reply on empty tweet | No panel appears | [ ] |

### Category 8: UI/UX Tests

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 8.1 | Panel positioning | 1. Click reply on different tweets | Panel near reply button | [ ] |
| 8.2 | Panel stays in viewport | 1. Reply to tweet at screen edge | Panel doesn't overflow | [ ] |
| 8.3 | Close button works | 1. Open panel<br>2. Click X | Panel closes | [ ] |
| 8.4 | Click outside closes | 1. Open panel<br>2. Click outside | Panel closes | [ ] |
| 8.5 | Escape key closes | 1. Open panel<br>2. Press Escape | Panel closes | [ ] |
| 8.6 | Settings panel slides in | 1. Click settings icon | Smooth slide animation | [ ] |
| 8.7 | Popup displays correctly | 1. Click extension icon | Popup shows with all controls | [ ] |

---

## Quick Regression Test (5 minutes)

Run these tests after any code change:

1. [ ] Extension loads without errors (check console)
2. [ ] Popup opens and shows settings
3. [ ] Click reply -> floating panel appears (side panel disabled)
4. [ ] Click reply -> no floating panel (side panel enabled)
5. [ ] Suggestions generate successfully
6. [ ] Copy button works
7. [ ] Use button inserts text

---

## Automated Tests

Run automated tests with:

```bash
npm run test:extension    # Full extension tests
npm run test:api          # API key tests only
```

---

## Troubleshooting

### Floating panel still appears when side panel is enabled

1. Check that state loaded correctly: Open DevTools on Twitter, run:
   ```javascript
   chrome.storage.local.get('cassprState', console.log)
   ```
2. Verify `useSidePanel: true` in the output
3. Reload the extension and try again

### Side panel doesn't receive tweet data

1. Ensure Chrome side panel is open before clicking reply
2. Check service worker for errors: `chrome://extensions` -> Details -> Service worker

### Suggestions not generating

1. Verify API key is correct (Test button in popup)
2. Check network tab for API errors
3. Verify provider matches the API key type

---

## Test Log

| Date | Tester | Version | Tests Passed | Tests Failed | Notes |
|------|--------|---------|--------------|--------------|-------|
| | | | | | |

---

*Last updated: 2024*
