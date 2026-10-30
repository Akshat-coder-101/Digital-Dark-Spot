Digital Dark Spot: Problem Analysis and PRD
AI-Assisted Information Gap Detection Platform | Shinchan Online Hackathon 2026 | Team DEVENGERS
Part A. Problem Statement Analysis
A1. What the problem really is
Search tools find information. Summarizers condense what was found. Neither tells the user what is missing, conflicting or stale. The product is therefore a research auditor, not a search engine and not a chatbot. The value is in the negative space: what the sources do not say.
A2. Required deliverables (from Section 2)
#
Requirement
Core or stretch
1
Web app taking a topic, question or research goal
Core
2
Add or collect sources (user URLs or permitted search)
Core (URLs); stretch (search API)
3
Structured summary of key information across sources
Core
4
List of potential gaps and unanswered questions
Core
5
Contradictions between sources, with references
Core
6
Outdated or undated warnings
Core
7
Prioritized verification checklist
Core
8
Dashboard separating sourced facts, AI suggestions and uncertainty
Core
All eight are needed for the workflow to count as complete, so the plan treats them as the minimum viable product.
A3. How judges will score it (10 marks)
Criterion
Weight
What wins marks
Working prototype
25% (2.5)
End-to-end flow: input → sources → findings → checklist, with no crashes
Innovation
20% (2.0)
Must clearly go beyond search, summaries or chatbots: a gap-detection engine
Problem understanding
15% (1.5)
Named target users, realistic scenarios
Technical implementation
15% (1.5)
Clean architecture, structured AI output, error handling
Evidence and transparency
15% (1.5)
Every finding traceable to a source snippet; uncertainty shown honestly
Presentation and demo
10% (1.0)
A scripted, reliable demo with real sources
Takeaway: 40% of the score (prototype + technical) rewards a working core, and another 15% rewards traceability. A polished core beats a wide feature set, which the document states explicitly.
A4. Hidden requirements and traps
1. A chatbot or summary alone fails. The gap-detection workflow itself must be demonstrated.
2. AI findings must be labelled "potential" or "signal", never as facts. The wording is part of the grade.
3. Judges must be able to open the evidence behind each finding. Every claim needs a source plus an exact supporting snippet.
4. Source dates are only a "when available" feature. Handle missing dates gracefully ("undated" is itself a warning).
5. Use real or clearly identified sample sources. Prepare a curated demo set so the demo does not depend on live scraping.
6. Mandatory submission: project description plus a GitHub repo with README. Live demo, video and PPT are optional but useful.
7. Timeline: submission window is 31 Oct 10:00 AM to 1 Nov 5:00 PM (31 hours). Scope must be disciplined.
8. Individual participation, intermediate level: the architecture has to be buildable by one person.
A5. Key design insight
The core idea is to extract atomic claims per source, then compare claims across sources against a topic-specific checklist of expected information. Gaps are things the checklist expects that no source covers. Conflicts are claims on the same attribute with different values. Staleness comes from dates and cycle mentions. This is much more defensible than asking an LLM to "find what's missing" in one prompt.
Part B. Product Requirements Document
B1. Overview
Product name: Digital Dark Spot
Tagline: See what your sources don't tell you.
Category: Web, AI, research tooling
Version: MVP for hackathon
B2. Problem
People decide about scholarships, courses, jobs, public services and business matters using scattered web information. Pages are outdated, disagree with each other, or omit crucial facts such as renewal rules, current deadlines or required documents. Users have no systematic way to know whether what they found is complete enough to act on.
B3. Goals and non-goals
Goals
• G1. Let a user go from a research question and a few sources to a gap report in under 2 minutes.
• G2. Surface potential gaps, conflicts, outdated or undated details, and unanswered questions.
• G3. Make every finding traceable to a source URL and quoted snippet.
• G4. Produce a prioritized, actionable verification checklist.
• G5. Communicate uncertainty responsibly through labels and confidence levels.
Non-goals
• Not a general search engine or crawler.
• Not a chatbot or open-ended Q&A.
• Not a fact-checker that declares truth. It flags potential issues only.
• No user accounts, payments or multi-user collaboration in the MVP.
B4. Target users and personas
Persona
Need
Example question
Student (primary)
Apply correctly and not miss requirements
"What should I verify before applying for this scholarship?"
Early researcher or journalist
Know if evidence is sufficient and consistent
"What is known about policy X and what is unclear?"
Job or career seeker
Verify role, eligibility, process details
"What do I need to confirm before taking this certification?"
Small business owner
Check regulatory or scheme details
"What do I need to verify to register under scheme Y?"
B5. User stories
• As a student, I enter a question and paste 3 to 5 URLs so the app can review them.
• As a user, I see what the sources agree on, with a link and snippet for each point.
• As a user, I see where information is missing so I know what to look for next.
• As a user, I see where two sources disagree and can read both claims side by side.
• As a user, I am warned when a source looks old or has no date.
• As a user, I get a checklist ordered by importance that I can tick off and export.
• As a judge, I can click any finding and see the exact evidence behind it.
B6. Core user flow
1. Input: the user enters a research question and optionally a topic type (scholarship, policy, product, general).
2. Sources: the user adds URLs or pasted text, or picks the bundled demo set. Optional stretch: fetch suggested sources via a search API.
3. Ingest: the app fetches each page and extracts clean text, title, publisher domain and any visible date.
4. Analyze: the AI pipeline runs (see B8).
5. Dashboard: the user reviews the summary, gaps, conflicts, freshness warnings and checklist.
6. Evidence drill-down: clicking a finding opens a side panel with the source snippet and link.
7. Export: the user copies or downloads the checklist (Markdown, or PDF as a stretch).
B7. Functional requirements
Priority key: P0 = must have, P1 = should have, P2 = stretch.
ID
Requirement
Priority
F1
Question input with validation
P0
F2
Add 2 to 8 sources via URL or pasted text, with remove and reorder
P0
F3
Fetch and clean page content (title, text, domain, fetch status). Show per-source errors without blocking the others
P0
F4
Date detection from metadata, text patterns and cycle mentions such as "2024-25". Mark undated sources
P0
F5
Per-source claim extraction as structured JSON, each claim with attribute, value and a verbatim quote
P0
F6
Cross-source summary of key information, each point citing sources
P0
F7
Gap detection by comparing the expected-information checklist for the topic against extracted claims
P0
F8
Conflict detection: same attribute, different values across sources, shown side by side with both quotes
P0
F9
Freshness warnings: older than a threshold, undated, or referring to a prior cycle
P0
F10
Unanswered questions list generated from gaps and ambiguity
P0
F11
Prioritized verification checklist (High, Medium, Low) with a reason and a suggested official source to check
P0
F12
Dashboard labels every item as Sourced, AI-suggested or Uncertain with a confidence indicator
P0
F13
Evidence viewer: snippet with highlight and a link to the original
P0
F14
Source credibility hint (official or government domain, education domain, third party, unknown), shown as a hint and not a verdict
P1
F15
Checkbox state on the checklist and export to Markdown
P1
F16
Pre-loaded demo scenario (scholarship) that works offline
P1
F17
Search API integration to suggest sources
P2
F18
PDF source upload
P2
F19
Save and share a report via link
P2
B8. AI and analysis pipeline
The pipeline is deliberately staged so that each step is inspectable and testable.
1. Question understanding. Classify the topic type and generate an expected-information checklist (for a scholarship: eligibility, deadline, required documents, application link, renewal conditions, selection process, award amount, contact). Let the user edit the list.
2. Claim extraction (per source). Output JSON of attribute, value, quote (verbatim), date_hint and confidence. Reject any claim whose quote is not found in the source text (anti-hallucination check).
3. Normalization and matching. Group claims by attribute across sources.
4. Gap analysis. An expected attribute with no supporting claim becomes a potential gap. An attribute with only one weak or third-party source becomes a thin coverage warning.
5. Conflict analysis. Within one attribute, compare values (deterministic comparison for dates, numbers and amounts; LLM judgment for text). Output conflicts with both quotes.
6. Freshness analysis. Rule-based date and cycle detection first, LLM fallback second.
7. Checklist synthesis. Convert gaps, conflicts and stale items into prioritized actions. Priority is driven by attribute importance and issue severity.
Guardrails
• Strict JSON schema output with validation and retry.
• Every sourced item must carry a quote and URL. Items without evidence are automatically labelled AI-suggested.
• Standard wording: "potential gap", "possible conflict", "not found in the sources reviewed".
• Never state that something does not exist, only that it was not found in the reviewed sources.
B9. Dashboard and UX requirements
• Header strip: the question plus source count, gap count, conflict count and stale-source count.
• Sections: Summary, Gaps, Conflicts, Freshness, Checklist, Sources.
• Colour and label system: Sourced (green), AI-suggested (blue), Uncertain (amber), Conflict (red). Each also carries a text label, so colour is never the only signal.
• Evidence drawer: quote, source title, domain, date status and an open-original link.
• Coverage matrix: rows are expected attributes, columns are sources, cells show found, missing or conflicting. This is the signature visual and the clearest demo moment.
• Loading and error states: progress per source and per pipeline stage. Partial results are shown if one source fails.
• Persistent disclaimer: "Findings are potential signals, not verified facts. Confirm with the official source."
• Responsive layout and keyboard-accessible controls.
B10. Data model (simplified)
ResearchSession { id, question, topicType, createdAt }
Source { id, sessionId, url, title, domain, text, fetchedAt, publishedDate?, dateStatus, credibilityHint, fetchStatus }
Claim { id, sourceId, attribute, value, quote, confidence }
Finding { id, sessionId, type: gap|conflict|stale|unanswered, label: sourced|ai|uncertain, severity, description, evidenceClaimIds[] }
ChecklistItem { id, sessionId, text, priority, reason, suggestedSource, done }
B11. Suggested architecture and tech stack
Layer
Choice
Rationale
Frontend
React with Vite (or Next.js) and Tailwind
Fast to build, good component reuse
Backend
Node (Express or Next API routes) or Python FastAPI
Simple REST endpoints; FastAPI is convenient for text processing
Content extraction
Readability or trafilatura, plus cheerio or BeautifulSoup
Clean article text and metadata
LLM
Claude API with JSON-schema style prompting
Reliable structured extraction and reasoning
Storage
SQLite or in-memory for the MVP
No setup burden
Deployment (optional)
Vercel or Render, API key kept server-side
Cheap live demo
Endpoints (sketch): POST /api/session, POST /api/sources (fetch and parse), POST /api/analyze (runs the pipeline, can stream stage progress), GET /api/report/:id.
B12. Non-functional requirements
• Performance: analysis of 5 sources in under about 60 seconds, with streamed progress.
• Reliability: per-source failures are isolated. Fall back to pasted text. Cached demo results exist as a backup.
• Security: API keys never reach the client. URL fetching is protected against SSRF (block private IP ranges). Source text is treated as untrusted data, so prompt-injection text inside pages must not be followed as instructions.
• Legal and ethical: respect robots.txt and site terms where applicable. Only user-provided or permitted sources are used. Quotes are kept short with a link back.
• Transparency: show methodology ("How we detect gaps") on a small info panel.
B13. Success metrics
• Demo scenario returns at least 1 gap, 1 conflict and 1 freshness warning, all with clickable evidence.
• 100% of Sourced findings include a verifiable quote that exists in the source text.
• Core flow completes with zero manual intervention during the demo.
• Qualitative target: a first-time user can state what to verify next after one look at the dashboard.
B14. Mapping to judging criteria
Criterion
How the PRD addresses it
Problem understanding
Named personas and the scholarship scenario from the brief
Innovation
Expected-information checklist, coverage matrix, cross-source claim comparison
Working prototype
F1 to F13 form one coherent flow
Technical implementation
Staged pipeline, schema validation, SSRF protection, error isolation
Evidence and transparency
Verbatim-quote verification, three-way labelling, careful wording
Presentation
Offline demo set, scripted flow, coverage matrix as the visual anchor
B15. Build plan for the 31-hour window
Block
Hours
Output
Setup and design
0 to 3
Repo, skeleton UI, schema, prompts drafted
Ingestion
3 to 8
URL fetch, text cleaning, date detection
AI pipeline
8 to 17
Claim extraction, gap and conflict logic, checklist synthesis
Dashboard
17 to 24
Summary, matrix, evidence drawer, labels
Hardening
24 to 28
Error handling, demo dataset, caching fallback, README
Submission
28 to 31
Description, optional video and deployment, final repo check
Submit a few hours before the 5:00 PM deadline on 1 November, and confirm the repository is accessible to judges.
B16. Risks and mitigations
Risk
Mitigation
Sites block scraping or pages are JS-rendered
Pasted-text fallback and a cached demo set
LLM hallucinates claims
Verbatim quote check; drop claims that fail it
Over-confident wording
Fixed label vocabulary and confidence levels
Scope creep
Freeze P0 first and treat P1 and P2 as optional
API cost or latency during the demo
Cache analysis results for the demo scenario
Prompt injection from page content
Delimit source text as data and never execute its instructions
B17. Future scope
• Search API integration for automatic source discovery.
• PDF and document upload.
• Re-check and monitoring: alert when a source changes or a new cycle is published.
• Domain-specific expected-information templates (jobs, health schemes, visas).
• Browser extension that audits the page the user is reading.
• Multilingual sources, including Indian regional languages.
• Team workspaces and shareable reports.
B18. Submission description (ready to adapt)
Digital Dark Spot is an AI-assisted research auditor. Instead of only searching or summarizing, it analyzes multiple sources on a topic and shows what the user still does not know. It extracts claims with verbatim evidence, builds a coverage matrix against an expected-information checklist, flags possible conflicts and outdated or undated sources, and generates a prioritized checklist of what to verify next. Every sourced finding links to its evidence, and AI-suggested or uncertain items are clearly labelled as potential signals, not facts.
B19. Open questions
1. Which LLM and API budget will be used for the demo?
2. Is live deployment worth the time, or is a screen-recorded demo with a clean README enough?
3. Which scenario will be the primary demo (scholarship is the safest, since it matches the brief)?
4. Will the team include a search API, or rely on user-provided URLs only?