# Graph Report - deven2  (2026-10-31)

## Corpus Check
- 170 files · ~78,341 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 910 nodes · 1950 edges · 64 communities (54 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b8c8e17`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DashboardLayout.tsx
- ban-list-scan.ts
- discoveryService.ts
- card-split-accordian.tsx
- test-attribute-matching.ts
- GSD-STYLE.md
- fetcher.ts
- Digital Dark Spot 🍉
- llm/manager.ts
- compilerOptions
- scripts
- components.json
- package.json
- frontend/package.json
- dependencies
- compilerOptions
- PROJECT_RULES.md — GSD Canonical Rules
- Digital Dark Spot — Design System Specification
- validate-all.sh script
- Gemini Adapter
- devDependencies
- Digital Dark Spot — Official Hackathon Project Submission Description
- GPT & Open Source Models Adapter
- Claude Adapter
- ban-list-scan.ts
- credit-usage-card.tsx
- Digital Dark Spot — Product Requirements Document (PRD)
- App.tsx
- Digital Dark Spot — UI Components Registry
- continuous-tabs.tsx
- sampleData.ts
- Digital Dark Spot — Product Requirements Document (PRD)
- Token Efficiency Rules
- setup_search.sh script
- Open Source Models
- react
- scripts
- search_repo.sh script
- DashboardLayout.tsx
- cn
- lucide-react
- CoverageMatrixTable.tsx
- eval.ts
- DarkSpotSphere.tsx
- analysis/types.ts
- react
- lucide-react
- test-phase1-engine.ts
- verifier.ts
- pipeline.ts
- Baseline Verification Report (Phase 0)
- alert.tsx
- tabs.tsx
- activities-card.tsx
- budget-card.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 56 edges
2. `cn()` - 56 edges
3. `motion` - 31 edges
4. `lucide-react` - 27 edges
5. `SeedIcon()` - 27 edges
6. `Button` - 23 edges
7. `scripts` - 20 edges
8. `detectConflicts()` - 20 edges
9. `IngestedSource` - 19 edges
10. `App()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Decision 2: In-Memory Pre-Extracted Content Ingestion` --references--> `SourceInput`  [INFERRED]
  docs/DECISIONS.md → backend/src/ingestion/types.ts
- `Decision 4: Topic-Independent Typed Normalization & Qualifier Separation` --references--> `compareTypedValues()`  [INFERRED]
  docs/DECISIONS.md → backend/src/analysis/normalization.ts
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `CrackLineDraw()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/CrackLineDraw.tsx
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `EvidenceDrawerMotion()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/EvidenceDrawerMotion.tsx
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `SeedCheckMorph()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/SeedCheckMorph.tsx

## Import Cycles
- None detected.

## Communities (64 total, 10 thin omitted)

### Community 0 - "DashboardLayout.tsx"
Cohesion: 0.26
Nodes (17): CrackIcon(), IconProps, SeedIcon(), VerifiedCheckIcon(), WiltIcon(), StatusTag(), StatusTagProps, StatusType (+9 more)

### Community 1 - "ban-list-scan.ts"
Cohesion: 0.20
Nodes (10): ALLOWED_PATH_PATTERNS, BANNED_PATTERNS, BANNED_REGEX, filesToScan, isAllowed(), rootDir, scanDirectory(), targets (+2 more)

### Community 2 - "discoveryService.ts"
Cohesion: 0.15
Nodes (18): SAMPLE_DISCOVERY_RESULTS, braveAdapter, isOfficialDomain(), tavilyAdapter, discoveryService, searchManager, generateDiverseSearchQueries(), normalizeUrl() (+10 more)

### Community 3 - "card-split-accordian.tsx"
Cohesion: 0.11
Nodes (19): AccordionApp(), AccordionItem(), AccordionItemData, AccordionItemProps, AccordionProps, DEFAULT_ITEMS, springTransition, AnimatedText() (+11 more)

### Community 4 - "test-attribute-matching.ts"
Cohesion: 0.12
Nodes (22): areAttributesMatching(), canonicalizeAttribute(), canonicalizeAttributeDetailed(), extractQualifier(), normalizeAttributeName(), QUALIFIER_TOKENS, EXTRACTION_SYSTEM_PROMPT, extractionZodSchema (+14 more)

### Community 5 - "GSD-STYLE.md"
Cohesion: 0.06
Nodes (34): Anti-Patterns to Avoid, Banners, Brevity with Substance, Checkpoint Structure, Commit Conventions, Context Engineering, Core Philosophy, Decision Gates (+26 more)

### Community 6 - "fetcher.ts"
Cohesion: 0.14
Nodes (22): cleanExtractedText(), determineCredibilityHint(), extractHostname(), ingestSources(), processSource(), DetectedTemporalInfo, detectTemporalMetadata(), MONTHS (+14 more)

### Community 7 - "Digital Dark Spot 🍉"
Cohesion: 0.06
Nodes (29): 1. Prerequisites, 2. Environment Variables, 3. Build & Run Commands, 4. Reverse Proxy Configuration, 5. Health Checks & Verification, Caddy Example, Development, Digital Dark Spot — Deployment & Operations Guide (+21 more)

### Community 8 - "llm/manager.ts"
Cohesion: 0.08
Nodes (25): app, anthropicAdapter, geminiAdapter, groqAdapter, openaiAdapter, llmManager, stripCodeFences(), KeyState (+17 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 10 - "scripts"
Cohesion: 0.04
Nodes (44): dependencies, cheerio, cors, dotenv, express, zod, devDependencies, tsx (+36 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "package.json"
Cohesion: 0.10
Nodes (19): devDependencies, concurrently, tsx, tsx, name, private, scripts, backend (+11 more)

### Community 13 - "frontend/package.json"
Cohesion: 0.11
Nodes (18): @types/node, typescript, name, private, type, version, clsx, framer-motion (+10 more)

### Community 14 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, framer-motion, lucide-react, motion, @radix-ui/react-dialog, @radix-ui/react-slot (+8 more)

### Community 15 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, rootDir (+4 more)

### Community 16 - "PROJECT_RULES.md — GSD Canonical Rules"
Cohesion: 0.15
Nodes (13): Commit Conventions, Context Management, Core Protocol, Delegation, Model Independence, PROJECT_RULES.md — GSD Canonical Rules, Proof Requirements, Quick Reference (+5 more)

### Community 17 - "Digital Dark Spot — Design System Specification"
Cohesion: 0.17
Nodes (11): 1. Core Philosophy & Visual Direction, 2. Semantic Token System, 3. Typography & Hierarchy, 4. Spacing, Borders & Radius, 5. Motion Rules (motion/react), 6. Layout Guide for Specific Routes, 7. Component Review Checklist, Color Usage & Contrast Rules: (+3 more)

### Community 18 - "validate-all.sh script"
Cohesion: 0.17
Nodes (6): validate-agents.sh script, validate-all.sh script, validate-encoding.sh script, validate-skills.sh script, validate-templates.sh script, validate-workflows.sh script

### Community 19 - "Gemini Adapter"
Cohesion: 0.22
Nodes (9): Anti-Patterns, Code Execution, Context Loading Pattern, Context Window Optimization, Flash vs Pro, Gemini Adapter, Grounding, Integration with .gemini/ (+1 more)

### Community 20 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 21 - "Digital Dark Spot — Official Hackathon Project Submission Description"
Cohesion: 0.22
Nodes (8): 1. Problem Statement, 2. Proposed Solution, 3. How It Works, 4. Major Features, 5. Uniqueness & Innovation, 6. Technology Stack, 7. Future Scope, Digital Dark Spot — Official Hackathon Project Submission Description

### Community 22 - "GPT & Open Source Models Adapter"
Cohesion: 0.25
Nodes (8): Anti-Patterns, Context Optimization, Function Calling, GPT Models, GPT & Open Source Models Adapter, Model Selection, Model-Specific Files, Shorter Context Strategies

### Community 23 - "Claude Adapter"
Cohesion: 0.29
Nodes (7): Anti-Patterns, Artifacts Mode, Claude Adapter, Context Optimization, Effort Levels, Extended Thinking Mode, File Conventions

### Community 24 - "ban-list-scan.ts"
Cohesion: 0.13
Nodes (10): BINARY_EXTENSIONS, IGNORED_PATHS, SECRET_PATTERNS, banListScript, CheckResult, fixtureScript, pdfScript, reportPhase5Script (+2 more)

### Community 25 - "credit-usage-card.tsx"
Cohesion: 0.33
Nodes (4): CreditUsageCardProps, PERIOD_OPTIONS, popoverAnim, UsageHistoryItem

### Community 26 - "Digital Dark Spot — Product Requirements Document (PRD)"
Cohesion: 0.40
Nodes (4): Architecture & System Design, Digital Dark Spot — Product Requirements Document (PRD), Problem Statement, Workflow Pipeline

### Community 27 - "App.tsx"
Cohesion: 0.21
Nodes (13): Analyzing, App(), Discover, Home, HowItWorks, NotFound, RouteLoading(), ScrollToTop() (+5 more)

### Community 28 - "Digital Dark Spot — UI Components Registry"
Cohesion: 0.50
Nodes (3): Digital Dark Spot — UI Components Registry, 🛡️ Radix & shadcn Primitives (Fallback where no Watermelon component exists), 🍉 Watermelon UI Official Registry Components (10 Installed)

### Community 29 - "continuous-tabs.tsx"
Cohesion: 0.40
Nodes (3): ContinuousTabsProps, DEFAULT_TABS, TabItem

### Community 30 - "sampleData.ts"
Cohesion: 0.15
Nodes (13): RawLLMExtraction, FIXTURES_DIR, generateSampleReport(), SAMPLE_RESEARCH_QUESTION, SAMPLE_SOURCES, runCheckpointVerification(), EXACT_FINDING_LABELS, EXACT_ORIGIN_TAGS (+5 more)

### Community 31 - "Digital Dark Spot — Product Requirements Document (PRD)"
Cohesion: 0.40
Nodes (4): Architecture & System Design, Digital Dark Spot — Product Requirements Document (PRD), Problem Statement, Workflow Pipeline

### Community 32 - "Token Efficiency Rules"
Cohesion: 0.40
Nodes (5): Budget Thresholds, Compression Protocol, Loading Rules, Per-Wave Efficiency, Token Efficiency Rules

### Community 33 - "setup_search.sh script"
Cohesion: 0.70
Nodes (4): check_fd(), check_ripgrep(), setup_search.sh script, suggest_install()

### Community 35 - "Open Source Models"
Cohesion: 0.50
Nodes (4): General Guidance, Local Deployment, Open Source Models, Recommended Patterns

### Community 36 - "react"
Cohesion: 0.18
Nodes (13): 🎬 Reusable Motion Components (`frontend/src/components/motion/`), EvidenceStack(), EvidenceStackProps, AppLayout(), Footer(), Navbar(), CrackLineDraw(), CrackLineDrawProps (+5 more)

### Community 37 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

### Community 47 - "DashboardLayout.tsx"
Cohesion: 0.27
Nodes (9): DeadlineInfo, parseDeadlineFromText(), FullAnalysisReport, ReportContext, ReportContextType, useReport(), formatSentenceCase(), HighlightedQuote() (+1 more)

### Community 48 - "cn"
Cohesion: 0.10
Nodes (23): FloatingInput(), FloatingInputProps, AnimatedCheckboxProps, Card, CardContent, CardDescription, CardFooter, CardHeader (+15 more)

### Community 49 - "lucide-react"
Cohesion: 0.17
Nodes (17): DotField(), V, AnimatedCheckbox(), RedactedDocumentBackground(), DiscoveredSource, fetchSampleData(), getDiscoveryJob(), getReport (+9 more)

### Community 50 - "CoverageMatrixTable.tsx"
Cohesion: 0.17
Nodes (15): CoverageMap(), CoverageMapProps, formatCellPreview(), formatSentenceCase(), CoverageMatrixTableProps, HalfMelonSliceViewProps, AnalysisStage, ChecklistItem (+7 more)

### Community 51 - "eval.ts"
Cohesion: 0.20
Nodes (20): __dirname, DOCS_DIR, EvalResult, __filename, FIXTURES_DIR, generateMarkdownReport(), runEvaluation(), ScenarioFixture (+12 more)

### Community 52 - "DarkSpotSphere.tsx"
Cohesion: 0.40
Nodes (3): G, GAP, gl

### Community 53 - "analysis/types.ts"
Cohesion: 0.28
Nodes (10): ChecklistItem, CoverageMatrixRow, DateKind, ExtractedClaim, FreshnessWarning, MatrixCellStatus, PossibleConflict, PotentialGap (+2 more)

### Community 56 - "react"
Cohesion: 0.15
Nodes (16): EvidenceDrawerMotion(), EvidenceDrawerMotionProps, Button, ButtonProps, buttonVariants, NotFoundBlock(), NotFoundBlockProps, getJobStatus() (+8 more)

### Community 57 - "lucide-react"
Cohesion: 0.27
Nodes (8): BowlIcon(), AnimatedText(), CopyConfirm(), SkillCardProps, SeedCheckMorph(), SeedCheckMorphProps, ChecklistTab(), lucide-react

### Community 58 - "test-phase1-engine.ts"
Cohesion: 0.10
Nodes (27): areValuesEquivalent(), normalizeValueForComparison(), compareTypedValues(), MoneyValue, MONTH_NAMES, normalizeBoolean(), normalizeDate(), normalizeList() (+19 more)

### Community 60 - "verifier.ts"
Cohesion: 0.18
Nodes (10): normalizeWhitespace(), VerificationResult, verifyClaimsVerbatim(), runExtractionTests(), emptyVerifyResult, injectionClaim, injectionVerifyResult, mockSource (+2 more)

### Community 61 - "pipeline.ts"
Cohesion: 0.16
Nodes (9): analysisPipeline, ProgressCallback, AnalysisStage, FullAnalysisReport, JobProgress, FixtureScenarioData, IngestedSource, llmCache (+1 more)

### Community 63 - "Baseline Verification Report (Phase 0)"
Cohesion: 0.22
Nodes (8): 1.1 Entry Points & Architecture, 1.2 Routes & API Endpoints, 1.3 Analysis Pipeline, 1. System Inspection Summary, 2. Baseline Test & Build Results, 3. Initial Baseline Failures & Network Isolation Constraints, 4. Phase 0 Verification Gate Result, Baseline Verification Report (Phase 0)

### Community 64 - "alert.tsx"
Cohesion: 0.42
Nodes (7): Alert1(), Alert1Props, Alert, AlertDescription, AlertTitle, alertVariants, class-variance-authority

### Community 66 - "tabs.tsx"
Cohesion: 0.29
Nodes (6): Tabs, TabsContent, TabsList, TabsTrigger, TabsTriggerProps, @radix-ui/react-tabs

### Community 69 - "activities-card.tsx"
Cohesion: 0.50
Nodes (4): ActivitiesCard(), ActivitiesCardProps, ActivityItem(), ActivityItemType

### Community 70 - "budget-card.tsx"
Cohesion: 0.40
Nodes (3): BreakdownItem, BudgetCardProps, months

## Knowledge Gaps
- **14 isolated node(s):** `@types/cors`, `@types/express`, `@types/node`, `tsx`, `typescript` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 437 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `alert.tsx`, `DashboardLayout.tsx`, `tabs.tsx`, `card-split-accordian.tsx`, `activities-card.tsx`, `budget-card.tsx`, `frontend/package.json`, `DashboardLayout.tsx`, `cn`, `lucide-react`, `CoverageMatrixTable.tsx`, `DarkSpotSphere.tsx`, `react`, `lucide-react`, `App.tsx`, `continuous-tabs.tsx`, `credit-usage-card.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `@types/cors`, `@types/express`, `@types/node` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `card-split-accordian.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._
- **Should `test-attribute-matching.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._
- **Should `GSD-STYLE.md` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `fetcher.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13763440860215054 - nodes in this community are weakly interconnected._
- **Should `Digital Dark Spot 🍉` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._