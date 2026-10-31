import { Router, Request, Response } from 'express';
import {
  loadFixtureScenario,
  generateSampleReport
} from '../data/sampleData.js';
import { analysisPipeline } from '../analysis/pipeline.js';

export const sampleRouter = Router();

sampleRouter.get('/:scenarioId?', (req: Request, res: Response): void => {
  try {
    const scenarioId = req.params.scenarioId || 'scenario-a-aurora';
    const fixtureData = loadFixtureScenario(scenarioId);

    // Cache in analysis pipeline in-memory map
    analysisPipeline.setReport(fixtureData.report);

    res.json({
      question: fixtureData.question,
      sources: fixtureData.sources,
      report: fixtureData.report,
      scenarioId: fixtureData.id,
      name: fixtureData.name,
      isSample: true,
      message: 'Sample dataset loaded from validated fixture for offline demonstration.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate sample report' });
  }
});
