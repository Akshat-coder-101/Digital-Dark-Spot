# Digital Dark Spot — Hackathon Submission Summary
> **Shinchan Online Hackathon 2026** — *Problem Statement: Digital Dark Spot*  
> **Team:** Devengers  
> **Repository:** [Digital Dark Spot](https://github.com/example/digital-dark-spot)  
> **Verification Status:** 14/14 Automated Gates Passing cleanly via `npm run verify`  

---

## 1. Problem Solved

When individuals research critical guidelines, public initiatives, clean energy subsidies, academic programs, or hardware specifications, they encounter fragmented online information:
- **Missing Information (Gaps):** Essential decision parameters (e.g., renewal criteria, required documentation, deadlines) are missing from reviewed materials.
- **Conflicting Values:** Unofficial aggregators and secondary blogs cite conflicting rules, numbers, or qualifications.
- **Outdated Data:** Articles update page titles to the current year (e.g., 2026) to attract search traffic while leaving expired guidelines or earlier cycle data intact.
- **AI Hallucination:** Traditional generative chatbots and search summarizers fabricate missing facts or smooth over real contradictions.

**Digital Dark Spot** solves this by shifting from *synthesizing what is present* to **systematically detecting what is missing, contradicted, or outdated**, with every finding verified verbatim against primary source text.

---

## 2. Approach Taken

1. **Strictly Grounded, Topic-Independent Pipeline:**
   - Works across arbitrary topics (Education, Clean Energy Subsidies, Hardware Benchmarks, Public Guidelines).
   - Domain vocabulary is prohibited in core engine logic and UI code, enforced by an automated ban-list scanner.
2. **Untrusted Data Isolation & Verbatim Verifier:**
   - Ingested web and pasted materials are treated as untrusted data and strictly delimited in prompts.
   - Every extracted claim must pass an automated verbatim substring verification against raw source text before being accepted. Hallucinated quotes are discarded immediately.
3. **Deterministic Typed Normalization & Qualifier Separation:**
   - Canonicalizes typed quantities (numbers, percentages, dates, multi-currency values with Indian lakh/crore support).
   - Material differences yield `Sourced` conflicts; wording variations produce `Uncertain` review signals.
   - Distinguishes stakeholder roles (e.g. applicant submission vs institutional verification) so valid procedural distinctions never trigger false conflicts.
4. **Temporal Freshness Audit:**
   - Separates publication dates from effective closing deadlines.
   - Detects earlier cycle references, documents older than 18 months, and undated web documents.
5. **Human Verification Dashboard:**
   - Findings are presented as candidate signals, never dogmatic truth.
   - Coverage Map cross-examines expected parameters across all reviewed sources using unambiguous status tags (`Found`, `Conflict`, `Single source`, `Gap`, `Stale`) with accompanying icons (never color alone).
   - Evidence Drawer provides raw document excerpts showing the verbatim quote highlighted with 120 characters of surrounding authentic context.
   - Generates a prioritized, actionable verification checklist with Markdown export.
6. **"Black, Cobalt and Acid lime" Palette System:**
   - Strict CSS token architecture replacing all old green values across CSS, Tailwind, SVGs, favicon, and components.
   - All contrast pairs exceed WCAG AA requirements (4.5:1 text/status, 3.0:1 focus rings).
   - Exactly 1 faint radial glow behind hero and report header (no other decorative glows).

---

## 3. Key Architectural Decisions

| Decision | Summary |
| :--- | :--- |
| **Monorepo Verification Harness (`scripts/verify.ts`)** | Single command (`npm run verify`) running 14 automated verification checks across unit tests, evaluation benchmarks, secrets scanner, ban-list compliance, route integration, palette tokens, edge cases, failover, and frontend builds. |
| **Deterministic Evaluation Protocol** | All automated tests and evaluations run with zero external network dependencies and deterministic mock fixtures, guaranteeing repeatable accuracy scores without API rate-limit flakes. |
| **No Source Fabrication Policy** | If web discovery APIs are unavailable, the platform never invents fake URLs, domains, or government notices. It gracefully falls back to user-provided URLs, pasted text, or clearly labeled offline sample data (`.example` domains). |
| **Topic-Independent Normalization** | Replaced domain-specific hardcoded synonym tables with deterministic typed normalizers and qualifier-aware comparisons. |
| **Automated Vocabulary Ban-List Scanner** | Automatically verifies 97+ non-fixture source files to ensure no domain-specific words leak into engine code or UI copy. |
| **Traceable Evidence Context Viewer** | Built a slide-over evidence inspection panel displaying verbatim substring matches in a 120-character surrounding context window, explanation metadata ("Why this was flagged"), and cross-source comparisons. |
| **Objective UI Gate & Accessibility** | 40 full-page screenshots captured at 1440px, 1024px, 768px, and 390px in dark and light themes (`docs/screens/`). Verified zero horizontal overflow, zero console errors, and full keyboard navigation with focus return. |

---

## 4. Verification & Testing Evidence

Run the complete verification harness:
```bash
npm run verify
```

All 14 automated test checks pass cleanly with 0 failures:
- Core hackathon scenarios (5/5 PASS)
- Engine normalization and qualifier separation (PASS)
- Topic-tailored search discovery and graceful fallback (PASS)
- Deterministic multi-scenario fixture validator (PASS)
- Automated secrets leak audit (0 leaks)
- Automated domain vocabulary ban-list scan (97+ files clean)
- Palette tokens and WCAG AA contrast verification (PASS)
- Safety and robustness: 7 edge-case tests (PASS)
- Mock provider failover and 60s cooldown tests (PASS)
- Production frontend build & typecheck (PASS)
- Objective UI Gate: 40 screenshots in `docs/screens/` (PASS)
