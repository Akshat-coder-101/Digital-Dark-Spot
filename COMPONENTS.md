# Digital Dark Spot — UI Components Registry

This project adapts components inspired by **[Watermelon UI](https://ui.watermelon.sh)** and Radix UI / shadcn primitives, rigorously restyled with the **"Watermelon Seed"** design token system.

## Design Token Mapping

| Token Name | Light Mode | Dark Mode | Semantic Meaning |
|---|---|---|---|
| **Rind** (`--color-rind`) | `#1F6B3A` | `#4FBF7A` | Primary brand, safe verified states, action buttons |
| **Flesh** (`--color-flesh`) | `#F2506E` | `#FF6B86` | Sourced claims, active highlighted melon flesh, destructive |
| **Pith** (`--color-pith`) | `#F4F8EE` | `#0F1512` | Background surface, page canvas, cards |
| **Seed** (`--color-seed`) | `#15110F` | `#F2F1ED` | Core text, black seed icon, information gaps |
| **Crack** (`--color-crack`) | `#E8A317` | `#F2B84B` | Conflicting claims, jagged split warnings |
| **Wilt** (`--color-wilt`) | `#8E9982` | `#75806D` | Stale data, undated warnings, previous cycles |

---

## 10 Watermelon / Radix Adapted Components

1. **Stepper / Progress Steps (`components/ui/stepper.tsx`)**
   - *Source Inspiration:* Watermelon UI Stepper (`@watermelon/stepper`)
   - *Where Used:* `/analyzing/:id`
   - *Tokens:* Rind active stage ring, Pith stage connector, Seed stage labels.

2. **Stat Card / Counter (`components/ui/stat-card.tsx`)**
   - *Source Inspiration:* Watermelon UI Stat Card (`@watermelon/stat-card`)
   - *Where Used:* `/report/:id` metric counter strip
   - *Tokens:* Pith card background, Seed text, Rind/Crack/Flesh accent borders.

3. **Animated Tabs (`components/ui/tabs.tsx`)**
   - *Source Inspiration:* Watermelon UI Animated Tabs (`@watermelon/tabs`)
   - *Where Used:* `/report/:id` tab navigation (Summary, Gaps, Conflicts, Freshness, Checklist, Sources)
   - *Tokens:* Rind indicator, Pith muted container, Seed active typography.

4. **Coverage Data Table (`components/ui/data-table.tsx`)**
   - *Source Inspiration:* Watermelon UI Data Table (`@watermelon/data-table`)
   - *Where Used:* `/report/:id` Attribute × Source coverage matrix
   - *Tokens:* Pith alternating rows, Seed text, status icons with high contrast.

5. **Evidence Drawer (`components/ui/drawer.tsx`)**
   - *Source Inspiration:* Watermelon UI Sheet / Drawer (`@watermelon/drawer`)
   - *Where Used:* `/report/:id/evidence/:claimId`
   - *Tokens:* Pith card surface, Flesh quote highlight border, Rind source badge.

6. **Animated Checkbox (`components/ui/animated-checkbox.tsx`)**
   - *Source Inspiration:* Watermelon UI Animated Checkbox (`@watermelon/animated-checkbox`)
   - *Where Used:* `/report/:id/checklist`
   - *Tokens:* Seed seed-shape container morphs to Rind checkmark upon verification.

7. **Empty State (`components/ui/empty-state.tsx`)**
   - *Source Inspiration:* Watermelon UI Empty State (`@watermelon/empty-state`)
   - *Where Used:* `/report/:id` tabs when 0 items detected
   - *Tokens:* Pith muted illustrations, Seed descriptive headers.

8. **Toast Notification (`components/ui/toast.tsx`)**
   - *Source Inspiration:* Watermelon UI Toast (`@watermelon/toast`)
   - *Where Used:* Global feedback (e.g. "Copied markdown to clipboard")
   - *Tokens:* Seed background, Pith text, Rind success indicator.

9. **Status Badge / Tag (`components/ui/badge.tsx`)**
   - *Source Inspiration:* Watermelon UI Badge (`@watermelon/badge`)
   - *Where Used:* Everywhere across findings: `Sourced`, `AI-suggested`, `Uncertain`
   - *Tokens:* Always includes icon shape + text label (never color alone, WCAG AA).

10. **404 Not Found Block (`components/ui/not-found-block.tsx`)**
    - *Source Inspiration:* Watermelon UI 404 Block (`@watermelon/not-found-block`)
    - *Where Used:* `NotFound.tsx` (`*` route)
    - *Tokens:* Melonic cracked rind illustration, Pith background, Rind CTA button.

---

## Motion Integration
All components integrate with `motion/react` and honor the user's accessibility settings via `<MotionConfig reducedMotion="user">`.
