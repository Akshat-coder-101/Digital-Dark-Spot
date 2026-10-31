import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IngestedSource } from '../backend/src/ingestion/types.js';
import { detectTemporalMetadata } from '../backend/src/ingestion/metadata.js';
import { verifyClaimsVerbatim } from '../backend/src/analysis/verifier.js';
import { detectGaps } from '../backend/src/analysis/gaps.js';
import { detectConflicts } from '../backend/src/analysis/conflicts.js';
import { auditFreshness } from '../backend/src/analysis/freshness.js';
import { buildCoverageMatrix } from '../backend/src/analysis/matrix.js';
import { buildPrioritizedChecklist } from '../backend/src/analysis/checklist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.resolve(ROOT, 'fixtures');
const BACKEND_FIXTURES_DIR = path.resolve(ROOT, 'backend/fixtures');
const DOCS_DIR = path.resolve(ROOT, 'docs');

interface ScenarioBaseline {
  id: string;
  name: string;
  question: string;
  sourceCount: number;
  verifiedClaimsCount: number;
  claims: Array<{
    source_id: string;
    attribute: string;
    value: string;
    verified: boolean;
  }>;
  conflictsCount: number;
  conflicts: Array<{
    attribute: string;
    description: string;
  }>;
  gapsCount: number;
  totalGaps: string[];
  thinGaps: string[];
  freshnessWarningsCount: number;
  freshnessWarnings: Array<{
    sourceId: string;
    warningType: string;
  }>;
  matrixRowsCount: number;
  matrixStatuses: Array<{
    attribute: string;
    overallStatus: string;
  }>;
  checklistCount: number;
  checklistPriorities: {
    High: number;
    Medium: number;
    Low: number;
  };
}

async function run() {
  const baselines: Record<string, ScenarioBaseline> = {};

  // 1. Root fixtures/
  const rootDirs = ['scenario-a-aurora', 'scenario-b-solarbridge', 'scenario-c-nimbus-air'];
  for (const dir of rootDirs) {
    const scPath = path.join(FIXTURES_DIR, dir, 'scenario.json');
    const expPath = path.join(FIXTURES_DIR, dir, 'expected.json');
    if (!fs.existsSync(scPath) || !fs.existsSync(expPath)) continue;

    const scenario = JSON.parse(fs.readFileSync(scPath, 'utf8'));
    const expected = JSON.parse(fs.readFileSync(expPath, 'utf8'));

    const ingestedSources: IngestedSource[] = scenario.sources.map((s: any) => {
      const temporal = detectTemporalMetadata(s.cleanedText, s.title);
      return {
        id: s.id,
        type: 'text',
        domain: s.domain,
        title: s.title,
        rawText: s.cleanedText,
        cleanedText: s.cleanedText,
        wordCount: s.cleanedText.split(/\s+/).length,
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

    const verification = verifyClaimsVerbatim(expected.claims, ingestedSources);
    const gaps = detectGaps(expected.expectedAttributes, verification.verifiedClaims, ingestedSources.length);
    const conflicts = detectConflicts(verification.verifiedClaims, ingestedSources);
    const freshnessWarnings = auditFreshness(ingestedSources, verification.verifiedClaims);
    const matrix = buildCoverageMatrix(expected.expectedAttributes, ingestedSources, verification.verifiedClaims, conflicts);
    const checklist = buildPrioritizedChecklist(gaps, conflicts, freshnessWarnings, []);

    baselines[dir] = {
      id: scenario.id || dir,
      name: scenario.name,
      question: scenario.question,
      sourceCount: ingestedSources.length,
      verifiedClaimsCount: verification.verifiedClaims.length,
      claims: verification.verifiedClaims.map(c => ({
        source_id: c.source_id,
        attribute: c.attribute,
        value: c.value,
        verified: c.verified
      })),
      conflictsCount: conflicts.length,
      conflicts: conflicts.map(c => ({
        attribute: c.attribute,
        description: c.description
      })),
      gapsCount: gaps.length,
      totalGaps: gaps.filter(g => g.type === 'total_gap').map(g => g.attribute),
      thinGaps: gaps.filter(g => g.type === 'thin_coverage').map(g => g.attribute),
      freshnessWarningsCount: freshnessWarnings.length,
      freshnessWarnings: freshnessWarnings.map(w => ({
        sourceId: w.sourceId,
        warningType: w.warningType
      })),
      matrixRowsCount: matrix.length,
      matrixStatuses: matrix.map(m => ({
        attribute: m.attribute,
        overallStatus: m.overallStatus
      })),
      checklistCount: checklist.length,
      checklistPriorities: {
        High: checklist.filter(c => c.priority === 'High').length,
        Medium: checklist.filter(c => c.priority === 'Medium').length,
        Low: checklist.filter(c => c.priority === 'Low').length
      }
    };
  }

  // 2. backend/fixtures/
  const backendFixtureFiles = fs.readdirSync(BACKEND_FIXTURES_DIR).filter(f => f.endsWith('.json'));
  for (const file of backendFixtureFiles) {
    const filePath = path.join(BACKEND_FIXTURES_DIR, file);
    const fixture = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const ingestedSources: IngestedSource[] = fixture.sources.map((s: any) => {
      const temporal = detectTemporalMetadata(s.cleanedText, s.title);
      const isOfficial = s.domain.endsWith('.gov') || s.domain.endsWith('.gov.in') || s.domain.endsWith('.edu') || s.domain.endsWith('.ac.in');
      return {
        id: s.id,
        type: 'url',
        url: s.url,
        domain: s.domain,
        title: s.title,
        rawText: s.cleanedText,
        cleanedText: s.cleanedText,
        wordCount: s.cleanedText.split(/\s+/).length,
        textCharacterCount: s.cleanedText.length,
        claimsExtracted: 0,
        claimsDiscarded: 0,
        usefulnessStatus: 'READY',
        credibilityHint: isOfficial ? 'institutional' : 'general',
        status: 'ready',
        detectedDate: temporal.detectedDate,
        detectedCycle: temporal.detectedCycle,
        isUndated: temporal.isUndated,
        isStale: temporal.isStale,
        fetchedAt: new Date().toISOString()
      };
    });

    const verification = verifyClaimsVerbatim(fixture.expectedExtraction.claims, ingestedSources);
    const gaps = detectGaps(fixture.expectedExtraction.expected_attributes, verification.verifiedClaims, ingestedSources.length);
    const conflicts = detectConflicts(verification.verifiedClaims, ingestedSources);
    const freshnessWarnings = auditFreshness(ingestedSources, verification.verifiedClaims);
    const matrix = buildCoverageMatrix(fixture.expectedExtraction.expected_attributes, ingestedSources, verification.verifiedClaims, conflicts);
    const checklist = buildPrioritizedChecklist(gaps, conflicts, freshnessWarnings, fixture.expectedExtraction.open_questions || []);

    const id = path.basename(file, '.json');
    baselines[id] = {
      id: fixture.id || id,
      name: fixture.name,
      question: fixture.question,
      sourceCount: ingestedSources.length,
      verifiedClaimsCount: verification.verifiedClaims.length,
      claims: verification.verifiedClaims.map((c: any) => ({
        source_id: c.source_id,
        attribute: c.attribute,
        value: c.value,
        verified: c.verified
      })),
      conflictsCount: conflicts.length,
      conflicts: conflicts.map(c => ({
        attribute: c.attribute,
        description: c.description
      })),
      gapsCount: gaps.length,
      totalGaps: gaps.filter(g => g.type === 'total_gap').map(g => g.attribute),
      thinGaps: gaps.filter(g => g.type === 'thin_coverage').map(g => g.attribute),
      freshnessWarningsCount: freshnessWarnings.length,
      freshnessWarnings: freshnessWarnings.map(w => ({
        sourceId: w.sourceId,
        warningType: w.warningType
      })),
      matrixRowsCount: matrix.length,
      matrixStatuses: matrix.map(m => ({
        attribute: m.attribute,
        overallStatus: m.overallStatus
      })),
      checklistCount: checklist.length,
      checklistPriorities: {
        High: checklist.filter(c => c.priority === 'High').length,
        Medium: checklist.filter(c => c.priority === 'Medium').length,
        Low: checklist.filter(c => c.priority === 'Low').length
      }
    };
  }

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DOCS_DIR, 'BASELINE.json'), JSON.stringify(baselines, null, 2), 'utf8');
  console.log('✅ Baseline snapshot saved to docs/BASELINE.json for', Object.keys(baselines).length, 'scenarios.');
}

run().catch(err => {
  console.error('Failed to snapshot baseline:', err);
  process.exit(1);
});
