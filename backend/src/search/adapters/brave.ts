import { SearchAdapter, SearchResult } from '../types.js';
import { isOfficialDomain } from './tavily.js';

export const braveAdapter: SearchAdapter = {
  provider: 'brave',
  async search(apiKey: string, query: string, limit: number = 5): Promise<SearchResult[]> {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        },
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const err = new Error(`Brave search API error (${res.status}): ${errText}`);
        (err as any).status = res.status;
        throw err;
      }

      const data: any = await res.json();
      const results: any[] = data?.web?.results || [];

      return results.map(r => {
        let domain = 'unknown';
        try {
          domain = new URL(r.url).hostname;
        } catch {}

        return {
          title: r.title || domain,
          url: r.url,
          snippet: r.description || '',
          date: r.page_age || undefined,
          domain,
          isOfficial: isOfficialDomain(domain)
        };
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

