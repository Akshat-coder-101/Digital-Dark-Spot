import { Router, Request, Response } from 'express';
import { discoveryService } from '../search/discoveryService.js';
import crypto from 'crypto';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_PER_MINUTE = 10; // 10 discoveries per minute per IP

export function resetDiscoverRateLimitsForTesting(): void {
  ipRateLimits.clear();
}

export const discoverRouter = Router();

// POST /api/discover
discoverRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers && req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const rateRecord = ipRateLimits.get(clientIp);
    const skipRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';

    if (!skipRateLimit) {
      if (rateRecord && rateRecord.resetTime > now) {
        if (rateRecord.count >= RATE_LIMIT_MAX_PER_MINUTE) {
          const retryAfterSec = Math.max(1, Math.ceil((rateRecord.resetTime - now) / 1000));
          res.setHeader('Retry-After', String(retryAfterSec));
          res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED: You have reached the discovery request limit (10 discoveries per minute).',
            retryAfter: retryAfterSec,
            message: 'To protect search quotas, please wait before initiating another discovery request.'
          });
          return;
        }
        rateRecord.count++;
      } else {
        ipRateLimits.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      }
    }

    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'Question is required for automated source discovery.' });
      return;
    }

    const discoveryId = `disc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Kick off discovery
    discoveryService.runDiscovery(discoveryId, question.trim()).catch(err => {
      console.error(`[Discover] Error in job ${discoveryId}:`, err);
    });

    res.json({
      discoveryId,
      status: 'started',
      message: 'Automatic source discovery initiated.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Discovery failure' });
  }
});

// GET /api/discover/:id
discoverRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  let job = discoveryService.getJob(id);

  // If not found in memory or persistent store, attempt auto-recovery
  if (!job) {
    const questionFromQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (questionFromQuery) {
      console.log(`[Discover Recovery] Re-running discovery for job ${id} from query question: "${questionFromQuery}"`);
      job = await discoveryService.runDiscovery(id, questionFromQuery);
    } else if (id.includes('sample')) {
      job = await discoveryService.runDiscovery(id, 'Sample Topic');
    }
  }

  if (!job) {
    res.status(404).json({ error: `Discovery job ${id} not found.` });
    return;
  }

  res.json({ job });
});

