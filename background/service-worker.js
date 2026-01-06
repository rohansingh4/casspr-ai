// background/service-worker.js
// Casspr Extension - Service Worker for AI API Calls

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_SUGGESTIONS') {
    handleGenerateSuggestions(message.tweet, message.config, sender.tab?.id);
  }
  if (message.type === 'REFINE_TEXT') {
    handleRefineText(message.text, message.originalTweet, message.config, sender.tab?.id);
  }
  if (message.type === 'OPEN_SIDE_PANEL') {
    // Use windowId from message (popup) or from sender.tab (content script)
    const windowId = message.windowId || sender.tab?.windowId;
    if (windowId) {
      chrome.sidePanel.open({ windowId }).catch(err => {
        console.error('[Casspr] Failed to open side panel:', err);
      });
    }
  }
  if (message.type === 'TEST_API_KEY') {
    handleTestApiKey(message.provider, message.apiKey)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
  return true;
});

// Handle action click - open side panel
chrome.action.onClicked.addListener((tab) => {
  // If user has set preference, open side panel
  chrome.storage.local.get('cassprState', (result) => {
    if (result.cassprState?.useSidePanel) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
});

async function handleGenerateSuggestions(tweet, config, tabId) {
  const { provider, apiKey, expertise, style, tone, length, includeEmojis, addHashtags, roughInput } = config;

  console.log('[Casspr] Generating with:', provider);

  if (!apiKey || !tabId) {
    console.error('[Casspr] Missing API key or tab ID');
    sendSuggestions(tabId, []);
    return;
  }

  const prompt = buildPrompt(tweet, { expertise, style, tone, length, includeEmojis, addHashtags, roughInput });

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
      case 'gemini':
        suggestions = await callGemini(apiKey, prompt);
        break;
      default:
        console.error('[Casspr] Unknown provider:', provider);
        suggestions = [];
    }

    console.log('[Casspr] Got', suggestions?.length || 0, 'suggestions');
    sendSuggestions(tabId, suggestions);
    await updateStats();

  } catch (error) {
    console.error('[Casspr] Error:', error.message);
    sendSuggestions(tabId, []);
  }
}

function buildPrompt(tweet, config) {
  const { expertise, style, tone, length, includeEmojis, addHashtags, roughInput, platform } = config;
  const isLinkedIn = platform === 'linkedin' || tweet.platform === 'linkedin';

  const toneDescription = tone < 33 ? 'friendly, warm, and approachable' :
                          tone > 66 ? 'authoritative, confident, and expert' :
                          'balanced, conversational, and engaging';

  // LinkedIn has more room for longer comments
  const lengthGuide = isLinkedIn
    ? (length === 'concise' ? '1-2 sentences, focused and impactful' :
       length === 'detailed' ? '2-4 sentences, insightful with clear value' :
       '2-3 sentences, professional and engaging')
    : (length === 'concise' ? '1-2 sentences, under 100 characters ideal' :
       length === 'detailed' ? '2-4 sentences, can use up to 280 characters' :
       '1-3 sentences, around 140-180 characters');

  const styleDescriptions = {
    professional: 'professional and polished',
    casual: 'casual and relaxed, like talking to a friend',
    witty: 'clever and witty, with subtle humor',
    thoughtful: 'thoughtful and insightful',
    provocative: 'bold and thought-provoking'
  };

  // For LinkedIn, default to professional style if not explicitly set
  const effectiveStyle = isLinkedIn ? (style || 'professional') : style;

  const expertiseStr = expertise.length > 0
    ? `The user has expertise in: ${expertise.join(', ')}.`
    : '';

  const roughInputStr = roughInput
    ? `\nUSER'S ROUGH IDEAS:\n"${roughInput}"\nTransform these rough thoughts into polished ${isLinkedIn ? 'comments' : 'replies'} while preserving the core message.`
    : '';

  // Platform-specific context
  const platformContext = isLinkedIn
    ? 'You are a LinkedIn engagement expert helping craft professional, insightful comments that build meaningful professional connections.'
    : 'You are a Twitter engagement expert helping craft authentic replies.';

  const authorFormat = isLinkedIn
    ? `Author: ${tweet.author}`
    : `Author: ${tweet.author} (@${tweet.handle})`;

  const postType = isLinkedIn ? 'POST' : 'TWEET';
  const actionType = isLinkedIn ? 'comment' : 'reply';

  const guidelines = isLinkedIn
    ? `GUIDELINES:
1. Add professional value - share insights, ask thoughtful questions, or offer relevant expertise
2. Be authentic and genuine - avoid generic "Great post!" comments
3. Build on the conversation - reference specific points from the post
4. Maintain professional tone appropriate for LinkedIn
5. Encourage further discussion`
    : `GUIDELINES:
1. Add genuine value - insight, question, or unique perspective
2. Be authentic - avoid generic responses
3. Match the tweet's energy
4. Spark conversation`;

  return `${platformContext}

${postType} TO ${actionType.toUpperCase()} TO:
${authorFormat}
Content: "${tweet.text}"
${roughInputStr}

REQUIREMENTS:
- Style: ${styleDescriptions[effectiveStyle] || effectiveStyle}
- Tone: ${toneDescription}
- Length: ${lengthGuide}
${expertiseStr}
${includeEmojis ? '- Include 1-2 relevant emojis' : '- No emojis'}
${addHashtags ? (isLinkedIn ? '- No hashtags (not common in LinkedIn comments)' : '- Add 1-2 relevant hashtags') : '- No hashtags'}

${guidelines}

Generate exactly 3 different ${actionType} options.

IMPORTANT: Return ONLY a JSON array with 3 strings. No markdown, no explanation.
Example: ["${actionType.charAt(0).toUpperCase() + actionType.slice(1)} 1", "${actionType.charAt(0).toUpperCase() + actionType.slice(1)} 2", "${actionType.charAt(0).toUpperCase() + actionType.slice(1)} 3"]`;
}

// Handle real-time text refinement
async function handleRefineText(text, originalTweet, config, tabId) {
  const { provider, apiKey, style, tone, platform } = config;
  const isLinkedIn = platform === 'linkedin' || originalTweet?.platform === 'linkedin';

  if (!apiKey || !tabId || !text.trim()) {
    return;
  }

  const toneDescription = tone < 33 ? 'friendly' : tone > 66 ? 'authoritative' : 'balanced';
  const postType = isLinkedIn ? 'post' : 'tweet';
  const actionType = isLinkedIn ? 'comment' : 'reply';
  const lengthGuide = isLinkedIn ? 'Keep it professional and concise.' : 'Keep it concise for Twitter (under 280 chars).';

  const prompt = `Improve this ${actionType} while keeping the same meaning and intent.

ORIGINAL ${postType.toUpperCase()}: "${originalTweet?.text || ''}"

USER'S DRAFT ${actionType.toUpperCase()}: "${text}"

Make it more ${style} and ${toneDescription}. Fix grammar, improve clarity, make it engaging.
${lengthGuide}

Return ONLY the improved text, nothing else.`;

  try {
    let refinedText;

    switch (provider) {
      case 'openai':
        refinedText = await callOpenAIRefine(apiKey, prompt);
        break;
      case 'anthropic':
        refinedText = await callAnthropicRefine(apiKey, prompt);
        break;
      case 'groq':
        refinedText = await callGroqRefine(apiKey, prompt);
        break;
      case 'gemini':
        refinedText = await callGeminiRefine(apiKey, prompt);
        break;
      default:
        return;
    }

    if (refinedText) {
      chrome.tabs.sendMessage(tabId, { type: 'REFINED_TEXT', text: refinedText }).catch(() => {});
    }
  } catch (error) {
    console.error('[Casspr] Refine error:', error);
  }
}

// Refine API calls (return single string)
async function callOpenAIRefine(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    })
  });
  if (!response.ok) throw new Error(`OpenAI: ${response.status}`);
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function callAnthropicRefine(apiKey, prompt) {
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
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) throw new Error(`Anthropic: ${response.status}`);
  const data = await response.json();
  return data.content[0]?.text?.trim() || '';
}

async function callGroqRefine(apiKey, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    })
  });
  if (!response.ok) throw new Error(`Groq: ${response.status}`);
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function callGeminiRefine(apiKey, prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
    })
  });
  if (!response.ok) throw new Error(`Gemini: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

// OpenAI
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
        { role: 'system', content: 'Return ONLY a JSON array of 3 reply strings.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 600
    })
  });

  if (!response.ok) throw new Error(`OpenAI: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.choices[0]?.message?.content || '[]');
}

// Anthropic
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
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt + '\n\nReturn ONLY a JSON array.' }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.content[0]?.text || '[]');
}

// Groq with fallback models
async function callGroq(apiKey, prompt) {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'];

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Return ONLY a JSON array of 3 reply strings.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 600
        })
      });

      if (response.ok) {
        const data = await response.json();
        return parseAIResponse(data.choices?.[0]?.message?.content || '[]');
      }
    } catch (e) {
      console.warn(`[Casspr] Groq ${model} failed:`, e.message);
    }
  }
  throw new Error('All Groq models failed');
}

// Gemini
async function callGemini(apiKey, prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt + '\n\nIMPORTANT: Return ONLY a JSON array of 3 strings.' }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 600
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  return parseAIResponse(text);
}

function parseAIResponse(content) {
  let cleaned = content.trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3).map(s => String(s).trim());
    }
  } catch (e) {}

  // Extract JSON array
  const match = cleaned.match(/\[[\s\S]*?\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed.slice(0, 3).map(s => String(s).trim());
    } catch (e) {}
  }

  // Extract quoted strings
  const quotes = cleaned.match(/"([^"]+)"/g);
  if (quotes && quotes.length >= 3) {
    return quotes.slice(0, 3).map(q => q.replace(/^"|"$/g, '').trim());
  }

  console.error('[Casspr] Failed to parse:', content);
  return [];
}

function sendSuggestions(tabId, suggestions) {
  // Send to content script
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'SUGGESTIONS_READY', suggestions }).catch(() => {});
  }
  // Also broadcast to side panel (extension pages listen via runtime.sendMessage)
  chrome.runtime.sendMessage({ type: 'SUGGESTIONS_READY', suggestions }).catch(() => {});
}

async function updateStats() {
  try {
    const stored = await chrome.storage.local.get('cassprState');
    const state = stored.cassprState || {};
    const today = new Date().toDateString();
    const stats = state.stats || { repliesGenerated: 0, tweetsAnalyzed: 0, lastReset: today };

    if (stats.lastReset !== today) {
      stats.repliesGenerated = 0;
      stats.tweetsAnalyzed = 0;
      stats.lastReset = today;
    }

    stats.repliesGenerated++;
    await chrome.storage.local.set({ cassprState: { ...state, stats } });
  } catch (e) {}
}

// Test API key validity
async function handleTestApiKey(provider, apiKey) {
  if (!apiKey) {
    return { success: false, error: 'No API key provided' };
  }

  try {
    switch (provider) {
      case 'openai':
        return await testOpenAI(apiKey);
      case 'anthropic':
        return await testAnthropic(apiKey);
      case 'groq':
        return await testGroq(apiKey);
      case 'gemini':
        return await testGemini(apiKey);
      default:
        return { success: false, error: 'Unknown provider' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testOpenAI(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (response.ok) {
    return { success: true };
  }
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error?.message || `HTTP ${response.status}`);
}

async function testAnthropic(apiKey) {
  // Anthropic doesn't have a simple test endpoint, so we make a minimal request
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
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }]
    })
  });
  if (response.ok) {
    return { success: true };
  }
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error?.message || `HTTP ${response.status}`);
}

async function testGroq(apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (response.ok) {
    return { success: true };
  }
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error?.message || `HTTP ${response.status}`);
}

async function testGemini(apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
    method: 'GET'
  });
  if (response.ok) {
    return { success: true };
  }
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error?.message || `HTTP ${response.status}`);
}

console.log('%c[Casspr] Ready', 'color:#FFF;background:#000;padding:2px 6px;border-radius:3px');
