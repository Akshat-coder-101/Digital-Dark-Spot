# Graph Report - deven2  (2026-10-30)

## Corpus Check
- 147 files · ~61,413 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 799 nodes · 1684 edges · 53 communities (43 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3690af34`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DashboardLayout.tsx
- pipeline.ts
- discoveryService.ts
- cn
- src/index.ts
- GSD-STYLE.md
- fetcher.ts
- Digital Dark Spot 🍉
- card-split-accordian.tsx
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
- check-secrets.ts
- credit-usage-card.tsx
- Digital Dark Spot — Product Requirements Document (PRD)
- error-1.tsx
- react
- continuous-tabs.tsx
- lib/types.ts
- Digital Dark Spot — Product Requirements Document (PRD)
- Token Efficiency Rules
- setup_search.sh script
- Open Source Models
- Digital Dark Spot — UI Components Registry
- scripts
- search_repo.sh script
- lucide-react
- App.tsx
- Home.tsx
- Button
- budget-card.tsx
- feedback-action.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 53 edges
2. `cn()` - 50 edges
3. `motion` - 29 edges
4. `SeedIcon()` - 27 edges
5. `lucide-react` - 26 edges
6. `Button` - 23 edges
7. `scripts` - 19 edges
8. `generateSampleReport()` - 18 edges
9. `llmManager` - 18 edges
10. `App()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `SeedCheckMorph()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/SeedCheckMorph.tsx
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `CrackLineDraw()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/CrackLineDraw.tsx
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `EvidenceDrawerMotion()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/EvidenceDrawerMotion.tsx
- `🎬 Reusable Motion Components (`frontend/src/components/motion/`)` --references--> `SeedPopIn()`  [INFERRED]
  COMPONENTS.md → frontend/src/components/motion/SeedPopIn.tsx
- `runEvaluation()` --calls--> `detectTemporalMetadata()`  [EXTRACTED]
  backend/scripts/eval.ts → backend/src/ingestion/metadata.ts

## Import Cycles
- None detected.

## Communities (53 total, 10 thin omitted)

### Community 0 - "DashboardLayout.tsx"
Cohesion: 0.23
Nodes (18): BowlIcon(), CrackIcon(), IconProps, SeedIcon(), VerifiedCheckIcon(), WiltIcon(), SeedCheckMorph(), SeedCheckMorphProps (+10 more)

### Community 1 - "pipeline.ts"
Cohesion: 0.05
Nodes (77): __dirname, DOCS_DIR, EvalResult, __filename, FIXTURES_DIR, generateMarkdownReport(), runEvaluation(), ScenarioFixture (+69 more)

### Community 2 - "discoveryService.ts"
Cohesion: 0.16
Nodes (16): braveAdapter, isOfficialDomain(), tavilyAdapter, discoveryService, SAMPLE_DISCOVERY_RESULTS, searchManager, generateDiverseSearchQueries(), normalizeUrl() (+8 more)

### Community 3 - "cn"
Cohesion: 0.07
Nodes (36): Alert1(), Alert1Props, FloatingInput(), FloatingInputProps, Alert, AlertDescription, AlertTitle, alertVariants (+28 more)

### Community 4 - "src/index.ts"
Cohesion: 0.05
Nodes (45): dependencies, cheerio, cors, dotenv, express, zod, devDependencies, tsx (+37 more)

### Community 5 - "GSD-STYLE.md"
Cohesion: 0.06
Nodes (34): Anti-Patterns to Avoid, Banners, Brevity with Substance, Checkpoint Structure, Commit Conventions, Context Engineering, Core Philosophy, Decision Gates (+26 more)

### Community 6 - "fetcher.ts"
Cohesion: 0.20
Nodes (15): cleanExtractedText(), ingestSources(), processSource(), DetectedTemporalInfo, detectTemporalMetadata(), MONTHS, isPrivateOrLoopbackIP(), validateUrlForSSRF() (+7 more)

### Community 7 - "Digital Dark Spot 🍉"
Cohesion: 0.06
Nodes (29): 1. Prerequisites, 2. Environment Variables, 3. Build & Run Commands, 4. Reverse Proxy Configuration, 5. Health Checks & Verification, Caddy Example, Development, Digital Dark Spot — Deployment & Operations Guide (+21 more)

### Community 8 - "card-split-accordian.tsx"
Cohesion: 0.25
Nodes (8): AccordionApp(), AccordionItem(), AccordionItemData, AccordionItemProps, AccordionProps, DEFAULT_ITEMS, springTransition, react-use-measure

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, check:secrets, dev, eval, start, test:analysis, test:attr (+11 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "package.json"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, backend, build, check:secrets (+8 more)

### Community 13 - "frontend/package.json"
Cohesion: 0.12
Nodes (15): @types/node, typescript, name, private, type, version, clsx, framer-motion (+7 more)

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

### Community 24 - "check-secrets.ts"
Cohesion: 0.18
Nodes (6): BINARY_EXTENSIONS, IGNORED_PATHS, SECRET_PATTERNS, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 25 - "credit-usage-card.tsx"
Cohesion: 0.33
Nodes (4): CreditUsageCardProps, PERIOD_OPTIONS, popoverAnim, UsageHistoryItem

### Community 26 - "Digital Dark Spot — Product Requirements Document (PRD)"
Cohesion: 0.40
Nodes (4): Architecture & System Design, Digital Dark Spot — Product Requirements Document (PRD), Problem Statement, Workflow Pipeline

### Community 27 - "error-1.tsx"
Cohesion: 0.33
Nodes (7): defaultErrorOneAction, ErrorOne(), ErrorOneAction, ErrorOneProps, GradientCode(), PillButton(), NotFound()

### Community 28 - "react"
Cohesion: 0.19
Nodes (12): ActivitiesCard(), ActivitiesCardProps, ActivityItem(), ActivityItemType, AppLayout(), Footer(), Navbar(), SeedPopInProps (+4 more)

### Community 29 - "continuous-tabs.tsx"
Cohesion: 0.40
Nodes (3): ContinuousTabsProps, DEFAULT_TABS, TabItem

### Community 30 - "lib/types.ts"
Cohesion: 0.22
Nodes (8): ChecklistItem, ExtractedClaim, FreshnessWarning, FullAnalysisReport, MatrixCellStatus, PossibleConflict, PotentialGap, ReportContextType

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

### Community 36 - "Digital Dark Spot — UI Components Registry"
Cohesion: 0.50
Nodes (3): Digital Dark Spot — UI Components Registry, 🛡️ Radix & shadcn Primitives (Fallback where no Watermelon component exists), 🍉 Watermelon UI Official Registry Components (10 Installed)

### Community 37 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

### Community 47 - "lucide-react"
Cohesion: 0.16
Nodes (20): 🎬 Reusable Motion Components (`frontend/src/components/motion/`), StatusTag(), StatusTagProps, StatusType, CrackLineDraw(), CrackLineDrawProps, EvidenceDrawerMotion(), EvidenceDrawerMotionProps (+12 more)

### Community 48 - "App.tsx"
Cohesion: 0.20
Nodes (16): Analyzing, App(), ChecklistTab, ConflictsTab, DashboardLayout, Discover, EvidenceDrawerSubRoute, FreshnessTab (+8 more)

### Community 49 - "Home.tsx"
Cohesion: 0.16
Nodes (18): DarkSpotSphere(), G, GAP, gl, AnimatedCheckbox(), RedactedDocumentBackground(), DiscoveredSource, fetchSampleData() (+10 more)

### Community 50 - "Button"
Cohesion: 0.19
Nodes (11): AnimatedText(), CopyConfirm(), SkillCardProps, Button, ButtonProps, buttonVariants, NotFoundBlock(), NotFoundBlockProps (+3 more)

### Community 51 - "budget-card.tsx"
Cohesion: 0.40
Nodes (3): BreakdownItem, BudgetCardProps, months

### Community 52 - "feedback-action.tsx"
Cohesion: 0.50
Nodes (4): AnimatedText(), FeedbackAction(), InlineFeedbackProps, react-icons

## Knowledge Gaps
- **13 isolated node(s):** `@types/cors`, `@types/express`, `@types/node`, `tsx`, `typescript` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 376 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DashboardLayout.tsx`, `cn`, `card-split-accordian.tsx`, `frontend/package.json`, `lucide-react`, `App.tsx`, `Home.tsx`, `Button`, `budget-card.tsx`, `feedback-action.tsx`, `credit-usage-card.tsx`, `error-1.tsx`, `continuous-tabs.tsx`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `@types/cors`, `@types/express`, `@types/node` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pipeline.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05142941349837902 - nodes in this community are weakly interconnected._
- **Why does `@tailwindcss/vite` connect `check-secrets.ts` to `frontend/package.json`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06763285024154589 - nodes in this community are weakly interconnected._
- **Why does `@vitejs/plugin-react` connect `check-secrets.ts` to `frontend/package.json`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05030181086519115 - nodes in this community are weakly interconnected._