import { Router, Request, Response } from 'express';
import { analysisPipeline } from '../analysis/pipeline.js';
import { SourceInput } from '../ingestion/types.js';
import crypto from 'crypto';

export const analyzeRouter = Router();

// POST /api/analyze
analyzeRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, sources, forceRerun } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'Research question or topic is required.' });
      return;
    }

    if (!Array.isArray(sources) || sources.length === 0) {
      res.status(400).json({ error: 'At least one source (URL or pasted text) is required.' });
      return;
    }

    const sourceInputs: SourceInput[] = sources.map((s: any, idx: number) => ({
      id: s.id,
      type: s.type === 'text' ? 'text' : 'url',
      value: typeof s.value === 'string' ? s.value : '',
      title: typeof s.title === 'string' ? s.title : undefined
    }));

    const jobId = `job-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Kick off pipeline asynchronously so response is immediate
    analysisPipeline.run(jobId, question, sourceInputs, Boolean(forceRerun)).catch(err => {
      console.error(`Error in async pipeline job ${jobId}:`, err);
    });

    res.json({
      jobId,
      status: 'started',
      message: 'Analysis initiated across 5 pipeline stages.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal analysis startup error' });
  }
});

// GET /api/analyze/:id/status
analyzeRouter.get('/:id/status', (req: Request, res: Response): void => {
  const jobId = String(req.params.id);
  const progress = analysisPipeline.getJob(jobId);

  if (!progress) {
    res.status(404).json({ error: `Job ${jobId} not found.` });
    return;
  }

  res.json({ progress });
});

// GET /api/report/:id
analyzeRouter.get('/report/:id', (req: Request, res: Response): void => {
  const reportId = String(req.params.id);
  const report = analysisPipeline.getReport(reportId);

  if (!report) {
    res.status(404).json({ error: `Report ${reportId} not found.` });
    return;
  }

  res.json({ report });
});
