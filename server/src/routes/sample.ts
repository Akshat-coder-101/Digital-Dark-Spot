import { Router, Request, Response } from 'express';
import {
  generateSampleReport,
  SAMPLE_SOURCES,
  SAMPLE_RESEARCH_QUESTION
} from '../data/sampleData.js';
import { analysisPipeline } from '../analysis/pipeline.js';

export const sampleRouter = Router();

sampleRouter.get('/', (_req: Request, res: Response): void => {
  try {
    const report = generateSampleReport();
    // Cache in analysis pipeline in-memory map so /api/report/sample-scholarship-report works immediately
    analysisPipeline.setReport(report);

    res.json({
      question: SAMPLE_RESEARCH_QUESTION,
      sources: SAMPLE_SOURCES,
      report,
      isSample: true,
      message: 'Fictional scholarship sample dataset loaded for offline exploration.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate sample report' });
  }
});
