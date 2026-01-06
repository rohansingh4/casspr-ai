#!/usr/bin/env node
/**
 * Casspr API Key Test Script
 * Tests all configured API keys to verify they're working
 *
 * Usage: npm run test:api
 */

require('dotenv').config();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logResult(provider, success, message) {
  const icon = success ? '✓' : '✗';
  const color = success ? 'green' : 'red';
  log(`  ${icon} ${provider}: ${message}`, color);
}

// Test OpenAI API
async function testOpenAI(apiKey) {
  if (!apiKey) return { success: false, message: 'No API key configured' };

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (response.ok) {
      const data = await response.json();
      const hasGpt4oMini = data.data?.some(m => m.id.includes('gpt-4o-mini'));
      return {
        success: true,
        message: `Connected (${data.data?.length || 0} models available${hasGpt4oMini ? ', gpt-4o-mini available' : ''})`
      };
    }

    const error = await response.json().catch(() => ({}));
    return { success: false, message: error.error?.message || `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Test Anthropic API
async function testAnthropic(apiKey) {
  if (!apiKey) return { success: false, message: 'No API key configured' };

  try {
    // Anthropic doesn't have a simple test endpoint, make minimal request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (response.ok) {
      return { success: true, message: 'Connected (claude-3-5-sonnet-20241022 available)' };
    }

    const error = await response.json().catch(() => ({}));
    return { success: false, message: error.error?.message || `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Test Groq API
async function testGroq(apiKey) {
  if (!apiKey) return { success: false, message: 'No API key configured' };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.data?.map(m => m.id) || [];
      const hasLlama = models.some(m => m.includes('llama'));
      return {
        success: true,
        message: `Connected (${models.length} models${hasLlama ? ', llama models available' : ''})`
      };
    }

    const error = await response.json().catch(() => ({}));
    return { success: false, message: error.error?.message || `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Test Gemini API
async function testGemini(apiKey) {
  if (!apiKey) return { success: false, message: 'No API key configured' };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map(m => m.name) || [];
      const hasFlash = models.some(m => m.includes('gemini-2.0-flash') || m.includes('gemini-1.5-flash'));
      return {
        success: true,
        message: `Connected (${models.length} models${hasFlash ? ', flash models available' : ''})`
      };
    }

    const error = await response.json().catch(() => ({}));
    return { success: false, message: error.error?.message || `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Test a simple generation to verify the key actually works
async function testGeneration(provider, apiKey) {
  const testPrompt = 'Reply with just the word "working" and nothing else.';

  try {
    let response, text;

    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 10
          })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = (await response.json()).choices?.[0]?.message?.content;
        break;

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: testPrompt }]
          })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = (await response.json()).content?.[0]?.text;
        break;

      case 'groq':
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 10
          })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = (await response.json()).choices?.[0]?.message?.content;
        break;

      case 'gemini':
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = (await response.json()).candidates?.[0]?.content?.parts?.[0]?.text;
        break;
    }

    return { success: true, message: `Generation works: "${text?.trim()}"` };
  } catch (error) {
    return { success: false, message: `Generation failed: ${error.message}` };
  }
}

async function main() {
  console.log('');
  log('═══════════════════════════════════════════════════════', 'blue');
  log('           Casspr API Key Test Suite', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  console.log('');

  const keys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };

  // Show which keys are configured
  log('Configured Keys:', 'yellow');
  Object.entries(keys).forEach(([provider, key]) => {
    if (key) {
      log(`  • ${provider}: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`, 'dim');
    } else {
      log(`  • ${provider}: (not configured)`, 'dim');
    }
  });
  console.log('');

  // Test connectivity
  log('Testing API Connectivity:', 'yellow');

  const results = {};

  results.openai = await testOpenAI(keys.openai);
  logResult('OpenAI', results.openai.success, results.openai.message);

  results.anthropic = await testAnthropic(keys.anthropic);
  logResult('Anthropic', results.anthropic.success, results.anthropic.message);

  results.groq = await testGroq(keys.groq);
  logResult('Groq', results.groq.success, results.groq.message);

  results.gemini = await testGemini(keys.gemini);
  logResult('Gemini', results.gemini.success, results.gemini.message);

  console.log('');

  // Test actual generation for configured keys
  log('Testing Text Generation:', 'yellow');

  for (const [provider, key] of Object.entries(keys)) {
    if (key && results[provider].success) {
      const genResult = await testGeneration(provider, key);
      logResult(provider, genResult.success, genResult.message);
    }
  }

  console.log('');

  // Summary
  const working = Object.entries(results).filter(([_, r]) => r.success).length;
  const configured = Object.values(keys).filter(Boolean).length;

  log('═══════════════════════════════════════════════════════', 'blue');
  if (working === configured && configured > 0) {
    log(`  All ${working} configured API keys are working!`, 'green');
  } else if (working > 0) {
    log(`  ${working}/${configured} configured API keys are working`, 'yellow');
  } else {
    log('  No API keys are working. Check your .env file.', 'red');
  }
  log('═══════════════════════════════════════════════════════', 'blue');
  console.log('');
}

main().catch(console.error);
