# Baseline Verification Report (Phase 0)

**Date**: 2026-10-31  
**Repository**: Digital Dark Spot (`deven2`)  
**Commit/Baseline Head**: Clean working baseline

---

## 1. System Inspection Summary

### 1.1 Entry Points & Architecture
- **Root**: Monorepo with npm workspaces `backend/` and `frontend/`.
- **Backend Entry**: `backend/src/index.ts` (Express on port 3001, CORS configured).
- **Frontend Entry**: `frontend/src/main.tsx` + `frontend/src/App.tsx` (Vite + React 18 + React Router v6 + Tailwind CSS v4 + Motion).

### 1.2 Routes & API Endpoints
- `POST /api/discover` & `GET /api/discover/:id`: Multi-angle query formulation and source discovery.
- `POST /api/analyze`, `GET /api/analyze/:id/status`, `GET /api/analyze/report/:id`: 5-stage asynchronous gap detection pipeline.
- `GET /api/sample`: Offline verified ground-truth dataset.
- `POST /api/sources/validate`: SSRF-protected URL verification.

### 1.3 Analysis Pipeline
- **Stage 1 (Fetching/Ingestion)**: `backend/src/ingestion/fetcher.ts` with SSRF guards (`ssrf.ts`) and metadata extraction (`metadata.ts`). Supports in-memory pre-extracted content.
- **Stage 2 (Reading/Extraction)**: `backend/src/analysis/extraction.ts` with verbatim quotation validation (`verifier.ts`).
- **Stage 3 (Comparing/Conflicts & Gaps)**: `backend/src/analysis/conflicts.ts`, `backend/src/analysis/gaps.ts`, and `backend/src/analysis/canonicalization.ts`.
- **Stage 4 (Checking dates/Freshness)**: `backend/src/analysis/freshness.ts`.
- **Stage 5 (Building checklist & matrix)**: `backend/src/analysis/checklist.ts` and `backend/src/analysis/matrix.ts`.

---

## 2. Baseline Test & Build Results

All tests executed with real deterministic fixtures:

| Test Suite | Command | Result | Duration | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Ingestion Suite** | `npm --prefix backend run test:ingestion` | **PASS** | 4s | 9 SSRF guard cases passed, dates detected |
| **Value Normalization** | `npm --prefix backend run test:norm` | **PASS** | 4s | 18/18 value normalization cases passed |
| **Attribute Matching** | `npm --prefix backend run test:attr` | **PASS** | 4s | 12/12 synonym & gap prevention cases passed |
| **Temporal Extraction** | `npm --prefix backend run test:temporal` | **PASS** | 4s | 12/12 date & cycle extraction cases passed |
| **Extraction & Verifier** | `npm --prefix backend run test:extraction` | **PASS** | 4s | Hallucinations discarded, verbatim verified |
| **Analysis Pipeline** | `npm --prefix backend run test:analysis` | **PASS** | 4s | Gaps, conflicts, matrix, checklist verified |
| **Role-Specific Deadlines** | `npx tsx backend/test/test-role-deadlines.ts` | **PASS** | 3s | Student vs institute vs verifier deadlines |
| **Sample Demo Mode** | `npm --prefix backend run test:sample` | **PASS** | 4s | 9 verified claims, 6 gaps, 2 conflicts |
| **Slice / Matrix Agreement** | `npm --prefix backend run test:slice` | **PASS** | 5s | 8/8 matrix rows map to wedge types |
| **Deterministic Eval** | `npm --prefix backend run eval` | **PASS** | 4s | 3/3 evaluation fixtures passed |
| **Secrets Audit** | `npm --prefix backend run check:secrets` | **PASS** | 4s | 0 secret leaks detected across repo |
| **Frontend Build** | `npm --prefix frontend run build` | **PASS** | 6.3s | TypeScript + Vite compiled with 0 errors |

---

## 3. Initial Baseline Failures & Network Isolation Constraints
- **Sandbox Network Isolation**: In sandboxed mode without network access, live calls to remote LLM endpoints (`api.groq.com`, `generativelanguage.googleapis.com`) return `fetch failed`. The LLM test harness (`test-llm.ts`) correctly catches this and exercises fallback/cooldown logic.
- **Topic Independence**: The core engine currently has lingering domain-specific identifiers in string literals (e.g. `scholarship`, `eligibility_income_limit`) which will be fully generalized into dynamic typed attribute representations in Phase 1.

---

## 4. Phase 0 Verification Gate Result
`npm run verify` executed successfully and confirmed all baseline criteria.

