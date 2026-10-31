# Digital Dark Spot 🍉
> **AI-Assisted Information Gap & Contradiction Detection Platform**  
> *Built for the Shinchan Online Hackathon 2026 (Devengers)*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v12-purple.svg)](https://motion.dev/)
[![Deterministic Evaluation](https://img.shields.io/badge/Eval_Suite-100%25_Passing-brightgreen.svg)](docs/EVAL.md)
[![Secrets Scanner](https://img.shields.io/badge/Secret_Audit-0_Leaks-brightgreen.svg)](#security--secret-protection)

---

## 1. Overview & Core Philosophy

Digital Dark Spot is an AI-assisted research and verification platform that cross-examines multi-source documents to detect hidden information gaps, conflicting requirements, and outdated claims. Instead of generating ungrounded summaries, it validates every finding with verbatim source quotes and delivers a prioritized checklist to guide reliable decision-making.

> [!IMPORTANT]
> **Candidate Signals, Not Definitive Truth:** Digital Dark Spot identifies information dark spots and delivers an actionable, prioritized checklist to guide human verification against primary government and institutional sources.

---

## 2. System Architecture

```mermaid
graph TD
    User([User Prompt & Source Material]) --> Intake[Intake Layer / Sources Ingestion]
    Intake --> SSRF[SSRF Security Guard & Ingest Fetcher]
    Intake --> Temporal[Temporal & Cycle Detection]
    
    SSRF --> Untrusted[Delimited Untrusted Context]
    Untrusted --> LLM[LLM Layer: Multi-Provider / Multi-Key]
    
    LLM --> JSON[Strict JSON Claims & Attributes]
    JSON --> Verifier[Verbatim Substring Verifier]
    
    Verifier --> Discarded[Discard Hallucinated Quotes]
    Verifier --> VerifiedClaims[Verified Ground-Truth Claims]
    
    VerifiedClaims --> Canonical[Typed Value Normalizer & Qualifier Separation]
    Temporal --> DeterministicEngine[Deterministic Analysis Engine]
    Canonical --> DeterministicEngine
    
    DeterministicEngine --> Gaps[Potential Gaps: Total & Single-Source]
    DeterministicEngine --> Conflicts[Possible Contradictions]
    DeterministicEngine --> Freshness[Potentially Stale & Undated Warnings]
    DeterministicEngine --> Matrix[Coverage Matrix: Parameter x Source]
    DeterministicEngine --> Checklist[Prioritized Verification Checklist]
    
    Gaps --> UI[Interactive Verification Dashboard]
    Conflicts --> UI
    Freshness --> UI
    Matrix --> UI
    Checklist --> UI
```

---

## 3. Hackathon Requirements to Implementation Mapping

| Hackathon Requirement | Engine Implementation | Frontend Component | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Structured Multi-Source Summary** | `AnalysisPipeline.run()`, `extraction.ts` | `SummaryTab.tsx`, `DashboardLayout.tsx` | Verbatim quote extraction across multiple documents. |
| **Potential Gaps Identification** | `detectGaps()` in `gaps.ts` | `GapsTab.tsx` | Flags both total gaps and thin single-source parameters. |
| **Possible Conflicts & Contradictions** | `detectConflicts()` in `conflicts.ts`, `normalization.ts` | `ConflictsTab.tsx` | Compares matching qualifiers; typed differences yield `Sourced` conflicts, wording differences yield `Uncertain`. |
| **Outdated & Undated Warnings** | `auditFreshness()` in `freshness.ts`, `metadata.ts` | `FreshnessTab.tsx` | Distinguishes publication dates from deadlines; flags items older than 18 months or earlier cycles. |
| **Prioritized Verification Checklist** | `buildPrioritizedChecklist()` in `checklist.ts` | `ChecklistTab.tsx` | High/Medium/Low prioritized checklist with actionable advice and Markdown export. |
| **Sourced vs AI-Suggested vs Uncertain** | `types.ts` signalTag model | `StatusTag.tsx` | Unambiguous badges: `Sourced`, `AI-suggested`, `Uncertain` with icon plus text. |
| **Verbatim Evidence Tracing** | `verifyClaimsVerbatim()` in `verifier.js` | `EvidenceDrawerSubRoute.tsx` | Verbatim substring match in raw document excerpt with 120-character context window. |
| **Topic Independence & Anti-Hallucination** | Typed normalizers in `normalization.ts`, ban-list scanner | Topic-tailored UI inputs without hardcoded domain jargon | 97+ files clean in `scripts/ban-list-scan.ts`; 3 varied sample scenarios. |
| **Coverage Parameter Matrix** | `buildCoverageMatrix()` in `matrix.ts` | `CoverageMap.tsx` | Interactive matrix displaying `Found`, `Conflict`, `Single source`, `Gap`, and `Stale` with icons. |
| **No Source Fabrication** | `discoveryService.ts` fallback | `Discover.tsx`, `Home.tsx` | Gracefully falls back to user URL/paste/sample data with clear origin labels (`REAL SOURCE`, `USER-PROVIDED`, `SAMPLE DATA`). |

---

## 4. Quickstart (3 Commands)

You can clone, install, and run Digital Dark Spot immediately:

```bash
# 1. Install dependencies
npm install

# 2. Run complete 11-step verification suite (zero API keys needed)
npm run verify

# 3. Start development server (Frontend + Backend)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 5. Zero-Key Offline Demo Mode

Digital Dark Spot does **not** require any API keys to be evaluated or demonstrated:
1. Open `http://localhost:5173`.
2. Choose one of the 3 verified sample scenarios on the home screen:
   - **Sample A: Aurora Merit Scholarship** (Education & financial aid guidelines)
   - **Sample B: SolarBridge Rooftop Subsidy 2026** (Clean energy rooftop installation incentives)
   - **Sample C: Nimbus Air 14 vs Nimbus Air 16** (Hardware and engineering benchmarks)
3. The platform instantly loads the verified reference dataset and executes the complete deterministic analysis pipeline.
4. If live search API keys are unavailable during custom search queries, the system cleanly prompts the user to explore offline datasets or provide their own URLs/notes without fabricating fake sources.

---

## 5. Verified LLM & Search Providers

The platform features built-in multi-provider failover, key round-robin rotation, and automatic cooldowns:

| Provider | Verified Models | Key Rotation | 2-Consecutive Failure Cooldown |
| :--- | :--- | :---: | :---: |
| **Google Gemini** | `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-3-flash-preview` | Yes (comma-separated) | 5-minute provider cooldown & failover |
| **Groq** | `qwen/qwen3.8-27b`, `llama-3.3-70b-versatile` | Yes (comma-separated) | 5-minute provider cooldown & failover |
| **OpenAI** | `gpt-4o-mini`, `gpt-4o` | Yes (comma-separated) | 5-minute provider cooldown & failover |
| **Anthropic** | `claude-3-5-haiku-20241022` | Yes (comma-separated) | 5-minute provider cooldown & failover |
| **Tavily Search** | Official Tavily Search API | Yes (comma-separated) | Auto-discovery query aggregation |
| **Brave Search** | Official Brave Search API | Yes (comma-separated) | Auto-discovery query aggregation |

Configure these keys in your `.env` file (see [DEPLOYMENT.md](DEPLOYMENT.md) for details).

---

## 6. Evaluation Matrix & Accuracy Suite

Digital Dark Spot includes a comprehensive deterministic evaluation runner tested against realistic ground-truth scenarios:

```bash
npm run eval
```

See [docs/EVAL.md](docs/EVAL.md) for the generated benchmark report covering:
1. **Scenario 1 (Conflicting Income Limits & Stale Cycle):** Surfaced Rs 6,00,000 vs Rs 2,50,000 conflict with original quotes preserved; flagged stale cycle 2024-25.
2. **Scenario 2 (Missing Disbursement Parameter):** Merged `Rs 25 lakh` with `Rs 25,00,000` to avoid false conflict, flagged `disbursement_timeline` as unmentioned Total Gap.
3. **Scenario 3 (Harmonious Multi-Source Consensus):** Synonym matching reconciled `stipend` with `award_amount` and reordered document checklists with 0 false conflicts.

---

## 7. Security & Secret Protection

- **Automated Secret Leak Scanner:**
  ```bash
  npm run check:secrets
  ```
  Scans all tracked files and commit history for Google AI, Groq, OpenAI, Anthropic, Tavily, and Brave API key signatures.
- **SSRF Ingestion Protection:** Blocks private subnets (RFC 1918, RFC 4193), loopback (`127.0.0.1`, `::1`), link-local metadata endpoints (`169.254.169.254`), and enforces a strict 12-second abort timeout.
- **Production AI Status Gating:** `/settings/ai` and `/api/llm/status` are disabled in production unless `SHOW_AI_STATUS=true` is explicitly enabled.
- **IP Rate Limiting:** In-memory sliding window protects backend capacity (5 analyses/hr per IP) with graceful sample dataset fallback.

---

## 8. Known Limitations

- **Paywalled & Restricted Content:** Subscription articles, password-protected portals, and CAPTCHA-protected services cannot be crawled.
- **Client-Side Heavy SPAs:** Portals requiring complex JavaScript hydration without server-rendered HTML may yield limited text snippets.
- **Scanned Non-Text PDFs:** Image-only scanned PDFs without embedded OCR streams cannot be parsed verbatim by the standard text extractor.
- **Unindexed Circulars:** Newly released physical gazettes or intranet administrative orders not indexed by search engines remain outside the discovery scope.

---

## 9. Credits & Inspirations

- **[Watermelon UI](https://ui.watermelon.sh):** Component design tokens and layout primitives.
- **[Motion](https://motion.dev):** GPU-accelerated spring animations and accessible reduced-motion support.
- **[Radix UI](https://www.radix-ui.com):** Accessible WAI-ARIA primitive foundations.
- **[Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) & [DM Sans](https://fonts.google.com/specimen/DM+Sans):** Typography system.
