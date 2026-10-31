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

## 2. Semantic Token System — "Black, Cobalt and Acid lime"

The design system uses a strict token palette across Dark (default forensic mode) and Light themes:

| Token Name | Dark Hex | Light Hex | Semantic Role & Constraints |
| :--- | :--- | :--- | :--- |
| `--bg` | `#0A0B0F` | `#F6F7FB` | Canvas background |
| `--surface` | `#11131A` | `#FFFFFF` | Primary surface / card base |
| `--surface-2` | `#171A24` | `#EEF0F7` | Secondary surface / subtle inset |
| `--border` | `#232838` | `#DDE1EC` | Hairline border |
| `--text` | `#ECEEF4` | `#0A0B0F` | Primary text (16.96:1 dark, 18.37:1 light) |
| `--text-muted` | `#9AA1B5` | `#4A5168` | Muted editorial text (7.62:1 dark, 7.35:1 light) |
| `--structure` | `#2F5BFF` | `#1F46E5` | Structural accents, deep cobalt (6.40:1 light) |
| `--structure-text` | `#7C9BFF` | `#1F46E5` | Links, active nav/tabs, focus rings (7.48:1 dark, 6.40:1 light) |
| `--signal` | `#C6F432` | `#C6F432` | Acid lime. Primary button fill, Found/Sourced. Fill only on light. Max 10% screen area. |
| `--signal-ink` | `#0A0B0F` | `#0A0B0F` | High-contrast ink on signal (15.35:1) |
| `--conflict` | `#FFB020` | `#FFB020` | Cross-source contradictions (10.76:1). Fill with dark text on light. |
| `--gap` | `#FF5C8A` | `#D6246E` | Potential information gaps & errors (6.70:1 dark, 4.52:1 light) |
| `--stale` | `#8A92AD` | `#5F6785` | Potentially outdated / uncertain signals (6.36:1 dark, 5.21:1 light) |

### Contrast & WCAG AA Verification
Every token pair was tested via `backend/test/test-palette-tokens.ts`:
- Text on BG: 16.96:1 (Dark), 18.37:1 (Light) — exceeds 4.5:1
- Muted on BG: 7.62:1 (Dark), 7.35:1 (Light) — exceeds 4.5:1
- Structure-text on BG: 7.48:1 (Dark), 6.40:1 (Light) — exceeds 4.5:1
- Signal-ink on Signal: 15.35:1 — exceeds 4.5:1
- Gap on BG: 6.70:1 (Dark), 4.52:1 (Light) — exceeds 4.5:1
- Stale on BG: 6.36:1 (Dark), 5.21:1 (Light) — exceeds 4.5:1
- Conflict on BG / with text: 10.76:1 (Dark), 10.76:1 (Light) — exceeds 4.5:1
- Focus Ring (structure-text on BG): 7.48:1 (Dark), 6.40:1 (Light) — exceeds 3.0:1

### Palette Constraints:
- **Primary Buttons:** Signal fill with signal-ink text (`bg-signal text-signal-ink`).
- **Links, Nav & Focus:** `structure-text` with 2px outline and 2px offset for `:focus-visible`.
- **Lime Coverage:** Capped at $\le 10\%$ of any screen viewport.
- **Radial Glow:** Exactly one faint radial glow of `structure` at ~12% opacity behind hero and report header (`.radial-structure-glow`). No other gradients or heavy glows.
- **Errors:** Styled with `--gap` (`#FF5C8A` / `#D6246E`), never generic saturated red.
- **Status Representation:** Always icon plus explicit text (never color alone).

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

