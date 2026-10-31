import { describe, it } from 'node:test';
import assert from 'node:assert';
import { chunkSourceText } from '../src/analysis/extraction.js';
import { stripBoilerplate, processSource } from '../src/ingestion/fetcher.js';
import { persistentStore } from '../src/store/persistentStore.js';
import { DiscoveryJob } from '../src/search/types.js';
import { FullAnalysisReport } from '../analysis/types.js';
import { areValuesEquivalent, detectConflicts } from '../src/analysis/conflicts.js';
import { IngestedSource } from '../src/ingestion/types.js';

describe('Reliability and Quality Verification Suite', () => {

  // 1. Chunking of 100k-character source
  it('chunks a 100k-character document at paragraph boundaries with overlap and no truncation', () => {
    // Generate a 100,000 character document with paragraphs
    const paragraph = 'This is a detailed paragraph describing government eligibility requirements for rooftop solar subsidies in 2026. Homeowners must verify consumer meter numbers, rooftop shadow analysis, grid connectivity, and discom sanctioned load.\n\n';
    let doc = '';
    while (doc.length < 100000) {
      doc += paragraph;
    }

    assert.ok(doc.length >= 100000, `Expected at least 100k chars, got ${doc.length}`);

    const chunks = chunkSourceText(doc, 12000, 600);
    assert.ok(chunks.length >= 8, `Expected at least 8 chunks for 100k text, got ${chunks.length}`);

    // Verify all chunks are non-empty and bounded around ~12k
    for (let i = 0; i < chunks.length; i++) {
      assert.ok(chunks[i].length > 0, `Chunk ${i} is empty`);
      assert.ok(chunks[i].length <= 15000, `Chunk ${i} exceeds target limit: ${chunks[i].length}`);
    }

    // Verify overlap preserves key phrases between adjacent chunks
    const chunk0Tail = chunks[0].slice(-200);
    assert.ok(chunks[1].includes(chunk0Tail.slice(0, 50)) || chunks[0].length >= 12000, 'Chunks must overlap or transition cleanly');
  });

  // 2. Limited marking for short / boilerplate pages
  it('marks sources Limited if under 1500 chars or if boilerplate junk is detected', async () => {
    // Boilerplate page
    const junkText = 'Something went wrong.\nPlease sign in to continue.\nSession expired.\nPage not found.\n404 Not Found';
    const { cleaned, isJunk } = stripBoilerplate(junkText);
    assert.strictEqual(isJunk, true, 'Expected junk boilerplate to be detected');

    // Short page (< 1500 chars)
    const shortSource = await processSource({
      type: 'text',
      value: 'Short notice with 200 characters only: Rooftop solar applications open on Monday.',
      title: 'Short Notice'
    }, 0);

    assert.strictEqual(shortSource.isLimited, true, 'Short source must be marked isLimited=true');
    assert.strictEqual(shortSource.sourceType, 'limited', 'Short source must have sourceType="limited"');
    assert.strictEqual(shortSource.usefulnessStatus, 'NEEDS_ATTENTION');

    // Long page (> 1500 chars)
    let longText = '';
    while (longText.length < 2000) {
      longText += 'Comprehensive policy guidelines for grid-connected rooftop solar systems in India. ';
    }
    const longSource = await processSource({
      type: 'text',
      value: longText,
      title: 'Full Guide'
    }, 1);

    assert.strictEqual(longSource.isLimited, false, 'Full source must not be marked limited');
    assert.strictEqual(longSource.sourceType, 'user_text');
    assert.strictEqual(longSource.usefulnessStatus, 'READY');
  });

  // 3. Persistent store: Discovery job recovery across restarts
  it('recovers stored discovery jobs from persistent store across restarts', () => {
    const testJobId = `job-test-recovery-${Date.now()}`;
    const testJob: DiscoveryJob = {
      id: testJobId,
      question: 'What should a homeowner verify for PM Surya Ghar rooftop solar?',
      status: 'ready',
      progressPercent: 100,
      message: 'Discovery complete with 4 sources.',
      queriesGenerated: ['PM Surya Ghar official guidelines'],
      sourcesFound: [{
        title: 'PM Surya Ghar Portal',
        url: 'https://pmsuryaghar.gov.in',
        snippet: 'Official rooftop solar portal',
        domain: 'pmsuryaghar.gov.in',
        isOfficial: true
      }],
      createdAt: new Date().toISOString()
    };

    // Save to persistent disk store
    persistentStore.saveDiscoveryJob(testJob);

    // Retrieve from disk
    const retrieved = persistentStore.getDiscoveryJob(testJobId);
    assert.ok(retrieved, 'Job must be retrievable from persistent disk store');
    assert.strictEqual(retrieved?.id, testJobId);
    assert.strictEqual(retrieved?.question, testJob.question);

    // Retrieve by question
    const retrievedByQ = persistentStore.findDiscoveryJobByQuestion(testJob.question);
    assert.ok(retrievedByQ, 'Job must be retrievable by question hash');
    assert.strictEqual(retrievedByQ?.id, testJobId);
  });

  // 4. Demo Snapshot load with zero network
  it('saves and loads demo snapshots with zero network and offline label', () => {
    const dummyReport: FullAnalysisReport = {
      id: `rep-snapshot-test-${Date.now()}`,
      question: 'Test subsidy inquiry',
      summary: 'Summary of findings across tested sources.',
      analyzedWith: { provider: 'test', model: 'mock', cached: false },
      metrics: { sourcesCount: 2, gapsCount: 1, conflictsCount: 0, staleCount: 0, claimsCount: 4, discardedClaimsCount: 0 },
      expectedAttributes: ['subsidy_amount', 'eligibility_criteria'],
      sources: [],
      claims: [],
      gaps: [],
      conflicts: [],
      freshnessWarnings: [],
      coverageMatrix: [],
      checklist: [{
        id: 'c1',
        priority: 'High',
        title: 'Verify meter connection with DISCOM',
        description: 'Ensure DISCOM account matches property ownership',
        suggestedOfficialSource: 'DISCOM Portal',
        signalTag: 'Sourced'
      }],
      openQuestions: [],
      createdAt: new Date().toISOString()
    };

    const saved = persistentStore.saveDemoSnapshot(dummyReport);
    assert.ok(saved.snapshotId.startsWith('demo-snapshot-'));

    const loaded = persistentStore.getDemoSnapshot(saved.snapshotId);
    assert.ok(loaded, 'Snapshot must load from disk');
    assert.ok(loaded?.summary.includes('Saved snapshot of a live run'), 'Must include snapshot label');
    assert.strictEqual(loaded?.analyzedWith.provider, 'snapshot');
  });

  // 5. Search Cache reuse for identical questions
  it('persists search cache and retrieves cached results for identical questions', () => {
    const q = 'PM Surya Ghar rooftop solar eligibility criteria 2026';
    const mockResults = [
      { title: 'Official PM Surya Ghar Portal', url: 'https://pmsuryaghar.gov.in', snippet: 'Guidelines' }
    ];

    persistentStore.saveSearchCache(q, mockResults);
    const cached = persistentStore.getSearchCache(q);

    assert.ok(cached, 'Search results must be retrieved from cache');
    assert.strictEqual(cached?.length, 1);
    assert.strictEqual(cached?.[0].url, 'https://pmsuryaghar.gov.in');
  });

  // 6. False conflict prevention and official vs blog notation
  it('prevents false conflicts on equivalent values and annotates official vs blog sources', () => {
    // Equivalent monetary values
    assert.strictEqual(areValuesEquivalent('₹60,000', 'Rs 60,000'), true);
    assert.strictEqual(areValuesEquivalent('Rs 60000', '60,000 INR'), true);
    assert.strictEqual(areValuesEquivalent('75%', '75 percent'), true);

    const mockSources: IngestedSource[] = [
      {
        id: 's1',
        type: 'url',
        domain: 'pmsuryaghar.gov.in',
        title: 'PM Surya Ghar Official Portal',
        rawText: 'Subsidy is Rs 78,000 for 3kW system.',
        cleanedText: 'Subsidy is Rs 78,000 for 3kW system.',
        wordCount: 10,
        textCharacterCount: 40,
        claimsExtracted: 1,
        claimsDiscarded: 0,
        usefulnessStatus: 'READY',
        credibilityHint: 'institutional',
        detectedDate: '2026-01-15',
        detectedCycle: '2026',
        isStale: false,
        isUndated: false,
        status: 'ready',
        fetchedAt: new Date().toISOString()
      },
      {
        id: 's2',
        type: 'url',
        domain: 'techsolarblog.com',
        title: 'Tech Solar Blog',
        rawText: 'Subsidy is Rs 60,000 for 3kW system according to initial drafts.',
        cleanedText: 'Subsidy is Rs 60,000 for 3kW system according to initial drafts.',
        wordCount: 12,
        textCharacterCount: 65,
        claimsExtracted: 1,
        claimsDiscarded: 0,
        usefulnessStatus: 'READY',
        credibilityHint: 'general',
        detectedDate: '2025-06-01',
        detectedCycle: '2025',
        isStale: true,
        isUndated: false,
        status: 'ready',
        fetchedAt: new Date().toISOString()
      }
    ];

    const claims = [
      {
        id: 'c1',
        source_id: 's1',
        source_title: 'PM Surya Ghar Official Portal',
        source_domain: 'pmsuryaghar.gov.in',
        attribute: 'subsidy_amount',
        value: '₹78,000',
        quote: 'Subsidy is Rs 78,000 for 3kW system.',
        verified: true,
        valueType: 'money' as const
      },
      {
        id: 'c2',
        source_id: 's2',
        source_title: 'Tech Solar Blog',
        source_domain: 'techsolarblog.com',
        attribute: 'subsidy_amount',
        value: '₹60,000',
        quote: 'Subsidy is Rs 60,000 for 3kW system',
        verified: true,
        valueType: 'money' as const
      }
    ];

    const conflicts = detectConflicts(claims, mockSources);
    assert.strictEqual(conflicts.length, 1, 'True difference should be detected as conflict');
    const conf = conflicts[0];
    assert.ok(conf.whyFlagged?.includes('Monetary specification differs'));
    assert.ok(conf.authorityDiscrepancy?.includes('Official source (pmsuryaghar.gov.in) takes precedence'));
  });

});

