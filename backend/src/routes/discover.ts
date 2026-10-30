import { Router, Request, Response } from 'express';
import { discoveryService } from '../search/discoveryService.js';
import crypto from 'crypto';

export const discoverRouter = Router();

// POST /api/discover
discoverRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
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
discoverRouter.get('/:id', (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const job = discoveryService.getJob(id);

  if (!job) {
    res.status(404).json({ error: `Discovery job ${id} not found.` });
    return;
  }

  res.json({ job });
});

