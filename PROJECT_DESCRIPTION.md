# Digital Dark Spot — Official Hackathon Project Submission Description

**Hackathon:** Shinchan Online Hackathon 2026 (Devengers)  
**Project Category:** Web Development • Artificial Intelligence • Research & Information Technology  
**Project Name:** Digital Dark Spot  

---

## 1. Problem Statement
People make high-stakes life decisions—such as applying for education scholarships, evaluating healthcare treatments, adhering to government regulations, or executing commercial contracts—based on scattered online information. 

However, online information is inherently fragmented and prone to severe blindspots:
- **Missing Vital Details:** Critical parameters (e.g. scholarship renewal criteria, minimum credit hours, penalty clauses) are frequently omitted from secondary guides.
- **Contradictory Requirements:** Different websites, unofficial blogs, and dated forums cite conflicting eligibility thresholds (e.g. $50,000 vs. $40,000 annual income).
- **Outdated / Stale Information:** Search engines often rank obsolete notices from prior application cycles (e.g. 2024-25 guidelines presented as current rules).

Ordinary search engines and AI chat summarizers condense what is *present in the text*, often giving users a false sense of completeness while hiding what is missing.

---

## 2. Proposed Solution
**Digital Dark Spot** is a specialized, web-based AI-assisted information gap and contradiction detection platform. Rather than generating generic summaries, it systematically audits an information space to identify:
1. **Potential Information Gaps:** Decision attributes completely missing across all reviewed sources, or backed by only a single source ("thin coverage").
2. **Possible Contradictions:** Materially conflicting requirements across sources, presented with side-by-side evidence quotes and a jagged fracture visualizer.
3. **Temporal Freshness Warnings:** Automatic flags for documents older than 18 months, references to prior cycles, or undated forum posts.
4. **100% Verbatim Ground Truth Evidence:** Every claim is strictly audited against raw source text using exact substring matching; any ungrounded hallucination is discarded.
5. **Prioritized Action Checklist:** An actionable next-step checklist grouped into High, Medium, and Low priorities with suggested official authority sources to verify.

---

## 3. How It Works

1. **Intake & Security Filtering:** The user inputs a research question and provides multiple sources (URLs or pasted text). An SSRF security guard blocks access to private, loopback, or cloud-metadata IPs, running within a 12-second timeout per source.
2. **AI Extraction:** The server invokes an LLM (supporting Google Gemini, OpenAI, and Anthropic with round-robin multi-key failover). The model extracts 6 to 10 expected attributes (in `snake_case`), candidate claims with verbatim quotes, and open questions.
3. **Verbatim Quote Verification:** Before findings are analyzed, a deterministic verifier searches the raw source texts. If a quote does not match verbatim, the claim is dropped and logged in a discarded count.
4. **Deterministic Analysis Engine:** No LLM is used in the gap or contradiction calculations. Deterministic algorithms compute:
   - Total gaps (uncovered expected attributes) and thin single-source coverage.
   - Cross-source value conflicts ("Possible conflict").
   - Freshness & cycle discrepancies.
   - Attribute × Source coverage matrix.
   - Prioritized verification checklist.
5. **Interactive Dashboard:** Findings are visualized through the interactive **Half-Melon Slice View** and coverage data table, with deep linking into slide-over **Evidence Drawers** for full quote inspection.

---

## 4. Major Features

- **Interactive Half-Melon Slice View:** A SVG visualization mapping each expected attribute to a slice wedge: flesh if covered, a black seed if missing (gap), a crack line if conflicting, and a wilted pale patch if stale.
- **Side-by-Side Contradiction Cards:** Two-column split cards with a jagged fracture divider allowing users to contrast conflicting claims side-by-side with source titles, domains, and dates.
- **Evidence Drawer:** Slide-over modal displaying highlighted verbatim quotes, source metadata, and direct outbound links to primary sources.
- **Accessible Coverage Matrix:** High-contrast matrix table mapping expected attributes to sources, fully keyboard navigable and WCAG AA compliant.
- **Session-Persisted Verification Checklist:** Interactive animated checkboxes that morph seeds into checkmarks, persist checked states across page refreshes, and support 1-click **"Copy as Markdown"** and **"Download .md"**.
- **Multi-Provider & Multi-Key Failover:** Robust backend LLM layer that round-robins keys, enforces 60-second cooldowns on 429/5xx rate limits, disables invalid keys for the session, and falls back across providers without leaking credentials.
- **Instant Offline Demo Mode:** 1-click exploration of a precomputed, verified scholarship scenario without needing live API keys or network connectivity.

---

## 5. Uniqueness & Innovation

| Feature | Conventional AI Summarizer / Chatbot | Digital Dark Spot |
|---|---|---|
| **Objective** | Condenses text that is present | Discovers what is **missing**, **contradicted**, and **outdated** |
| **Trust Model** | Generative guessing prone to hallucinations | **100% Verbatim Substring Grounding** (discards unverified claims) |
| **Gap Detection** | Subjective narrative | **Deterministic Attribute × Source Coverage Matrix** |
| **Output Presentation** | Conversational answer | **Prioritized Human Verification Checklist** |
| **Safety Posture** | Presents AI output as truth | Responsibly states *"Potential signals, not verified facts"* |

---

## 6. Technology Stack

- **Frontend:** Vite, React 18, TypeScript, React Router v6, Tailwind CSS v4, Motion (`motion/react`), Watermelon UI components, Radix UI.
- **Backend:** Node.js, Express, TypeScript (ES Modules), Cheerio, Zod.
- **Design System:** "Watermelon Seed" semantic token palette (Rind, Flesh, Pith, Seed, Crack, Wilt) in light and dark modes.
- **Typography:** Bricolage Grotesque & DM Sans.

---

## 7. Future Scope

1. **Headless Browser Crawler:** Integrate Browserbase or Puppeteer for rendering JavaScript-heavy single-page government portals.
2. **Automated Authority Monitoring:** Scheduled cron job to periodically re-audit active checklists and notify users via webhook when a gap is resolved by an official update.
3. **Collaborative Multi-Auditor Teams:** Shared workspace allowing research teams or advisors to collaboratively verify checklist items and annotate source evidence.
