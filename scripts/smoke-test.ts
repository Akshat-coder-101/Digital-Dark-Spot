import dotenv from 'dotenv';
import path from 'path';
import { analysisPipeline } from '../backend/src/analysis/pipeline.js';
import { llmManager } from '../backend/src/llm/index.js';
import { SourceInput } from '../backend/src/ingestion/types.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();
llmManager.reloadEnvironment();

async function runLiveSmokeTest() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — PART F: LIVE SMOKE TEST         ');
  console.log('========================================================\n');

  const question = 'What are the critical eligibility and deadline rules for this scheme?';
  const sources: SourceInput[] = [
    {
      type: 'text',
      title: 'Gazette Official Notice 2026',
      domain: 'gazette.gov.in',
      rawContent: `
        OFFICIAL GAZETTE 2026 NOTICE:
        Scheme provisions for the 2026-27 cycle.
        1. Income threshold: Annual household income must not exceed ₹50,000 per annum.
        2. Application deadline: All submissions must be received by 30 April 2026.
        3. Academic requirement: Minimum 60% aggregate in qualifying exam.
      `
    },
    {
      type: 'text',
      title: 'Unofficial Student Advisory Guide 2024',
      domain: 'studentforum.org',
      rawContent: `
        GUIDE FOR 2024-25 CYCLE (Archived 10 August 2024):
        1. Income threshold: Family income limit is capped at ₹40,000 maximum.
        2. Application deadline: Applications close on 15 March 2025.
        3. Disbursement: Expected disbursement timeline not specified in portal notes.
      `
    }
  ];

  console.log(`Question: "${question}"`);
  console.log(`Sources: ${sources.length} pasted texts (1 institutional gazette, 1 secondary archived guide)\n`);

  // Start analysis job
  const jobId = `smoke-${Date.now()}`;
  let report: any = null;
  try {
    report = await analysisPipeline.run(jobId, question, sources);
  } catch (err: any) {
    console.error(`Smoke test execution error: ${err.message}`);
  }

  if (!report) {
    throw new Error('Analysis report was not generated.');
  }

  console.log('--- Findings Breakdown ---');
  console.log(`Provider: ${report.analyzedWith.provider || 'Deterministic Ground Truth / Sample Engine'}`);
  console.log(`Model:    ${report.analyzedWith.model || 'Standard Evaluator'}`);
  console.log(`Total Claims:    ${report.claims.length}`);
  console.log(`Found / Sourced: ${report.claims.filter(c => c.verified).length}`);
  console.log(`Conflicts:       ${report.conflicts.length}`);
  console.log(`Gaps:            ${report.gaps.length}`);
  console.log(`Stale Warnings:  ${report.freshnessWarnings.length}`);
  console.log(`Checklist Items: ${report.checklist.length}`);

  // Verification checks:
  const hasFound = report.claims.some(c => c.verified);
  const hasConflict = report.conflicts.length > 0;
  const hasGap = report.gaps.length > 0;
  const hasStale = report.freshnessWarnings.length > 0;
  const hasChecklist = report.checklist.length > 0;

  console.log('\n--- Status Verification ---');
  console.log(`Found Sourced Findings:      ${hasFound ? '✅ YES' : '❌ NO'}`);
  console.log(`Possible Conflicts Detected: ${hasConflict ? '✅ YES' : '❌ NO'}`);
  console.log(`Potential Gaps Flagged:      ${hasGap ? '✅ YES' : '❌ NO'}`);
  console.log(`Stale / Undated Warnings:    ${hasStale ? '✅ YES' : '❌ NO'}`);
  console.log(`Checklist Generated:         ${hasChecklist ? '✅ YES' : '❌ NO'}`);

  if (hasFound && hasConflict && hasGap && hasStale && hasChecklist) {
    console.log('\n🎉 Live Smoke Test PASSED cleanly! All 4 signal types and checklist verified.\n');
  } else {
    throw new Error('One or more required signal types missing from report.');
  }
}

runLiveSmokeTest().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
