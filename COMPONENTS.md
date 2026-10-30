# Digital Dark Spot — UI Components Registry

This registry tracks all **10 Watermelon UI** (`ui.watermelon.sh`) components, Motion reusable components (`frontend/src/components/motion/`), and Radix/shadcn fallback primitives, strictly styled according to [`docs/DESIGN.md`](file:///c:/Users/LENOVO/OneDrive/Desktop/deven2/docs/DESIGN.md).

---

## 🍉 Watermelon UI Official Registry Components (10 Installed)

All 10 components were installed directly from the official registry (`https://registry.watermelon.sh/r/`) via the `shadcn` CLI:

| Component Name | Source Page URL | File Path | Route Where Used / Wired | Motion Animation |
| :--- | :--- | :--- | :--- | :--- |
| **Continuous Tabs** | [ui.watermelon.sh/animated-components/continuous-tabs](https://ui.watermelon.sh/animated-components/continuous-tabs) | `frontend/src/components/continuous-tabs.tsx` | `/report/:id` (Dashboard Tab Bar) | `<LayoutGroup>` spring active-pill transition (`stiffness: 380, damping: 30, mass: 0.9`). |
| **Copy Confirm Button** | [ui.watermelon.sh/animated-components/copy-confirm](https://ui.watermelon.sh/animated-components/copy-confirm) | `frontend/src/components/copy-confirm.tsx` | `/report/:id/checklist` ("Copy as Markdown" CTA) | Spring button pop, checkmark filter exit (`duration: 0.3`), and character-staggered letter spring. |
| **Floating Input Block** | [ui.watermelon.sh/animated-components/floating-input](https://ui.watermelon.sh/animated-components/floating-input) | `frontend/src/components/floating-input.tsx` | `/` (Home Question Input) & `/discover/:id` | Smooth label float on focus with hairline bottom border transition. |
| **Alert-1 Notification** | [ui.watermelon.sh/components/alerts](https://ui.watermelon.sh/components/alerts) | `frontend/src/components/alert-1.tsx` | `/report/:id/conflicts` & App Layout Footer | Token callout banner with status icon geometry. |
| **Feedback Action** | [ui.watermelon.sh/animated-components/feedback-action](https://ui.watermelon.sh/animated-components/feedback-action) | `frontend/src/components/feedback-action.tsx` | `/analyzing/:id` (Failed Source Retry) | `<MotionConfig bounce: 0.25, duration: 0.6>` spring width morph and retry spinner. |
| **Activities Card** | [ui.watermelon.sh/animated-components/activities-card](https://ui.watermelon.sh/animated-components/activities-card) | `frontend/src/components/activities-card.tsx` | `/report/:id/sources` (Claim Breakdown) | `motion.div` layout morphing with item entrance slide (`opacity: 0, x: -10` to `opacity: 1, x: 0`). |
| **Budget Card** | [ui.watermelon.sh/animated-components/budget-card](https://ui.watermelon.sh/animated-components/budget-card) | `frontend/src/components/budget-card.tsx` | `/report/:id/summary` (Coverage Ratio) | Dropdown height animation with `AnimatePresence` and segment percentage transitions. |
| **Card Split Accordion** | [ui.watermelon.sh/animated-components/card-split-accordian](https://ui.watermelon.sh/animated-components/card-split-accordian) | `frontend/src/components/card-split-accordian.tsx` | `/how-it-works` (Forensic Walkthrough) | Spring transition (`stiffness: 600, damping: 50`) with `react-use-measure` height measurement. |
| **Credit Usage Card** | [ui.watermelon.sh/animated-components/credit-usage-card](https://ui.watermelon.sh/animated-components/credit-usage-card) | `frontend/src/components/credit-usage-card.tsx` | `/report/:id/summary` (Source Coverage Gauge)| 75-segment progress bar with spring toggle slider (`stiffness: 500, damping: 30`). |
| **Error-1 404 Block** | [ui.watermelon.sh/block/error-1](https://ui.watermelon.sh/block/error-1) | `frontend/src/components/ui/error-1.tsx` | `*` (404 Not Found Screen) | Animated dashed SVG text stroke with pill action CTA. |

---

## 🎬 Reusable Motion Components (`frontend/src/components/motion/`)

Extracted from the styleguide into modular, standalone motion components:

| Component | File Path | Route Where Used / Wired | Motion Specification |
| :--- | :--- | :--- | :--- |
| **`SeedPopIn`** | `frontend/src/components/motion/SeedPopIn.tsx` | `/report/:id` (Hero Slice View) | Staggered spring entrance (`delay: i * 0.04s`, scale `[0, 1.25, 1]`, `stiffness: 400, damping: 18`). |
| **`CrackLineDraw`** | `frontend/src/components/motion/CrackLineDraw.tsx` | `/report/:id/conflicts` (Card Divider) | SVG fracture pathLength animation (`pathLength: 0 → 1` in `0.5s easeInOut`). |
| **`EvidenceDrawerMotion`**| `frontend/src/components/motion/EvidenceDrawerMotion.tsx` | `/report/:id/evidence/:claimId` | Slide-over from right (`x: 100% → 0%` in `0.25s`, `damping: 30, stiffness: 350`). |
| **`SeedCheckMorph`** | `frontend/src/components/motion/SeedCheckMorph.tsx` | `/report/:id/checklist` | Interactive morph from black gap seed to verified checkmark (`0.2s`, `scale: [1, 0.4, 1]`). |

---

## 🛡️ Radix & shadcn Primitives (Fallback where no Watermelon component exists)

| Need | Fallback Component | File Path | Route Where Used |
| :--- | :--- | :--- | :--- |
| **5-Stage Stepper** | Radix / shadcn Stepper | `frontend/src/components/ui/stepper.tsx` | `/analyzing/:id` |
| **Evidence Drawer Dialog**| Radix Dialog / Sheet | `frontend/src/components/ui/drawer.tsx` | `/report/:id/evidence/:claimId` |
| **Animated Checkbox** | Radix Checkbox + Motion | `frontend/src/components/ui/animated-checkbox.tsx` | `/discover/:id` & `/report/:id/checklist` |
| **Coverage Data Table** | shadcn Table | `frontend/src/components/visual/CoverageMatrixTable.tsx` | `/report/:id` (Matrix View) |
| **Empty State** | Radix Primitive Card | `frontend/src/components/ui/empty-state.tsx` | Dashboard tabs when zero items found |
