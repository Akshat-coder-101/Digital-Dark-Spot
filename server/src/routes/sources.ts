import { Router, Request, Response } from 'express';
import { ingestSources, SourceInput } from '../ingestion/index.js';

export const sourcesRouter = Router();

sourcesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSources = req.body?.sources;

    if (!Array.isArray(rawSources) || rawSources.length === 0) {
      res.status(400).json({
        error: 'Invalid request: "sources" must be a non-empty array of source items.'
      });
      return;
    }

    const inputs: SourceInput[] = rawSources.map((s: any, idx: number) => ({
      id: s.id,
      type: s.type === 'text' ? 'text' : 'url',
      value: typeof s.value === 'string' ? s.value : '',
      title: typeof s.title === 'string' ? s.title : undefined
    }));

    const ingested = await ingestSources(inputs);

    const readyCount = ingested.filter(s => s.status === 'ready').length;
    const errorCount = ingested.filter(s => s.status === 'error').length;

    res.json({
      sources: ingested,
      total: ingested.length,
      ready: readyCount,
      errors: errorCount
    });
  } catch (err: any) {
    console.error('Error during sources ingestion:', err);
    res.status(500).json({
      error: `Ingestion failure: ${err.message || 'Internal server error'}`
    });
  }
});
