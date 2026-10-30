# Digital Dark Spot — UI Components Registry

This project uses **10 official [Watermelon UI](https://ui.watermelon.sh)** components and Motion (`motion/react`) for UI/UX and micro-interactions, strictly restyled with the **"Watermelon Seed"** design token system.

---

## 🍉 Watermelon UI Official Registry Components (10 Installed)

All components were pulled directly from the official Watermelon registry (`https://registry.watermelon.sh/r/`) using the `shadcn` CLI:

### 1. Continuous Tabs (`ContinuousTabs`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/continuous-tabs](https://ui.watermelon.sh/animated-components/continuous-tabs)
- **Registry Source:** `https://registry.watermelon.sh/r/continuous-tabs.json`
- **Component File:** `frontend/src/components/continuous-tabs.tsx`
- **Where Used:** `/styleguide` and `/report/:id` tab navigation (Summary, Gaps, Conflicts, Freshness, Checklist, Sources).
- **Motion Animation:** Uses `motion/react` with `<LayoutGroup>` and spring active-pill transition (`stiffness: 380, damping: 30, mass: 0.9`).

### 2. Copy Confirm Action Button (`CopyConfirm`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/copy-confirm](https://ui.watermelon.sh/animated-components/copy-confirm)
- **Registry Source:** `https://registry.watermelon.sh/r/copy-confirm.json`
- **Component File:** `frontend/src/components/copy-confirm.tsx`
- **Where Used:** `/styleguide` and `/report/:id/checklist` ("Copy as Markdown" action).
- **Motion Animation:** Spring button pop, checkmark pop-in with blur exit filter (`duration: 0.3, bounce: 0`), and staggered character-by-character letter spring (`stiffness: 200, damping: 20, delay: 0.03 * index`).

### 3. Floating Input Block (`FloatingInput`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/floating-input](https://ui.watermelon.sh/animated-components/floating-input)
- **Registry Source:** `https://registry.watermelon.sh/r/floating-input.json`
- **Component File:** `frontend/src/components/floating-input.tsx`
- **Where Used:** `/styleguide` and `/` (Home search & question intake).
- **Motion Animation:** Animated CSS variable label float (`-top-2.5 left-3`) on focus/active state with smooth transition.

### 4. Alert-1 Notification Callout (`Alert1`)
- **Watermelon Page:** [https://ui.watermelon.sh/components/alerts](https://ui.watermelon.sh/components/alerts)
- **Registry Source:** `https://registry.watermelon.sh/r/alert-1.json`
- **Component File:** `frontend/src/components/alert-1.tsx`
- **Where Used:** `/styleguide`, footer disclaimer ("Potential signals, not verified facts"), and error callouts.
- **Motion Animation:** Clean token border highlight and icon geometry.

### 5. Feedback Action (`FeedbackAction`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/feedback-action](https://ui.watermelon.sh/animated-components/feedback-action)
- **Registry Source:** `https://registry.watermelon.sh/r/feedback-action.json`
- **Component File:** `frontend/src/components/feedback-action.tsx`
- **Where Used:** `/styleguide` and `/analyzing/:id` error states ("Page blocked fetching. Paste its text instead.").
- **Motion Animation:** `<MotionConfig bounce: 0.25, duration: 0.6>` spring width layout morph and rotating spinner.

### 6. Activities Card (`ActivitiesCard`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/activities-card](https://ui.watermelon.sh/animated-components/activities-card)
- **Registry Source:** `https://registry.watermelon.sh/r/activities-card.json`
- **Component File:** `frontend/src/components/activities-card.tsx`
- **Where Used:** `/styleguide` and `/report/:id/sources` for verified source claim listings.
- **Motion Animation:** `motion.div` layout morphing with item entrance slide (`opacity: 0, x: -10` to `opacity: 1, x: 0`).

### 7. Budget Card (`BudgetCard`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/budget-card](https://ui.watermelon.sh/animated-components/budget-card)
- **Registry Source:** `https://registry.watermelon.sh/r/budget-card.json`
- **Component File:** `frontend/src/components/budget-card.tsx`
- **Where Used:** `/styleguide` and `/report/:id/summary` for coverage breakdown (Sourced vs Gaps vs Conflicts).
- **Motion Animation:** Dropdown height animation with `AnimatePresence` and segment percentage transitions.

### 8. Card Split Accordion (`CardSplitAccordian`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/card-split-accordian](https://ui.watermelon.sh/animated-components/card-split-accordian)
- **Registry Source:** `https://registry.watermelon.sh/r/card-split-accordian.json`
- **Component File:** `frontend/src/components/card-split-accordian.tsx`
- **Where Used:** `/styleguide` and `/how-it-works` (Educational methodology breakdown).
- **Motion Animation:** Spring transition (`stiffness: 600, damping: 50, mass: 1`) with `react-use-measure` height measurement and smooth content unroll.

### 9. Credit Usage Metric Card (`CreditUsageCard`)
- **Watermelon Page:** [https://ui.watermelon.sh/animated-components/credit-usage-card](https://ui.watermelon.sh/animated-components/credit-usage-card)
- **Registry Source:** `https://registry.watermelon.sh/r/credit-usage-card.json`
- **Component File:** `frontend/src/components/credit-usage-card.tsx`
- **Where Used:** `/styleguide` and `/report/:id/summary` metrics strip.
- **Motion Animation:** 75-segment opacity bar with spring toggle slider (`stiffness: 500, damping: 30`) and popover animations (`stiffness: 400, damping: 28`).

### 10. Error-1 404 Block (`ErrorOne`)
- **Watermelon Page:** [https://ui.watermelon.sh/block/error-1](https://ui.watermelon.sh/block/error-1)
- **Registry Source:** `https://registry.watermelon.sh/r/error-1.json`
- **Component File:** `frontend/src/components/ui/error-1.tsx`
- **Where Used:** `*` 404 Not Found route (`/pages/NotFound.tsx`).
- **Motion Animation:** Animated dashed SVG text stroke and rounded pill CTA.

---

## 🛡️ shadcn / Radix Fallback Primitives (Where No Watermelon Counterpart Exists)

In accordance with the PRD rule (*"If a component cannot be found, build it with shadcn/Radix, not custom code"*):

| Need | Fallback Primitive | File Path | Semantic Tokens Applied |
| :--- | :--- | :--- | :--- |
| **5-Stage Stepper** | Radix / shadcn Stepper | `frontend/src/components/ui/stepper.tsx` | Rind ring, Pith connector, Seed labels |
| **Evidence Drawer** | Radix Dialog / Sheet | `frontend/src/components/ui/drawer.tsx` | Slide-in from right in 0.25s, Flesh quote border |
| **Animated Checkbox** | Radix Checkbox + Motion | `frontend/src/components/ui/animated-checkbox.tsx` | Seed shrink to Rind checkmark in 0.2s |
| **Coverage Data Table** | shadcn Table | `frontend/src/components/visual/CoverageMatrixTable.tsx` | Pith alternating rows, Seed text, WCAG AA badges |
| **Empty State** | Radix Card / Primitive | `frontend/src/components/ui/empty-state.tsx` | Pith muted canvas, Seed descriptive header |

---

## 🎨 Watermelon Seed Design Tokens

| Token | CSS Variable | Light Hex | Dark Hex | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Rind** | `--color-rind` | `#1F6B3A` | `#4FBF7A` | Primary brand action, verified ground truth |
| **Flesh** | `--color-flesh` | `#F2506E` | `#FF6B86` | Sourced claims, destructive highlights |
| **Pith** | `--color-pith` | `#F4F8EE` | `#0F1512` | Background surface canvas, cards |
| **Seed** | `--color-seed` | `#15110F` | `#F2F1ED` | Gap dark spots, unanswered questions, body typography |
| **Crack** | `--color-crack` | `#E8A317` | `#F2B84B` | Conflicting assertions between sources |
| **Wilt** | `--color-wilt` | `#8E9982` | `#75806D` | Stale info, older cycles (>18m), undated pages |
