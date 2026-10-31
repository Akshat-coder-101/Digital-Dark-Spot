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
