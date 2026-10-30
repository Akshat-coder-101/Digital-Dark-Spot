import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Digital Dark Spot',
    timestamp: new Date().toISOString()
  });
});

// Mock LLM status endpoint (implemented fully in Step 2)
app.get('/api/llm/status', (_req, res) => {
  const geminiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
  const openaiKeys = (process.env.OPENAI_API_KEYS || '').split(',').filter(Boolean);
  const anthropicKeys = (process.env.ANTHROPIC_API_KEYS || '').split(',').filter(Boolean);

  res.json({
    providers: [
      {
        name: 'Google Gemini',
        enabled: geminiKeys.length > 0,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        keyCount: geminiKeys.length,
        inCooldown: false
      },
      {
        name: 'OpenAI',
        enabled: openaiKeys.length > 0,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        keyCount: openaiKeys.length,
        inCooldown: false
      },
      {
        name: 'Anthropic',
        enabled: anthropicKeys.length > 0,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        keyCount: anthropicKeys.length,
        inCooldown: false
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🍉 Digital Dark Spot server listening on http://localhost:${PORT}`);
});
