# Architectural Decisions Log (Digital Dark Spot)

## Decision 1: Monorepo Verification Harness (`scripts/verify.ts`)
- **Context**: The hackathon workflow requires automated end-to-end verification across both backend services and frontend bundles.
- **Decision**: Created `scripts/verify.ts` executable via `npm run verify` at the project root. It coordinates backend unit tests, deterministic evaluations, secrets audits, frontend builds, and phase-specific gates (ban-list scan, fixture validator, route tests), printing a concise Markdown/ASCII table and exiting non-zero upon any failure.

## Decision 2: In-Memory Pre-Extracted Content Ingestion
- **Context**: External websites, government circulars, and institutional domains often restrict automated bots with HTTP 403, Cloudflare challenges, or SSRF protection.
- **Decision**: Extended `SourceInput` to accept optional `rawContent`. When available (from user paste, cached discovery snippets, or verified sample datasets), the ingestion pipeline bypasses redundant network requests while preserving security guards and text cleaning.

## Decision 3: Deterministic Test Mocks (Rule 4 Compliance)
- **Context**: Network calls to external AI providers (Groq/Gemini) can be non-deterministic, rate-limited, or blocked by sandbox boundaries during automated verification.
- **Decision**: All automated unit and regression tests run against deterministic mock fixtures and pre-computed extractions. Real LLM calls are reserved strictly for manual live smoke testing.


## Decision 4: Topic-Independent Typed Normalization & Qualifier Separation
- **Context**: The engine must be topic-independent and must not use hardcoded domain synonym tables or hardcoded scholarship concepts.
- **Decision**: Implemented `backend/src/analysis/normalization.ts` providing deterministic typed normalizers (number, money with multi-currency and Indian numbering, percent, date, list, boolean, url) and `compareTypedValues`. Materially different typed values create a `Sourced` conflict, while differing text expressions produce an `Uncertain` ("different wording, review") signal. Strict qualifier separation guarantees distinct applicant roles (e.g., student submission vs institute verification) never falsely conflict.

## Decision 5: Automated Domain Vocabulary Ban-List Scanner
- **Context**: Banned domain vocabulary (`scholarship`, `eligibility`, `renewal`, `marksheet`, `income limit`, `award amount`, `subsidy`, `laptop`, `NSP`) is strictly prohibited in engine code and UI string literals, permitted only in test fixtures and sample scenarios.
- **Decision**: Created `scripts/ban-list-scan.ts` running as an automated verification check against 97+ non-fixture source files across both `backend/src` and `frontend/src`.

## Decision 6: Hardened Discovery Service & Second-Pass Targeted Probe
- **Context**: The discovery pipeline must handle arbitrary topics without fabricating fake URLs, domains, or government notices when search keys are unavailable, and must support targeted secondary passes for critical gaps.
- **Decision**: Added `backend/test/test-discovery-phase2.ts` validating topic-tailored search formulation across diverse industries (e.g., Clean Hydrogen, Drone Regulations), authoritative institutional domain weighting, duplicate removal, no-search fallback messaging, and second-pass gap probing with updated gap titles without crashing when search API keys are absent.

## Decision 7: Multi-Scenario Fictional Fixtures & Validation Protocol
- **Context**: Offline exploration must demonstrate that the gap and conflict detection engine is domain-independent across varied sectors (Education, Clean Energy, Hardware Benchmarks). All sample sources must use `.example` domains and avoid deceptive naming or `.fictional` TLDs.
- **Decision**: Created `fixtures/scenario-a-aurora`, `fixtures/scenario-b-solarbridge`, and `fixtures/scenario-c-nimbus-air` containing `scenario.json` and `expected.json`. Created `scripts/validate-fixtures.ts` to assert that every claim is an exact verbatim quote, all domains use `.example`, and deterministic analysis produces expected conflicts and gaps. Added a three-scenario switcher on the Home intake screen.
