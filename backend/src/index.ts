import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { llmManager } from './llm/index.js';
import { sourcesRouter } from './routes/sources.js';
import { analyzeRouter } from './routes/analyze.js';
import { sampleRouter } from './routes/sample.js';
import { discoverRouter } from './routes/discover.js';
import { analysisPipeline } from './analysis/pipeline.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback
llmManager.reloadEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Mount routers
app.use('/api/sources', sourcesRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/sample', sampleRouter);
app.use('/api/discover', discoverRouter);

// Direct report endpoint: GET /api/report/:id
app.get('/api/report/:id', (req, res) => {
  const reportId = String(req.params.id);
  const report = analysisPipeline.getReport(reportId);
  if (!report) {
    res.status(404).json({ error: `Report ${reportId} not found.` });
    return;
  }
  res.json({ report });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Digital Dark Spot',
    timestamp: new Date().toISOString()
  });
});

const isDev = process.env.NODE_ENV !== 'production';
const showAiStatus = process.env.SHOW_AI_STATUS === 'true' || isDev;

// Diagnostic LLM status endpoint (keys masked, never returned; gated in production)
app.get('/api/llm/status', (_req, res) => {
  if (!showAiStatus) {
    res.status(404).json({ error: 'Endpoint not found or disabled in production.' });
    return;
  }
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
