import { IngestedSource } from '../ingestion/types.js';
import { ExtractedClaim } from './types.js';
import { canonicalizeAttribute } from './canonicalization.js';
import crypto from 'crypto';

export function normalizeWhitespace(str: string): string {
  return (str || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface VerificationResult {
  verifiedClaims: ExtractedClaim[];
  discardedClaimsCount: number;
  discardedQuotes: Array<{ quote: string; source_id: string; reason: string }>;
}

/**
 * Validates that every claim's quote exists verbatim inside its corresponding source.
 * Discards any hallucinated or altered quotes strictly.
 */
export function verifyClaimsVerbatim(
  rawClaims: Array<{ source_id: string; attribute: string; value: string; quote: string }>,
  sources: IngestedSource[]
): VerificationResult {
  const sourceMap = new Map<string, IngestedSource>();
  for (const s of sources) {
    sourceMap.set(s.id, s);
  }

  const verifiedClaims: ExtractedClaim[] = [];
  const discardedQuotes: Array<{ quote: string; source_id: string; reason: string }> = [];

  for (let i = 0; i < rawClaims.length; i++) {
    const claim = rawClaims[i];
    const source = sourceMap.get(claim.source_id);

    if (!source) {
      discardedQuotes.push({
        quote: claim.quote,
        source_id: claim.source_id,
        reason: `Source ID "${claim.source_id}" does not exist in ingested sources.`
      });
      continue;
    }

    const quote = (claim.quote || '').trim();
    if (quote.length < 5) {
      discardedQuotes.push({
        quote: claim.quote,
        source_id: claim.source_id,
        reason: 'Quote too short to be verifiable evidence (min 5 chars).'
      });
      continue;
    }

    // Check verbatim substring in rawText or cleanedText
    const rawContent = source.rawText || (source as any).text || '';
    const cleanContent = source.cleanedText || (source as any).text || '';

    let matchIndex = rawContent.indexOf(quote);
    if (matchIndex === -1) {
      matchIndex = cleanContent.indexOf(quote);
    }

    // If exact substring fails, test normalized whitespace substring
    if (matchIndex === -1) {
      const normQuote = normalizeWhitespace(quote);
      const normRaw = normalizeWhitespace(rawContent);
      const normClean = normalizeWhitespace(cleanContent);

      if (normRaw.includes(normQuote) || normClean.includes(normQuote)) {
        matchIndex = 0; // verified via normalized space
      }
    }

    if (matchIndex !== -1) {
      const claimId = `claim-${i + 1}-${crypto.randomBytes(3).toString('hex')}`;
      const rawAttr = claim.attribute.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      const canonicalAttr = canonicalizeAttribute(rawAttr);
      verifiedClaims.push({
        id: claimId,
        source_id: source.id,
        source_title: source.title,
        source_domain: source.domain,
        attribute: canonicalAttr,
        original_attribute: claim.attribute,
        value: claim.value.trim(),
        quote: quote,
        verified: true,
        charOffset: matchIndex,
        subject: (claim as any).subject
      });
    } else {
      discardedQuotes.push({
        quote: quote,
        source_id: source.id,
        reason: 'Verbatim quote was not found in source text (possible hallucination or paraphrase).'
      });
    }
  }

  return {
    verifiedClaims,
    discardedClaimsCount: discardedQuotes.length,
    discardedQuotes
  };
}

