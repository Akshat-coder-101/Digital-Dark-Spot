# Digital Dark Spot 
> **AI-Assisted Information Gap & Contradiction Detection Platform**  
> *Built for the Shinchan Online Hackathon 2026 (Devengers)*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v12-purple.svg)](https://motion.dev/)
[![Verification Suite](https://img.shields.io/badge/Verify_Suite-18%2F18_Passing-brightgreen.svg)](#6-automated-verification-suite)
[![Secrets Scanner](https://img.shields.io/badge/Secret_Audit-0_Leaks-brightgreen.svg)](#7-security--secret-protection)

---

## 🏆 How Judges Can Run the Website on Their Laptop

You can clone, install, and run **Digital Dark Spot** locally on Windows, macOS, or Linux in under 2 minutes:

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` LTS recommended).
- **npm**: `v9+` or higher (bundled with Node.js).
- **Git**

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/Akshat-coder-101/Digital-Dark-Spot.git
cd Digital-Dark-Spot

# Install all workspace dependencies (root, backend, and frontend)
npm install
```

### 3. Start the Web Platform
```bash
# Starts Express backend (port 3001) and Vite frontend (port 5173) concurrently:
npm run dev
```

Open your browser to:  
👉 **[http://localhost:5173](http://localhost:5173)**

---

### 4. Zero-Key Offline Demo (No API Keys Needed!)

Digital Dark Spot is built with a **100% zero-configuration offline demo mode** so judges can evaluate the entire engine immediately without entering any API keys:

1. Open **[http://localhost:5173](http://localhost:5173)**.
2. Directly below the question bar on the homepage, click any of the **3 Verified Sample Scenarios**:
   - **Sample A: Aurora Merit Scholarship** — Evaluates conflicting income eligibility rules (₹6,00,000 vs ₹2,50,000), missing disbursement timeline gaps, and expired application cycles.
   - **Sample B: SolarBridge Rooftop Subsidy 2026** — Analyzes clean-energy solar subsidies, benchmark cost ceilings, and mandatory vendor empanelment requirements across 6 sources.
   - **Sample C: Nimbus Air 14 vs Nimbus Air 16** — Compares hardware engineering specs, power limits (TGP), VRAM configurations, and thermal dissipation differences.
3. The platform executes the complete deterministic verification engine and renders:
   - **Executive Summary:** Bullet-based findings tied directly to verified claim IDs (no hallucinated paragraphs).
   - **Key Facts Table:** Up to 12 canonical decision parameters with status chips (`Found`, `Conflict`, `Single source`, `Gap`, `Stale`). Clicking any row opens the verbatim evidence drawer.
   - **Key Dates Timeline:** Chronological milestone and deadline tracker with `Passed` or `Upcoming` indicators.
   - **Coverage Map:** Source × Parameter matrix showing exact cross-source coverage.
   - **Prioritized Checklist:** High/Medium/Low action items guiding the user on what to verify next before making a decision.

---

### 5. Running with Live AI & Search APIs (Optional)

To test live web search discovery and dynamic AI extraction on custom arbitrary topics:

1. Copy the environment file template:
   ```bash
   cp .env.example .env
   cp .env.example backend/.env
   ```
2. Add your preferred API keys in `.env` and `backend/.env`:
   - `GEMINI_API_KEYS=...` (Google Gemini API key)
   - `TAVILY_API_KEYS=...` (Tavily Search API key)
   - `GROQ_API_KEYS=...` (Optional ultra-fast Groq fallback key)
3. Restart the dev server (`npm run dev`).
4. Enter any question on the home screen (e.g. *"What should I verify before buying an RTX 5060 laptop?"* or *"What are the eligibility criteria for the national scholarship portal?"*). The system automatically discovers real external sources, extracts verified claims with verbatim quotes, and audits for contradictions and gaps.

---

## 1. Problem Solved & Core Philosophy

When researching critical decisions—such as public schemes, financial grants, clean energy subsidies, or hardware specifications—public information is often fragmented:
- **Hidden Information Gaps:** Vital decision parameters (e.g. income ceilings, renewal rules, required documents) are missing from reviewed materials.
- **Conflicting Claims:** Aggregators, secondary blogs, and older circulars cite contradicting numbers, dates, or eligibility conditions.
- **Outdated Data:** Articles often refresh page titles to the current year while leaving expired dates and old guidelines intact.
- **AI Hallucination:** Traditional generative chatbots and search summarizers fabricate missing facts or smooth over real contradictions.

**Digital Dark Spot** shifts the focus from *synthesizing what is present* to **systematically detecting what is missing, contradicted, or outdated**, with every finding verified verbatim against primary source text.

> [!IMPORTANT]
> **Candidate Signals, Not Definitive Truth:** Digital Dark Spot validates every finding against verbatim substrings in the primary text. If a quote cannot be verified verbatim in the raw document, it is rejected immediately to eliminate hallucination.

---

## 2. Hackathon Requirements to Implementation Mapping

| Hackathon Requirement | Engine Implementation | Frontend Component | User Benefit |
| :--- | :--- | :--- | :--- |
| **1. Enter topic, question, or research goal** | `Home.tsx`, `Discover.tsx` | Clean input with suggestion chips | Intuitive question bar with comfortable multi-line editing. |
| **2. Add or collect source material** | `fetcher.ts`, `discoveryService.ts` | Multi-URL & text modal intake | SSRF-safe crawling, multi-URL batch pasting, and Tavily live search. |
| **3. Structured summary across sources** | `pipeline.ts`, `extraction.ts` | `SummaryTab.tsx`, `KeyFactsTable.tsx` | Compact Key Facts table (max 12 topics) and claim-linked summary bullets. |
| **4. Potential information gaps & unanswered questions** | `gaps.ts`, `canonicalization.ts` | `GapsTab.tsx` | Distinguishes critical question-derived **Needs** from secondary details. |
| **5. Possible contradictions with source references** | `conflicts.ts`, `normalization.ts` | `ConflictsTab.tsx` | Subject-aware comparison preventing false conflicts; side-by-side quotes. |
| **6. Warnings for outdated or undated details** | `freshness.ts`, `metadata.ts` | `FreshnessTab.tsx`, `CoverageMap.tsx` | Cycle detection, publication date auditing, and synchronized map counters. |
| **7. Prioritized checklist of items to verify next** | `checklist.ts` | `ChecklistTab.tsx` | High/Med/Low verification checklist with Markdown export. |
| **8. Distinguish sourced data from AI uncertainty** | `types.ts`, `StatusTag.tsx` | `StatusTag.tsx` | Clear visual badges: `Sourced` (green), `AI-suggested` (purple), `Uncertain` (amber). |
| **9. Verbatim evidence tracing** | `verifier.ts` | `EvidenceDrawerSubRoute.tsx` | Sliding drawer displaying the exact quote highlighted within 120-character context. |

---

## 3. System Architecture

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

## 4. Deterministic Evaluation Benchmark

Digital Dark Spot includes a deterministic evaluation runner that tests the complete pipeline against ground-truth scenarios without network calls:

```bash
npm run eval
```

### Benchmark Scenario Matrix

| Scenario | Scenario Name | Sources | Claims | Total Gaps | Conflicts | Stale Warnings | Verification Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `scenario-1` | **State Merit Scholarship with Conflicting Income and Stale Cycle** | 2 | 6 | 0 | 2 | 1 | **PASSED** |
| `scenario-2` | **Clean Energy Scheme with Missing Critical Disbursement Attribute** | 2 | 5 | 1 | 0 | 0 | **PASSED** |
| `scenario-3` | **Global Fellowship with Full Consensus and Complete Coverage** | 2 | 8 | 0 | 0 | 0 | **PASSED** |

- **Scenario 1:** Detected conflicting income limits (₹6,00,000 in official notice vs ₹2,50,000 in third-party post) with original quotes preserved; flagged the 2024 blog as a stale cycle (`2024-25`).
- **Scenario 2:** Value equivalence engine normalized `Rs 25 lakh` with `Rs 25,00,000` producing 0 false conflicts, and accurately flagged `disbursement_timeline` as an unaddressed **Total Gap**.
- **Scenario 3:** Canonical synonym matching reconciled `stipend` with `award_amount` and normalized currency formatting with 0 false conflicts and 0 false gaps.

---

## 5. Multi-Provider LLM & Search Resilience

The platform features built-in automated failover, key round-robin rotation, and cooldown recovery:

| Provider | Supported Models | Key Rotation | Cooldown & Failover |
| :--- | :--- | :---: | :---: |
| **Google Gemini** | `gemini-3-flash-preview`, `gemini-3.8-flash` | Yes (comma-separated keys) | Automatic failover to secondary key/model |
| **Groq** | `qwen/qwen3.8-27b`, `llama-3.3-70b-versatile` | Yes (comma-separated keys) | Ultra-fast fallback provider |
| **OpenAI** | `gpt-4o-mini`, `gpt-4o` | Yes (comma-separated keys) | Standard fallback |
| **Anthropic** | `claude-3-5-haiku-20241022` | Yes (comma-separated keys) | Haiku tier fallback |
| **Tavily Search** | Official Tavily Search API | Yes (comma-separated keys) | Context-rich web discovery |

---

## 6. Automated Verification Suite

Run the complete 18-step verification harness:

```bash
npm run verify
```

All 18 automated test checks pass cleanly with 0 failures:
- ✅ **Core Hackathon Scenarios** (5/5 PASS)
- ✅ **Engine Normalization & Qualifier Separation** (PASS)
- ✅ **Topic-Tailored Search Discovery & Fallback** (PASS)
- ✅ **Deterministic Evaluation Fixtures** (PASS)
- ✅ **Automated Secrets Leak Audit** (0 leaks)
- ✅ **Automated Domain Vocabulary Ban-List Scan** (PASS)
- ✅ **Palette Tokens & Contrast Verification** (PASS)
- ✅ **Safety, Edge-Cases & Provider Failover** (PASS)
- ✅ **Hardware Verification Discipline** (PASS)
- ✅ **Production Frontend Typecheck & Build** (PASS)

---

## 7. Security & Secret Protection

- **Automated Secret Leak Scanner (`npm run check:secrets`):** Scans all files and git staging areas for Google AI, Groq, OpenAI, Anthropic, Tavily, and Brave API key patterns.
- **SSRF Ingestion Protection:** Blocks private subnets (RFC 1918, RFC 4193), loopback (`127.0.0.1`, `::1`), link-local metadata endpoints (`169.254.169.254`), and enforces strict fetch timeouts.
- **Zero API Key Leak Guarantee:** No secrets or private credentials are ever committed to version control.

---

## 8. Credits & Inspirations

- **[Watermelon UI](https://ui.watermelon.sh):** Component design tokens and layout primitives.
- **[Motion](https://motion.dev):** GPU-accelerated spring animations and accessible reduced-motion support.
- **[Radix UI](https://www.radix-ui.com):** Accessible WAI-ARIA primitive foundations.
- **[Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) & [DM Sans](https://fonts.google.com/specimen/DM+Sans):** Typography system.
