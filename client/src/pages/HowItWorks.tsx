import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CrackIcon, WiltIcon, VerifiedCheckIcon } from '@/components/common/Icons';

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-seed">
          How Digital Dark Spot Works
        </h1>
        <p className="text-seed-muted text-base">
          Understanding the difference between AI summarization and deterministic information gap detection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-rind/15 text-rind w-fit">
            <VerifiedCheckIcon className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-seed">1. Strict Grounding</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Every claim extracted by the LLM layer is strictly verified against raw source text. If a quote is not found verbatim, it is discarded immediately.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-crack/15 text-crack w-fit">
            <CrackIcon className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-seed">2. Deterministic Analysis</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Gap and contradiction calculations do not rely on generative guessing. We compare normalized attribute values across sources deterministically.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-wilt/15 text-wilt w-fit">
            <WiltIcon className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-seed">3. Temporal Freshness</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Sources are automatically checked for publish dates, cycle references (e.g. 2024-25), and flags for data older than 18 months.
          </p>
        </Card>
      </div>

      <Card className="p-6 border-l-4 border-l-rind">
        <CardContent className="p-0 space-y-2">
          <h4 className="font-heading font-bold text-base text-seed">Core Philosophy</h4>
          <p className="text-sm text-seed-muted leading-relaxed">
            We never present findings as definitive facts. We provide <em>potential signals</em>, identify <em>unanswered questions</em>, and deliver an actionable <em>verification checklist</em> for authoritative human confirmation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
