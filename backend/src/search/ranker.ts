import { SearchResult } from './types.js';
import { isOfficialDomain } from './adapters/tavily.js';
import { stripTrackingParams } from './adapters/gemini.js';

export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove trailing slash and tracking params (utm_*, ref, etc.)
    const cleanParams = new URLSearchParams();
    for (const [k, v] of parsed.searchParams.entries()) {
      if (!k.startsWith('utm_') && k !== 'ref' && k !== 'fbclid') {
        cleanParams.append(k, v);
      }
    }
    const query = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}${query}`.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

export function rankAndDedupeSearchResults(
  results: SearchResult[],
  questionOrMax?: string | number,
  maxSourcesLimit: number = 6
): SearchResult[] {
  let question = '';
  let maxSources = maxSourcesLimit;

  if (typeof questionOrMax === 'number') {
    maxSources = questionOrMax;
  } else if (typeof questionOrMax === 'string') {
    question = questionOrMax;
  }

  const seenUrls = new Set<string>();
  const domainCounts = new Map<string, number>();

  const keywords = (question || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Score each result
  const scored = results.map(r => {
    let score = 0;
    const cleanedUrl = stripTrackingParams(r.url);
    const normUrl = normalizeUrl(cleanedUrl);
    const domain = r.domain.toLowerCase();
    const text = `${r.title} ${r.snippet}`.toLowerCase();

    // Check for narrow foreign embassy programs when question is generic national inquiry
    const qLower = (question || '').toLowerCase();
    const isEmbassyOrConsulate = domain.includes('embassy') ||
      domain.includes('consulate') ||
      domain.includes('timor') ||
      text.includes('embassy') ||
      text.includes('consulate') ||
      text.includes('timor-leste') ||
      text.includes('bilateral');

    const questionAskedForEmbassy = qLower.includes('embassy') ||
      qLower.includes('consulate') ||
      qLower.includes('abroad') ||
      qLower.includes('timor');

    if (isEmbassyOrConsulate && !questionAskedForEmbassy) {
      // Downrank narrow or unrelated embassy pages for generic inquiries
      score -= 45;
    }

    // 1. Official / Institutional domain bonus (+35, only when scope-relevant)
    if (isOfficialDomain(domain)) {
      if (!isEmbassyOrConsulate || questionAskedForEmbassy) {
        score += 35;
      }
    }

    // 2. Keyword relevance in title and snippet
    for (const kw of keywords) {
      if (r.title.toLowerCase().includes(kw)) score += 6;
      else if (text.includes(kw)) score += 2;
    }

    // 3. Recency bonus (+15)
    const currentYear = new Date().getFullYear().toString();
    if (text.includes(currentYear) || text.includes('2026') || text.includes('2025')) {
      score += 15;
    }

    // 4. Relevance Hint formulation
    let relevanceHint = 'Public guidance & analysis';
    if (isOfficialDomain(domain) && (!isEmbassyOrConsulate || questionAskedForEmbassy)) {
      relevanceHint = 'Primary authoritative notice';
    } else if (isEmbassyOrConsulate && !questionAskedForEmbassy) {
      relevanceHint = 'Narrow regional/embassy notice';
    } else if (text.includes('spec') || text.includes('benchmark') || text.includes('review') || text.includes('tgp')) {
      relevanceHint = 'Technical specifications & benchmarks';
    } else if (text.includes('portal') || text.includes('apply') || text.includes('application')) {
      relevanceHint = 'Application portal reference';
    }

    return {
      ...r,
      url: cleanedUrl,
      normalizedUrl: normUrl,
      relevanceHint,
      score: (r.score || 0) * 10 + score
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const finalResults: SearchResult[] = [];

  for (const item of scored) {
    if (seenUrls.has(item.normalizedUrl)) continue;

    const count = domainCounts.get(item.domain) || 0;
    // Enforce diversity: Max 2 results per domain
    if (count >= 2) continue;

    seenUrls.add(item.normalizedUrl);
    domainCounts.set(item.domain, count + 1);
    finalResults.push(item);

    if (finalResults.length >= maxSources) break;
  }

  return finalResults;
}

