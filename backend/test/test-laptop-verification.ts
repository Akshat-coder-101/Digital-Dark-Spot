import assert from 'assert';
import { batchCanonicalizeAttributes } from '../src/analysis/canonicalization.js';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { detectGaps } from '../src/analysis/gaps.js';
import { ExtractedClaim } from '../src/analysis/types.js';
import { IngestedSource } from '../src/ingestion/types.js';

console.log('\n🍉 ========================================================');
console.log('       TEST: HARDWARE VERIFICATION DISCIPLINE (NO FALSE GAPS/CONFLICTS) ');
console.log('========================================================\n');

// 1. Setup 3 Sources: Lenovo specs, Acer review, Tech blog hardware overview
const sources: IngestedSource[] = [
  {
    id: 'src-lenovo-spec',
    type: 'url',
    url: 'https://psref.lenovo.com/Product/Legion/Legion_5_16IRX9',
    domain: 'lenovo.com',
    title: 'Lenovo Legion 5i 16 Gen 9 Product Specifications',
    rawText: 'Full specifications for Lenovo Legion 5i with RTX 5060 Laptop GPU. Max graphics power 115W, with Dynamic Boost up to 140W. 8GB GDDR7 VRAM. 1-year limited manufacturer warranty. $1,199 MSRP.',
    cleanedText: 'Full specifications for Lenovo Legion 5i with RTX 5060 Laptop GPU. Max graphics power 115W, with Dynamic Boost up to 140W. 8GB GDDR7 VRAM. 1-year limited manufacturer warranty. $1,199 MSRP.',
    wordCount: 35,
    textCharacterCount: 220,
    claimsExtracted: 4,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'institutional',
    detectedDate: null,
    detectedCycle: null,
    isStale: false,
    isUndated: true,
    status: 'ready',
    fetchedAt: '2026-10-31T12:00:00Z'
  },
  {
    id: 'src-acer-review',
    type: 'url',
    url: 'https://laptopmedia.com/review/acer-nitro-16-rtx-5060',
    domain: 'laptopmedia.com',
    title: 'Acer Nitro 16 In-Depth Review and Teardown',
    rawText: 'The Acer Nitro 16 runs its RTX 5060 at a 100W power limit. Includes 8GB GDDR7 VRAM. Acer provides a 2-year warranty on this configuration at an introductory retail price of $1,050.',
    cleanedText: 'The Acer Nitro 16 runs its RTX 5060 at a 100W power limit. Includes 8GB GDDR7 VRAM. Acer provides a 2-year warranty on this configuration at an introductory retail price of $1,050.',
    wordCount: 35,
    textCharacterCount: 210,
    claimsExtracted: 4,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'general',
    detectedDate: null,
    detectedCycle: null,
    isStale: false,
    isUndated: true,
    status: 'ready',
    fetchedAt: '2026-10-31T12:00:00Z'
  },
  {
    id: 'src-tech-blog',
    type: 'url',
    url: 'https://notebookcheck.net/RTX-5060-Laptop-GPU-Analysis',
    domain: 'notebookcheck.net',
    title: 'NVIDIA RTX 5060 Mobile TGP Range and Architecture Deep Dive',
    rawText: 'NVIDIA specifies a configurable 80W - 140W TGP range for the mobile RTX 5060 with 8GB GDDR7 VRAM. Market prices for these systems span $999 to $1,299 depending on cooling and panel tier.',
    cleanedText: 'NVIDIA specifies a configurable 80W - 140W TGP range for the mobile RTX 5060 with 8GB GDDR7 VRAM. Market prices for these systems span $999 to $1,299 depending on cooling and panel tier.',
    wordCount: 35,
    textCharacterCount: 230,
    claimsExtracted: 3,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'general',
    detectedDate: null,
    detectedCycle: null,
    isStale: false,
    isUndated: true,
    status: 'ready',
    fetchedAt: '2026-10-31T12:00:00Z'
  }
];

// Question needs derived from user verification goal
const questionNeeds = [
  'power_limit_tgp',
  'vram_capacity',
  'warranty_and_return_policy',
  'pricing_and_deals'
];

// 2. Extracted raw claims across the three sources
const rawClaims: ExtractedClaim[] = [
  // Source 1 (Lenovo)
  {
    id: 'c-1',
    source_id: 'src-lenovo-spec',
    source_title: sources[0].title,
    source_domain: sources[0].domain,
    attribute: 'tgp_graphics_power',
    value: '115W (up to 140W with Dynamic Boost)',
    quote: 'Max graphics power 115W, with Dynamic Boost up to 140W',
    verified: true,
    subject: 'Lenovo Legion 5i'
  },
  {
    id: 'c-2',
    source_id: 'src-lenovo-spec',
    source_title: sources[0].title,
    source_domain: sources[0].domain,
    attribute: 'vram',
    value: '8GB GDDR7',
    quote: '8GB GDDR7 VRAM',
    verified: true,
    subject: 'Lenovo Legion 5i'
  },
  {
    id: 'c-3',
    source_id: 'src-lenovo-spec',
    source_title: sources[0].title,
    source_domain: sources[0].domain,
    attribute: 'warranty_terms',
    value: '1-year limited manufacturer warranty',
    quote: '1-year limited manufacturer warranty',
    verified: true,
    subject: 'Lenovo Legion 5i'
  },
  {
    id: 'c-4',
    source_id: 'src-lenovo-spec',
    source_title: sources[0].title,
    source_domain: sources[0].domain,
    attribute: 'msrp_price',
    value: '$1,199',
    quote: '$1,199 MSRP',
    verified: true,
    subject: 'Lenovo Legion 5i'
  },

  // Source 2 (Acer)
  {
    id: 'c-5',
    source_id: 'src-acer-review',
    source_title: sources[1].title,
    source_domain: sources[1].domain,
    attribute: 'power_limit',
    value: '100W',
    quote: 'runs its RTX 5060 at a 100W power limit',
    verified: true,
    subject: 'Acer Nitro 16'
  },
  {
    id: 'c-6',
    source_id: 'src-acer-review',
    source_title: sources[1].title,
    source_domain: sources[1].domain,
    attribute: 'vram_size',
    value: '8GB GDDR7',
    quote: 'Includes 8GB GDDR7 VRAM',
    verified: true,
    subject: 'Acer Nitro 16'
  },
  {
    id: 'c-7',
    source_id: 'src-acer-review',
    source_title: sources[1].title,
    source_domain: sources[1].domain,
    attribute: 'warranty_period',
    value: '2-year warranty',
    quote: 'Acer provides a 2-year warranty',
    verified: true,
    subject: 'Acer Nitro 16'
  },
  {
    id: 'c-8',
    source_id: 'src-acer-review',
    source_title: sources[1].title,
    source_domain: sources[1].domain,
    attribute: 'retail_price',
    value: '$1,050',
    quote: 'introductory retail price of $1,050',
    verified: true,
    subject: 'Acer Nitro 16'
  },

  // Source 3 (Tech blog)
  {
    id: 'c-9',
    source_id: 'src-tech-blog',
    source_title: sources[2].title,
    source_domain: sources[2].domain,
    attribute: 'tgp_range',
    value: '80W - 140W',
    quote: 'configurable 80W - 140W TGP range',
    verified: true,
    subject: 'RTX 5060 Mobile'
  },
  {
    id: 'c-10',
    source_id: 'src-tech-blog',
    source_title: sources[2].title,
    source_domain: sources[2].domain,
    attribute: 'vram_memory',
    value: '8GB GDDR7',
    quote: '8GB GDDR7 VRAM',
    verified: true,
    subject: 'RTX 5060 Mobile'
  },
  {
    id: 'c-11',
    source_id: 'src-tech-blog',
    source_title: sources[2].title,
    source_domain: sources[2].domain,
    attribute: 'market_price',
    value: '$999 - $1,299',
    quote: 'span $999 to $1,299',
    verified: true,
    subject: 'RTX 5060 Mobile'
  }
];

// Test 1: Canonicalization Maps All 11 Claims cleanly to Question Needs
const canonOutput = batchCanonicalizeAttributes({
  question: 'What should I verify before buying an RTX 5060 device?',
  questionNeeds,
  rawAttributes: rawClaims.map(c => c.attribute)
});

console.log('Canonical Parameters:', canonOutput.canonicalParameters);
console.log('Mapping count:', canonOutput.rawToCanonicalMap.size);

// Re-map claims
for (const c of rawClaims) {
  const mapped = canonOutput.rawToCanonicalMap.get(c.attribute);
  c.original_attribute = c.attribute;
  c.attribute = mapped || 'other_details';
}

// Assert 0 claims unmapped to other_details
const unmappedClaims = rawClaims.filter(c => c.attribute === 'other_details');
console.log(`Claims mapped: ${rawClaims.length - unmappedClaims.length}/${rawClaims.length}`);
assert.strictEqual(unmappedClaims.length, 0, 'All 11 hardware claims must be mapped to question needs');

// Test 2: Detect Gaps - 0 False Gaps for Covered Parameters
const gaps = detectGaps(canonOutput.canonicalParameters, rawClaims, sources.length, questionNeeds);
const totalGaps = gaps.filter(g => g.type === 'total_gap');
console.log(`Total Gaps detected: ${totalGaps.length}`);
assert.strictEqual(totalGaps.length, 0, 'There should be 0 total gaps since all 4 question needs are covered');

// Test 3: Detect Conflicts - 0 Cross-Subject Conflicts & Overlapping Range Suppression
const conflicts = detectConflicts(rawClaims, sources);
console.log(`Conflicts detected: ${conflicts.length}`);
assert.strictEqual(
  conflicts.length,
  0,
  `Expected 0 cross-subject/overlapping conflicts, but got ${conflicts.length}: ${JSON.stringify(conflicts.map(c => ({ attr: c.attribute, valA: c.sourceA.value, valB: c.sourceB.value })))}`
);

// Test 4: Outdated vs Undated Counters
const outdatedSources = sources.filter(s => s.isStale).length;
const undatedSources = sources.filter(s => s.isUndated).length;
console.log(`Sources status: ${outdatedSources} outdated, ${undatedSources} undated`);
assert.strictEqual(outdatedSources, 0, 'No sources are older than 18 months or earlier cycles');
assert.strictEqual(undatedSources, 3, 'All 3 sources are undated specification notices');

console.log('\n🎉 [PASS] Hardware verification discipline tests passed with 0 false gaps and 0 cross-subject conflicts!\n');

