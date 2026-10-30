import { Router, Request, Response } from 'express';
import { analysisPipeline } from '../analysis/pipeline.js';
import { SourceInput } from '../ingestion/types.js';
import crypto from 'crypto';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const RATE_LIMIT_MAX_PER_HOUR = 5; // 5 analyses per hour per IP

export function resetRateLimitsForTesting(): void {
  ipRateLimits.clear();
}

export const analyzeRouter = Router();

// POST /api/analyze
analyzeRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const rateRecord = ipRateLimits.get(clientIp);
    const skipRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';

    if (!skipRateLimit) {
      if (rateRecord && rateRecord.resetTime > now) {
        if (rateRecord.count >= RATE_LIMIT_MAX_PER_HOUR) {
          res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED: You have reached the analysis request limit (5 analyses per hour).',
            sampleAvailable: true,
            message: 'To protect system capacity during high load, rate limits apply. You can continue exploring without restrictions by selecting "Use sample data".'
          });
          return;
        }
        rateRecord.count++;
      } else {
        ipRateLimits.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      }
    }

    const { question, sources, forceRerun, expectedAttributes } = req.body;

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

    const customAttrs: string[] | undefined = Array.isArray(expectedAttributes)
      ? expectedAttributes.filter(a => typeof a === 'string' && a.trim().length > 0)
      : undefined;

    const jobId = `job-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Kick off pipeline asynchronously so response is immediate
    analysisPipeline.run(jobId, question, sourceInputs, Boolean(forceRerun), undefined, customAttrs).catch(err => {
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
