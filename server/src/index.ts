import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { llmManager } from './llm/index.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback
llmManager.reloadEnvironment();

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

// Diagnostic LLM status endpoint (keys masked, never returned)
app.get('/api/llm/status', (_req, res) => {
  try {
    const diagnostics = llmManager.getDiagnostics();
    res.json({
      providers: diagnostics,
      hasConfiguredKeys: llmManager.hasAnyKeys(),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🍉 Digital Dark Spot server listening on http://localhost:${PORT}`);
});
