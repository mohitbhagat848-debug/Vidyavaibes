const https = require('https');
const { OpenAI } = require('openai');

/**
 * Calls the Google Gemini REST API directly without an SDK dependency.
 * Uses fetch (Node 18+) or falls back to https.
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * @desc    Ask the AI assistant a question
 * @route   POST /api/ai/ask
 * @access  Private (any authenticated user)
 */
const askAI = async (req, res, next) => {
  try {
    const { question, context } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A question is required.',
      });
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    // ── Try Nvidia first (NIM) ──────────────────────────────────────────
    if (nvidiaKey && nvidiaKey !== 'your_nvidia_api_key_here') {
      const answer = await callNvidia(question, context, nvidiaKey);
      return res.status(200).json({
        success: true,
        question,
        answer,
        provider: 'nvidia',
      });
    }

    // ── Try Gemini next ──────────────────────────────────────────────────
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      const answer = await callGemini(question, context, apiKey);
      return res.status(200).json({
        success: true,
        question,
        answer,
        provider: 'gemini',
      });
    }

    // ── Fallback to OpenAI ────────────────────────────────────────────────
    if (openAIKey && openAIKey !== 'your_openai_api_key_here') {
      const answer = await callOpenAI(question, context, openAIKey);
      return res.status(200).json({
        success: true,
        question,
        answer,
        provider: 'openai',
      });
    }

    // ── No API key set — return a mock response for development ──────────
    const mockAnswer = getMockAnswer(question);
    return res.status(200).json({
      success: true,
      question,
      answer: mockAnswer,
      provider: 'mock',
      warning:
        'No AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env for live responses.',
    });
  } catch (error) {
    console.error('AI Assistant Error:', error.message);
    res.status(200).json({
      success: true,
      question: req.body.question,
      answer: `⚠️ **AI Error:** ${error.message}\n\nPlease check your API key configuration in the .env file.`,
      provider: 'error'
    });
  }
};

// ── Gemini API Call ──────────────────────────────────────────────────────────
const callGemini = async (question, context, apiKey) => {
  const systemPrompt = `You are AMEP AI, an intelligent and friendly AI tutor for the 
Adaptive Personalized Learning Platform. You help students understand concepts clearly, 
encourage critical thinking, and explain topics in simple terms. 
${context ? `Context about the student's current topic: ${context}` : ''}
Always structure your answer clearly, use examples, and be encouraging.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nStudent question: ${question}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`❌ Gemini API Error Details:`, errorBody);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
};

// ── OpenAI API Call ──────────────────────────────────────────────────────────
const callOpenAI = async (question, context, apiKey) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are AMEP AI, an intelligent and friendly AI tutor for the 
Adaptive Personalized Learning Platform. Help students understand concepts clearly.
${context ? `Context: ${context}` : ''}`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || 'No response from AI.';
};

// ── Nvidia (NIM) API Call ──────────────────────────────────────────────────
const callNvidia = async (question, context, apiKey) => {
  // NOTE: Node.js openai SDK uses 'baseURL' (not 'base_url' which is the Python SDK)
  const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey,
  });

  const systemPrompt = `You are AMEP AI, an intelligent and friendly AI tutor for the
Adaptive Personalized Learning Platform. Help students understand concepts clearly,
use examples, and be encouraging.
${context ? `Context about the student's current topic: ${context}` : ''}`;

  const completion = await client.chat.completions.create({
    model: 'meta/llama-3.1-8b-instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
    temperature: 0.50,
    top_p: 0.70,
    max_tokens: 1024,
    stream: false,
  });

  return completion.choices[0]?.message?.content || 'No response from Nvidia AI.';
};

// ── Mock answer for dev/testing ──────────────────────────────────────────────
const getMockAnswer = (question) => {
  return `🤖 **AMEP AI (Mock Mode)**\n\nYou asked: "${question}"\n\n` +
    `This is a placeholder response. To enable real AI responses:\n` +
    `1. Add your **GEMINI_API_KEY** or **OPENAI_API_KEY** to the \`.env\` file.\n` +
    `2. Restart the server.\n\n` +
    `The AI tutor will then provide personalized, context-aware answers to help you learn!`;
};

/**
 * @desc    Get AI chat history for a student (future feature — stored sessions)
 * @route   GET /api/ai/history
 * @access  Private
 */
const getAIHistory = async (req, res, next) => {
  // Placeholder — in production, you'd store conversations in a ChatSession model
  res.status(200).json({
    success: true,
    message: 'Chat history feature coming soon.',
    history: [],
  });
};

module.exports = { askAI, getAIHistory };
