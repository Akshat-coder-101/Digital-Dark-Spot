import assert from 'node:assert';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { ExtractedClaim } from '../src/analysis/types.js';
import { IngestedSource } from '../src/ingestion/types.js';
import { extractNumericRange, doRangesOverlap } from '../src/analysis/normalization.js';

console.log('🧪 Running Conflict Precision & Suppression Tests...');

const mockSources: IngestedSource[] = [
  {
    id: 'src-1',
    type: 'url',
    domain: 'portal.example.gov',
    title: 'National Scholarship Portal',
    rawText: 'text',
    cleanedText: 'text',
    wordCount: 100,
    textCharacterCount: 500,
    claimsExtracted: 2,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'institutional',
    detectedDate: '2026-01-01',
    detectedCycle: null,
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  },
  {
    id: 'src-2',
    type: 'url',
    domain: 'education.example.gov',
    title: 'Department of Higher Education',
    rawText: 'text',
    cleanedText: 'text',
    wordCount: 100,
    textCharacterCount: 500,
    claimsExtracted: 2,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'institutional',
    detectedDate: '2026-01-01',
    detectedCycle: null,
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  }
];

// TEST 1: Overlapping Numeric Ranges must NOT produce a conflict
const range1 = extractNumericRange('$1,000 - $1,500');
const point1 = extractNumericRange('$1,200');
assert(range1 && point1, 'Range extraction must succeed');
assert(doRangesOverlap(range1, point1), 'Range $1,000-$1,500 and $1,200 must overlap');

const tgpRange = extractNumericRange('80W - 115W');
const tgpPoint = extractNumericRange('100W');
assert(tgpRange && tgpPoint, 'TGP Range extraction must succeed');
assert(doRangesOverlap(tgpRange, tgpPoint), 'TGP 80W-115W and 100W must overlap');

const mockOverlapClaims: ExtractedClaim[] = [
  {
    id: 'c-range-1',
    source_id: 'src-1',
    source_title: 'Tech Spec',
    source_domain: 'maker.example',
    attribute: 'gpu_tgp',
    value: '80W - 115W configurable TGP',
    quote: 'GPU supports 80W - 115W configurable TGP.',
    verified: true
  },
  {
    id: 'c-range-2',
    source_id: 'src-2',
    source_title: 'Review Guide',
    source_domain: 'reviews.example',
    attribute: 'gpu_tgp',
    value: '100W TGP in default mode',
    quote: 'The default profile runs at 100W TGP in default mode.',
    verified: true
  }
];

const overlapConflicts = detectConflicts(mockOverlapClaims, mockSources);
assert.strictEqual(overlapConflicts.length, 0, 'Overlapping numeric ranges must NOT be flagged as conflicts');
console.log('✅ Overlapping numeric ranges ($1,000-$1,500 vs $1,200 and 80W-115W vs 100W) successfully suppressed.');

// TEST 2: "Official portal or link" generic descriptions must NOT produce a conflict
const mockPortalClaims: ExtractedClaim[] = [
  {
    id: 'c-portal-1',
    source_id: 'src-1',
    source_title: 'National Portal',
    source_domain: 'portal.example.gov',
    attribute: 'official_portal_or_link',
    value: 'Official portal',
    quote: 'Submit applications through the Official portal.',
    verified: true
  },
  {
    id: 'c-portal-2',
    source_id: 'src-2',
    source_title: 'Department Guidelines',
    source_domain: 'education.example.gov',
    attribute: 'official_portal_or_link',
    value: 'Official government portal',
    quote: 'Access the Official government portal for verification.',
    verified: true
  }
];

const portalConflicts = detectConflicts(mockPortalClaims, mockSources);
assert.strictEqual(portalConflicts.length, 0, '"Official portal" generic text mentions must NOT be flagged as conflicts');
console.log('✅ "Official portal" false conflict successfully suppressed.');

// TEST 3: Genuine URL conflict with distinct targets for same role
const mockRealUrlConflicts: ExtractedClaim[] = [
  {
    id: 'c-url-1',
    source_id: 'src-1',
    source_title: 'Primary Notice',
    source_domain: 'gov.example',
    attribute: 'submission_portal_url',
    value: 'https://apply.real-portal.gov',
    quote: 'Apply at https://apply.real-portal.gov',
    verified: true
  },
  {
    id: 'c-url-2',
    source_id: 'src-2',
    source_title: 'Third Party Guide',
    source_domain: 'blog.example',
    attribute: 'submission_portal_url',
    value: 'https://apply.fake-portal.com',
    quote: 'Direct submission link: https://apply.fake-portal.com',
    verified: true
  }
];

const realUrlConflicts = detectConflicts(mockRealUrlConflicts, mockSources);
assert.strictEqual(realUrlConflicts.length, 1, 'Distinct conflicting URLs for the same role must be flagged');
assert(realUrlConflicts[0].sourceA.quote && realUrlConflicts[0].sourceB.quote, 'Both quotes must be present');
console.log('✅ Real URL conflict between distinct endpoints flagged correctly with both verbatim quotes.');

console.log('🎉 Phase 3 Conflict Precision Tests Passed Successfully!');

