# Reading & Grounding Performance Audit (Phase 0)

## 1. Executive Summary & Dominant Cause
- **Inquiry Evaluated**: "What should a student verify before applying for a government scholarship in India?"
- **Number of Sources**: 8 sources (1,47,871 raw characters total)
- **Measurement Mode**: recorded_snapshot (recorded 8-source live snapshot from `backend/data/store/reports/rep-1793451949564-c7dbe5.json`)
- **Largest Single Source**: Source 4 (`thestudentscholarships.com`) with **61,669 characters** (split into 6 separate 12k chunks)
- **Second Largest**: Source 5 (`www.youtube.com` transcript) with **36,534 characters** (split into 4 separate 12k chunks)
- **Largest Input Payload**: ~**14,091 characters** per LLM call
- **Total Chunks / Sequential LLM Calls**: **15 calls**

### Dominant Cause of Slowness (Empirical Data Only):
1. **Strictly Sequential Execution**: In `extraction.ts`, the outer loop iterates over every source sequentially (`for (const source of readySources)`), and the inner loop iterates over every chunk sequentially (`for (let cIdx = 0; cIdx < chunks.length; cIdx++)`). Across 8 sources and 17 chunks, 17 sequential HTTP network round-trips were performed.
2. **Oversized Unsanitized Payloads**: Full web pages including raw navigation menus, repetitive footers, cookie notices, and boilerplates were chunked at 12,000 characters rather than stripped and compacted.
3. **Unbounded Verbose Prompts & JSON**: Each chunk prompt requested free-form expected attributes, verbose explanations, candidate open questions, and free-form summaries, inflating output token generation time.

## 2. Source-by-Source Breakdown

| Source ID | Domain | Characters | Word Count | 12k Chunks | Chars in Largest Chunk |
|---|---|---|---|---|---|
| `src-1793451811701-1-9ed7d4` | `www.indembassydili.gov.in` | 17,282 | 2469 | 2 | 12,591 |
| `src-1793451811705-2-f684d5` | `scholarships.gov.in` | 7,211 | 1030 | 1 | 7,211 |
| `src-1793451811715-3-8ffdab` | `scholarships.gov.in` | 9,472 | 1353 | 1 | 9,472 |
| `src-1793451811716-4-c6bdb5` | `thestudentscholarships.com` | 61,669 | 8810 | 5 | 12,589 |
| `src-1793451811721-5-5e9f00` | `www.youtube.com` | 36,534 | 5219 | 3 | 12,513 |
| `src-1793451811727-6-3e622a` | `edumanch.in` | 1,448 | 207 | 1 | 1,448 |
| `src-1793451954117-7-3cdaa0` | `collegeforum.in` | 9,845 | 1406 | 1 | 9,845 |
| `src-1793451966642-8-09f054` | `scholarships.gov.in` | 4,410 | 630 | 1 | 4,410 |
