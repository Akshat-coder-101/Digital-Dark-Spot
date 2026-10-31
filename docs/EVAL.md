# Digital Dark Spot — Pipeline Accuracy & Deterministic Evaluation Report

**Generated:** 2026-10-31T16:17:56.379Z  
**Environment:** Offline Deterministic Fixture Test Runner (`npm run eval`)  
**Scope:** Core Analysis Engine (Temporal Detection, Verbatim Verification, Synonym Canonicalization, Conflict Matrix, Gap Detection, Checklist Prioritization)

## 1. Executive Summary

Digital Dark Spot utilizes a multi-layered verification and canonicalization engine to evaluate unstructured public information. This evaluation suite executes the complete pipeline over ground-truth reference scenarios without network calls, verifying that:
1. Contradictions between official guidelines and outdated third-party sources are detected without hallucination.
2. Synonym attributes (e.g. `deadline` vs `last_date`, `Rs 6 lakh` vs `INR 6,00,000`) are normalized accurately to prevent false gaps.
3. Unaddressed parameters (e.g. missing disbursement timelines) are correctly highlighted as high-priority Total Gaps.
4. Outdated cycles (e.g. `session 2024-25`) generate visible Freshness Warnings.

## 2. Benchmark Scenario Matrix

| Scenario | Scenario Name | Sources | Claims | Total Gaps | Conflicts | Stale Warnings | Verification Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `scenario-1` | **State Merit Scholarship with Conflicting Income and Stale Cycle** | 2 | 6 | 0 | 2 | 1 | **PASSED** (8ms) |
| `scenario-2` | **Clean Energy Scheme with Missing Critical Disbursement Attribute** | 2 | 5 | 1 | 0 | 0 | **PASSED** (1ms) |
| `scenario-3` | **Global Fellowship with Full Consensus and Complete Coverage** | 2 | 8 | 0 | 0 | 0 | **PASSED** (2ms) |

## 3. Scenario Profiles

### Scenario 1: State Merit Scholarship (`scenario-1`)
- **Challenge:** Two sources report conflicting income limits (`Rs 6,00,000` in official 2026-27 notice vs `Rs 2,50,000` in an older 2024 blog).
- **Engine Performance:** Successfully surfaced the numerical discrepancy as a high-priority conflict with original quotes preserved. Flagged the 2024 blog as a stale cycle (`2024-25`).

### Scenario 2: Clean Energy Startup Subsidy (`scenario-2`)
- **Challenge:** Both the Ministry and Industry reports agree on subsidy amount (`Rs 25,00,000` / `Rs 25 lakh`), but neither addresses the disbursement timeline.
- **Engine Performance:** Equivalence engine merged `Rs 25 lakh` with `Rs 25,00,000` to produce zero false conflicts. Correctly identified `disbursement_timeline` as an unaddressed **Total Gap** with a suggested targeted inquiry.

### Scenario 3: Global AI Fellowship (`scenario-3`)
- **Challenge:** Two independent institutional sources describe the same fellowship using varied terminology (`stipend` vs `award amount`, `$ 50000` vs `$50,000`, and reordered document lists).
- **Engine Performance:** Canonical synonym mapping and value equivalence reconciled all attributes. Zero false conflicts and zero false gaps reported.

## 4. How to Reproduce

Run the evaluation suite locally anytime:
```bash
npm run eval
```
This command runs instantly and requires zero API keys or external network connections.
