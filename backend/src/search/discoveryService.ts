import { SearchResult, DiscoveryJob } from './types.js';
import { searchManager } from './manager.js';
import { generateDiverseSearchQueries } from './queryGenerator.js';
import { rankAndDedupeSearchResults } from './ranker.js';
import { processSource } from '../ingestion/fetcher.js';
import { IngestedSource } from '../ingestion/types.js';
import { SAMPLE_DISCOVERY_RESULTS } from '../data/sampleData.js';

export { SAMPLE_DISCOVERY_RESULTS };

export class DiscoveryService {
  private jobs: Map<string, DiscoveryJob> = new Map();

  public getJob(id: string): DiscoveryJob | undefined {
    return this.jobs.get(id);
  }

  public setJob(job: DiscoveryJob): void {
    this.jobs.set(job.id, job);
  }

  public async runDiscovery(id: string, question: string): Promise<DiscoveryJob> {
    const maxSources = parseInt(process.env.MAX_SOURCES || '6', 10);

    const job: DiscoveryJob = {
      id,
      question,
      status: 'searching',
      progressPercent: 20,
      message: 'Generating diverse investigative search queries...',
      queriesGenerated: [],
      sourcesFound: [],
      createdAt: new Date().toISOString()
    };
    this.jobs.set(id, job);

    // Explicit Sample Demo Mode
    if (id.includes('sample')) {
      job.queriesGenerated = [
        `${question} official guidelines 2026-27`,
        `${question} qualifying criteria parameters`,
        `${question} required documents portal`
      ];
      job.sourcesFound = SAMPLE_DISCOVERY_RESULTS;
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'Discovery complete (Sample Demonstration Mode).';
      return job;
    }

    // Check if web search keys are available
    if (!searchManager.hasAnyKeys()) {
      // DO NOT fabricate fake sources. Gracefully formulate investigative queries and notify user.
      try {
        const queries = await generateDiverseSearchQueries(question);
        job.queriesGenerated = queries;
      } catch {
        job.queriesGenerated = [
          `${question} official guidelines 2026`,
          `${question} requirements qualifying criteria`,
          `${question} mandatory documents checklist`
        ];
      }
      job.sourcesFound = [];
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'Web search API key is not configured. Formulated investigative search queries. You may add specific URLs, paste text excerpts, or load sample demonstration data.';
      return job;
    }

    // Web Search API is available: execute multi-query search
    try {
      const queries = await generateDiverseSearchQueries(question);
      job.queriesGenerated = queries;
      job.progressPercent = 40;
      job.message = `Executing ${queries.length} targeted search queries across official and secondary sources...`;

      const searchPromises = queries.map(q => searchManager.search(q, { maxResults: 5 }));
      const queryResults = await Promise.allSettled(searchPromises);

      const allResults: SearchResult[] = [];
      for (const res of queryResults) {
        if (res.status === 'fulfilled') {
          allResults.push(...res.value);
        }
      }

      job.progressPercent = 70;
      job.message = 'Ranking and filtering search results...';

      const ranked = rankAndDedupeSearchResults(allResults, maxSources);
      job.sourcesFound = ranked;
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = `Found ${ranked.length} relevant sources ready for investigation.`;

      return job;
    } catch (err: any) {
      job.status = 'error';
      job.error = err.message || 'Discovery search failed';
      job.message = 'Search discovery encountered an error.';
      return job;
    }
  }

  public async ingestSelectedSources(
    selectedUrlsOrTexts: Array<{ type: 'url' | 'text'; value: string; title?: string }>
  ): Promise<IngestedSource[]> {
    const promises = selectedUrlsOrTexts.map((item, idx) =>
      processSource({
        type: item.type,
        value: item.value,
        title: item.title,
        sourceType: item.type === 'url' ? 'real' : 'user_text'
      }, idx)
    );

    return Promise.all(promises);
  }
}

export const discoveryService = new DiscoveryService();
