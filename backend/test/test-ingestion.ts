import { validateUrlForSSRF, isPrivateOrLoopbackIP } from '../src/ingestion/ssrf.js';
import { detectTemporalMetadata } from '../src/ingestion/metadata.js';
import { ingestSources } from '../src/ingestion/fetcher.js';

async function runIngestionTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — INGESTION TEST SUITE            ');
  console.log('========================================================\n');

  // --- 1. SSRF Protection Tests ---
  console.log('--- 1. Testing SSRF & Security Guards ---');
  const ssrfTargets = [
    'http://localhost:3001/api/admin',
    'http://127.0.0.1:8080',
    'http://127.0.0.1/secret',
    'http://169.254.169.254/latest/meta-data',
    'http://10.0.0.15/internal',
    'http://192.168.1.100',
    'http://172.16.5.4',
    'ftp://example.com/file',
    'file:///C:/Windows/win.ini'
  ];

  for (const target of ssrfTargets) {
    const res = await validateUrlForSSRF(target);
    if (!res.valid) {
      console.log(`✅ Correctly blocked SSRF target: ${target} (${res.error})`);
    } else {
      console.error(`❌ FAILED to block forbidden SSRF target: ${target}`);
      process.exit(1);
    }
  }

  // --- 2. Date & Cycle Detection Tests ---
  console.log('\n--- 2. Testing Date & Cycle Detection ---');

  // Case A: Current date "12 January 2026"
  const textCurrent = "Official Notice: Scholarship applications open on 12 January 2026. Submit required transcripts.";
  const metaCurrent = detectTemporalMetadata(textCurrent);
  if (metaCurrent.detectedDate?.includes('12') && metaCurrent.detectedDate?.includes('January') && metaCurrent.detectedDate?.includes('2026')) {
    console.log(`✅ Current date detected: "${metaCurrent.detectedDate}" (isStale: ${metaCurrent.isStale})`);
  } else {
    console.error(`❌ Failed to detect "12 January 2026": ${JSON.stringify(metaCurrent)}`);
    process.exit(1);
  }

  // Case B: Stale date (older than 18 months, e.g., March 15, 2023)
  const textStale = "Archived update: The program was renewed on 15 March 2023 for all eligible students.";
  const metaStale = detectTemporalMetadata(textStale);
  if (metaStale.isStale === true && metaStale.detectedDate) {
    console.log(`✅ Stale date detected (>18 months): "${metaStale.detectedDate}" (isStale: true)`);
  } else {
    console.error(`❌ Failed to flag stale date: ${JSON.stringify(metaStale)}`);
    process.exit(1);
  }

  // Case C: Cycle detection "2024-25" (earlier cycle -> stale)
  const textCycleEarlier = "Guidebook for the 2024-25 application cycle. Income threshold was $40,000.";
  const metaCycleEarlier = detectTemporalMetadata(textCycleEarlier);
  if (metaCycleEarlier.detectedCycle === '2024-25' && metaCycleEarlier.isStale === true) {
    console.log(`✅ Earlier cycle detected: "${metaCycleEarlier.detectedCycle}" (isStale: true)`);
  } else {
    console.error(`❌ Failed earlier cycle detection: ${JSON.stringify(metaCycleEarlier)}`);
    process.exit(1);
  }

  // Case D: Current cycle "2026-27" (fresh)
  const textCycleFresh = "Annual Scholarship Policy Document (2026-27 Cycle). All submissions are due Nov 1.";
  const metaCycleFresh = detectTemporalMetadata(textCycleFresh);
  if (metaCycleFresh.detectedCycle === '2026-27' && metaCycleFresh.isStale === false) {
    console.log(`✅ Current cycle detected: "${metaCycleFresh.detectedCycle}" (isStale: false)`);
  } else {
    console.error(`❌ Failed current cycle detection: ${JSON.stringify(metaCycleFresh)}`);
    process.exit(1);
  }

  // Case E: Undated text
  const textUndated = "General tips: Always keep photocopies of your submission forms and ask seniors for advice.";
  const metaUndated = detectTemporalMetadata(textUndated);
  if (metaUndated.isUndated === true) {
    console.log(`✅ Undated content detected: isUndated = true`);
  } else {
    console.error(`❌ Failed undated detection: ${JSON.stringify(metaUndated)}`);
    process.exit(1);
  }

  // --- 3. Partial Failure Isolation Tests ---
  console.log('\n--- 3. Testing Partial Failure Resilience (Non-blocking Ingestion) ---');

  const batchInputs = [
    { type: 'text' as const, value: 'Official Gazette 2026: The eligibility age is capped at 25 years as of 12 January 2026.' },
    { type: 'url' as const, value: 'http://127.0.0.1:9999/private-file' }, // Should fail SSRF
    { type: 'text' as const, value: '' }, // Should fail validation
    { type: 'text' as const, value: 'Student forum discussion on 2024-25 cycle document requirements.' }
  ];

  const ingested = await ingestSources(batchInputs);

  if (ingested.length !== 4) {
    console.error(`❌ Expected 4 results, got ${ingested.length}`);
    process.exit(1);
  }

  const [res1, res2, res3, res4] = ingested;

  if (res1.status === 'ready' && res1.wordCount > 5) {
    console.log(`✅ Source 1 ingested successfully (status: ready, words: ${res1.wordCount})`);
  } else {
    console.error(`❌ Source 1 unexpected status: ${res1.status}`);
    process.exit(1);
  }

  if (res2.status === 'error' && res2.errorMessage?.includes('SSRF')) {
    console.log(`✅ Source 2 SSRF error isolated cleanly without breaking batch (${res2.errorMessage})`);
  } else {
    console.error(`❌ Source 2 did not catch SSRF properly: ${JSON.stringify(res2)}`);
    process.exit(1);
  }

  if (res3.status === 'error' && res3.errorMessage?.includes('cannot be empty')) {
    console.log(`✅ Source 3 empty error isolated cleanly (${res3.errorMessage})`);
  } else {
    console.error(`❌ Source 3 did not catch empty error properly`);
    process.exit(1);
  }

  if (res4.status === 'ready' && res4.detectedCycle === '2024-25') {
    console.log(`✅ Source 4 ingested successfully despite preceding errors (status: ready)`);
  } else {
    console.error(`❌ Source 4 failed: ${JSON.stringify(res4)}`);
    process.exit(1);
  }

  console.log('\n🍉 Ingestion Test Suite completed with 100% success!\n');
}

runIngestionTests().catch(err => {
  console.error('Fatal test error in ingestion suite:', err);
  process.exit(1);
});

