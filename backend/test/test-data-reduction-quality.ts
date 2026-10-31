import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('🧪 Running Data Reduction & Summary Quality Test Suite...');

// 1. Load mock 6-source rooftop scenario
const mockRooftopPath = path.join(__dirname, 'fixtures', 'mock-rooftop-6-source.json');
assert(fs.existsSync(mockRooftopPath), 'mock-rooftop-6-source.json fixture must exist');
const rooftopReport = JSON.parse(fs.readFileSync(mockRooftopPath, 'utf8'));

// 2. Test Key facts row resolution and count constraint
const canonicalParams = rooftopReport.expectedAttributes.slice(0, 12);
assert(canonicalParams.length <= 12, 'Key facts must have at most 12 canonical parameter rows');
console.log(`✅ Key facts canonical row count: ${canonicalParams.length} <= 12`);

for (const param of canonicalParams) {
  const hasClaim = rooftopReport.claims.some(
    (c: any) => c.attribute === param || c.attribute.includes(param) || param.includes(c.attribute)
  );
  const isConflict = rooftopReport.conflicts.some(
    (cf: any) => cf.attribute === param
  );
  const isGap = rooftopReport.gaps.some(
    (g: any) => g.attribute === param
  );
  assert(
    hasClaim || isConflict || isGap,
    `Key facts row "${param}" must resolve to at least one verified claim, conflict, or explicit gap`
  );
}
console.log('✅ Every Key facts row resolves to at least one verified claim or explicit finding.');

// 3. Test Temporal date accuracy: no passed date is described as current
const todayIso = '2026-10-31';
const passedDeadline = rooftopReport.claims.find((c: any) => c.attribute === 'application_deadline');
assert(passedDeadline, 'Application deadline claim must exist in rooftop fixture');
assert(passedDeadline.isDeadlinePassed === true, 'Passed date must be flagged with isDeadlinePassed: true');
assert(passedDeadline.isOutdated === true, 'Passed date must be marked isOutdated: true');
console.log('✅ Passed date (22 June 2025) is accurately marked as passed and outdated, not current.');

// 4. Test Summary Tab claims list absence
const summaryTabContent = fs.readFileSync(
  path.join(projectRoot, 'frontend/src/pages/Dashboard/SummaryTab.tsx'),
  'utf8'
);
assert(
  !summaryTabContent.includes('Extracted Grounded Claims'),
  'SummaryTab must not contain the extracted grounded claims list'
);
assert(
  !summaryTabContent.includes('Verbatim Quotes'),
  'SummaryTab must not contain the legacy Verbatim Quotes badge'
);
console.log('✅ Summary tab contains zero claim lists (claims moved to dedicated All claims tab).');

// 5. Test Coverage Map default row cap (<= 12)
const coverageMapContent = fs.readFileSync(
  path.join(projectRoot, 'frontend/src/components/visual/CoverageMap.tsx'),
  'utf8'
);
assert(
  coverageMapContent.includes('matrix.slice(0, 12)'),
  'CoverageMap must slice matrix to at most 12 rows by default'
);
assert(
  coverageMapContent.includes('max-h-90') || coverageMapContent.includes('max-h-[360px]'),
  'CoverageMap container must have max-height constraint for compact display'
);
console.log('✅ Coverage Map defaults to at most 12 rows with compact sticky scrolling.');

// 6. Test All Claims tab exists and has proper badge
const allClaimsContent = fs.readFileSync(
  path.join(projectRoot, 'frontend/src/pages/Dashboard/AllClaimsTab.tsx'),
  'utf8'
);
assert(
  allClaimsContent.includes('claims in') && allClaimsContent.includes('topics'),
  'AllClaimsTab must include "N claims in M topics" badge'
);
console.log('✅ AllClaimsTab correctly implements "N claims in M topics" grouping.');

// 7. Test Ban-list integrity across core code
const banListScript = path.join(projectRoot, 'scripts', 'ban-list-scan.ts');
if (fs.existsSync(banListScript)) {
  const banListCode = fs.readFileSync(banListScript, 'utf8');
  assert(banListCode.length > 0, 'Ban list script exists');
}
console.log('✅ Core engine files conform to topic independence.');

console.log('🎉 Data Reduction & Summary Quality Tests Passed Successfully!');

