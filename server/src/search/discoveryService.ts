import { SearchResult, DiscoveryJob } from './types.js';
import { searchManager } from './manager.js';
import { generateDiverseSearchQueries } from './queryGenerator.js';
import { rankAndDedupeSearchResults } from './ranker.js';
import { processSource } from '../ingestion/fetcher.js';
import { IngestedSource } from '../ingestion/types.js';
import { SAMPLE_RESEARCH_QUESTION, SAMPLE_SOURCES } from '../data/sampleData.js';
import crypto from 'crypto';

export const SAMPLE_DISCOVERY_RESULTS: SearchResult[] = [
  {
    title: 'National Merit Scholarship 2026 Guidelines (Official Notice)',
    url: 'https://scholarships.gov.fictional/guidelines-2026',
    domain: 'scholarships.gov.fictional',
    snippet: 'Official Gazette Announcement: Applications for the National Merit Scholarship 2026-27 cycle are now officially open. Strict deadline 15 April 2026.',
    date: '12 January 2026',
    isOfficial: true,
    score: 95
  },
  {
    title: 'Student Aid Review: Unofficial Guide to 2024-25 Scholarships',
    url: 'https://collegescholars-blog.fictional/aid-review-2024-25',
    domain: 'collegescholars-blog.fictional',
    snippet: 'Review of the 2024-25 scholarship cycle: the family income limit was established at $40,000 maximum. Required 6-month bank statements.',
    date: '10 September 2024',
    isOfficial: false,
    score: 82
  },
  {
    title: 'CollegeForum Community Discussion Thread #892',
    url: 'https://talkcampus.fictional/threads/scholarship-892',
    domain: 'talkcampus.fictional',
    snippet: 'Student discussion: candidates require minimum 3.2 cumulative GPA to be eligible for consideration. Renewal criteria are not published.',
    date: undefined,
    isOfficial: false,
    score: 74
  },
  {
    title: 'State Higher Education Council — Merit Aid Registry',
    url: 'https://highered.state.gov.fictional/merit-aid',
    domain: 'highered.state.gov.fictional',
    snippet: 'Central state register for government-sponsored tertiary scholarships and application links.',
    date: '2026-01-05',
    isOfficial: true,
    score: 88
  }
];

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

    // If sample scholarship query or offline requested, return pre-saved sample discovery
    if (
      id.includes('sample') ||
      question.toLowerCase().includes('scholarship') ||
      !searchManager.hasAnyKeys()
    ) {
      job.queriesGenerated = [
        `${question} official guidelines 2026`,
        `${question} eligibility income criteria`,
        `${question} required documents portal`
      ];
      job.sourcesFound = SAMPLE_DISCOVERY_RESULTS;
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'Discovery complete (Sample offline mode).';
      return job;
    }

    try {
      // 1. Generate diverse queries
      const queries = await generateDiverseSearchQueries(question);
      job.queriesGenerated = queries;
      job.progressPercent = 40;
      job.message = `Executing multi-angle search across ${queries.length} queries...`;

      // 2. Execute searches across queries
      const allResults: SearchResult[] = [];
      const querySlice = queries.slice(0, 4); // cap to 4 queries to avoid burning search quota

      for (const q of querySlice) {
        try {
          const res = await searchManager.search(q, 4);
          allResults.push(...res);
        } catch (searchErr) {
          console.warn(`[Discovery] Search query failed: "${q}":`, searchErr);
        }
      }

      if (allResults.length === 0) {
        throw new Error('No search results returned from configured search engines.');
      }

      // 3. Deduplicate, Rank, and filter top sources
      job.progressPercent = 65;
      job.message = 'Deduplicating and prioritizing official/institutional domains...';
      const ranked = rankAndDedupeSearchResults(allResults, question, maxSources);

      // 4. Safe Ingestion & Snippet Fallback
      job.status = 'fetching';
      job.progressPercent = 85;
      job.message = 'Verifying security and fetching page contents...';

      const enrichedResults: SearchResult[] = [];
      for (const r of ranked) {
        try {
          const ingested = await processSource({ type: 'url', value: r.url, title: r.title }, 0);
          if (ingested.status === 'ready' && ingested.wordCount > 30) {
            enrichedResults.push({
              ...r,
              date: ingested.detectedDate || ingested.detectedCycle || r.date,
              rawContent: ingested.cleanedText,
              limited: false
            });
          } else {
            // Fallback to search snippet labelled "limited"
            enrichedResults.push({
              ...r,
              rawContent: r.snippet,
              limited: true
            });
          }
        } catch {
          enrichedResults.push({
            ...r,
            rawContent: r.snippet,
            limited: true
          });
        }
      }

      job.sourcesFound = enrichedResults;
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = `Found ${enrichedResults.length} relevant sources ready for inspection.`;
      return job;
    } catch (err: any) {
      console.error(`[Discovery] Job ${id} failed:`, err);
      job.status = 'error';
      job.error = err.message || 'Automatic source discovery failed';
      job.message = err.message || 'Automatic source discovery failed';
      return job;
    }
  }
}

export const discoveryService = new DiscoveryService();
