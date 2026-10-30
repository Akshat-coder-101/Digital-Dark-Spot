import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { Drawer } from '@/components/ui/drawer';
import { StatusTag, StatusType } from '@/components/common/StatusTag';
import { SeedIcon, CrackIcon, WiltIcon, BowlIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox';
import { Stepper } from '@/components/ui/stepper';
import { EmptyState } from '@/components/ui/empty-state';
import { Layers, Palette, Eye } from 'lucide-react';

export const Styleguide: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(true);

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
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rind/10 text-rind text-xs font-semibold mb-3">
          <Palette className="w-3.5 h-3.5" />
          <span>Design System & Token Catalog</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold text-seed tracking-tight">
          Watermelon Seed Design Tokens
        </h1>
        <p className="text-seed-muted text-base mt-2 max-w-2xl leading-relaxed">
          The official design token guide for <strong>Digital Dark Spot</strong>. Built with semantic metaphors: gaps as black seeds, conflicts as cracks, stale data as wilted patches, and verification checklists as seed bowls.
        </p>
      </div>

      {/* Color Tokens Palette */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed flex items-center gap-2">
          <Layers className="w-5 h-5 text-rind" />
          Color Tokens
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <Card key={token.name} className="overflow-hidden">
              <div
                className="h-20 w-full flex items-end p-3 transition-colors"
                style={{ backgroundColor: `var(${token.cssVar})` }}
              >
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur-xs">
                  {token.cssVar}
                </span>
              </div>
              <CardContent className="pt-4">
                <h4 className="font-heading font-bold text-seed">{token.name}</h4>
                <p className="text-xs text-seed-muted mt-1">{token.desc}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-seed-muted border-t border-border pt-2">
                  <span>Light: {token.hex}</span>
                  <span>Dark: {token.darkHex}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Metaphor Icons */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">Metaphor Icons</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Card className="p-4 flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-seed/10 text-seed mb-2">
              <SeedIcon className="w-6 h-6 fill-current" />
            </div>
            <span className="font-heading font-bold text-sm text-seed">SeedIcon</span>
            <span className="text-xs text-seed-muted">Gap Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-crack/15 text-crack mb-2">
              <CrackIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-sm text-seed">CrackIcon</span>
            <span className="text-xs text-seed-muted">Conflict Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-wilt/15 text-wilt mb-2">
              <WiltIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-sm text-seed">WiltIcon</span>
            <span className="text-xs text-seed-muted">Stale Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-rind/15 text-rind mb-2">
              <BowlIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-sm text-seed">BowlIcon</span>
            <span className="text-xs text-seed-muted">Checklist Metaphor</span>
          </Card>

          <Card className="p-4 flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-rind/15 text-rind mb-2">
              <VerifiedCheckIcon className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-sm text-seed">VerifiedCheckIcon</span>
            <span className="text-xs text-seed-muted">Sourced Metaphor</span>
          </Card>
        </div>
      </section>

      {/* Status Tags (WCAG AA compliant: text + icon shape) */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">
          Status Tags (Text + Icon Shape)
        </h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-3 items-center">
            {statuses.map((status) => (
              <StatusTag key={status} status={status} size="md" />
            ))}
          </div>
          <p className="text-xs text-seed-muted mt-4">
            Every status tag uses high contrast, distinct text, and a unique icon geometry to satisfy WCAG AA accessibility rules without relying on color alone.
          </p>
        </Card>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">Buttons</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="rind">Rind (Primary Action)</Button>
            <Button variant="flesh">Flesh (Destructive / Highlight)</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link Style</Button>
          </div>
        </Card>
      </section>

      {/* Counters / Stat Cards */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">Stat Card Counters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Counter
            value={3}
            label="Sources Reviewed"
            icon={<VerifiedCheckIcon className="w-4 h-4" />}
            variant="rind"
            subtext="100% reachable"
          />
          <Counter
            value={4}
            label="Potential Gaps"
            icon={<SeedIcon className="w-4 h-4 fill-current" />}
            variant="seed"
            subtext="Black seeds"
          />
          <Counter
            value={2}
            label="Possible Conflicts"
            icon={<CrackIcon className="w-4 h-4" />}
            variant="crack"
            subtext="Contradictions"
          />
          <Counter
            value={1}
            label="Potentially Stale"
            icon={<WiltIcon className="w-4 h-4" />}
            variant="wilt"
            subtext="Previous cycle"
          />
        </div>
      </section>

      {/* Stepper Preview */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">5-Stage Analysis Stepper</h2>
        <Card className="p-6">
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
        </Card>
      </section>

      {/* Animated Checkbox */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">Animated Checkbox (Seed to Check)</h2>
        <Card className="p-6 space-y-3">
          <div>
            <AnimatedCheckbox
              id="c1"
              checked={checkbox1}
              onCheckedChange={setCheckbox1}
              label="Verify whether renewal requires minimum 3.0 GPA with the official faculty office."
            />
          </div>
          <div>
            <AnimatedCheckbox
              id="c2"
              checked={checkbox2}
              onCheckedChange={setCheckbox2}
              label="Obtain original income certificate issued within the past 6 months."
            />
          </div>
        </Card>
      </section>

      {/* Drawer Component */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">Evidence Drawer (Sheet)</h2>
        <Card className="p-6 flex items-center justify-between">
          <div>
            <h4 className="font-heading font-bold text-seed">Inspect Verbatim Evidence</h4>
            <p className="text-xs text-seed-muted">Test the slide-over modal for examining highlighted source quotes.</p>
          </div>
          <Button variant="rind" onClick={() => setDrawerOpen(true)}>
            <Eye className="w-4 h-4 mr-1.5" />
            Open Evidence Drawer
          </Button>
        </Card>

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

            <div className="p-4 rounded-xl bg-pith-muted border border-border space-y-2">
              <span className="text-xs font-bold text-seed uppercase tracking-wider">
                Verbatim Quote from Source:
              </span>
              <blockquote className="p-3 rounded-lg bg-pith-card border-l-4 border-flesh text-sm italic text-seed">
                "Scholarship continuation requires maintaining satisfactory academic standing as evaluated per annual term."
              </blockquote>
            </div>

            <div className="space-y-1 text-xs text-seed-muted">
              <p><strong>Source Title:</strong> National Merit Scholarship Guidelines 2026</p>
              <p><strong>Domain:</strong> scholarships.gov.example</p>
              <p><strong>Date Status:</strong> 12 January 2026 (Current Cycle)</p>
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                Open Original Source
              </Button>
            </div>
          </div>
        </Drawer>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-seed">Empty State Block</h2>
        <EmptyState
          icon={<CrackIcon className="w-6 h-6 text-rind" />}
          title="No Contradictions Found"
          description="All reviewed sources agree on the extracted values for this attribute."
        />
      </section>
    </div>
  );
};
