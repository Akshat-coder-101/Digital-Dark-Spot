import { SearchAdapter, SearchResult } from '../types.js';

export function isOfficialDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return (
    d.endsWith('.gov') ||
    d.includes('.gov.') ||
    d.endsWith('.nic.in') ||
    d.endsWith('.edu') ||
    d.includes('.edu.') ||
    d.endsWith('.ac.in') ||
    d.includes('.ac.') ||
    d.includes('.mil')
  );
}

export const tavilyAdapter: SearchAdapter = {
  provider: 'tavily',
  async search(apiKey: string, query: string, limit: number = 5): Promise<SearchResult[]> {
    const url = 'https://api.tavily.com/search';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          max_results: limit,
          include_domains: [],
          exclude_domains: []
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const err = new Error(`Tavily search API error (${res.status}): ${errText}`);
        (err as any).status = res.status;
        throw err;
      }

      const data: any = await res.json();
      const results: any[] = data?.results || [];

      return results.map(r => {
        let domain = 'unknown';
        try {
          domain = new URL(r.url).hostname;
        } catch {}

        return {
          title: r.title || domain,
          url: r.url,
          snippet: r.content || '',
          date: r.published_date || undefined,
          domain,
          isOfficial: isOfficialDomain(domain),
          score: r.score
        };
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
