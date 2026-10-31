import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { llmManager } from './llm/index.js';
import { searchManager } from './search/manager.js';
import { sourcesRouter } from './routes/sources.js';
import { analyzeRouter } from './routes/analyze.js';
import { sampleRouter } from './routes/sample.js';
import { discoverRouter } from './routes/discover.js';
import { analysisPipeline } from './analysis/pipeline.js';
import { loadFixtureScenario } from './data/sampleData.js';
import { persistentStore } from './store/persistentStore.js';

// Load environment variables with fallback search paths
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env')
];
let loadedEnvPath = 'default process.env';
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    dotenv.config({ path: cand });
    loadedEnvPath = cand;
    break;
  }
}
dotenv.config(); // fallback

// Reload both LLM and Search managers after dotenv loads the environment
llmManager.reloadEnvironment();
searchManager.reloadEnvironment();

console.log(`[Env] Loaded environment from: ${loadedEnvPath}`);
console.log(`[Env] SEARCH_PROVIDER_ORDER: ${process.env.SEARCH_PROVIDER_ORDER || 'gemini,tavily,brave'}`);
console.log(`[Env] Tavily key present: ${Boolean(process.env.TAVILY_API_KEYS?.trim())}, Gemini keys count: ${(process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean).length}`);

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
  let report = analysisPipeline.getReport(reportId);
  if (!report && reportId.startsWith('sample-')) {
    try {
      const scenarioKey = reportId.replace(/^sample-/, '');
      const fixtureData = loadFixtureScenario(scenarioKey);
      analysisPipeline.setReport(fixtureData.report);
      report = fixtureData.report;
    } catch {
      // not a sample fixture
    }
  }
  if (!report) {
    res.status(404).json({ error: `Report ${reportId} not found.` });
    return;
  }
  res.json({ report });
});

// Snapshot creation endpoint: POST /api/report/:id/snapshot
app.post('/api/report/:id/snapshot', (req, res) => {
  const reportId = String(req.params.id);
  const report = analysisPipeline.getReport(reportId);
  if (!report) {
    res.status(404).json({ error: `Report ${reportId} not found.` });
    return;
  }
  const saved = persistentStore.saveDemoSnapshot(report);
  res.json({
    success: true,
    snapshotId: saved.snapshotId,
    message: `Report saved as demo snapshot (${saved.snapshotId}). Accessible offline with zero LLM and search calls.`
  });
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
const showAiStatus = process.env.SHOW_AI_STATUS === 'true';

// Diagnostic LLM and Search status endpoint (keys masked, never returned; gated by SHOW_AI_STATUS=true)
app.get('/api/llm/status', (_req, res) => {
  const isEnabled = process.env.SHOW_AI_STATUS === 'true';
  if (!isEnabled) {
    res.json({ available: false });
    return;
  }
  try {
    const diagnostics = llmManager.getDiagnostics();
    const searchDiagnostics = searchManager.getDiagnostics();
    res.json({
      available: true,
      providers: diagnostics,
      searchProviders: searchDiagnostics,
      hasConfiguredKeys: llmManager.hasAnyKeys(),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Saved snapshots endpoint (if docs/demo-snapshots/ is empty, available=false)
app.get('/api/snapshots', (_req, res) => {
  const candidates = [
    path.resolve(process.cwd(), 'docs', 'demo-snapshots'),
    path.resolve(process.cwd(), '../docs', 'demo-snapshots')
  ];
  let targetDir = candidates[0];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      targetDir = c;
      break;
    }
  }

  let snapshots: string[] = [];
  if (fs.existsSync(targetDir)) {
    snapshots = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));
  }

  res.json({
    available: snapshots.length > 0,
    count: snapshots.length,
    snapshots,
    message: snapshots.length === 0 ? 'No snapshots in docs/demo-snapshots/' : undefined
  });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🍉 Digital Dark Spot server listening on http://localhost:${PORT}`);
  });
}
