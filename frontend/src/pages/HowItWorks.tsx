import React from 'react';
import { CrackIcon, WiltIcon, VerifiedCheckIcon } from '@/components/common/Icons';

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-seed/10 pb-8">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-sans font-medium">
          <span>Methodology & architecture</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-seed tracking-tight">
          How Digital Dark Spot Works
        </h1>
        <p className="text-seed-muted text-sm sm:text-base max-w-2xl">
          The difference between generative AI summarization and deterministic information gap detection.
        </p>
      </div>

      {/* 3 Core Forensic Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-rind bg-pith space-y-3">
          <div className="p-2 rounded-xs bg-rind/10 text-rind w-fit">
            <VerifiedCheckIcon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-base text-seed">01. Strict Grounding</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Every candidate claim extracted by the LLM layer must have a 100% exact substring match in the ingested source document. Any claim whose quote cannot be verified verbatim is discarded immediately.
          </p>
        </div>

        <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-crack bg-pith space-y-3">
          <div className="p-2 rounded-xs bg-crack/10 text-crack w-fit">
            <CrackIcon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-base text-seed">02. Deterministic Comparison</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Gaps and contradictions are never calculated by hallucinating or probabilistic guessing. Normalized attribute values are matrix-compared deterministically across sources to identify true data fractures.
          </p>
        </div>

        <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith space-y-3">
          <div className="p-2 rounded-xs bg-wilt/15 text-wilt w-fit">
            <WiltIcon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-base text-seed">03. Temporal Freshness</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Sources are automatically inspected for publication timestamps, academic/fiscal cycle markers (e.g. 2024-25 vs 2026), and temporal decay. Outdated cycles are explicitly surfaced to prevent obsolete reliance.
          </p>
        </div>
      </div>

      {/* Philosophy Statement */}
      <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-seed bg-seed/[0.01] space-y-2">
        <h4 className="font-sans font-semibold text-sm text-seed">
          Core research philosophy
        </h4>
        <p className="text-xs sm:text-sm text-seed leading-relaxed">
          We never present findings as definitive truth. We provide <strong className="text-seed">potential signals</strong>, expose <strong className="text-seed">unanswered questions</strong>, and deliver an actionable <strong className="text-seed">verification checklist</strong> so humans can audit primary government and institutional notices before taking critical steps.
        </p>
      </div>
    </div>
  );
};
