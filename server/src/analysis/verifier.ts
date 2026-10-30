import { IngestedSource } from '../ingestion/types.js';
import { ExtractedClaim } from './types.js';
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
    let matchIndex = source.rawText.indexOf(quote);
    if (matchIndex === -1) {
      matchIndex = source.cleanedText.indexOf(quote);
    }

    // If exact substring fails, test normalized whitespace substring
    if (matchIndex === -1) {
      const normQuote = normalizeWhitespace(quote);
      const normRaw = normalizeWhitespace(source.rawText);
      const normClean = normalizeWhitespace(source.cleanedText);

      if (normRaw.includes(normQuote) || normClean.includes(normQuote)) {
        matchIndex = 0; // verified via normalized space
      }
    }

    if (matchIndex !== -1) {
      const claimId = `claim-${i + 1}-${crypto.randomBytes(3).toString('hex')}`;
      verifiedClaims.push({
        id: claimId,
        source_id: source.id,
        source_title: source.title,
        source_domain: source.domain,
        attribute: claim.attribute.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'),
        value: claim.value.trim(),
        quote: quote,
        verified: true,
        charOffset: matchIndex
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
