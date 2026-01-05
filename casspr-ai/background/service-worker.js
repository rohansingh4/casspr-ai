// background/service-worker.js
// Casspr Extension - Service Worker for AI API Calls

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_SUGGESTIONS') {
    handleGenerateSuggestions(message.tweet, message.config, sender.tab?.id);
  }
  return true;
});

async function handleGenerateSuggestions(tweet, config, tabId) {
  const { provider, apiKey, expertise, style, tone, length, includeEmojis, addHashtags } = config;

  console.log('[Casspr] Generating with:', provider);

  if (!apiKey || !tabId) {
    console.error('[Casspr] Missing API key or tab ID');
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
  const { expertise, style, tone, length, includeEmojis, addHashtags } = config;

  const toneDescription = tone < 33 ? 'friendly, warm, and approachable' :
                          tone > 66 ? 'authoritative, confident, and expert' :
                          'balanced, conversational, and engaging';

  const lengthGuide = length === 'concise' ? '1-2 sentences, under 100 characters ideal' :
                      length === 'detailed' ? '2-4 sentences, can use up to 280 characters' :
                      '1-3 sentences, around 140-180 characters';

  const styleDescriptions = {
    professional: 'professional and polished',
    casual: 'casual and relaxed, like talking to a friend',
    witty: 'clever and witty, with subtle humor',
    thoughtful: 'thoughtful and insightful',
    provocative: 'bold and thought-provoking'
  };

  const expertiseStr = expertise.length > 0
    ? `The user has expertise in: ${expertise.join(', ')}.`
    : '';

  return `You are a Twitter engagement expert helping craft authentic replies.

TWEET TO REPLY TO:
Author: ${tweet.author} (@${tweet.handle})
Content: "${tweet.text}"

REQUIREMENTS:
- Style: ${styleDescriptions[style] || style}
- Tone: ${toneDescription}
- Length: ${lengthGuide}
${expertiseStr}
${includeEmojis ? '- Include 1-2 relevant emojis' : '- No emojis'}
${addHashtags ? '- Add 1-2 relevant hashtags' : '- No hashtags'}

GUIDELINES:
1. Add genuine value - insight, question, or unique perspective
2. Be authentic - avoid generic responses
3. Match the tweet's energy
4. Spark conversation

Generate exactly 3 different reply options.

IMPORTANT: Return ONLY a JSON array with 3 strings. No markdown, no explanation.
Example: ["Reply 1", "Reply 2", "Reply 3"]`;
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
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: 'SUGGESTIONS_READY', suggestions }).catch(() => {});
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

console.log('%c[Casspr] Ready', 'color:#FFF;background:#000;padding:2px 6px;border-radius:3px');
