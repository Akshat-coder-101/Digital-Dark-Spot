import React from 'react';
import { CrackIcon, WiltIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { AlertTriangle } from 'lucide-react';

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
        <p className="text-seed-muted text-sm sm:text-base max-w-2xl leading-relaxed">
          The difference between generative AI summarization and deterministic information gap detection.
        </p>
      </div>

      {/* 3 Core Analytical Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-rind bg-pith space-y-3">
          <div className="p-2 rounded-xs bg-rind/10 text-rind w-fit">
            <VerifiedCheckIcon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-base text-seed">01. Grounded Claim Verification</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Candidate claims extracted by the language model must match an exact substring in the retrieved source document. Any claim whose quote cannot be verified verbatim against the ingested text is discarded and reported in the discarded claims tally.
          </p>
        </div>

        <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-crack bg-pith space-y-3">
          <div className="p-2 rounded-xs bg-crack/10 text-crack w-fit">
            <CrackIcon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-base text-seed">02. Deterministic Comparison</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Gaps and contradictions are evaluated deterministically using value normalization and synonym matching. The system surfaces candidate gaps and highlights potential contradictions for verification across the reviewed sources.
          </p>
        </div>

        <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith space-y-3">
          <div className="p-2 rounded-xs bg-wilt/15 text-wilt w-fit">
            <WiltIcon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-base text-seed">03. Temporal Freshness Auditing</h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Sources are inspected for publication dates, academic/fiscal cycle markers (e.g. 2024-25 vs 2026-27), and temporal decay. The engine flags undated sources and earlier cycles so users can distinguish active guidelines from historical rules.
          </p>
        </div>
      </div>

      {/* Philosophy Statement */}
      <div className="p-6 rounded-sm border border-seed/10 border-l-2 border-l-seed bg-seed/[0.01] space-y-2">
        <h4 className="font-sans font-semibold text-sm text-seed">
          Research and Decision Philosophy
        </h4>
        <p className="text-xs sm:text-sm text-seed-muted leading-relaxed">
          Digital Dark Spot surfaces <strong className="text-seed">candidate gaps</strong>, highlights <strong className="text-seed">potential contradictions for human verification</strong>, and generates an actionable <strong className="text-seed">verification checklist</strong>. We help researchers identify what public web pages fail to answer before making consequential decisions.
        </p>
      </div>

      {/* Known Limitations */}
      <div className="p-6 rounded-sm border border-crack/20 border-l-2 border-l-crack bg-crack/[0.03] space-y-3">
        <div className="flex items-center gap-2 text-crack">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="font-heading font-bold text-sm text-seed">
            Known Limitations
          </h4>
        </div>
        <p className="text-xs text-seed-muted leading-relaxed">
          While Digital Dark Spot significantly improves visibility into public web information, the engine cannot guarantee discovering offline, unindexed, or restricted materials. Please be aware of the following technical boundaries:
        </p>
        <ul className="text-xs text-seed-muted space-y-1.5 list-disc pl-5">
          <li><strong>Paywalled & Restricted Content:</strong> Subscription articles, password-protected portals, and CAPTCHA-protected services cannot be ingested.</li>
          <li><strong>Client-Side Single-Page Applications:</strong> JavaScript-heavy portals that require complex user interactions or render text exclusively post-hydration may yield limited text snippets.</li>
          <li><strong>Non-Text PDFs & Scanned Circulars:</strong> Image-only scanned PDFs without OCR text streams cannot be parsed verbatim by the standard text extractor.</li>
          <li><strong>Unindexed Government Notices:</strong> Newly released gazettes, physical notice boards, or internal administrative orders not indexed by search providers remain outside the search scope.</li>
        </ul>
      </div>
    </div>
  );
};
