import assert from 'assert';
import { isLowTextDomain, isLoginWall, isLowTextSource } from '../src/ingestion/lowText.js';
import { buildPrioritizedChecklist } from '../src/analysis/checklist.js';
import { computeParameterStatuses } from '../src/analysis/parameterStatus.js';
import { generateStructuredSummary } from '../src/analysis/summaryGenerator.js';
import { IngestedSource } from '../src/ingestion/types.js';
import { ExtractedClaim, PossibleConflict, FreshnessWarning } from '../src/analysis/types.js';

console.log('\n============================================================');
console.log('    PHASE 2 & PHASE 4: LOW-TEXT & CHECKLIST TEST            ');
console.log('============================================================\n');

// 1. Low text source detection
console.log('--- 1. Low-Text Source Detection ---');
assert.strictEqual(isLowTextDomain('https://instagram.com/p/12345'), true);
assert.strictEqual(isLowTextDomain('https://youtube.com/watch?v=abcd'), true);
assert.strictEqual(isLowTextDomain('https://tiktok.com/@user/video/123'), true);
assert.strictEqual(isLowTextDomain('https://official-portal.gov/spec'), false);
assert.strictEqual(isLoginWall('https://example.com/login', 'Login to continue reading', 'Please sign in'), true);
assert.strictEqual(isLoginWall('https://example.com/spec', 'Official Specs', 'Comprehensive device specifications'), false);

const mockLowSource: any = {
  url: 'https://youtube.com/watch?v=test',
  domain: 'youtube.com',
  title: 'Review Video',
  rawContent: 'Video description only',
  limited: true
};
assert.strictEqual(isLowTextSource(mockLowSource), true);
console.log('✅ PASS: Low-text domain, login wall, and limited threshold detected.');

// 2. Low-text source exclusion from reviewed counts
console.log('\n--- 2. Low-Text Source Exclusion from Reviewed Counts ---');
const sources: IngestedSource[] = [
  {
    id: 's1', type: 'url', domain: 'source1.gov', title: 'Official Doc 1',
    rawText: '...', cleanedText: 'Full specifications and details for standard configuration.',
    wordCount: 150, textCharacterCount: 1800, claimsExtracted: 2, claimsDiscarded: 0,
    usefulnessStatus: 'READY', credibilityHint: 'institutional', detectedDate: '2026-05-01',
    detectedCycle: '2026', isStale: false, isUndated: false, status: 'ready', isLimited: false,
    sourceType: 'real', fetchedAt: new Date().toISOString()
  },
  {
    id: 's2', type: 'url', domain: 'source2.org', title: 'Technical Sheet 2',
    rawText: '...', cleanedText: 'Technical specifications.',
    wordCount: 80, textCharacterCount: 800, claimsExtracted: 1, claimsDiscarded: 0,
    usefulnessStatus: 'NEEDS_ATTENTION', credibilityHint: 'general', detectedDate: '2026-04-01',
    detectedCycle: '2026', isStale: false, isUndated: false, status: 'ready', isLimited: true,
    sourceType: 'limited', fetchedAt: new Date().toISOString()
  },
  {
    id: 's3', type: 'url', domain: 'instagram.com', title: 'Instagram Post',
    rawText: '...', cleanedText: 'Short caption.',
    wordCount: 10, textCharacterCount: 50, claimsExtracted: 0, claimsDiscarded: 0,
    usefulnessStatus: 'NEEDS_ATTENTION', credibilityHint: 'general', detectedDate: null,
    detectedCycle: null, isStale: false, isUndated: true, status: 'ready', isLimited: true,
    isLowText: true, sourceType: 'low_text', fetchedAt: new Date().toISOString()
  }
];

const claims: ExtractedClaim[] = [
  {
    id: 'c1', source_id: 's1', source_title: 'Official Doc 1', source_domain: 'source1.gov',
    attribute: 'power_limit', value: '115W', quote: 'Operating at 115W power limit', verified: true
  },
  {
    id: 'c2', source_id: 's2', source_title: 'Technical Sheet 2', source_domain: 'source2.org',
    attribute: 'power_limit', value: '95W', quote: 'Configured at 95W', verified: true
  }
];

const conflicts: PossibleConflict[] = [
  {
    id: 'conf-1',
    attribute: 'power_limit',
    title: 'Discrepancy in power limit',
    description: '115W vs 95W',
    sourceA: { source_id: 's1', source_domain: 'source1.gov', source_title: 'Official Doc 1', value: '115W', quote: 'Operating at 115W power limit' },
    sourceB: { source_id: 's2', source_domain: 'source2.org', source_title: 'Technical Sheet 2', value: '95W', quote: 'Configured at 95W' },
    statusLabel: 'Possible conflict',
    signalTag: 'Sourced'
  }
];

const expectedParameters = ['power_limit', 'display_refresh', 'warranty_period'];
const paramStatuses = computeParameterStatuses(
  expectedParameters,
  claims,
  conflicts,
  [],
  sources
);

const summary = generateStructuredSummary({
  question: 'What are the technical specs of Model X?',
  sources,
  parameterStatuses: paramStatuses,
  claims,
  conflicts,
  freshness: [],
  checklist: []
});

console.log('Overview sentence 1:', summary.overview[0]);
// Verify reviewed count excludes low-text: 2 reviewed sources (1 full, 1 limited, and 1 low-text)
assert.ok(summary.overview[0].includes('across 2 reviewed sources'));
assert.ok(summary.overview[0].includes('1 full document'));
assert.ok(summary.overview[0].includes('1 limited supporting text'));
assert.ok(summary.overview[0].includes('1 low-text source'));
console.log('✅ PASS: Summary excludes low-text sources from reviewed counts.');

// 3. Checklist Priorities and Specific Phrasing
console.log('\n--- 3. Checklist Priorities and Wording ---');
const freshness: FreshnessWarning[] = [
  {
    id: 'f1', source_id: 's1', source_title: 'Official Doc 1', source_domain: 'source1.gov',
    warningType: 'deadline_passed', reason: 'Deadline passed', detectedDate: '2025-12-31', detectedCycle: null,
    statusLabel: 'Potentially stale', signalTag: 'Sourced'
  },
  {
    id: 'f2', source_id: 's2', source_title: 'Technical Sheet 2', source_domain: 'source2.org',
    warningType: 'undated', reason: 'Undated source', detectedDate: null, detectedCycle: null,
    statusLabel: 'No date found in the source text', signalTag: 'Sourced'
  }
];

const checklist = buildPrioritizedChecklist(
  [],
  conflicts,
  freshness,
  ['Is international warranty supported?'],
  paramStatuses,
  sources
);

const highItems = checklist.filter(c => c.priority === 'High');
const mediumItems = checklist.filter(c => c.priority === 'Medium');
const lowItems = checklist.filter(c => c.priority === 'Low');

console.log(`Checklist items compiled: ${highItems.length} High, ${mediumItems.length} Medium, ${lowItems.length} Low`);
for (const item of checklist) {
  console.log(` • [${item.priority}] ${item.title}`);
}

// Check High priority invariants: conflict, passed deadline, true gap
assert.ok(highItems.some(i => i.title.toLowerCase().includes('resolve conflicting details: power limit')));
assert.ok(highItems.some(i => i.title.includes('Passed deadline')));
assert.ok(highItems.some(i => i.title.startsWith('Find a source for:')));

// Check Medium priority invariants: limited source, undated
assert.ok(mediumItems.some(i => i.title.includes('Audit undated claims')));
assert.ok(mediumItems.some(i => i.title.includes('Audit claims from limited source')));

// Check Low priority: open questions
assert.ok(lowItems.some(i => i.title.startsWith('General check:')));

// Ensure no titles have generic "Obtain verified..."
assert.strictEqual(checklist.some(i => i.title.startsWith('Obtain verified')), false);

console.log('✅ PASS: Checklist priorities strictly follow High/Medium/Low rules.');
console.log('✅ PASS: All checklist titles are specific and non-generic.');

console.log('\n🎉 ALL PHASE 2 & 4 TESTS PASSED CLEANLY!\n');
