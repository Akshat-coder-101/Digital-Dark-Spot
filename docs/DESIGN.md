# Digital Dark Spot — Design System Specification
> **Single Source of Design Truth**  
> *Theme: Editorial Intelligence × Forensic Research*  
> *Inspiration: Perplexity × Linear × Editorial Magazine*

---

## 1. Core Philosophy & Visual Direction

Digital Dark Spot is an **investigation instrument** (Question → Sources → Compare → Detect Gaps → Inspect Evidence → Verify), not an AI landing page or marketing showpiece.

The "Watermelon Seed" metaphor is a **semantic signal system and subtle geometry**, never a cartoonish theme splashed across the screen.

### 🚫 Explicit Anti-Patterns (What We Removed)
- **NO** full-page dark green backgrounds or giant saturated green cards.
- **NO** oversized marketing heroes with flashy floating badges or marketing taglines.
- **NO** heavy pill/bubble containers or rounded-3xl borders on standard layouts.
- **NO** thick bordered cards wrapped redundantly around every section.
- **NO** decorative radial gradients, glows, blur backdrops, or heavy drop shadows.

### ✅ Editorial Layout Principles
- **Generous Whitespace & Asymmetry:** Clear breathing room, left-aligned typography, restrained hierarchy.
- **Max Content Width:** Constrained to approximately `1100px` (`max-w-[1100px] mx-auto`) for optimal readability.
- **Hairline Dividers:** 1px borders in a low-contrast seed tint (`border-seed/10`) instead of heavy boxed cards.
- **Restrained Elevation:** Cards are reserved strictly for evidence items, highlighted quote excerpts, and the slide-over drawer.
- **Numbered Markers:** Used only for real sequential processes (e.g. the 4 investigation steps, the 5 backend analysis stages).

---

## 2. Semantic Token System

Tokens adapt between Light Mode (default) and Dark Mode while preserving their forensic meaning:

| Token Name | Light Hex | Dark Hex | Role & Constraint |
| :--- | :--- | :--- | :--- |
| **Pith** (Background) | `#F4F8EE` | `#0F1512` | Clean, airy editorial canvas; paper feel. |
| **Seed** (Text & Ink) | `#15110F` | `#F2F1ED` | High-contrast editorial ink; black seed icon for unmentioned dark spots. |
| **Rind** (Primary / Verified) | `#1F6B3A` | `#4FBF7A` | Used sparingly: primary action CTA, verified coverage wedge/dot, text link. |
| **Flesh** (AI-Suggested) | `#F2506E` | `#FF6B86` | Strictly for AI signals; never small text on pith; fills/borders/dots with seed text. |
| **Crack** (Conflict) | `#E8A317` | `#F2B84B` | Cross-source contradictions, fracture lines, warning badges. |
| **Wilt** (Stale) | `#B9C2AE` | `#75806D` | Temporal staleness (>18 months), earlier cycles, undated documents. |

### Color Usage & Contrast Rules:
- **Rind Sparingly:** Do not paint buttons and cards all green. Keep rind for the main CTA button and positive verified markers.
- **WCAG AA Compliance:** Flesh (`#F2506E`), Crack (`#E8A317`), and Wilt (`#B9C2AE`) must **never** be used as standalone body text on pith. Always use them as fills, borders, dots, or icons accompanied by dark seed text (`#15110F`).
- **Never Color Alone:** Every finding status must present an **explicit text label + icon shape** (e.g. `[● Sourced]`, `[▲ AI-suggested]`, `[◆ Potential gap]`, `[⚡ Possible conflict]`, `[⏱ Potentially stale]`).

---

## 3. Typography & Hierarchy

- **Heading Font:** **Bricolage Grotesque** (`font-heading`) — large, tight letter-spacing (`tracking-tight`), left-aligned, authoritative editorial presence.
- **Body Font:** **DM Sans** (`font-sans`) — readable, neutral, clear line-height.
- **Line Length:** Kept under 75 characters (`max-w-2xl` or `max-w-prose`) to avoid eye fatigue.
- **Uppercase Labels:** Small labels (`text-[10px]` or `text-xs font-mono font-semibold tracking-wider uppercase`) only where they carry semantic information (e.g. stage labels, attribute keys, status counters). Never use uppercase for full headlines or body sentences.

---

## 4. Spacing, Borders & Radius

- **Borders:** 1px hairlines using `border-seed/10` (light) or `border-seed/15` (dark).
- **Corner Radius:** Small and consistent: `rounded-sm` (2px) to `rounded-md` (4–6px). Avoid bubbly `rounded-3xl`.
- **Shadows:** Minimal to none (`shadow-none` or `shadow-xs`). Real shadows are only used on the slide-over Evidence Drawer (`shadow-xl`) to lift paper layers.

---

## 5. Motion Rules (motion/react)

- **Global Constraint:** App is wrapped in `<MotionConfig reducedMotion="user">`. Always respect user prefers-reduced-motion preferences.
- **Hardware-Accelerated Properties Only:** Animate `transform` and `opacity` exclusively. Never animate layout dimensions (`width`, `height`, `margin`) directly.
- **Targeted Micro-Interactions:**
  - **Seed Pop-In:** Report data arrival triggers staggered spring entrance (`staggerChildren: 0.04s`, scale `[0, 1.25, 1]`, duration 0.3s, spring `stiffness: 400, damping: 18`).
  - **Crack Draw:** Jagged conflict lines draw from `pathLength: 0` to `pathLength: 1` in `0.5s` (`easeInOut`).
  - **Evidence Drawer Slide:** Enters from the right edge (`x: '100%'` to `x: 0`) in `0.25s` (`damping: 30, stiffness: 350`).
  - **Checklist Morph:** Seed shrinks to checkmark on completion in `0.2s` (`scale: [1, 0.4, 1]`).
  - **Timeline Transitions:** Forensic pipeline stage status updates fade smoothly in `0.2s`.
- **Restraint:** No scroll-triggered entrance fades on every paragraph. No hovering spring bounces on every card.

---

## 6. Layout Guide for Specific Routes

1. **Home (`/`):**
   - Slim header: wordmark `"Digital Dark Spot"`, small seed mark, nav (`Investigate`, `How it works`, `AI status`), theme toggle. No beta badge, no marketing tagline.
   - Left-aligned medium hero: Heading `"Find what the sources don't tell you."` + 2-line description.
   - 3-step investigation column:
     - **Step 1 (Ask):** Borderless textarea with bottom hairline, placeholder `"What are you trying to verify?"`, character count.
     - **Step 2 (Bring evidence):** Compact action chips (`+ URL`, `Paste text`, `Use sample scholarship data`); attached sources appear as small removable chips with domain and status dot.
     - **Step 3 (Slice it open):** Single authoritative rind button.
   - Lower section: 4 numbered hairline-separated columns (`01 Read`, `02 Compare`, `03 Expose`, `04 Verify`).
   - Subtle background: One thin, low-opacity line-art half-melon SVG accent, not a heavy hero graphic.

2. **Discover (`/discover/:id`):**
   - Forensic list of discovered sources with institutional badges (`.gov`, `.nic.in`, `.edu`), date status, and checkboxes.
   - Clear disclosure: *"Search results are not a complete view of the web."*

3. **Analyzing (`/analyzing/:id`):**
   - Clean vertical forensic timeline of real backend stages (`Searching`, `Fetching`, `Reading`, `Comparing`, `Checking dates`, `Building checklist`).
   - Per-source status chips, session ID, calm state transitions.

4. **Report (`/report/:id`):**
   - Signature investigation brief.
   - Header: `"Research report"`, research question, date, session ID, `"Analyzed with: <provider>"` or `"Sample data"`.
   - Signal strip: 4 hairline-divided metric counters (Sources, Potential gaps, Possible conflicts, Stale/undated).
   - Two-column visual inspection: Left Half-Melon Slice View line-art; Right Accessible Coverage Matrix table (Attributes × Sources).
   - Underlined tab bar (Summary, Gaps, Conflicts, Freshness, Checklist, Sources).
   - Annotated findings with left border rules; Markdown exportable checklist.
   - Persistent footer: *"Potential signals, not verified facts."*

5. **Evidence Drawer (`/report/:id/evidence/:claimId`):**
   - Right slide-over (440px) with clean paper texture feel.
   - Order: Status badge, finding statement, highlighted verbatim quote with left border rule, source title & domain, date status, *"Open original source"* button.

---

## 7. Component Review Checklist

Before creating or editing any UI component:
- [ ] Does it read `docs/DESIGN.md` for styling constraints?
- [ ] Is it free of heavy dark green card backgrounds, glows, and bubbly radii?
- [ ] Does it use hairlines (`border-seed/10`) and small radius (`rounded-md` / 4–6px)?
- [ ] Does every status tag include both text and icon geometry?
- [ ] Does all text meet WCAG AA contrast against pith (`#F4F8EE`)?
- [ ] Are animations restricted to `transform` and `opacity` with `<MotionConfig reducedMotion="user">` respected?
- [ ] Is copy sentence case, calm, and objective (using *"potential gap"*, *"possible conflict"*, *"not found in the sources reviewed"*)?
