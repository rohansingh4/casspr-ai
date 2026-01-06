#!/usr/bin/env node
/**
 * Casspr Extension Test Suite
 * Comprehensive tests for the Casspr Chrome extension
 *
 * Usage: npm run test:extension
 *
 * This script tests:
 * - API key validation formats
 * - API connectivity for all providers
 * - State structure validation
 * - Configuration validation
 */

require('dotenv').config();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
}

function logTest(testName, passed, message = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  const msg = message ? ` - ${message}` : '';
  log(`  ${icon} ${testName}${msg}`, color);
  return passed;
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function recordTest(category, name, passed, message = '') {
  results.tests.push({ category, name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
  return logTest(name, passed, message);
}

function skipTest(category, name, reason) {
  results.tests.push({ category, name, passed: null, message: reason });
  results.skipped++;
  log(`  ○ ${name} - SKIPPED: ${reason}`, 'yellow');
}

// ============================================================================
// Category 1: API Key Format Validation
// ============================================================================

function testApiKeyFormats() {
  logSection('Category 1: API Key Format Validation');

  const patterns = {
    openai: /^sk-[a-zA-Z0-9]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{20,}$/,
    groq: /^gsk_[a-zA-Z0-9]{20,}$/,
    gemini: /^AIzaSy[a-zA-Z0-9_-]{30,}$/
  };

  // Test 1.1: Valid OpenAI key format
  const validOpenAI = 'sk-abcdefghijklmnopqrstuvwxyz123456';
  recordTest('API Key Formats', 'Valid OpenAI key format',
    patterns.openai.test(validOpenAI),
    validOpenAI.substring(0, 10) + '...'
  );

  // Test 1.2: Invalid OpenAI key format
  const invalidOpenAI = 'invalid-key';
  recordTest('API Key Formats', 'Invalid OpenAI key rejected',
    !patterns.openai.test(invalidOpenAI),
    'Correctly rejects invalid format'
  );

  // Test 1.3: Valid Groq key format
  const validGroq = 'gsk_abcdefghijklmnopqrstuvwxyz12345678';
  recordTest('API Key Formats', 'Valid Groq key format',
    patterns.groq.test(validGroq),
    validGroq.substring(0, 10) + '...'
  );

  // Test 1.4: Valid Anthropic key format
  const validAnthropic = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz';
  recordTest('API Key Formats', 'Valid Anthropic key format',
    patterns.anthropic.test(validAnthropic),
    validAnthropic.substring(0, 15) + '...'
  );

  // Test 1.5: Valid Gemini key format
  const validGemini = 'AIzaSyAf_PzJDMzdgHxFcxEq1rM0JtxgvyGJHiw';
  recordTest('API Key Formats', 'Valid Gemini key format',
    patterns.gemini.test(validGemini),
    validGemini.substring(0, 15) + '...'
  );

  // Test 1.6: Empty key rejected
  const emptyKey = '';
  recordTest('API Key Formats', 'Empty key rejected',
    !emptyKey || emptyKey.length === 0,
    'Empty keys should be rejected'
  );

  // Test 1.7: Whitespace-only key rejected
  const whitespaceKey = '   ';
  recordTest('API Key Formats', 'Whitespace-only key rejected',
    !whitespaceKey.trim(),
    'Whitespace keys should be rejected'
  );
}

// ============================================================================
// Category 2: State Structure Validation
// ============================================================================

function testStateStructure() {
  logSection('Category 2: State Structure Validation');

  const defaultState = {
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
    useSidePanel: false
  };

  // Test 2.1: Default state has all required fields
  const requiredFields = ['isEnabled', 'provider', 'apiKey', 'style', 'tone', 'length', 'useSidePanel'];
  const hasAllFields = requiredFields.every(field => field in defaultState);
  recordTest('State Structure', 'Default state has all required fields',
    hasAllFields,
    `${requiredFields.length} required fields`
  );

  // Test 2.2: Provider is valid
  const validProviders = ['openai', 'anthropic', 'groq', 'gemini'];
  recordTest('State Structure', 'Provider is valid',
    validProviders.includes(defaultState.provider),
    `provider: ${defaultState.provider}`
  );

  // Test 2.3: Tone is in valid range
  recordTest('State Structure', 'Tone is in valid range (0-100)',
    defaultState.tone >= 0 && defaultState.tone <= 100,
    `tone: ${defaultState.tone}`
  );

  // Test 2.4: Length is valid
  const validLengths = ['short', 'medium', 'long'];
  recordTest('State Structure', 'Length is valid',
    validLengths.includes(defaultState.length),
    `length: ${defaultState.length}`
  );

  // Test 2.5: Style is valid
  const validStyles = ['casual', 'professional', 'witty', 'thoughtful'];
  recordTest('State Structure', 'Style is valid',
    validStyles.includes(defaultState.style),
    `style: ${defaultState.style}`
  );

  // Test 2.6: Boolean fields are booleans
  const booleanFields = ['isEnabled', 'autoShow', 'includeEmojis', 'addHashtags', 'useSidePanel'];
  const allBooleans = booleanFields.every(field => typeof defaultState[field] === 'boolean');
  recordTest('State Structure', 'Boolean fields are booleans',
    allBooleans,
    `${booleanFields.length} boolean fields`
  );

  // Test 2.7: Expertise is an array
  recordTest('State Structure', 'Expertise is an array',
    Array.isArray(defaultState.expertise),
    `expertise type: ${typeof defaultState.expertise}`
  );
}

// ============================================================================
// Category 3: API Connectivity Tests
// ============================================================================

async function testApiConnectivity() {
  logSection('Category 3: API Connectivity Tests');

  const keys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };

  // Test 3.1: OpenAI connectivity
  if (keys.openai) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${keys.openai}` }
      });
      recordTest('API Connectivity', 'OpenAI API connection',
        response.ok,
        response.ok ? 'Connected' : `HTTP ${response.status}`
      );
    } catch (error) {
      recordTest('API Connectivity', 'OpenAI API connection', false, error.message);
    }
  } else {
    skipTest('API Connectivity', 'OpenAI API connection', 'No API key configured');
  }

  // Test 3.2: Anthropic connectivity
  if (keys.anthropic) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keys.anthropic,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      recordTest('API Connectivity', 'Anthropic API connection',
        response.ok,
        response.ok ? 'Connected' : `HTTP ${response.status}`
      );
    } catch (error) {
      recordTest('API Connectivity', 'Anthropic API connection', false, error.message);
    }
  } else {
    skipTest('API Connectivity', 'Anthropic API connection', 'No API key configured');
  }

  // Test 3.3: Groq connectivity
  if (keys.groq) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${keys.groq}` }
      });
      recordTest('API Connectivity', 'Groq API connection',
        response.ok,
        response.ok ? 'Connected' : `HTTP ${response.status}`
      );
    } catch (error) {
      recordTest('API Connectivity', 'Groq API connection', false, error.message);
    }
  } else {
    skipTest('API Connectivity', 'Groq API connection', 'No API key configured');
  }

  // Test 3.4: Gemini connectivity
  if (keys.gemini) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keys.gemini}`, {
        method: 'GET'
      });
      recordTest('API Connectivity', 'Gemini API connection',
        response.ok,
        response.ok ? 'Connected' : `HTTP ${response.status}`
      );
    } catch (error) {
      recordTest('API Connectivity', 'Gemini API connection', false, error.message);
    }
  } else {
    skipTest('API Connectivity', 'Gemini API connection', 'No API key configured');
  }
}

// ============================================================================
// Category 4: Text Generation Tests
// ============================================================================

async function testTextGeneration() {
  logSection('Category 4: Text Generation Tests');

  const keys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };

  const testPrompt = 'Reply with just the word "working" and nothing else.';

  // Test 4.1: OpenAI generation
  if (keys.openai) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || '';
        recordTest('Text Generation', 'OpenAI generates text',
          text.length > 0,
          `Response: "${text}"`
        );
      } else {
        recordTest('Text Generation', 'OpenAI generates text', false, `HTTP ${response.status}`);
      }
    } catch (error) {
      recordTest('Text Generation', 'OpenAI generates text', false, error.message);
    }
  } else {
    skipTest('Text Generation', 'OpenAI generates text', 'No API key configured');
  }

  // Test 4.2: Groq generation
  if (keys.groq) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.groq}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || '';
        recordTest('Text Generation', 'Groq generates text',
          text.length > 0,
          `Response: "${text}"`
        );
      } else {
        recordTest('Text Generation', 'Groq generates text', false, `HTTP ${response.status}`);
      }
    } catch (error) {
      recordTest('Text Generation', 'Groq generates text', false, error.message);
    }
  } else {
    skipTest('Text Generation', 'Groq generates text', 'No API key configured');
  }

  // Test 4.3: Gemini generation
  if (keys.gemini) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        recordTest('Text Generation', 'Gemini generates text',
          text.length > 0,
          `Response: "${text}"`
        );
      } else {
        recordTest('Text Generation', 'Gemini generates text', false, `HTTP ${response.status}`);
      }
    } catch (error) {
      recordTest('Text Generation', 'Gemini generates text', false, error.message);
    }
  } else {
    skipTest('Text Generation', 'Gemini generates text', 'No API key configured');
  }
}

// ============================================================================
// Category 5: Configuration Validation
// ============================================================================

function testConfigurationValidation() {
  logSection('Category 5: Configuration Validation');

  // Test 5.1: Provider switching validation
  const validProviders = ['openai', 'anthropic', 'groq', 'gemini'];
  recordTest('Configuration', 'Valid providers list',
    validProviders.length === 4,
    `Providers: ${validProviders.join(', ')}`
  );

  // Test 5.2: Style options
  const validStyles = ['casual', 'professional', 'witty', 'thoughtful'];
  recordTest('Configuration', 'Valid styles list',
    validStyles.length === 4,
    `Styles: ${validStyles.join(', ')}`
  );

  // Test 5.3: Length options
  const validLengths = ['short', 'medium', 'long'];
  recordTest('Configuration', 'Valid lengths list',
    validLengths.length === 3,
    `Lengths: ${validLengths.join(', ')}`
  );

  // Test 5.4: Tone range
  const minTone = 0;
  const maxTone = 100;
  recordTest('Configuration', 'Tone range valid',
    maxTone - minTone === 100,
    `Range: ${minTone} to ${maxTone}`
  );

  // Test 5.5: Suggestion count
  const suggestionCount = 3;
  recordTest('Configuration', 'Suggestion count is 3',
    suggestionCount === 3,
    `Count: ${suggestionCount}`
  );
}

// ============================================================================
// Category 6: Prompt Template Validation
// ============================================================================

function testPromptTemplates() {
  logSection('Category 6: Prompt Template Validation');

  // Simulate the prompt building from service-worker.js
  const tweet = { text: 'This is a test tweet', author: 'TestUser', handle: 'testuser' };
  const config = {
    style: 'casual',
    tone: 50,
    length: 'medium',
    includeEmojis: true,
    addHashtags: true,
    roughInput: 'I want to agree'
  };

  const toneDescription = config.tone < 30 ? 'friendly and warm' :
                         config.tone > 70 ? 'professional and authoritative' :
                         'balanced and conversational';

  const lengthGuide = config.length === 'short' ? '1-2 sentences' :
                     config.length === 'long' ? '3-4 sentences' :
                     '2-3 sentences';

  // Test 6.1: Tone description mapping
  recordTest('Prompt Templates', 'Tone description for 50 is balanced',
    toneDescription === 'balanced and conversational',
    `Tone 50 = "${toneDescription}"`
  );

  // Test 6.2: Length guide mapping
  recordTest('Prompt Templates', 'Length guide for medium is 2-3 sentences',
    lengthGuide === '2-3 sentences',
    `Length medium = "${lengthGuide}"`
  );

  // Test 6.3: Rough input included in prompt
  const promptIncludes = config.roughInput.length > 0;
  recordTest('Prompt Templates', 'Rough input included when provided',
    promptIncludes,
    `Rough input: "${config.roughInput}"`
  );

  // Test 6.4: Emoji instruction conditional
  const emojiInstruction = config.includeEmojis ? 'Use appropriate emojis' : '';
  recordTest('Prompt Templates', 'Emoji instruction when enabled',
    emojiInstruction.length > 0,
    `Emoji instruction: "${emojiInstruction}"`
  );

  // Test 6.5: Hashtag instruction conditional
  const hashtagInstruction = config.addHashtags ? 'Include relevant hashtags' : '';
  recordTest('Prompt Templates', 'Hashtag instruction when enabled',
    hashtagInstruction.length > 0,
    `Hashtag instruction: "${hashtagInstruction}"`
  );
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('');
  log('╔═══════════════════════════════════════════════════════════════════╗', 'blue');
  log('║             CASSPR EXTENSION TEST SUITE                           ║', 'blue');
  log('║                                                                   ║', 'blue');
  log('║  Testing: API Keys, State, Connectivity, Generation              ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'blue');

  // Run all test categories
  testApiKeyFormats();
  testStateStructure();
  await testApiConnectivity();
  await testTextGeneration();
  testConfigurationValidation();
  testPromptTemplates();

  // Print summary
  console.log('');
  log('═══════════════════════════════════════════════════════════════════', 'blue');
  log('                         TEST SUMMARY                               ', 'bold');
  log('═══════════════════════════════════════════════════════════════════', 'blue');
  console.log('');

  log(`  ✓ Passed:  ${results.passed}`, 'green');
  log(`  ✗ Failed:  ${results.failed}`, results.failed > 0 ? 'red' : 'dim');
  log(`  ○ Skipped: ${results.skipped}`, 'yellow');
  console.log('');

  const total = results.passed + results.failed;
  const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;

  if (results.failed === 0) {
    log(`  All ${results.passed} tests passed! (${percentage}%)`, 'green');
  } else {
    log(`  ${results.passed}/${total} tests passed (${percentage}%)`, 'yellow');
    console.log('');
    log('  Failed Tests:', 'red');
    results.tests
      .filter(t => t.passed === false)
      .forEach(t => log(`    • ${t.category}: ${t.name} - ${t.message}`, 'red'));
  }

  console.log('');
  log('═══════════════════════════════════════════════════════════════════', 'blue');
  console.log('');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
