import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { verifyClaimsVerbatim } from '../backend/src/analysis/verifier.js';
import { detectGaps } from '../backend/src/analysis/gaps.js';
import { detectConflicts } from '../backend/src/analysis/conflicts.js';
import { auditFreshness } from '../backend/src/analysis/freshness.js';
import { IngestedSource } from '../backend/src/ingestion/types.js';
import { detectTemporalMetadata } from '../backend/src/ingestion/metadata.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — FIXTURE VALIDATOR (PHASE 3)     ');
console.log('========================================================\n');

const FIXTURES_ROOT = path.join(process.cwd(), 'fixtures');

if (!fs.existsSync(FIXTURES_ROOT)) {
  console.error('Fixtures directory not found at', FIXTURES_ROOT);
  process.exit(1);
}

const scenarioDirs = fs.readdirSync(FIXTURES_ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join(FIXTURES_ROOT, d.name));

if (scenarioDirs.length === 0) {
  console.error('No scenario directories found in', FIXTURES_ROOT);
  process.exit(1);
}

let totalValidated = 0;
let totalPassed = 0;

for (const dir of scenarioDirs) {
  const scenarioFile = path.join(dir, 'scenario.json');
  const expectedFile = path.join(dir, 'expected.json');

  if (!fs.existsSync(scenarioFile) || !fs.existsSync(expectedFile)) {
    console.warn(`Skipping incomplete directory: ${dir}`);
    continue;
  }

  totalValidated++;
  const scenario = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'));
  const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));

  console.log(`▶ Validating Fixture: [${scenario.id}] ${scenario.name}`);

  // 1. Rule Checks: .example domains, no .fictional domains, clear sample labeling
  for (const src of scenario.sources) {
    assert(!src.domain.endsWith('.fictional'), `Source ${src.id} must not use .fictional domain: ${src.domain}`);
    assert(src.domain.endsWith('.example') || src.domain.includes('.example'), `Source ${src.id} must use .example domain: ${src.domain}`);
    assert(src.title.includes('SAMPLE') || src.sourceType === 'sample', `Source ${src.id} must be clearly tagged as sample data`);
  }

  // 2. Prepare Ingested Sources
  const ingestedSources: IngestedSource[] = scenario.sources.map((s: any) => {
    const temporal = detectTemporalMetadata(s.cleanedText, s.title);
    return {
      id: s.id,
      type: 'text',
      url: s.url,
      domain: s.domain,
      title: s.title,
      rawText: s.rawText || s.cleanedText,
      cleanedText: s.cleanedText,
      wordCount: s.cleanedText.split(/\s+/).filter(Boolean).length,
      textCharacterCount: s.cleanedText.length,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus: 'READY',
      credibilityHint: s.domain.includes('.gov') || s.domain.includes('official') ? 'institutional' : 'general',
      detectedDate: temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      sourceType: 'sample',
      fetchedAt: new Date().toISOString()
    };
  });

  // 3. Verbatim Claim Verification
  const verification = verifyClaimsVerbatim(expected.claims, ingestedSources);
  assert.strictEqual(
    verification.discardedClaimsCount,
    0,
    `Fixture claims must be 100% verifiable verbatim. Discarded: ${JSON.stringify(verification.discardedQuotes)}`
  );

  // 4. Deterministic Gap, Conflict, and Freshness Detection
  const gaps = detectGaps(expected.expectedAttributes, verification.verifiedClaims, ingestedSources.length);
  const conflicts = detectConflicts(verification.verifiedClaims, ingestedSources);
  const freshnessWarnings = auditFreshness(ingestedSources);

  // 5. Assertions Validation
  if (expected.assertions?.minConflicts !== undefined) {
    assert(
      conflicts.length >= expected.assertions.minConflicts,
      `Expected at least ${expected.assertions.minConflicts} conflicts, got ${conflicts.length}`
    );
  }
  if (expected.assertions?.expectedConflictAttributes) {
    for (const expAttr of expected.assertions.expectedConflictAttributes) {
      assert(
        conflicts.some(c => c.attribute === expAttr),
        `Expected conflict on attribute "${expAttr}"`
      );
    }
  }
  if (expected.assertions?.minFreshnessWarnings !== undefined) {
    assert(
      freshnessWarnings.length >= expected.assertions.minFreshnessWarnings,
      `Expected at least ${expected.assertions.minFreshnessWarnings} freshness warnings, got ${freshnessWarnings.length}`
    );
  }
  if (expected.assertions?.expectedTotalGaps) {
    for (const expGap of expected.assertions.expectedTotalGaps) {
      assert(
        gaps.some(g => g.attribute === expGap && g.type === 'total_gap'),
        `Expected total gap on attribute "${expGap}"`
      );
    }
  }

  console.log(`  ✅ Passed: ${verification.verifiedClaims.length} verified claims, ${conflicts.length} conflicts, ${gaps.filter(g => g.type === 'total_gap').length} total gaps, ${freshnessWarnings.length} freshness warnings.\n`);
  totalPassed++;
}

console.log(`────────────────────────────────────────────────────────`);
console.log(`Validation Results: ${totalPassed}/${totalValidated} scenario fixtures passed cleanly.`);
if (totalPassed === totalValidated && totalValidated >= 3) {
  console.log('🎉 All Phase 3 scenario fixtures verified!\n');
  process.exit(0);
} else {
  console.error('💥 Some fixtures failed validation.');
  process.exit(1);
}

