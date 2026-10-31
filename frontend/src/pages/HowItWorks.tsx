import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HelpCircle, Globe, FileJson, GitCompare, AlertTriangle, CheckSquare } from 'lucide-react';
import { EvidenceStack } from '@/components/EvidenceStack';

export const HowItWorks: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // 6 Horizontal Forensic Pipeline Stages matching product spec
  const stages = [
    {
      num: '01',
      title: 'Question',
      icon: HelpCircle,
      desc: 'Formulates verification intent and defines scope for cross-source inquiry.'
    },
    {
      num: '02',
      title: 'Sources',
      icon: Globe,
      desc: 'Ingests documents and URLs with SSRF protection, auditing dates and publication cycles.'
    },
    {
      num: '03',
      title: 'Extraction',
      icon: FileJson,
      desc: 'Extracts structured claims, attributes, and candidate quotes with strict verbatim validation.'
    },
    {
      num: '04',
      title: 'Comparison',
      icon: GitCompare,
      desc: 'Cross-examines provisions row by row, executing deterministic normalizers and synonym clusters.'
    },
    {
      num: '05',
      title: 'Gaps and conflicts',
      icon: AlertTriangle,
      desc: 'Flags missing critical requirements, unstated conditions, and contradictory parameter values.'
    },
    {
      num: '06',
      title: 'Verify',
      icon: CheckSquare,
      desc: 'Generates a prioritized checklist of actionable next steps with exact source references.'
    }
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-border pb-7">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-structure/10 text-structure-text text-xs font-sans font-medium">
          <span>Methodology & architecture</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text tracking-tight">
          How Digital Dark Spot Works
        </h1>
        <p className="text-text-muted text-xs sm:text-sm max-w-2xl leading-relaxed">
          The difference between generative AI summarization and deterministic information gap detection.
        </p>
      </div>

      {/* Forensic Pipeline Illustration: EvidenceStack */}
      <div className="rounded-sm border border-border bg-surface p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-structure/10 text-structure-text text-xs font-mono font-medium">
            <span>Pipeline illustration</span>
          </div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-text">
            Cross-Document Layering & Fracture Discovery
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            By layering multiple primary sources—from official notices to public forums—the deterministic engine compares corresponding provisions row by row to detect unstated qualifying conditions and contradictory rules.
          </p>
        </div>
        <div className="w-full max-w-[440px] shrink-0 flex justify-center">
          <EvidenceStack />
        </div>
      </div>

      {/* Horizontal Forensic Process Flow (Vertical on Mobile) */}
      <div className="space-y-6">
        <h2 className="font-sans text-xs font-semibold text-text-muted tracking-normal">
          Investigation sequence
        </h2>

        <div className="relative">
          {/* Desktop Connecting SVG Line that draws once (pathLength: 0 to 1) when scrolled into view */}
          <svg className="hidden md:block absolute top-7 left-8 right-8 w-[calc(100%-64px)] h-4 overflow-visible pointer-events-none -z-0">
            <motion.line
              x1="0"
              y1="2"
              x2="100%"
              y2="2"
              stroke="var(--structure-text)"
              strokeWidth="2"
              strokeDasharray="4 3"
              initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>

          {/* 6 Process Stages */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
            {stages.map((st, idx) => (
              <motion.div
                key={st.num}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: shouldReduceMotion ? 0 : idx * 0.08,
                  ease: 'easeOut'
                }}
                className="flex md:flex-col items-start gap-3.5 md:gap-3 p-3.5 md:p-3 rounded-xs border md:border-transparent border-border bg-surface md:bg-transparent"
              >
                {/* Stage Badge & Icon */}
                <div className="w-10 h-10 rounded-xs border border-border bg-surface flex items-center justify-center shrink-0 shadow-xs">
                  <st.icon className="w-4 h-4 text-structure-text" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-structure-text">{st.num}</span>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-text truncate">
                      {st.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Rigorous Evidence & Deterministic Comparison Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="p-5 rounded-xs border border-border border-l-2 border-l-structure-text bg-surface space-y-2.5">
          <h3 className="font-heading font-bold text-sm text-text">
            Verbatim Substring Verification
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Every candidate claim extracted by language models must match an exact substring in the ingested source text. If a quote cannot be verified verbatim against raw ground truth, it is discarded immediately and recorded in the discarded claims tally to prevent hallucinations from propagating.
          </p>
        </div>

        <div className="p-5 rounded-xs border border-border border-l-2 border-l-conflict bg-surface space-y-2.5">
          <h3 className="font-heading font-bold text-sm text-text">
            Rule-Based Deterministic Comparison
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Cross-source contradictions and gaps are detected using deterministic code algorithms: numeric value normalization (percentages, currencies, dates), synonym cluster canonicalization, and temporal publication cycle checks.
          </p>
        </div>
      </div>

      {/* Research & Decision Philosophy */}
      <div className="p-5 rounded-xs border border-border border-l-2 border-l-border bg-surface-2 space-y-2">
        <h4 className="font-sans font-semibold text-xs text-text">
          Investigation Instrument Notice
        </h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Digital Dark Spot surfaces signals and potential contradictions, not definitive facts. All findings should be inspected in the source evidence drawer before taking authoritative action.
        </p>
      </div>
    </div>
  );
};

export default HowItWorks;
