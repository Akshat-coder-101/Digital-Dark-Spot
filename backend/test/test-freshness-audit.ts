import assert from 'node:assert';
import { auditFreshness } from '../src/analysis/freshness.js';
import { IngestedSource } from '../src/ingestion/types.js';
import { ExtractedClaim } from '../src/analysis/types.js';

console.log('🧪 Running Freshness, Passed Deadline, and Cycle Audit Tests...');

const mockSources: IngestedSource[] = [
  // 1. Earlier cycle source
  {
    id: 'src-earlier-cycle',
    type: 'url',
    domain: 'portal.example',
    title: 'Archive Guidelines 2023-24',
    rawText: 'Full text',
    cleanedText: 'Full text',
    wordCount: 100,
    textCharacterCount: 500,
    claimsExtracted: 1,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'institutional',
    detectedDate: '2023-08-01',
    detectedCycle: '2023-24',
    isStale: true,
    isUndated: false,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  },
  // 2. Undated source
  {
    id: 'src-undated',
    type: 'url',
    domain: 'blog.example',
    title: 'Undated Third-Party Explainer',
    rawText: 'Full text without date',
    cleanedText: 'Full text without date',
    wordCount: 80,
    textCharacterCount: 400,
    claimsExtracted: 1,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'general',
    detectedDate: null,
    detectedCycle: null,
    isStale: false,
    isUndated: true,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  },
  // 3. Current active source
  {
    id: 'src-current',
    type: 'url',
    domain: 'official.gov',
    title: 'Official Gazette 2026',
    rawText: 'Current official guidelines',
    cleanedText: 'Current official guidelines',
    wordCount: 150,
    textCharacterCount: 900,
    claimsExtracted: 1,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'institutional',
    detectedDate: '2026-05-10',
    detectedCycle: null,
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  }
];

// Claims with past deadline vs current
const mockClaims: ExtractedClaim[] = [
  {
    id: 'claim-past-deadline',
    source_id: 'src-earlier-cycle',
    source_title: 'Archive Guidelines 2023-24',
    source_domain: 'portal.example',
    attribute: 'application_deadline',
    value: '30 April 2025',
    quote: 'The application deadline was 30 April 2025.',
    verified: true
  },
  {
    id: 'claim-future-deadline',
    source_id: 'src-current',
    source_title: 'Official Gazette 2026',
    source_domain: 'official.gov',
    attribute: 'application_deadline',
    value: '31 December 2028',
    quote: 'The final application deadline is 31 December 2028.',
    verified: true
  }
];

const warnings = auditFreshness(mockSources, mockClaims);

// Verify earlier cycle warning
const cycleWarn = warnings.find(w => w.warningType === 'earlier_cycle');
assert(cycleWarn, 'Earlier cycle source must generate earlier_cycle warning');
assert.strictEqual(cycleWarn.statusLabel, 'Potentially outdated');
console.log('✅ Earlier cycle warning verified correctly.');

// Verify undated warning
const undatedWarn = warnings.find(w => w.warningType === 'undated');
assert(undatedWarn, 'Undated source must generate undated warning');
assert.strictEqual(undatedWarn.statusLabel, 'No date found in the source text');
console.log('✅ Undated source warning labeled "No date found in the source text".');

// Verify passed deadline warning
const deadlineWarn = warnings.find(w => w.warningType === 'deadline_passed');
assert(deadlineWarn, 'Claim with past deadline (30 April 2025) must generate deadline_passed warning');
assert(mockClaims[0].isDeadlinePassed, 'Past deadline claim must have isDeadlinePassed = true');
assert(mockClaims[0].isOutdated, 'Past deadline claim must have isOutdated = true');
assert(!mockClaims[1].isDeadlinePassed, 'Future deadline (2028) must NOT be flagged as deadline passed');
console.log('✅ Past deadline (30 April 2025) flagged with deadline_passed warning and isDeadlinePassed=true.');

console.log('🎉 Phase 2 Freshness Audit Tests Passed Successfully!');

