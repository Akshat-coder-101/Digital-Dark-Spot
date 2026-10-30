import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { Drawer } from '@/components/ui/drawer';
import { StatusTag, StatusType } from '@/components/common/StatusTag';
import { SeedIcon, CrackIcon, WiltIcon, BowlIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox';
import { Stepper } from '@/components/ui/stepper';

// 🍉 Watermelon UI Official Registry Components
import { ContinuousTabs } from '@/components/continuous-tabs';
import { CreditUsageCard } from '@/components/credit-usage-card';
import { ActivitiesCard } from '@/components/activities-card';
import { BudgetCard } from '@/components/budget-card';
import CopyConfirm from '@/components/copy-confirm';
import { FeedbackAction } from '@/components/feedback-action';
import { FloatingInput } from '@/components/floating-input';
import CardSplitAccordian from '@/components/card-split-accordian';
import { Alert1 } from '@/components/alert-1';
import { ErrorOne } from '@/components/ui/error-1';

import { motion } from 'motion/react';
import { Layers, Palette, Eye, Play, Sparkles, RefreshCw, FileText } from 'lucide-react';

export const Styleguide: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Motion Demo Triggers
  const [seedPopKey, setSeedPopKey] = useState(0);
  const [crackDrawKey, setCrackDrawKey] = useState(0);
  const [tickDemoChecked, setTickDemoChecked] = useState(false);

  const tokens = [
    { name: 'Rind (Primary)', hex: '#1F6B3A', darkHex: '#4FBF7A', cssVar: '--color-rind', desc: 'Verified status, primary action, safe perimeter' },
    { name: 'Flesh (Sourced)', hex: '#F2506E', darkHex: '#FF6B86', cssVar: '--color-flesh', desc: 'Verified claims, active melon interior, highlights' },
    { name: 'Pith (Background)', hex: '#F4F8EE', darkHex: '#0F1512', cssVar: '--color-pith', desc: 'Canvas background, outer protective membrane' },
    { name: 'Seed (Text / Gaps)', hex: '#15110F', darkHex: '#F2F1ED', cssVar: '--color-seed', desc: 'Dark spots, unanswered questions, primary body' },
    { name: 'Crack (Conflicts)', hex: '#E8A317', darkHex: '#F2B84B', cssVar: '--color-crack', desc: 'Contradictions between sources, warning fractures' },
    { name: 'Wilt (Stale)', hex: '#8E9982', darkHex: '#75806D', cssVar: '--color-wilt', desc: 'Undated items, older cycles (>18m), faded knowledge' },
  ];

  const statuses: StatusType[] = ['sourced', 'ai_suggested', 'uncertain', 'gap', 'conflict', 'stale'];

  return (
    <div className="space-y-16 pb-24">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rind/10 text-rind text-xs font-semibold mb-3">
          <Palette className="w-3.5 h-3.5" />
          <span>Watermelon UI (ui.watermelon.sh) + Motion System</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-black text-seed tracking-tight">
          Styleguide & Component Registry
        </h1>
        <p className="text-seed-muted text-base mt-2 max-w-3xl leading-relaxed">
          Design system showcasing 10 official <strong>Watermelon UI</strong> components adapted to our <strong>"Watermelon Seed"</strong> design tokens, animated with <strong>Motion (<code className="text-xs bg-pith-muted px-1 py-0.5 rounded">motion/react</code>)</strong>.
        </p>
      </div>

      {/* 1. Color Tokens Palette */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed flex items-center gap-2">
          <Layers className="w-5 h-5 text-rind" />
          1. Watermelon Seed Design Tokens
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <Card key={token.name} className="overflow-hidden border-pith-border bg-pith-card">
              <div
                className="h-16 w-full flex items-end p-3 transition-colors"
                style={{ backgroundColor: `var(${token.cssVar})` }}
              >
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-xs">
                  {token.cssVar}
                </span>
              </div>
              <CardContent className="pt-3 pb-4">
                <h4 className="font-heading font-bold text-seed text-sm">{token.name}</h4>
                <p className="text-xs text-seed-muted mt-0.5">{token.desc}</p>
                <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-seed-muted border-t border-pith-border pt-2">
                  <span>Light: {token.hex}</span>
                  <span>Dark: {token.darkHex}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Metaphor Icons */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">2. Brand Metaphor Icons (Small SVGs)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="p-4 flex flex-col items-center text-center border-pith-border bg-pith-card">
            <div className="p-3 rounded-2xl bg-seed/10 text-seed mb-2">
              <SeedIcon className="w-6 h-6 fill-current" />
            </div>
            <span className="font-heading font-bold text-xs text-seed">SeedIcon</span>
            <span className="text-[11px] text-seed-muted">Gap Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center border-pith-border bg-pith-card">
            <div className="p-3 rounded-2xl bg-crack/15 text-crack mb-2">
              <CrackIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xs text-seed">CrackIcon</span>
            <span className="text-[11px] text-seed-muted">Conflict Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center border-pith-border bg-pith-card">
            <div className="p-3 rounded-2xl bg-wilt/15 text-wilt mb-2">
              <WiltIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xs text-seed">WiltIcon</span>
            <span className="text-[11px] text-seed-muted">Stale Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center border-pith-border bg-pith-card">
            <div className="p-3 rounded-2xl bg-rind/15 text-rind mb-2">
              <BowlIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xs text-seed">BowlIcon</span>
            <span className="text-[11px] text-seed-muted">Checklist Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center border-pith-border bg-pith-card">
            <div className="p-3 rounded-2xl bg-rind/15 text-rind mb-2">
              <VerifiedCheckIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xs text-seed">VerifiedCheckIcon</span>
            <span className="text-[11px] text-seed-muted">Sourced Metaphor</span>
          </Card>
        </div>
      </section>

      {/* 3. Status Tags (WCAG AA) */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">3. Accessible Status Tags (Text + Icon Shape)</h2>
        <Card className="p-6 border-pith-border bg-pith-card">
          <div className="flex flex-wrap gap-3 items-center">
            {statuses.map((status) => (
              <StatusTag key={status} status={status} size="md" />
            ))}
          </div>
          <p className="text-xs text-seed-muted mt-4">
            Compliant with WCAG AA: status is never conveyed by color alone. Every tag couples an explicit text label with a unique icon geometry.
          </p>
        </Card>
      </section>

      {/* 4. MOTION INTERACTION DEMOS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-seed flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-flesh" />
              4. Motion Planned Animations (motion/react)
            </h2>
            <p className="text-xs text-seed-muted mt-1">
              Test each core interaction animation planned for the Digital Dark Spot experience.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demo 1: Seed Pop-In Animation */}
          <Card className="p-6 border-pith-border bg-pith-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-seed">Demo 1: Hero Seed Pop-in</h4>
                <Button size="sm" variant="subtle" onClick={() => setSeedPopKey(k => k + 1)}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replay Pop
                </Button>
              </div>
              <p className="text-xs text-seed-muted mb-4">
                On report arrival, wedges fade in and seeds pop in with a staggered spring (0.04s stagger, 0.3s duration).
              </p>

              <div key={seedPopKey} className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-pith-muted border border-pith-border min-h-[90px]">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.25, 1], opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 18,
                      delay: i * 0.04
                    }}
                    whileHover={{ scale: 1.25 }}
                    className="cursor-pointer p-2 rounded-xl bg-seed text-pith shadow-xs"
                    title={`Seed ${i + 1}`}
                  >
                    <SeedIcon className="w-4 h-4 fill-current" />
                  </motion.div>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-mono text-rind mt-3">spring stiffness: 400, damping: 18, stagger: 0.04s</span>
          </Card>

          {/* Demo 2: Animated Crack Draw */}
          <Card className="p-6 border-pith-border bg-pith-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-seed">Demo 2: Animated Crack Draw</h4>
                <Button size="sm" variant="subtle" onClick={() => setCrackDrawKey(k => k + 1)}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Replay Draw
                </Button>
              </div>
              <p className="text-xs text-seed-muted mb-4">
                Conflict indicators draw their jagged fracture line smoothly using <code className="text-xs">pathLength: 0 to 1</code> (0.5s).
              </p>

              <div key={crackDrawKey} className="flex items-center justify-center p-6 rounded-2xl bg-pith-muted border border-pith-border min-h-[90px]">
                <svg width="180" height="40" viewBox="0 0 180 40" className="overflow-visible">
                  <motion.path
                    d="M 5,20 L 35,5 L 65,32 L 95,10 L 125,28 L 155,8 L 175,20"
                    fill="none"
                    stroke="var(--color-crack)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </svg>
              </div>
            </div>
            <span className="text-[11px] font-mono text-crack mt-3">pathLength: 0 → 1 in 0.5s (easeInOut)</span>
          </Card>

          {/* Demo 3: Evidence Drawer Slide */}
          <Card className="p-6 border-pith-border bg-pith-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-seed">Demo 3: Drawer Slide-Over</h4>
                <Button size="sm" variant="rind" onClick={() => setDrawerOpen(true)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Open Drawer
                </Button>
              </div>
              <p className="text-xs text-seed-muted mb-4">
                Clicking any seed, crack, or matrix cell slides the Evidence Drawer in from the right edge in 0.25s.
              </p>
              <div className="p-4 rounded-xl bg-pith-muted border border-pith-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusTag status="sourced" size="sm" />
                  <span className="text-xs font-mono text-seed">claim_scholarship_gpa</span>
                </div>
                <span className="text-xs text-seed-muted">Click button above to trigger</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-rind mt-3">x: 100% → 0% in 0.25s (spring easeOut)</span>
          </Card>

          {/* Demo 4: Tick Morph Animation */}
          <Card className="p-6 border-pith-border bg-pith-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-seed">Demo 4: Seed to Checkmark Morph</h4>
                <Button size="sm" variant="subtle" onClick={() => setTickDemoChecked(c => !c)}>
                  Toggle State
                </Button>
              </div>
              <p className="text-xs text-seed-muted mb-4">
                Checklist completion: the black gap seed shrinks away and a green checkmark emerges in 0.2s.
              </p>
              <div className="p-4 rounded-xl bg-pith-muted border border-pith-border flex items-center gap-3">
                <AnimatedCheckbox
                  id="tick-demo"
                  checked={tickDemoChecked}
                  onCheckedChange={setTickDemoChecked}
                  label="Verify annual renewal criteria with university financial aid office."
                />
              </div>
            </div>
            <span className="text-[11px] font-mono text-rind mt-3">scale: 1 → 0.4 → 1, seed shrink to check in 0.2s</span>
          </Card>
        </div>
      </section>

      {/* 5. WATERMELON UI COMPONENTS SHOWCASE */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-seed flex items-center gap-2">
            <Layers className="w-5 h-5 text-rind" />
            5. Watermelon UI (ui.watermelon.sh) 10-Component Catalog
          </h2>
          <p className="text-xs text-seed-muted mt-1">
            Official components pulled directly via the shadcn CLI from <code className="text-xs">https://registry.watermelon.sh/r/</code> and restyled with our semantic tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Watermelon Component 1: Continuous Tabs */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #1</span>
                <h3 className="font-heading font-bold text-seed">Continuous Tabs</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/continuous-tabs" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Smooth pill indicator transitioning between active report tabs with spring physics.
            </p>
            <div className="overflow-x-auto py-2">
              <ContinuousTabs
                tabs={[
                  { id: 'summary', label: 'Summary' },
                  { id: 'gaps', label: 'Gaps (Seeds)' },
                  { id: 'conflicts', label: 'Conflicts (Cracks)' },
                  { id: 'freshness', label: 'Freshness' },
                ]}
                defaultActiveId="summary"
              />
            </div>
          </Card>

          {/* Watermelon Component 2: Copy Confirm Button */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #2</span>
                <h3 className="font-heading font-bold text-seed">Copy Confirm Action Button</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/copy-confirm" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Micro-interaction button for copying Markdown checklist findings with animated character-by-character tick confirmation.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <CopyConfirm
                title="Export Checklist"
                valueToCopy="# Digital Dark Spot Verification Checklist&#10;- [ ] Check Renewal Policy"
                copyText="Copy .md"
                copiedText="Copied!"
              />
            </div>
          </Card>

          {/* Watermelon Component 3: Floating Input */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #3</span>
                <h3 className="font-heading font-bold text-seed">Floating Input Block</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/floating-input" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Smooth animated label floating input field adapted for intake of target scholarship research questions.
            </p>
            <div className="pt-2">
              <FloatingInput label="What scholarship or policy question do you want to verify?" defaultValue="What should I verify before applying for this scholarship?" />
            </div>
          </Card>

          {/* Watermelon Component 4: Semantic Alert-1 */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #4</span>
                <h3 className="font-heading font-bold text-seed">Alert-1 Notification</h3>
              </div>
              <a href="https://ui.watermelon.sh/components/alerts" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Structured callout banner styled in Rind and Crack token variants.
            </p>
            <div className="space-y-3 pt-2">
              <Alert1
                variant="rind"
                title="Potential signals, not verified facts."
                description="Digital Dark Spot identifies omissions and contradictions across reviewed sources; always confirm with official scholarship administrators."
              />
              <Alert1
                variant="crack"
                title="Possible Contradiction Detected"
                description="Source A lists $50,000 income limit while Source B lists $40,000 for 2024-25 cycle."
              />
            </div>
          </Card>

          {/* Watermelon Component 5: Feedback Action */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #5</span>
                <h3 className="font-heading font-bold text-seed">Feedback Action (Retry / Error)</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/feedback-action" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Animated spring state for URL ingestion recovery when a source page blocks automated fetching.
            </p>
            <div className="pt-2">
              <FeedbackAction errorMessage="Page Blocked Fetching" loadingMessage="Retrying Fetch" />
            </div>
          </Card>

          {/* Watermelon Component 6: Activities Card */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #6</span>
                <h3 className="font-heading font-bold text-seed">Activities Card (Expandable List)</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/activities-card" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Expandable card with smooth layout animation for listing extracted claims and findings.
            </p>
            <div className="pt-2">
              <ActivitiesCard
                headerIcon={<FileText className="w-5 h-5 text-rind" />}
                title="Extracted Verbatim Claims"
                subtitle="3 verified ground-truth quotes"
                activities={[
                  {
                    icon: <VerifiedCheckIcon className="w-4 h-4 text-rind" />,
                    title: 'Income Limit: $50,000 max',
                    desc: 'National Merit Guidelines 2026',
                    time: 'Current'
                  },
                  {
                    icon: <CrackIcon className="w-4 h-4 text-crack" />,
                    title: 'Income Limit: $40,000 max',
                    desc: 'Student Aid Review 2024-25',
                    time: 'Earlier cycle'
                  }
                ]}
              />
            </div>
          </Card>

          {/* Watermelon Component 7: Budget Card */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #7</span>
                <h3 className="font-heading font-bold text-seed">Budget Card (Coverage Breakdown)</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/budget-card" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Breakdown card representing attribute verification progress across Sourced, Gaps, and Conflicts.
            </p>
            <div className="pt-2">
              <BudgetCard
                month="Cycle 2026"
                totalBudget={10}
                spentAmount={7}
                breakdown={[
                  { label: 'Sourced Attributes', amount: 5, color: 'var(--color-rind)' },
                  { label: 'Potential Gaps', amount: 2, color: 'var(--color-seed)' },
                  { label: 'Possible Conflicts', amount: 1, color: 'var(--color-crack)' }
                ]}
              />
            </div>
          </Card>

          {/* Watermelon Component 8: Card Split Accordian */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #8</span>
                <h3 className="font-heading font-bold text-seed">Card Split Accordian (Text Reveal)</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/card-split-accordian" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Spring-physics split accordion for educational walkthroughs and FAQ items on how dark spots are detected.
            </p>
            <div className="pt-2">
              <CardSplitAccordian />
            </div>
          </Card>

          {/* Watermelon Component 9: Credit Usage Card */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #9</span>
                <h3 className="font-heading font-bold text-seed">Credit Usage Metric Card</h3>
              </div>
              <a href="https://ui.watermelon.sh/animated-components/credit-usage-card" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Segmented progress indicator and usage metric display with custom toggles and popovers.
            </p>
            <div className="pt-2">
              <CreditUsageCard
                usedCreditsPercent={62}
                totalCreditsLabel="8 ATTRIBUTES"
                creditsUsedLabel="5 SOURCED"
                creditsLeftLabel="3 GAPS"
              />
            </div>
          </Card>

          {/* Watermelon Component 10: Error-1 404 Block */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-4">
            <div className="flex items-center justify-between border-b border-pith-border pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-rind uppercase">Watermelon UI Component #10</span>
                <h3 className="font-heading font-bold text-seed">Error-1 (404 Block)</h3>
              </div>
              <a href="https://ui.watermelon.sh/block/error-1" target="_blank" rel="noreferrer" className="text-xs text-rind hover:underline">
                ui.watermelon.sh ↗
              </a>
            </div>
            <p className="text-xs text-seed-muted">
              Watermelon block for invalid report IDs and missing route states, styled with rind SVG strokes and pill action CTA.
            </p>
            <div className="pt-2 border border-pith-border rounded-xl p-4 bg-pith-muted/50">
              <ErrorOne
                code="404"
                title="Potential Gap: Route Not Found"
                description="Preview of the ErrorOne component from ui.watermelon.sh"
                action={{ label: "Sample Action", href: "#" }}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* 6. SHADCN / RADIX FALLBACK PRIMITIVES */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-seed">6. shadcn / Radix Fallback Primitives</h2>
          <p className="text-xs text-seed-muted mt-1">
            Where a standalone component does not exist in the Watermelon catalog (e.g. Stepper, Drawer Sheet, Stat Counter), we adhere to the rule: <em>fall back to shadcn/Radix, not custom code</em>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stepper */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-3">
            <h4 className="font-heading font-bold text-sm text-seed">5-Stage Analysis Stepper (Radix / shadcn)</h4>
            <p className="text-xs text-seed-muted">Used on <code className="text-xs">/analyzing/:id</code>.</p>
            <div className="pt-2">
              <Stepper
                activeStepIndex={2}
                steps={[
                  { id: '1', label: 'Fetching', description: 'Retrieving sources' },
                  { id: '2', label: 'Reading', description: 'Extracting claims' },
                  { id: '3', label: 'Comparing', description: 'Detecting gaps' },
                  { id: '4', label: 'Checking dates', description: 'Freshness audit' },
                  { id: '5', label: 'Building checklist', description: 'Final prioritization' }
                ]}
              />
            </div>
          </Card>

          {/* Stat Counters Strip */}
          <Card className="p-6 border-pith-border bg-pith-card space-y-3">
            <h4 className="font-heading font-bold text-sm text-seed">Metric Counters Strip</h4>
            <p className="text-xs text-seed-muted">Counts up once from 0 to target value on dashboard mount.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Counter value={3} label="Sources" icon={<VerifiedCheckIcon className="w-4 h-4" />} variant="rind" subtext="100% reachable" />
              <Counter value={4} label="Gaps" icon={<SeedIcon className="w-4 h-4 fill-current" />} variant="seed" subtext="Unanswered" />
              <Counter value={2} label="Conflicts" icon={<CrackIcon className="w-4 h-4" />} variant="crack" subtext="Contradictions" />
              <Counter value={1} label="Stale" icon={<WiltIcon className="w-4 h-4" />} variant="wilt" subtext="Older cycle" />
            </div>
          </Card>
        </div>
      </section>

      {/* Evidence Drawer Modal instance */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Evidence & Source Context"
        description="Claim #CLM-01 verified against source text"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusTag status="sourced" />
            <span className="text-xs font-mono text-seed-muted">attribute: renewal_criteria</span>
          </div>

          <div className="p-4 rounded-xl bg-pith-muted border border-pith-border space-y-2">
            <span className="text-xs font-bold text-seed uppercase tracking-wider">
              Verbatim Quote from Source:
            </span>
            <blockquote className="p-3 rounded-lg bg-pith-card border-l-4 border-flesh text-sm italic text-seed">
              "Scholarship continuation requires maintaining satisfactory academic standing as evaluated per annual term."
            </blockquote>
          </div>

          <div className="space-y-1 text-xs text-seed-muted">
            <p><strong>Source Title:</strong> National Merit Scholarship Guidelines 2026</p>
            <p><strong>Domain:</strong> scholarships.gov.in</p>
            <p><strong>Date Status:</strong> 12 January 2026 (Current Cycle)</p>
          </div>

          <div className="pt-4 border-t border-pith-border">
            <Button variant="outline" size="sm" className="w-full">
              Open Original Source
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
