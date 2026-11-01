import * as cheerio from 'cheerio';
import zlib from 'zlib';
import { SourceInput, IngestedSource, CredibilityHint, UsefulnessStatus } from './types.js';
import { validateUrlForSSRF } from './ssrf.js';
import { detectTemporalMetadata } from './metadata.js';
import { isLowTextDomain, isLoginWall, isLowTextSource } from './lowText.js';
import crypto from 'crypto';

export function extractTextFromPdfBuffer(buf: Buffer): string {
  let pos = 0;
  let out = '';
  while (pos < buf.length) {
    const streamStart = buf.indexOf(Buffer.from('stream'), pos);
    if (streamStart === -1) break;
    let dataStart = streamStart + 6;
    if (buf[dataStart] === 13) dataStart++;
    if (buf[dataStart] === 10) dataStart++;
    const streamEnd = buf.indexOf(Buffer.from('endstream'), dataStart);
    if (streamEnd === -1) break;
    let slice = buf.slice(dataStart, streamEnd);
    if (slice[slice.length - 1] === 10) slice = slice.slice(0, slice.length - 1);
    if (slice[slice.length - 1] === 13) slice = slice.slice(0, slice.length - 1);
    let uncompressed = slice;
    try {
      uncompressed = zlib.inflateSync(slice);
    } catch {
      // uncompressed or alternative filter
    }
    const s = uncompressed.toString('latin1');
    const parenMatches = s.match(/\(([^()]*)\)/g);
    if (parenMatches) {
      for (const pm of parenMatches) {
        const text = pm.slice(1, -1).replace(/\\([()\\])/g, '$1').trim();
        if (text && text.length > 1) {
          out += text + ' ';
        }
      }
    }
    pos = streamEnd + 9;
  }
  return out.replace(/\s+/g, ' ').trim();
}

const JUNK_BOILERPLATE_REGEX = /(something went wrong|page not found|404 not found|access denied|sign in to continue|session expired|please log in|enable javascript to continue|cloudflare|robot check|captcha|you have been signed out|log in to your account)/i;

export function stripBoilerplate(text: string): { cleaned: string; isJunk: boolean } {
  const lines = text.split('\n');
  const filteredLines: string[] = [];
  let junkMatches = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (JUNK_BOILERPLATE_REGEX.test(trimmed)) {
      junkMatches++;
      continue;
    }
    filteredLines.push(line);
  }

  const cleaned = cleanExtractedText(filteredLines.join('\n'));
  const isJunk = junkMatches > 0 && (cleaned.length < 300 || junkMatches >= Math.max(1, lines.length / 2));
  return { cleaned, isJunk };
}

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

export function classifyUrlFailure(
  rawUrl: string,
  detailError?: string
): 'invalid URL' | 'private address' | 'blocked or timed out' {
  if (!rawUrl || !rawUrl.trim()) {
    return 'invalid URL';
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'invalid URL';
    }
  } catch {
    return 'invalid URL';
  }

  if (detailError) {
    const errLower = detailError.toLowerCase();
    if (errLower.includes('malformed') || errLower.includes('protocol')) {
      return 'invalid URL';
    }
    if (
      errLower.includes('ssrf') ||
      errLower.includes('private') ||
      errLower.includes('loopback') ||
      errLower.includes('localhost') ||
      errLower.includes('protected ip') ||
      errLower.includes('internal')
    ) {
      return 'private address';
    }
  }

  return 'blocked or timed out';
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

    const { cleaned, isJunk } = stripBoilerplate(raw);
    const firstLine = cleaned.split('\n')[0].slice(0, 60).trim();
    const title = input.title || (firstLine.length > 5 ? firstLine : `Source ${index + 1}`);
    const temporal = detectTemporalMetadata(cleaned, title);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    const textCharacterCount = cleaned.length;
    // Mark source Limited if usable text is under ~1,500 characters or junk page detected
    const isLimited = textCharacterCount < 1500 || isJunk;
    const isLowText = isLowTextDomain(defaultDomain) || isLoginWall(input.value, title, cleaned) || (isLimited && textCharacterCount < 300) || input.sourceType === 'low_text';
    const usefulnessStatus: UsefulnessStatus = isLowText || isLimited
      ? 'NEEDS_ATTENTION'
      : (textCharacterCount < 50 ? 'NEEDS_ATTENTION' : 'READY');

    const isLowTextDomainMatch = isLowTextDomain(defaultDomain) || isLoginWall(input.value, title, cleaned);
    const derivedSourceType = input.sourceType || (isSample
      ? 'sample'
      : (isLowTextDomainMatch ? 'low_text' : (isLimited ? 'limited' : (input.type === 'text' ? 'user_text' : 'user_url'))));

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
      isLimited,
      isLowText,
      sourceType: derivedSourceType,
      fetchedAt: nowIso
    };
  }

  // CASE 2: URL without pre-extracted rawContent (Execute SSRF-validated network fetch)
  const rawUrl = (input.value || '').trim();
  const ssrfCheck = await validateUrlForSSRF(rawUrl);
  if (!ssrfCheck.valid || !ssrfCheck.url) {
    let domain = 'unknown-host';
    try { domain = new URL(rawUrl).hostname; } catch {}
    const plainReason = classifyUrlFailure(rawUrl, ssrfCheck.error);
    // Server-side logging only for the actual failure reason
    console.error(`[Ingest Failure] SSRF/URL validation check failed for "${rawUrl}":`, ssrfCheck.error || 'Invalid URL');

    // If supporting text/snippet exists from search provider and not a private internal address
    const fallbackText = cleanExtractedText(input.snippet || input.rawContent || '');
    if (fallbackText.length >= 20 && plainReason !== 'private address') {
      return {
        id,
        type: 'url',
        url: rawUrl,
        domain,
        title: input.title || domain,
        rawText: fallbackText,
        cleanedText: fallbackText,
        wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
        textCharacterCount: fallbackText.length,
        claimsExtracted: 0,
        claimsDiscarded: 0,
        usefulnessStatus: 'NEEDS_ATTENTION',
        credibilityHint: determineCredibilityHint(domain),
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'ready',
        isLimited: true,
        sourceType: 'limited',
        errorMessage: 'Network retrieval failed; using supporting provider text.',
        fetchedAt: nowIso
      };
    }

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
      isUnavailable: true,
      errorMessage: plainReason,
      fetchedAt: nowIso,
      sourceType: 'unavailable'
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      // Server-side logging only
      console.error(`[Ingest Failure] HTTP fetch failed for "${rawUrl}" with status ${response.status} ${response.statusText}`);

      // Check if supporting snippet/text is available from search provider
      const fallbackText = cleanExtractedText(input.snippet || input.rawContent || '');
      if (fallbackText.length >= 20) {
        return {
          id,
          type: 'url',
          url: rawUrl,
          domain,
          title: input.title || domain,
          rawText: fallbackText,
          cleanedText: fallbackText,
          wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
          textCharacterCount: fallbackText.length,
          claimsExtracted: 0,
          claimsDiscarded: 0,
          usefulnessStatus: 'NEEDS_ATTENTION',
          credibilityHint,
          detectedDate: null,
          detectedCycle: null,
          isStale: false,
          isUndated: true,
          status: 'ready',
          isLimited: true,
          sourceType: 'limited',
          errorMessage: 'Live page retrieval failed; using supporting provider text.',
          fetchedAt: nowIso
        };
      }

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
        isUnavailable: true,
        errorMessage: 'blocked or timed out',
        fetchedAt: nowIso,
        sourceType: 'unavailable'
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const isPdf = contentType.toLowerCase().includes('application/pdf') || rawUrl.toLowerCase().split('?')[0].endsWith('.pdf');

    let bodyText = '';
    let finalTitle = input.title || domain;

    if (isPdf) {
      const arrayBuffer = await response.arrayBuffer();
      bodyText = extractTextFromPdfBuffer(Buffer.from(arrayBuffer));
      finalTitle = input.title || `${domain} (PDF Document)`;
    } else {
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove noise elements
      $('script, style, nav, footer, header, noscript, svg, iframe, form, button').remove();

      // Extract title
      const docTitle = $('meta[property="og:title"]').attr('content') ||
        $('title').first().text() ||
        $('h1').first().text() ||
        domain;
      finalTitle = (input.title || docTitle || domain).trim();

      // Extract body text
      bodyText = $('body').text() || $.text();
    }

    const { cleaned, isJunk } = stripBoilerplate(bodyText);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    const textCharacterCount = cleaned.length;

    // Detect empty or JavaScript-only pages, or pure boilerplate junk pages
    if (textCharacterCount < 20 || wordCount === 0 || (isJunk && textCharacterCount < 100)) {
      console.warn(`[Ingest Failure] Empty or JavaScript-only page content for "${rawUrl}" (length: ${textCharacterCount}, words: ${wordCount}, isJunk: ${isJunk})`);

      const fallbackText = cleanExtractedText(input.snippet || input.rawContent || '');
      if (fallbackText.length >= 20) {
        return {
          id,
          type: 'url',
          url: rawUrl,
          domain,
          title: finalTitle,
          rawText: fallbackText,
          cleanedText: fallbackText,
          wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
          textCharacterCount: fallbackText.length,
          claimsExtracted: 0,
          claimsDiscarded: 0,
          usefulnessStatus: 'NEEDS_ATTENTION',
          credibilityHint,
          detectedDate: null,
          detectedCycle: null,
          isStale: false,
          isUndated: true,
          status: 'ready',
          isLimited: true,
          sourceType: 'limited',
          errorMessage: 'Page content was empty or JS-rendered; using supporting provider text.',
          fetchedAt: nowIso
        };
      }

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
        usefulnessStatus: 'FAILED',
        credibilityHint,
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'error',
        isUnavailable: true,
        errorMessage: 'empty or JavaScript-only page',
        fetchedAt: nowIso,
        sourceType: 'unavailable'
      };
    }

    // Mark source Limited if usable text is under ~1,500 characters or junk page detected
    const isLimited = textCharacterCount < 1500 || isJunk;
    const isLowText = isLowTextDomain(domain) || isLoginWall(rawUrl, finalTitle, cleaned) || (isLimited && textCharacterCount < 300) || input.sourceType === 'low_text';
    const usefulnessStatus: UsefulnessStatus = isLowText || isLimited
      ? 'NEEDS_ATTENTION'
      : (textCharacterCount < 50 ? 'NEEDS_ATTENTION' : 'READY');

    // Cap single web page length to 25,000 characters to prevent forum/dump flood
    const MAX_CLEANED_CHARS = 25000;
    const finalCleanedText = cleaned.length > MAX_CLEANED_CHARS ? cleaned.slice(0, MAX_CLEANED_CHARS) : cleaned;

    // Detect temporal metadata
    const temporal = detectTemporalMetadata(finalCleanedText, finalTitle);

    const isLowTextDomainMatch = isLowTextDomain(domain) || isLoginWall(rawUrl, finalTitle, cleaned);
    const derivedSourceType = input.sourceType || (isLowTextDomainMatch ? 'low_text' : (isLimited ? 'limited' : 'real'));

    return {
      id,
      type: 'url',
      url: rawUrl,
      domain,
      title: finalTitle,
      rawText: bodyText,
      cleanedText: finalCleanedText,
      wordCount,
      textCharacterCount: finalCleanedText.length,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus,
      credibilityHint,
      detectedDate: temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      isLimited,
      isLowText,
      sourceType: derivedSourceType,
      fetchedAt: nowIso
    };
  } catch (fetchErr: any) {
    // Server-side logging only
    console.error(`[Ingest Failure] Network fetch exception for "${rawUrl}":`, fetchErr);

    const fallbackText = cleanExtractedText(input.snippet || input.rawContent || '');
    if (fallbackText.length >= 20) {
      return {
        id,
        type: 'url',
        url: rawUrl,
        domain,
        title: input.title || domain,
        rawText: fallbackText,
        cleanedText: fallbackText,
        wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
        textCharacterCount: fallbackText.length,
        claimsExtracted: 0,
        claimsDiscarded: 0,
        usefulnessStatus: 'NEEDS_ATTENTION',
        credibilityHint,
        detectedDate: null,
        detectedCycle: null,
        isStale: false,
        isUndated: true,
        status: 'ready',
        isLimited: true,
        sourceType: 'limited',
        errorMessage: 'Network retrieval failed; using supporting provider text.',
        fetchedAt: nowIso
      };
    }

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
      isUnavailable: true,
      errorMessage: 'blocked or timed out',
      fetchedAt: nowIso,
      sourceType: 'unavailable'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function ingestSources(inputs: SourceInput[]): Promise<IngestedSource[]> {
  const promises = inputs.map((input, index) => processSource(input, index));
  return Promise.all(promises);
}
