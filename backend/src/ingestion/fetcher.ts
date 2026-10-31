import * as cheerio from 'cheerio';
import { SourceInput, IngestedSource, CredibilityHint, UsefulnessStatus } from './types.js';
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

function extractHostname(val: string): string {
  try {
    return new URL(val).hostname;
  } catch {
    return 'custom-source';
  }
}

export function determineCredibilityHint(domain: string): CredibilityHint {
  const d = domain.toLowerCase();
  if (
    d.endsWith('.gov') ||
    d.includes('.gov.') ||
    d.endsWith('.nic.in') ||
    d.includes('.nic.') ||
    d.endsWith('.edu') ||
    d.includes('.edu.') ||
    d.endsWith('.ac.in') ||
    d.endsWith('.ac.uk') ||
    d.includes('.ac.') ||
    d.endsWith('.org')
  ) {
    return 'institutional';
  }
  return 'general';
}

export async function processSource(input: SourceInput, index: number): Promise<IngestedSource> {
  const id = input.id || `src-${Date.now()}-${index + 1}-${crypto.randomBytes(3).toString('hex')}`;
  const nowIso = new Date().toISOString();
  const isSample = input.sourceType === 'sample' || input.value?.startsWith('sample://') || id.includes('sample');

  // CASE 1: Pre-extracted rawContent or Pasted Text (No HTTP request needed)
  if (input.rawContent || input.type === 'text') {
    const raw = (input.rawContent || input.value || '').trim();
    const defaultDomain = input.domain || (input.type === 'url' ? extractHostname(input.value) : (isSample ? 'sample-data.example' : 'pasted-content'));
    const credibilityHint = determineCredibilityHint(defaultDomain);

    if (!raw) {
      return {
        id,
        type: input.type,
        url: input.type === 'url' ? input.value : undefined,
        domain: defaultDomain,
        title: input.title || `Source ${index + 1}`,
        rawText: '',
        cleanedText: '',
        wordCount: 0,
        textCharacterCount: 0,
        claimsExtracted: 0,
        claimsDiscarded: 0,
        usefulnessStatus: 'FAILED',
        credibilityHint,
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'error',
        errorMessage: 'Source text cannot be empty.',
        fetchedAt: nowIso,
        sourceType: input.sourceType || (isSample ? 'sample' : (input.type === 'text' ? 'user_text' : 'user_url'))
      };
    }

    const cleaned = cleanExtractedText(raw);
    const firstLine = cleaned.split('\n')[0].slice(0, 60).trim();
    const title = input.title || (firstLine.length > 5 ? firstLine : `Source ${index + 1}`);
    const temporal = detectTemporalMetadata(cleaned, title);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    const textCharacterCount = cleaned.length;
    const usefulnessStatus: UsefulnessStatus = textCharacterCount < 50 ? 'NEEDS_ATTENTION' : 'READY';

    return {
      id,
      type: input.type,
      url: input.type === 'url' ? input.value : undefined,
      domain: defaultDomain,
      title,
      rawText: raw,
      cleanedText: cleaned,
      wordCount,
      textCharacterCount,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus,
      credibilityHint,
      detectedDate: input.detectedDate || temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      fetchedAt: nowIso,
      sourceType: input.sourceType || (isSample ? 'sample' : (input.type === 'text' ? 'user_text' : 'user_url'))
    };
  }

  // CASE 2: URL without pre-extracted rawContent (Execute SSRF-validated network fetch)
  const rawUrl = (input.value || '').trim();
  const ssrfCheck = await validateUrlForSSRF(rawUrl);
  if (!ssrfCheck.valid || !ssrfCheck.url) {
    const domain = ssrfCheck.url?.hostname || 'unknown-host';
    return {
      id,
      type: 'url',
      url: rawUrl,
      domain,
      title: input.title || rawUrl,
      rawText: '',
      cleanedText: '',
      wordCount: 0,
      textCharacterCount: 0,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus: 'FAILED',
      credibilityHint: determineCredibilityHint(domain),
      detectedDate: null,
      detectedCycle: null,
      isStale: false,
      isUndated: true,
      status: 'error',
      errorMessage: ssrfCheck.error || 'Blocked by security policy (SSRF).',
      fetchedAt: nowIso,
      sourceType: input.sourceType || (isSample ? 'sample' : 'user_url')
    };
  }

  const parsedUrl = ssrfCheck.url;
  const domain = parsedUrl.hostname;
  const credibilityHint = determineCredibilityHint(domain);

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
        textCharacterCount: 0,
        claimsExtracted: 0,
        claimsDiscarded: 0,
        usefulnessStatus: 'FAILED',
        credibilityHint,
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'error',
        errorMessage: `HTTP ${response.status} ${response.statusText}`,
        fetchedAt: nowIso,
        sourceType: input.sourceType || (isSample ? 'sample' : 'real')
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
    const textCharacterCount = cleaned.length;
    const usefulnessStatus: UsefulnessStatus = textCharacterCount < 50 ? 'NEEDS_ATTENTION' : 'READY';

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
      textCharacterCount,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus,
      credibilityHint,
      detectedDate: temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      fetchedAt: nowIso,
      sourceType: input.sourceType || 'real'
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
      textCharacterCount: 0,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus: 'FAILED',
      credibilityHint,
      detectedDate: null,
      detectedCycle: null,
      isStale: false,
      isUndated: true,
      status: 'error',
      errorMessage: isTimeout
        ? 'Request timed out (12s limit exceeded). Page may be blocking automated retrieval.'
        : `Network error: ${fetchErr.message || 'Failed to connect'}`,
      fetchedAt: nowIso,
      sourceType: input.sourceType || 'user_url'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function ingestSources(inputs: SourceInput[]): Promise<IngestedSource[]> {
  const promises = inputs.map((input, index) => processSource(input, index));
  return Promise.all(promises);
}
