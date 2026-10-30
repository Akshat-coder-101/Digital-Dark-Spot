import { verifyClaimsVerbatim } from '../src/analysis/verifier.js';
import { IngestedSource } from '../ingestion/types.js';

async function runExtractionTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — EXTRACTION & VERIFIER TESTS     ');
  console.log('========================================================\n');

  // Sample Sources
  const mockSources: IngestedSource[] = [
    {
      id: 'src-official-1',
      type: 'text',
      domain: 'gov.scholarships.edu',
      title: 'Official Scholarship Regulations 2026',
      rawText: 'All candidates must submit official transcripts before 15 April 2026. Annual household income must not exceed $50,000 as verified through standard tax returns.',
      cleanedText: 'All candidates must submit official transcripts before 15 April 2026. Annual household income must not exceed $50,000 as verified through standard tax returns.',
      wordCount: 22,
      detectedDate: '15 April 2026',
      detectedCycle: null,
      isStale: false,
      isUndated: false,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    },
    {
      id: 'src-blog-2',
      type: 'text',
      domain: 'studentportal-blog.org',
      title: 'Community Guide to Aid',
      rawText: 'Important note for 2024-25 cycle: The income ceiling was previously listed as $40,000 only. Students must provide bank statements directly.',
      cleanedText: 'Important note for 2024-25 cycle: The income ceiling was previously listed as $40,000 only. Students must provide bank statements directly.',
      wordCount: 20,
      detectedDate: null,
      detectedCycle: '2024-25',
      isStale: true,
      isUndated: false,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    }
  ];

  // Claims to test
  const candidateClaims = [
    // 1. Verbatim authentic claim
    {
      source_id: 'src-official-1',
      attribute: 'application_deadline',
      value: '15 April 2026',
      quote: 'submit official transcripts before 15 April 2026'
    },
    // 2. Verbatim authentic claim from source 2
    {
      source_id: 'src-blog-2',
      attribute: 'eligibility_income_limit',
      value: '$40,000 only for 2024-25 cycle',
      quote: 'income ceiling was previously listed as $40,000 only'
    },
    // 3. Hallucinated / Paraphrased quote (not in source text)
    {
      source_id: 'src-official-1',
      attribute: 'minimum_gpa',
      value: '3.8 GPA required',
      quote: 'Candidates must possess at least a 3.8 GPA' // Fake quote!
    },
    // 4. Invalid source ID
    {
      source_id: 'src-non-existent-99',
      attribute: 'bonus_stipend',
      value: '$1,000 monthly',
      quote: 'Some text'
    }
  ];

  console.log(`Auditing ${candidateClaims.length} candidate claims against source ground truth...`);
  const result = verifyClaimsVerbatim(candidateClaims, mockSources);

  console.log(` • Verified Claims: ${result.verifiedClaims.length}`);
  console.log(` • Discarded Claims: ${result.discardedClaimsCount}`);

  if (result.verifiedClaims.length !== 2) {
    console.error(`❌ Expected 2 verified claims, got ${result.verifiedClaims.length}`);
    process.exit(1);
  }

  if (result.discardedClaimsCount !== 2) {
    console.error(`❌ Expected 2 discarded claims, got ${result.discardedClaimsCount}`);
    process.exit(1);
  }

  const [v1, v2] = result.verifiedClaims;
  console.log(`✅ Claim 1 verified: [${v1.attribute}] "${v1.quote}" from ${v1.source_title}`);
  console.log(`✅ Claim 2 verified: [${v2.attribute}] "${v2.quote}" from ${v2.source_title}`);

  for (const discarded of result.discardedQuotes) {
    console.log(`✅ Hallucination caught & discarded: "${discarded.quote}" (${discarded.reason})`);
  }

  console.log('\n🍉 Verbatim Extraction & Anti-Hallucination tests PASSED!\n');
}

runExtractionTests().catch(err => {
  console.error('Extraction test error:', err);
  process.exit(1);
});

