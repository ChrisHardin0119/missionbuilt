const Anthropic = require('@anthropic-ai/sdk');

// In-memory session tracking (resets on cold start, but sufficient for demo)
const sessionMessages = new Map();
const MESSAGE_LIMIT = 25;
const LIMIT_MESSAGE = "You've reached the 25-message demo limit! This chatbot is for demonstration purposes only. If you'd like to see more of what I can build, reach out through the contact form below.";
const SYSTEM_PROMPT = "You are a demo AI assistant on Christopher Hardin's portfolio website (MissionBuilt.dev). You showcase what custom AI chatbots can do for businesses. You're helpful, conversational, and occasionally mention that Chris can build a chatbot like this customized for their specific business. Keep responses concise (2-3 sentences max). If asked about pricing or specific projects, suggest they reach out through the contact form.";
const FIRST_MESSAGE_DISCLAIMER = "Note: This is a demo chatbot with a 25-message limit. ";

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields: message and sessionId' });
    }

    // Check session message limit
    const currentCount = sessionMessages.get(sessionId) || 0;

    if (currentCount >= MESSAGE_LIMIT) {
      return res.json({ reply: LIMIT_MESSAGE, messagesRemaining: 0 });
    }

    const isFirstMessage = currentCount === 0;

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }]
    });

    let reply = response.content[0].text;

    if (isFirstMessage) {
      reply = FIRST_MESSAGE_DISCLAIMER + reply;
    }

    // Increment message count
    const newCount = currentCount + 1;
    sessionMessages.set(sessionId, newCount);

    return res.json({
      reply: reply,
      messagesRemaining: MESSAGE_LIMIT - newCount
    });

  } catch (error) {
    console.error('Error calling Claude API:', error);
    return res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
};
