import { SearchAdapter, SearchResult } from '../types.js';
import { validateUrlForSSRF } from '../../ingestion/ssrf.js';
import { determineCredibilityHint } from '../../ingestion/fetcher.js';

export function stripTrackingParams(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const paramsToDrop = ['fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'twclid', 'ref'];
    const keys = Array.from(parsed.searchParams.keys());
    for (const key of keys) {
      if (key.startsWith('utm_') || paramsToDrop.includes(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export async function resolveRedirectUrl(rawUrl: string): Promise<{ resolvedUrl: string; domain: string; isResolved: boolean }> {
  const cleanedInitial = stripTrackingParams(rawUrl.trim());
  let parsed: URL;
  try {
    parsed = new URL(cleanedInitial);
  } catch {
    return { resolvedUrl: cleanedInitial, domain: 'unresolved-host', isResolved: false };
  }

  // Only resolve http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { resolvedUrl: cleanedInitial, domain: parsed.hostname || 'unresolved-host', isResolved: false };
  }

  // SSRF guard on initial target
  const ssrfInitial = await validateUrlForSSRF(cleanedInitial);
  if (!ssrfInitial.valid) {
    return { resolvedUrl: cleanedInitial, domain: parsed.hostname || 'unresolved-host', isResolved: false };
  }

  // If already a direct non-redirect link, we still try a fast HEAD/GET to catch server-side 301/302 redirects
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(cleanedInitial, {
      method: 'GET',
      headers: {
        'User-Agent': 'DigitalDarkSpotBot/1.0 (+https://digitaldarkspot.example/bot)'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    const finalUrl = response.url ? stripTrackingParams(response.url) : cleanedInitial;
    
    // SSRF guard on the final redirected destination URL
    const ssrfFinal = await validateUrlForSSRF(finalUrl);
    if (!ssrfFinal.valid) {
      return { resolvedUrl: cleanedInitial, domain: parsed.hostname, isResolved: false };
    }

    const finalDomain = new URL(finalUrl).hostname;
    return { resolvedUrl: finalUrl, domain: finalDomain, isResolved: true };
  } catch {
    // If resolution fails or times out, keep original URL without fabricating
    return { resolvedUrl: cleanedInitial, domain: parsed.hostname, isResolved: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const geminiSearchAdapter: SearchAdapter = {
  provider: 'gemini',
  async search(apiKey: string, query: string, limit: number = 6): Promise<SearchResult[]> {
    const model = process.env.GEMINI_SEARCH_MODEL || process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: query }]
        }
      ],
      tools: [
        {
          google_search: {}
        }
      ]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      throw new Error(`Gemini search network failure: ${fetchErr.message || 'connection error'}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      const err = new Error(`Gemini search API error (${res.status}): ${errorText}`);
      (err as any).status = res.status;
      throw err;
    }

    const data: any = await res.json();
    const candidate = data?.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (!groundingMetadata || !Array.isArray(groundingMetadata.groundingChunks)) {
      return [];
    }

    const chunks = groundingMetadata.groundingChunks;
    const supports = groundingMetadata.groundingSupports || [];

    // Map chunk indices to supporting text snippets if available
    const snippetMap = new Map<number, string>();
    for (const sup of supports) {
      const indices: number[] = sup.groundingChunkIndices || [];
      const segmentText = sup.segment?.text?.trim();
      if (segmentText) {
        for (const idx of indices) {
          if (!snippetMap.has(idx)) {
            snippetMap.set(idx, segmentText);
          }
        }
      }
    }

    const rawResults: Array<{ rawUri: string; title: string; snippet: string }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const web = chunk?.web;
      if (!web || !web.uri) continue;

      const rawUri = String(web.uri).trim();
      const title = String(web.title || web.uri).trim();
      const snippet = snippetMap.get(i) || '';

      rawResults.push({ rawUri, title, snippet });
      if (rawResults.length >= limit) break;
    }

    // Resolve redirect links in parallel with SSRF protection
    const resolvedPromises = rawResults.map(async (r) => {
      const { resolvedUrl, domain } = await resolveRedirectUrl(r.rawUri);
      const isOfficial = determineCredibilityHint(domain) === 'institutional';

      const result: SearchResult = {
        title: r.title,
        url: resolvedUrl,
        originalUrl: r.rawUri !== resolvedUrl ? r.rawUri : undefined,
        snippet: r.snippet,
        domain,
        isOfficial
      };
      return result;
    });

    return Promise.all(resolvedPromises);
  }
};

