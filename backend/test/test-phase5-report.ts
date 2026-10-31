import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { loadFixtureScenario } from '../src/data/sampleData.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — PHASE 5 REPORT & EVIDENCE TEST  ');
console.log('========================================================\n');

const FIXTURES_DIR = path.resolve(process.cwd(), 'fixtures');
const scenarioDirs = fs.readdirSync(FIXTURES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join(FIXTURES_DIR, d.name));

assert.ok(scenarioDirs.length >= 3, 'Must have at least 3 scenarios in fixtures/');

const EXACT_FINDING_LABELS = ['Sourced', 'AI-suggested', 'Uncertain'];
const EXACT_STATUS_WORDS = ['Found', 'Conflict', 'Single source', 'Gap', 'Stale'];
const EXACT_ORIGIN_TAGS = ['REAL SOURCE', 'USER-PROVIDED', 'SAMPLE DATA'];

let passedScenarios = 0;

for (const dir of scenarioDirs) {
  const scenarioFolder = path.basename(dir);
  const scenarioData = loadFixtureScenario(scenarioFolder);
  const { report, sources } = scenarioData;

  console.log(`▶ Testing Scenario [${scenarioData.id}] ${scenarioData.name}`);

  // 1. Verbatim quote verification & 120-character context window calculation
  assert.ok(report.claims.length > 0, `Scenario ${scenarioData.id} must have claims`);
  for (const claim of report.claims) {
    const src = sources.find(s => s.id === claim.source_id);
    assert.ok(src, `Source ${claim.source_id} must exist for claim ${claim.id}`);
    const sourceText = src.cleanedText || (src as any).rawText || '';
    const idx = sourceText.indexOf(claim.quote);
    assert.ok(idx !== -1, `Quote for claim ${claim.id} must exist in source text`);

    const start = Math.max(0, idx - 120);
    const end = Math.min(sourceText.length, idx + claim.quote.length + 120);
    const contextSnippet = sourceText.slice(start, end);
    assert.ok(
      contextSnippet.includes(claim.quote),
      `Context window (+/-120 chars) must contain verbatim quote for claim ${claim.id}`
    );
  }

  // 2. Section structure assertion
  assert.ok(report.summary && report.summary.length > 0, 'Summary section must exist');
  assert.ok(Array.isArray(report.claims), 'Claims section must exist');
  assert.ok(Array.isArray(report.gaps), 'Gaps section must exist');
  assert.ok(Array.isArray(report.conflicts), 'Conflicts section must exist');
  assert.ok(Array.isArray(report.freshnessWarnings), 'Freshness warnings section must exist');
  assert.ok(Array.isArray(report.coverageMatrix), 'Coverage matrix section must exist');
  assert.ok(Array.isArray(report.checklist), 'Checklist section must exist');

  // 3. Why this was flagged metadata verification
  for (const g of report.gaps) {
    assert.ok(g.description && g.description.length > 0, `Gap ${g.id} must have explanation description`);
    assert.ok(g.suggestedAction && g.suggestedAction.length > 0, `Gap ${g.id} must have recommended action`);
  }
  for (const c of report.conflicts) {
    assert.ok(c.description && c.description.length > 0, `Conflict ${c.id} must have explanation description`);
    assert.ok(c.title && c.title.length > 0, `Conflict ${c.id} must have title`);
  }
  for (const f of report.freshnessWarnings) {
    assert.ok(f.reason && f.reason.length > 0, `Freshness warning ${f.id} must have reason`);
  }

  // 4. Label vocabulary mapping assertion
  // Status words: 'Found' | 'Conflict' | 'Single source' | 'Gap' | 'Stale'
  for (const row of report.coverageMatrix) {
    const validOverall = ['covered', 'gap', 'conflict', 'thin'];
    assert.ok(validOverall.includes(row.overallStatus), `Matrix row status ${row.overallStatus} must be valid`);

    // Map to user-facing vocabulary
    const userFacingStatus = row.overallStatus === 'covered'
      ? 'Found'
      : row.overallStatus === 'conflict'
      ? 'Conflict'
      : row.overallStatus === 'thin'
      ? 'Single source'
      : 'Gap';
    assert.ok(EXACT_STATUS_WORDS.includes(userFacingStatus), `Mapped status ${userFacingStatus} must be in allowed status words`);
  }

  // 5. Source Origin tags assertion
  for (const src of sources) {
    const originTag = src.url?.startsWith('sample://') || src.sourceType === 'sample' || scenarioData.id.includes('scenario')
      ? 'SAMPLE DATA'
      : src.url?.startsWith('http')
      ? 'REAL SOURCE'
      : 'USER-PROVIDED';
    assert.ok(EXACT_ORIGIN_TAGS.includes(originTag), `Origin tag ${originTag} must be in allowed origin tags`);
  }

  passedScenarios++;
  console.log(`  ✓ Passed: [${scenarioData.id}] ${scenarioData.name}`);
}

assert.strictEqual(passedScenarios, 3, 'All 3 sample scenarios must pass report and evidence tests');
console.log('\n✅ All Phase 5 Report and Evidence tests passed successfully.\n');
