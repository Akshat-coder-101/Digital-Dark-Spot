import { SearchResult, DiscoveryJob } from './types.js';
import { searchManager } from './manager.js';
import { generateDiverseSearchQueries } from './queryGenerator.js';
import { rankAndDedupeSearchResults } from './ranker.js';
import { processSource } from '../ingestion/fetcher.js';
import { IngestedSource } from '../ingestion/types.js';
import { isLowTextDomain, isLoginWall, isLowTextSource } from '../ingestion/lowText.js';
import { SAMPLE_DISCOVERY_RESULTS } from '../data/sampleData.js';
import { persistentStore } from '../store/persistentStore.js';
import { deriveExpectedAttributesForQuestion, NEUTRAL_FALLBACK_ATTRIBUTES } from '../analysis/extraction.js';

export { SAMPLE_DISCOVERY_RESULTS };

export function classifySearchFailure(err?: any): string {
  if (!err) return 'no sources could be retrieved';
  const msg = String(err.message || err || '');
  const match = msg.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  const status = err.status || (match ? parseInt(match[0], 10) : undefined);

  if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
    return 'Search quota reached';
  }
  if (status === 401 || status === 403 || msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('invalid api key')) {
    return 'Search key rejected';
  }
  if (msg.includes('NO_SEARCH_KEYS_AVAILABLE') || msg.toLowerCase().includes('not configured')) {
    return 'Search key not configured';
  }
  if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('enotfound') || msg.toLowerCase().includes('network')) {
    return 'Search provider timed out or offline';
  }
  return 'Search provider failed to return results';
}

export class DiscoveryService {
  private jobs: Map<string, DiscoveryJob> = new Map();
  private discoveryCache: Map<string, { job: DiscoveryJob; timestamp: number }> = new Map();

  public getJob(id: string): DiscoveryJob | undefined {
    let job = this.jobs.get(id);
    if (!job) {
      const persisted = persistentStore.getDiscoveryJob(id);
      if (persisted) {
        this.jobs.set(id, persisted);
        return persisted;
      }
    }
    return job;
  }

  public setJob(job: DiscoveryJob): void {
    this.jobs.set(job.id, job);
    persistentStore.saveDiscoveryJob(job);
  }

  public async runDiscovery(id: string, question: string): Promise<DiscoveryJob> {
    const maxSources = parseInt(process.env.MAX_SOURCES || '6', 10);
    const cacheKey = question.trim().toLowerCase();

    // Check Question-Level Search Cache (Memory or Persistent Session Store)
    const cachedMemory = this.discoveryCache.get(cacheKey);
    const cachedSessionData = persistentStore.getSearchCache(question);
    const cachedSessionResults = (cachedSessionData as any)?.results || (Array.isArray(cachedSessionData) ? cachedSessionData : null);
    const cachedSessionAttrs = (cachedSessionData as any)?.suggestedAttributes;

    if (cachedMemory && Date.now() - cachedMemory.timestamp < 30 * 60 * 1000) {
      const cloned: DiscoveryJob = {
        ...cachedMemory.job,
        id,
        createdAt: new Date().toISOString()
      };
      this.setJob(cloned);
      return cloned;
    }

    const job: DiscoveryJob = {
      id,
      question,
      status: 'searching',
      progressPercent: 15,
      message: 'Discovering sources: formulating targeted search queries...',
      queriesGenerated: [],
      sourcesFound: [],
      createdAt: new Date().toISOString()
    };
    this.setJob(job);

    // If session-level search cache exists, immediately hydrate results without external search calls
    if (cachedSessionResults && Array.isArray(cachedSessionResults) && cachedSessionResults.length > 0) {
      job.queriesGenerated = [
        `${question} official documentation guidelines`,
        `${question} specifications requirements`
      ];
      job.sourcesFound = cachedSessionResults;
      job.suggestedAttributes = cachedSessionAttrs || await deriveExpectedAttributesForQuestion(question, cachedSessionResults);
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'These are sources retrieved for your question. Search results are not a complete view of the web.';
      this.setJob(job);
      return job;
    }

    // Explicit Sample Demo Mode
    if (id.includes('sample')) {
      job.queriesGenerated = [
        `${question} official primary specifications`,
        `${question} guidelines parameters`,
        `${question} reference requirements`
      ];
      job.sourcesFound = SAMPLE_DISCOVERY_RESULTS;
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'These are sources retrieved for your question. Search results are not a complete view of the web.';
      return job;
    }

    // Step 1: Generate Queries and Suggested Parameters
    let queries: string[] = [];
    try {
      const [qGen, attrs] = await Promise.all([
        generateDiverseSearchQueries(question),
        deriveExpectedAttributesForQuestion(question)
      ]);
      queries = qGen;
      job.queriesGenerated = queries;
      job.suggestedAttributes = attrs;
    } catch {
      const base = question.replace(/[?.,!]/g, '').trim();
      queries = [
        `${base} official specifications documentation`,
        `${base} key criteria requirements`,
        `${base} critical verification factors considerations`
      ];
      job.queriesGenerated = queries;
      job.suggestedAttributes = [...NEUTRAL_FALLBACK_ATTRIBUTES];
    }

    // Check if web search keys are available
    if (!searchManager.hasAnyKeys()) {
      console.error(`[Search Failure] No search provider keys configured in running server process`);
      job.sourcesFound = [];
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'No sources reviewed. AI-suggested: Search key not configured for this question. These are verification suggestions, not source-backed findings.';
      return job;
    }

    // Step 2: Execute Multi-Query Search
    try {
      job.progressPercent = 40;
      job.message = `Discovering sources: querying search provider with ${queries.length} targeted angles...`;

      const searchPromises = queries.map(q => searchManager.search(q, 5));
      const queryResults = await Promise.allSettled(searchPromises);

      const allResults: SearchResult[] = [];
      let lastFailureReason = '';

      for (const res of queryResults) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allResults.push(...res.value);
        } else if (res.status === 'rejected') {
          const reason = res.reason;
          lastFailureReason = classifySearchFailure(reason);
          const status = reason?.status || (String(reason?.message).match(/\b(400|401|403|404|429|500|502|503|504)\b/)?.[0]);
          console.error(`[Search Failure] Search failed on provider with status ${status || 'unknown'}: ${reason?.message || reason}`);
        }
      }

      // If search returned 0 results or failed due to quota/provider limits
      if (allResults.length === 0) {
        const plainReason = lastFailureReason || 'no sources could be retrieved';
        job.sourcesFound = [];
        job.status = 'ready';
        job.progressPercent = 100;
        job.message = `No sources reviewed. AI-suggested: ${plainReason} for this question. These are verification suggestions, not source-backed findings.`;
        return job;
      }

      job.progressPercent = 70;
      job.message = 'Discovering sources: evaluating source authority and deduplicating...';

      const ranked = rankAndDedupeSearchResults(allResults, question, maxSources);

      // Step 3: Fast pre-flight verification of retrieval status
      job.progressPercent = 85;
      job.message = 'Discovering sources: verifying document reachability...';

      const evaluatedSources: SearchResult[] = await Promise.all(
        ranked.map(async (src) => {
          try {
            // Check if page can be fetched or if supporting snippet should be retained
            const processed = await processSource({
              type: 'url',
              value: src.url,
              title: src.title,
              rawContent: src.rawContent,
              snippet: src.snippet
            }, 0);

            if (processed.status === 'ready') {
              const hasFullPageText = Boolean((processed.cleanedText && processed.cleanedText.length >= 300) || (src.rawContent && src.rawContent.length >= 300));
              const isLimited = (processed.sourceType === 'limited' || processed.usefulnessStatus === 'NEEDS_ATTENTION') && !hasFullPageText;
              const isLow = isLowTextDomain(src.url) || isLowTextDomain(src.domain) || isLoginWall(src.url, src.title, src.snippet) || processed.isLowText || isLimited;
              return {
                ...src,
                limited: isLimited,
                unavailable: false,
                isLowText: Boolean(isLow),
                sourceType: isLow ? 'low_text' : (isLimited ? 'limited' : src.sourceType),
                rawContent: processed.cleanedText || src.rawContent || src.snippet
              };
            } else if (src.rawContent && src.rawContent.trim().length >= 300) {
              const isLow = isLowTextDomain(src.url) || isLowTextDomain(src.domain) || isLoginWall(src.url, src.title, src.snippet);
              return {
                ...src,
                limited: false,
                unavailable: false,
                isLowText: Boolean(isLow),
                sourceType: isLow ? 'low_text' : src.sourceType,
                rawContent: src.rawContent
              };
            } else if ((src.rawContent && src.rawContent.trim().length >= 25) || (src.snippet && src.snippet.trim().length >= 25)) {
              return {
                ...src,
                limited: true,
                unavailable: false,
                isLowText: true,
                sourceType: 'low_text',
                rawContent: src.rawContent || src.snippet
              };
            } else {
              return {
                ...src,
                limited: false,
                unavailable: true,
                isLowText: true,
                sourceType: 'unavailable'
              };
            }
          } catch {
            const hasFullText = Boolean(src.rawContent && src.rawContent.trim().length >= 300);
            const hasSnippet = Boolean((src.rawContent && src.rawContent.length >= 25) || (src.snippet && src.snippet.length >= 25));
            const isLow = isLowTextDomain(src.url) || isLowTextDomain(src.domain) || !hasFullText;
            return {
              ...src,
              limited: !hasFullText && hasSnippet,
              unavailable: !hasFullText && !hasSnippet,
              isLowText: Boolean(isLow),
              sourceType: isLow ? 'low_text' : (!hasFullText && hasSnippet ? 'limited' : 'unavailable'),
              rawContent: src.rawContent || src.snippet
            };
          }
        })
      );

      job.sourcesFound = evaluatedSources;
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = 'These are sources retrieved for your question. Search results are not a complete view of the web.';

      // Cache successful discovery (Memory + Session Store)
      this.discoveryCache.set(cacheKey, { job, timestamp: Date.now() });
      persistentStore.saveSearchCache(question, evaluatedSources, job.suggestedAttributes);
      this.setJob(job);

      return job;
    } catch (err: any) {
      const plainReason = classifySearchFailure(err);
      console.error(`[Search Failure] Discovery exception for "${question}" with status ${err.status || 'unknown'}:`, err.message);
      // Fallback gracefully without fabricating false data
      job.sourcesFound = [];
      job.status = 'ready';
      job.progressPercent = 100;
      job.message = `No sources reviewed. AI-suggested: ${plainReason} for this question. These are verification suggestions, not source-backed findings.`;
      this.setJob(job);
      return job;
    }
  }

  public async ingestSelectedSources(
    selectedUrlsOrTexts: Array<{ type: 'url' | 'text'; value: string; title?: string; rawContent?: string; snippet?: string }>
  ): Promise<IngestedSource[]> {
    const promises = selectedUrlsOrTexts.map((item, idx) =>
      processSource({
        type: item.type,
        value: item.value,
        title: item.title,
        rawContent: item.rawContent,
        snippet: item.snippet,
        sourceType: item.type === 'url' ? 'real' : 'user_text'
      }, idx)
    );

    return Promise.all(promises);
  }
}

export const discoveryService = new DiscoveryService();
