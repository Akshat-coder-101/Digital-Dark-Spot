import { SearchResult } from './types.js';
import { isOfficialDomain } from './adapters/tavily.js';

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
  question: string,
  maxSources: number = 6
): SearchResult[] {
  const seenUrls = new Set<string>();
  const domainCounts = new Map<string, number>();

  const keywords = question
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Score each result
  const scored = results.map(r => {
    let score = 0;
    const normUrl = normalizeUrl(r.url);
    const domain = r.domain.toLowerCase();

    // 1. Official / Institutional domain bonus (+50)
    if (isOfficialDomain(domain)) {
      score += 50;
    }

    // 2. Keyword relevance in title and snippet
    const text = `${r.title} ${r.snippet}`.toLowerCase();
    for (const kw of keywords) {
      if (r.title.toLowerCase().includes(kw)) score += 6;
      else if (text.includes(kw)) score += 2;
    }

    // 3. Recency bonus (+15)
    const currentYear = new Date().getFullYear().toString();
    if (text.includes(currentYear) || text.includes('2026') || text.includes('2025')) {
      score += 15;
    }

    return {
      ...r,
      normalizedUrl: normUrl,
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

