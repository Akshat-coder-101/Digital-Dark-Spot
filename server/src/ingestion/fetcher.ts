import * as cheerio from 'cheerio';
import { SourceInput, IngestedSource } from './types.js';
import { validateUrlForSSRF } from './ssrf.js';
import { detectTemporalMetadata } from './metadata.js';
import crypto from 'crypto';

export function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

export async function processSource(input: SourceInput, index: number): Promise<IngestedSource> {
  const id = input.id || `src-${Date.now()}-${index + 1}-${crypto.randomBytes(3).toString('hex')}`;
  const nowIso = new Date().toISOString();

  // CASE 1: Pasted Text
  if (input.type === 'text') {
    const raw = (input.value || '').trim();
    if (!raw) {
      return {
        id,
        type: 'text',
        domain: 'pasted-content',
        title: input.title || `Pasted Source ${index + 1}`,
        rawText: '',
        cleanedText: '',
        wordCount: 0,
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'error',
        errorMessage: 'Source text cannot be empty.',
        fetchedAt: nowIso
      };
    }

    const cleaned = cleanExtractedText(raw);
    const firstLine = cleaned.split('\n')[0].slice(0, 60).trim();
    const title = input.title || (firstLine.length > 5 ? firstLine : `Pasted Note ${index + 1}`);
    const temporal = detectTemporalMetadata(cleaned, title);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

    return {
      id,
      type: 'text',
      domain: 'pasted-content',
      title,
      rawText: raw,
      cleanedText: cleaned,
      wordCount,
      detectedDate: temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      fetchedAt: nowIso
    };
  }

  // CASE 2: URL
  const rawUrl = (input.value || '').trim();
  const ssrfCheck = await validateUrlForSSRF(rawUrl);
  if (!ssrfCheck.valid || !ssrfCheck.url) {
    return {
      id,
      type: 'url',
      url: rawUrl,
      domain: ssrfCheck.url?.hostname || 'unknown-host',
      title: input.title || rawUrl,
      rawText: '',
      cleanedText: '',
      wordCount: 0,
      detectedDate: null,
      detectedCycle: null,
      isStale: false,
      isUndated: true,
      status: 'error',
      errorMessage: ssrfCheck.error || 'Blocked by security policy (SSRF).',
      fetchedAt: nowIso
    };
  }

  const parsedUrl = ssrfCheck.url;
  const domain = parsedUrl.hostname;

  // Fetch with 12s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'DigitalDarkSpotBot/1.0 (+https://digitaldarkspot.example/bot)'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        id,
        type: 'url',
        url: rawUrl,
        domain,
        title: input.title || domain,
        rawText: '',
        cleanedText: '',
        wordCount: 0,
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'error',
        errorMessage: `HTTP ${response.status} ${response.statusText}`,
        fetchedAt: nowIso
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $('script, style, nav, footer, header, noscript, svg, iframe, form, button').remove();

    // Extract title
    const docTitle = $('meta[property="og:title"]').attr('content') ||
      $('title').first().text() ||
      $('h1').first().text() ||
      domain;
    const finalTitle = (input.title || docTitle || domain).trim();

    // Extract body text
    const bodyText = $('body').text() || $.text();
    const cleaned = cleanExtractedText(bodyText);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

    // Detect temporal metadata
    const temporal = detectTemporalMetadata(cleaned, finalTitle);

    return {
      id,
      type: 'url',
      url: rawUrl,
      domain,
      title: finalTitle,
      rawText: bodyText,
      cleanedText: cleaned,
      wordCount,
      detectedDate: temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      fetchedAt: nowIso
    };
  } catch (fetchErr: any) {
    const isTimeout = fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted');
    return {
      id,
      type: 'url',
      url: rawUrl,
      domain,
      title: input.title || domain,
      rawText: '',
      cleanedText: '',
      wordCount: 0,
      detectedDate: null,
      detectedCycle: null,
      isStale: false,
      isUndated: true,
      status: 'error',
      errorMessage: isTimeout
        ? 'Request timed out (12s limit exceeded). Page may be blocking automated retrieval.'
        : `Network error: ${fetchErr.message || 'Failed to connect'}`,
      fetchedAt: nowIso
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function ingestSources(inputs: SourceInput[]): Promise<IngestedSource[]> {
  const promises = inputs.map((input, idx) => processSource(input, idx));
  const results = await Promise.allSettled(promises);

  return results.map((res, idx) => {
    if (res.status === 'fulfilled') {
      return res.value;
    }
    return {
      id: inputs[idx].id || `src-${Date.now()}-${idx + 1}`,
      type: inputs[idx].type,
      url: inputs[idx].type === 'url' ? inputs[idx].value : undefined,
      domain: 'unknown',
      title: inputs[idx].title || `Source ${idx + 1}`,
      rawText: '',
      cleanedText: '',
      wordCount: 0,
      detectedDate: null,
      detectedCycle: null,
      isStale: false,
      isUndated: true,
      status: 'error',
      errorMessage: res.reason?.message || 'Unexpected ingestion processing failure',
      fetchedAt: new Date().toISOString()
    };
  });
}
