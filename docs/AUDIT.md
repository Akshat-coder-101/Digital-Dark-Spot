# Digital Dark Spot — System Audit Report (`docs/AUDIT.md`)
> **Audit Date:** 31 October 2026  
> **Verification Gate Status:** 11/11 Checks Passing (`npm run verify`)  
> **Goal:** Comprehensive inventory of required capabilities, existing file paths, and identification of missing items for execution.

---

## 1. Required Components & Features Audit

| Capability / Feature | Status | File Path(s) | Notes |
| :--- | :---: | :--- | :--- |
| **Dotted-Sphere Hero** | **EXISTS** | `frontend/src/components/DotField.tsx`<br>`frontend/src/pages/Home.tsx` | 2D canvas, 2400 Fibonacci sphere dots, cursor proximity spring repulsion, reduced-motion static frame. |
| **Shared-Layout Nav Indicator** | **EXISTS** | `frontend/src/components/layout/Navbar.tsx` | `<motion.div layoutId="navbar-active-indicator" ... transition={{ duration: 0.2, ease: 'easeOut' }} />` |
| **How it Works Pipeline** | **MISSING** | `frontend/src/pages/HowItWorks.tsx` | Existing page has accordion/cards; needs single-screen horizontal process (vertical on mobile) with SVG connecting line that draws once on scroll into view: Question, Sources, Extraction, Comparison, Gaps & conflicts, Verify. |
| **Branded 404** | **MISSING** | `frontend/src/pages/NotFound.tsx` | Currently generic `ErrorOne`; requires exact branded copy *"This slice doesn't exist."*, small seed + crack marks, and *"Back to investigation"* button. |
| **Coverage Map Pop-in Animation** | **EXISTS** | `frontend/src/components/visual/CoverageMap.tsx` | Staggered spring pop-in with `motion.div` (`delay: rowIdx * 0.04`, stiffness 350, damping 24). |
| **Drawer Slide** | **EXISTS** | `frontend/src/components/motion/EvidenceDrawerMotion.tsx`<br>`frontend/src/pages/Dashboard/EvidenceDrawerSubRoute.tsx` | Smooth slide-over from right (`x: 100% -> 0%` in 0.25s, damping 30, stiffness 350). |
| **Checkbox Morph** | **EXISTS** | `frontend/src/components/motion/SeedCheckMorph.tsx`<br>`frontend/src/pages/Dashboard/ChecklistTab.tsx` | Animated SVG morph from black seed mark to verified checkmark in 0.2s. |
| **Reduced-Motion Handling** | **EXISTS** | `frontend/src/main.tsx`<br>`frontend/src/components/DotField.tsx`<br>`frontend/src/components/visual/CoverageMap.tsx` | Global `<MotionConfig reducedMotion="user">`, CSS media query `(prefers-reduced-motion: reduce)` in DotField, `useReducedMotion()` in tabs. |
| **SHOW_AI_STATUS Gating** | **MISSING** | `backend/src/index.ts`<br>`frontend/src/App.tsx`<br>`frontend/src/components/layout/Navbar.tsx` | Default `false` in production. Nav item hidden, route renders 404. However, `/api/llm/status` must return `{ available: false }` or `{ available: true }` instead of 404. |
| **Rate Limits** | **EXISTS** | `backend/src/routes/analyze.ts`<br>`backend/src/routes/discover.ts` | Sliding window rate limiting with HTTP 429 response and `Retry-After` header. |
| **Edge-Case Tests** | **MISSING** | `backend/test/test-edge-cases.ts` | Need dedicated automated suite verifying all 7 explicit edge cases: empty question, 1 failing URL among several, undated page, prompt injection in source, very long page, all keys invalid with sample offer, 1 provider down. |
| **Failover Test** | **MISSING** | `backend/test/test-failover.ts` | Needs isolated mock test with fake providers: deliberately bad first key, rotated to secondary key, cooldown after two invalid JSON responses. |
| **npm run test:llm** | **MISSING** | `backend/test/test-llm.ts`<br>`package.json` | Must run and print clean `OK/FAIL` per provider without needing real API keys configured in environment. |
| **Saved-Snapshots Feature** | **MISSING** | `docs/demo-snapshots/`<br>`frontend/src/pages/Home.tsx` | Needs snapshot reader: checks `docs/demo-snapshots/`; if folder is empty or absent, cleanly hides the feature in the UI and discloses state. |

---

## 2. Plan of Action (Implementing Only What is Missing)

1. **Part B**: Re-skin styling to the `"Black, Cobalt and Acid lime"` semantic token palette across dark and light themes. Add contrast and token-compliance tests.
2. **Part C**: 
   - Overhaul `HowItWorks.tsx` to the single-screen drawing pipeline (Question $\rightarrow$ Sources $\rightarrow$ Extraction $\rightarrow$ Comparison $\rightarrow$ Gaps and conflicts $\rightarrow$ Verify).
   - Rebrand `NotFound.tsx` with `"This slice doesn't exist."`, seed + crack glyphs, and `"Back to investigation"`.
   - Implement real backend stage progress in `Analyzing.tsx`.
3. **Part D**:
   - Align `/api/llm/status` to return `{ available: boolean }`.
   - Create `backend/test/test-edge-cases.ts` (7 edge cases).
   - Create `backend/test/test-failover.ts` (fake providers, bad key, 2 invalid JSON cooldown).
   - Update `backend/test/test-llm.ts` to output `OK/FAIL` per provider in offline zero-key mode.
   - Create `docs/demo-snapshots/` and wire saved snapshots viewer into `Home.tsx` (auto-hiding when empty).
   - Wire checks into `scripts/verify.ts`.
4. **Part E & F**: Execute UI gate, screenshot captures, live smoke check, and acceptance matrix update.
