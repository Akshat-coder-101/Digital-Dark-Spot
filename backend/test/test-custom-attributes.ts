import assert from 'assert';
import { AnalysisPipeline } from '../src/analysis/pipeline.js';
import { SourceInput } from '../ingestion/types.js';
import { LLMCache, llmCache } from '../src/llm/cache.js';

console.log('\n🍉 ========================================================');
console.log('   DIGITAL DARK SPOT — CUSTOM EXPECTED ATTRIBUTES TEST     ');
console.log('========================================================\n');

async function testCustomAttributes() {
  const pipeline = new AnalysisPipeline();
  const testJobId = `job-test-custom-attr-${Date.now()}`;
  const question = 'Custom scholarship rules inquiry';
  const customAttrs = ['stipend_amount', 'housing_allowance', 'renewal_gpa'];

  const sourceText = 'Fellowship details: stipend_amount is $30,000 annually. Renewal GPA must stay above 3.5.';
  const sources: SourceInput[] = [
    {
      id: 'src-custom-1',
      type: 'text',
      title: 'University Fellowship Memo',
      value: sourceText
    }
  ];

  // Pre-seed cache so the test runs completely offline without network LLM keys
  const cacheKey = LLMCache.computeHash(question, [sourceText]);
  llmCache.set(
    cacheKey,
    {
      expected_attributes: ['generic_attribute_1', 'generic_attribute_2'], // original unsolicited
      verified_claims: [
        {
          id: 'claim-custom-1',
          source_id: 'src-custom-1',
          source_title: 'University Fellowship Memo',
          source_domain: 'pasted-text',
          attribute: 'stipend_amount',
          value: '$30,000',
          quote: 'stipend_amount is $30,000 annually.',
          verified: true
        },
        {
          id: 'claim-custom-2',
          source_id: 'src-custom-1',
          source_title: 'University Fellowship Memo',
          source_domain: 'pasted-text',
          attribute: 'renewal_gpa',
          value: 'above 3.5',
          quote: 'Renewal GPA must stay above 3.5.',
          verified: true
        }
      ],
      discarded_claims_count: 0,
      open_questions: ['Is health insurance included?'],
      summary: 'Verified fellowship terms from memorandum.'
    },
    'Deterministic Test Runner',
    'test-model'
  );

  // Run pipeline with custom expected attributes
  const report = await pipeline.run(
    testJobId,
    question,
    sources,
    false,
    undefined,
    customAttrs
  );

  console.log('Returned Expected Attributes:', report.expectedAttributes);

  // Assertions
  assert.strictEqual(report.expectedAttributes.length, 3, 'Must contain exactly 3 custom attributes');
  assert.deepStrictEqual(report.expectedAttributes, customAttrs, 'Must match provided custom attributes');

  // Housing allowance was not mentioned in the text -> must be a total gap
  const housingGap = report.gaps.find(g => g.attribute === 'housing_allowance');
  assert.ok(housingGap, 'Unmentioned housing_allowance must be reported as a gap');
  assert.strictEqual(housingGap?.type, 'total_gap', 'Housing allowance must be total_gap');

  // Matrix rows should only reflect the 3 custom attributes
  assert.strictEqual(report.coverageMatrix.length, 3, 'Coverage matrix must have 3 rows for custom attributes');

  console.log('✅ [Custom Expected Attributes] Backend respected user-specified attributes list without generating unsolicited ones!');
  console.log('✅ [Custom Attribute Gaps] Computed gaps strictly against user-defined attributes!');
  console.log('\n🍉 All Custom Attributes tests passed!\n');
}

testCustomAttributes().catch(err => {
  console.error('❌ FAILED Custom Attributes test:', err);
  process.exit(1);
});
