// Import required packages
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

// Load API key from .env file
function loadApiKey() {
  const envPaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server', '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  }
  return process.env.ANTHROPIC_API_KEY || null;
}

const API_KEY = loadApiKey();
if (!API_KEY) {
  console.error('ERROR: No ANTHROPIC_API_KEY found. Create a .env file with your key.');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: API_KEY,
});

// Middleware - allows parsing JSON request bodies
app.use(express.json());

// Middleware - enables Cross-Origin Resource Sharing (allows requests from the portfolio website)
app.use(cors());

// Store message counts per session in memory
// Format: { sessionId: messageCount }
const sessionMessages = new Map();

// Constants
const MESSAGE_LIMIT = 25;
const LIMIT_MESSAGE = "You've reached the 25-message demo limit! This chatbot is for demonstration purposes only. If you'd like to see more of what I can build, reach out through the contact form below.";

const SYSTEM_PROMPT = "You are a demo AI assistant on Christopher Hardin's portfolio website. You showcase what custom AI chatbots can do for businesses. You're helpful, conversational, and occasionally mention that Chris can build a chatbot like this customized for their specific business. Keep responses concise (2-3 sentences max). If asked about pricing or specific projects, suggest they reach out through the contact form.";

const FIRST_MESSAGE_DISCLAIMER = "Note: This is a demo chatbot with a 25-message limit. ";

// Serve static files from the parent directory (the portfolio folder)
app.use(express.static(path.join(__dirname, '..')));

// GET endpoint - check remaining messages for a session
app.get('/api/chat/remaining/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // Get message count for this session (default to 0 if not found)
  const messageCount = sessionMessages.get(sessionId) || 0;
  const remaining = Math.max(0, MESSAGE_LIMIT - messageCount);

  res.json({
    remaining: remaining,
    messageCount: messageCount,
    isLimited: messageCount >= MESSAGE_LIMIT
  });
});

// POST endpoint - handle chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validate required fields
    if (!message || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: message and sessionId'
      });
    }

    // Check if session message limit is reached
    const currentCount = sessionMessages.get(sessionId) || 0;

    if (currentCount >= MESSAGE_LIMIT) {
      return res.json({
        reply: LIMIT_MESSAGE,
        messagesRemaining: 0
      });
    }

    // Check if this is the first message in the session
    const isFirstMessage = currentCount === 0;

    // Call Claude API with the user message
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    // Extract the text response from Claude
    let reply = response.content[0].text;

    // Add disclaimer to first message
    if (isFirstMessage) {
      reply = FIRST_MESSAGE_DISCLAIMER + reply;
    }

    // Increment message count for this session
    const newCount = currentCount + 1;
    sessionMessages.set(sessionId, newCount);

    // Calculate remaining messages
    const messagesRemaining = MESSAGE_LIMIT - newCount;

    // Return the response
    res.json({
      reply: reply,
      messagesRemaining: messagesRemaining
    });

  } catch (error) {
    console.error('Error calling Claude API:', error);

    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Portfolio AI Chatbot server running on http://localhost:${PORT}`);
  console.log('Make sure ANTHROPIC_API_KEY is set in your environment variables!');
});
