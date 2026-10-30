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

People rely on online information to make critical decisions about education, careers, public schemes, research, and legal matters. However, online information is fragmented, outdated, and full of conflicting blog posts.

Standard search engines and AI chatbots summarize what is *available*. **Digital Dark Spot** reveals what is **missing**, **contradicted**, or **outdated** across multiple sources, grounding every finding in verbatim evidence quotes.

> [!IMPORTANT]
> **Candidate Signals, Not Definitive Truth:** Digital Dark Spot identifies information dark spots and delivers an actionable, prioritized checklist to guide human verification against primary government and institutional sources.

---

## 2. System Architecture

```mermaid
flowchart TD
    User([User Prompt & Source Material]) --> Intake[Intake Layer / Sources Ingestion]
    Intake --> SSRF[SSRF Security Guard & 12s Fetcher]
    Intake --> Temporal[Temporal & Cycle Detection]
    
    SSRF --> Untrusted[Delimited Untrusted Context]
    Untrusted --> LLM[LLM Layer: Multi-Provider / Multi-Key]
    
    LLM --> JSON[Strict JSON Claims & Attributes]
    JSON --> Verifier[Verbatim Substring Verifier]
    
    Verifier --> Discarded[Discard Hallucinated Quotes]
    Verifier --> VerifiedClaims[Verified Ground-Truth Claims]
    
    VerifiedClaims --> Canonical[Synonym & Value Equivalence Engine]
    Temporal --> DeterministicEngine[Deterministic Analysis Engine]
    Canonical --> DeterministicEngine
    
    DeterministicEngine --> Gaps[Potential Gaps: Total & Thin]
    DeterministicEngine --> Conflicts[Possible Contradictions]
    DeterministicEngine --> Freshness[Stale & Undated Warnings]
    DeterministicEngine --> Matrix[Coverage Matrix: Attribute x Source]
    DeterministicEngine --> Checklist[Prioritized Verification Checklist]
    
    Gaps --> UI[Interactive Dashboard & Half-Melon Slice View]
    Conflicts --> UI
    Freshness --> UI
    Matrix --> UI
    Checklist --> UI
```

---

## 3. Quickstart (3 Commands)

You can clone, install, and run Digital Dark Spot immediately:

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic accuracy evaluation suite (zero API keys needed)
npm run eval

# 3. Start development server (Frontend + Backend)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 4. Zero-Key Offline Demo Mode

Digital Dark Spot does **not** require any API keys to be evaluated or demonstrated:
1. Open `http://localhost:5173`.
2. Click **"Try Demo: Fictional Scholarship Dataset"** on the home screen.
3. The platform instantly loads the verified, ground-truth reference dataset and executes the complete 5-stage analysis pipeline deterministically.
4. If live API keys are exhausted or unavailable during custom search queries, the system cleanly prompts the user to explore the offline dataset rather than throwing unhandled errors.

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
