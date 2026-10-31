import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveExpectedAttributesForQuestion, NEUTRAL_FALLBACK_ATTRIBUTES } from '../src/analysis/extraction.js';
import { buildPrioritizedChecklist } from '../src/analysis/checklist.js';
import { detectGaps } from '../src/analysis/gaps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('🧪 Running Topic Independence & Neutral Defaults Tests...');

// 1. Scan core code files to ensure no hardcoded scholarship/scheme defaults remain
const coreCodeFiles = [
  'backend/src/analysis/extraction.ts',
  'backend/src/search/queryGenerator.ts',
  'backend/src/search/discoveryService.ts',
  'backend/src/analysis/checklist.ts',
  'frontend/src/pages/Discover.tsx'
];

const bannedDefaultIdentifiers = [
  'application_deadline',
  'primary_qualifying_criteria',
  'continuation_policy'
];

for (const relPath of coreCodeFiles) {
  const fullPath = path.join(projectRoot, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const banned of bannedDefaultIdentifiers) {
      assert(
        !content.includes(`'${banned}'`) && !content.includes(`"${banned}"`),
        `Core code file ${relPath} must not contain hardcoded default '${banned}'`
      );
    }
  }
}
console.log('✅ Core code files contain zero hardcoded scholarship defaults.');

// 2. Verify fallback attributes are 100% neutral
const scholarshipWords = ['scholarship', 'scheme', 'fellowship', 'stipend', 'tuition'];
for (const attr of NEUTRAL_FALLBACK_ATTRIBUTES) {
  for (const word of scholarshipWords) {
    assert(
      !attr.toLowerCase().includes(word),
      `Neutral fallback attribute "${attr}" must not contain domain word "${word}"`
    );
  }
}
console.log('✅ NEUTRAL_FALLBACK_ATTRIBUTES contains zero domain or scholarship terms.');

// 3. Test derivation and gap detection for laptop question
async function runLaptopTest() {
  const laptopQuestion = 'What should I verify before buying an RTX 5060 laptop?';
  const laptopAttrs = await deriveExpectedAttributesForQuestion(laptopQuestion);
  console.log('   Laptop Derived Attributes:', laptopAttrs);

  for (const attr of laptopAttrs) {
    for (const word of scholarshipWords) {
      assert(
        !attr.toLowerCase().includes(word),
        `Laptop attribute "${attr}" should not contain scholarship term "${word}"`
      );
    }
    assert(
      !bannedDefaultIdentifiers.includes(attr),
      `Laptop attribute "${attr}" should not be a legacy scholarship default`
    );
  }

  // Verify simulated laptop claims do not produce scholarship gaps or checklist items
  const mockLaptopClaims = [
    {
      id: 'claim-1',
      source_id: 'src-1',
      source_title: 'Notebookcheck RTX 5060 Review',
      source_domain: 'notebookcheck.net',
      attribute: 'gpu_tgp',
      value: '115W maximum TGP',
      quote: '115W maximum TGP',
      verified: true
    },
    {
      id: 'claim-2',
      source_id: 'src-2',
      source_title: 'Manufacturer Spec Sheet',
      source_domain: 'maker.example',
      attribute: 'vram_capacity',
      value: '8GB GDDR7',
      quote: '8GB GDDR7',
      verified: true
    }
  ];

  const gaps = detectGaps(laptopAttrs, mockLaptopClaims, 2, laptopAttrs);
  for (const g of gaps) {
    for (const word of scholarshipWords) {
      assert(!g.title.toLowerCase().includes(word), `Gap title "${g.title}" must not contain "${word}"`);
    }
  }

  const checklist = buildPrioritizedChecklist(gaps, [], []);
  for (const item of checklist) {
    for (const word of scholarshipWords) {
      assert(!item.title.toLowerCase().includes(word), `Checklist item "${item.title}" must not contain "${word}"`);
    }
  }
  console.log('✅ Laptop question produced 0 scholarship terms in parameters, gaps, and checklist.');
}

// 4. Test derivation for rooftop solar question
async function runSolarTest() {
  const solarQuestion = 'What should a homeowner verify before applying for PM Surya Ghar rooftop solar subsidy?';
  const solarAttrs = await deriveExpectedAttributesForQuestion(solarQuestion);
  console.log('   Rooftop Solar Derived Attributes:', solarAttrs);

  for (const attr of solarAttrs) {
    assert(!attr.includes('application_deadline'), 'Solar attributes must not contain legacy application_deadline');
    assert(!attr.includes('continuation_policy'), 'Solar attributes must not contain continuation_policy');
  }
  console.log('✅ Rooftop solar question produced 0 legacy scholarship terms.');
}

await runLaptopTest();
await runSolarTest();

console.log('🎉 Phase 1 Topic Independence Tests Passed Successfully!');

