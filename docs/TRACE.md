# Digital Dark Spot — Pipeline Trace & Root Cause Analysis (Phase 0)

## 1. Parameter Explosion (Reaching 58 Parameters)
- **Source Code**: [`backend/src/analysis/extraction.ts:283-298`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/backend/src/analysis/extraction.ts#L283-L298)
- **Mechanism**:
  During multi-chunk extraction across sources, the LLM is prompted with free-form attribute names without schema bounds. Across 8 sources (and ~16 chunks), each chunk invents specific or redundant attribute names.
  At lines 283-298, the pipeline gathers all extracted claim attributes into `discoveredClusters` and merges them directly into `mergedExpected`:
  ```ts
  const mergedExpected = [...questionNeeds];
  for (const cluster of discoveredClusters) {
    const alreadyMatches = mergedExpected.some(need => areAttributesMatching(cluster, need));
    if (!alreadyMatches) {
      mergedExpected.push(cluster);
    }
  }
  ```
  Because `areAttributesMatching` ([`canonicalization.ts:16-40`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/backend/src/analysis/canonicalization.ts#L16-L40)) only matches identical strings or a small set of token overlaps, distinct synonyms and variations are not unified. Thus, 58 distinct parameters were accumulated and returned as the report's `coverageMatrix`.

### The 58 Parameters Grouped by Semantic Near-Duplicates:
1. **Academic & Age Criteria**:
   - `age_limitations`, `age_eligibility`
   - `academic_eligibility_criteria`, `scheme_eligibility_rules`, `requirements_and_criteria`
2. **Courses & Approvals**:
   - `course_eligibility`, `ineligible_courses`, `excluded_courses_and_fields`, `institutional_and_course_approvals`
3. **Deadlines & Timelines**:
   - `dates_and_deadlines`, `application_deadlines`, `student_application_deadline`, `institutional_verification_deadline`, `verification_deadlines`, `acceptance_deadlines`, `university_decision_timeline`
4. **Registration & Portals**:
   - `mandatory_registration_steps`, `registration_requirements`, `registration_process`, `otr_requirements`, `otr_specifications`, `official_source_and_documentation`
5. **Aadhaar, Banking & Verification**:
   - `aadhaar_and_biometric_status`, `aadhaar_and_banking_requirements`, `bank_account_seeding`, `software_validation_rules`
6. **Financials, Fees & Allowances**:
   - `costs_and_fees`, `service_fees`, `student_borne_costs`, `scholarship_value_and_benefits`, `scheme_specific_benefits`
7. **Income Thresholds**:
   - `income_eligibility_thresholds`, `income_eligibility_criteria`
8. **Documentation**:
   - `documentation_requirements`, `mandatory_documentation`, `mandatory_documentation_and_registration`
9. **Health & Medical**:
   - `medical_insurance_mandate`, `health_and_intent_requirements`, `medical_requirements`
10. **Institutional Rules & Selection**:
    - `institutional_selection_rules`, `institutional_verification_process`, `selection_and_merit_mechanisms`
11. **Combination Limits & Restrictions**:
    - `scheme_combination_limits`, `multiple_scholarship_rules`, `merit_scholarship_limit`, `welfare_scholarship_limit`, `state_specific_restrictions`, `regional_restrictions`, `domicile_and_regional_requirements`
12. **Lifecycle & Administration**:
    - `disbursement_method`, `disbursement_and_verification_stages`, `renewal_conditions`, `application_correction_process`, `disability_verification_rules`, `disability_documentation_standards`, `limitations_and_exceptions`, `key_facts_and_specifications`, `scholarship_overview`

---

## 2. Gap Inflation (41 Gaps of 58)
- **Source Code**: [`backend/src/analysis/gaps.ts:18-54`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/backend/src/analysis/gaps.ts#L18-L54)
- **Mechanism**:
  Line 38-53 flags any parameter covered by only 1 source as a `thin_coverage` gap (`Potential gap: X covered by single source only`).
  Because 58 granular parameters were created from disparate sources, 41 of them only appeared in a single source. Treating peripheral details from a single source as an information gap resulted in 41 gaps. Under parameter discipline, only essential question-derived **needs** with zero verified claims should be counted as potential gaps.

---

## 3. Checklist Inflation (48 Items)
- **Source Code**: [`backend/src/analysis/checklist.ts:50-130`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/backend/src/analysis/checklist.ts#L50-L130)
- **Mechanism**:
  The checklist generator naively aggregated every gap (41 items), every conflict (5 items), and every freshness warning (2 items) without capping, clustering, or prioritization: $41 + 5 + 2 = 48$ checklist items.

---

## 4. Summary Generation & Grounding
- **Source Code**: [`backend/src/analysis/extraction.ts:149-151, 195, 243`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/backend/src/analysis/extraction.ts#L149-L151) and [`frontend/src/pages/Dashboard/SummaryTab.tsx:212-214`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/frontend/src/pages/Dashboard/SummaryTab.tsx#L212-L214)
- **Mechanism**:
  The summary text was generated as a free-form string by the LLM without linking to verified claim IDs or timestamps. As a result, the summary hallucinated a past deadline ("June 22, 2025") and outdated 2025-26 cycle conditions as active and current facts on October 31, 2026.

---

## 5. Misleading UI Labels ("reviewed primary documents" & "Verbatim Quotes")
- **Source Code**:
  - [`frontend/src/pages/Dashboard/SummaryTab.tsx:205`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/frontend/src/pages/Dashboard/SummaryTab.tsx#L205): Hardcoded text `"Synthesized across {report.metrics.sourcesCount} reviewed primary documents"` regardless of source credibility.
  - [`frontend/src/pages/Dashboard/SummaryTab.tsx:226`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/frontend/src/pages/Dashboard/SummaryTab.tsx#L226): Hardcoded text `"{report.claims.length} Verbatim Quotes"` displaying raw claim rows instead of grouped claims across canonical topics.
  - [`frontend/src/pages/Dashboard/DashboardLayout.tsx:583-605`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/frontend/src/pages/Dashboard/DashboardLayout.tsx#L583-L605): `isMapCollapsed` state initialized to `true`, forcing the Coverage Map to be collapsed by default.

---

## 6. Outdated Count Under-reporting (Only 2 Outdated)
- **Source Code**: [`backend/src/analysis/freshness.ts:50-80`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/backend/src/analysis/freshness.ts#L50-L80)
- **Mechanism**:
  Only 2 explicit claims contained attributes matching `/deadline|closing/` with dates before today (e.g. 22 June 2025). The remaining sources discussed the previous 2025-26 cycle while the user's current date is October 31, 2026 (2026-27 academic session). Because the pipeline lacked question cycle extraction and cross-cycle comparison, historical cycle claims were marked as fresh.

