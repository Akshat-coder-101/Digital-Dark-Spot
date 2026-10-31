import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HelpCircle, Globe, FileJson, CheckCircle2, GitCompare, Sparkles, AlertTriangle } from 'lucide-react';
import { EvidenceStack } from '@/components/EvidenceStack';

export const HowItWorks: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // 6 Horizontal Forensic Pipeline Stages
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
      desc: 'Ingests documents and URLs with SSRF protection, auditing dates and academic cycles.'
    },
    {
      num: '03',
      title: 'Extraction',
      icon: FileJson,
      desc: 'Extracts structured claims, attributes, and candidate quotes via isolated model prompts.'
    },
    {
      num: '04',
      title: 'Verbatim check',
      icon: CheckCircle2,
      desc: 'Every extracted claim must match an exact verbatim substring in raw text; unmatched claims are discarded.'
    },
    {
      num: '05',
      title: 'Comparison',
      icon: GitCompare,
      desc: 'Executes deterministic rule-based normalizers, date checks, and synonym clusters to detect fractures.'
    },
    {
      num: '06',
      title: 'Signals',
      icon: Sparkles,
      desc: 'Surfaces potential gaps, possible contradictions, and an actionable verification checklist.'
    }
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-seed/10 pb-7">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-sans font-medium">
          <span>Methodology & architecture</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-seed tracking-tight">
          How Digital Dark Spot Works
        </h1>
        <p className="text-seed-muted text-xs sm:text-sm max-w-2xl leading-relaxed">
          The difference between generative AI summarization and deterministic information gap detection.
        </p>
      </div>

      {/* Forensic Pipeline Illustration: EvidenceStack */}
      <div className="rounded-sm border border-seed/10 bg-pith p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-mono font-medium">
            <span>Pipeline illustration</span>
          </div>
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-seed">
            Cross-Document Layering & Fracture Discovery
          </h2>
          <p className="text-xs sm:text-sm text-seed-muted leading-relaxed">
            By layering multiple primary sources—from official notices to public forums—the deterministic engine compares corresponding provisions row by row to detect unstated qualifying conditions and contradictory rules.
          </p>
        </div>
        <div className="w-full max-w-[440px] shrink-0 flex justify-center">
          <EvidenceStack />
        </div>
      </div>

      {/* Horizontal Forensic Process Flow (Vertical on Mobile) */}
      <div className="space-y-6">
        <h2 className="font-sans text-xs font-semibold text-seed-muted tracking-normal">
          Investigation sequence
        </h2>

        <div className="relative">
          {/* Desktop Connecting Line that draws as it scrolls into view */}
          <div className="hidden md:block absolute top-7 left-6 right-6 h-[2px] bg-seed/10 -z-0">
            <motion.div
              className="h-full bg-rind/70 origin-left"
              initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {/* 6 Process Stages */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10">
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
                className="flex md:flex-col items-start gap-3.5 md:gap-3 p-3.5 md:p-3 rounded-xs border md:border-transparent border-seed/10 bg-pith-card/40 md:bg-transparent"
              >
                {/* Stage Badge & Icon */}
                <div className="w-10 h-10 rounded-xs border border-seed/15 bg-pith flex items-center justify-center shrink-0 shadow-xs">
                  <st.icon className="w-4 h-4 text-rind" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-rind">{st.num}</span>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-seed truncate">
                      {st.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-seed-muted leading-relaxed">
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
        <div className="p-5 rounded-xs border border-seed/10 border-l-2 border-l-rind bg-pith space-y-2.5">
          <h3 className="font-heading font-bold text-sm text-seed">
            Verbatim Substring Verification
          </h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Every candidate claim extracted by language models must match an exact substring in the ingested source text. If a quote cannot be verified verbatim against raw ground truth, it is discarded immediately and recorded in the discarded claims tally to prevent hallucinations from propagating.
          </p>
        </div>

        <div className="p-5 rounded-xs border border-seed/10 border-l-2 border-l-crack bg-pith space-y-2.5">
          <h3 className="font-heading font-bold text-sm text-seed">
            Rule-Based Deterministic Comparison
          </h3>
          <p className="text-xs text-seed-muted leading-relaxed">
            Cross-source contradictions and gaps are detected using deterministic code algorithms: numeric value normalization (percentages, currencies, dates), synonym cluster canonicalization, and temporal publication cycle checks.
          </p>
        </div>
      </div>

      {/* Research & Decision Philosophy */}
      <div className="p-5 rounded-xs border border-seed/10 border-l-2 border-l-seed bg-seed/[0.01] space-y-2">
        <h4 className="font-sans font-semibold text-xs text-seed">
          Research and Decision Philosophy
        </h4>
        <p className="text-xs text-seed-muted leading-relaxed">
          The expected-information parameter list is <strong className="text-seed">AI-suggested</strong>, and all findings are <strong className="text-seed">potential signals</strong> rather than absolute legal truths. Digital Dark Spot provides an actionable <strong className="text-seed">verification checklist</strong> so researchers know precisely what questions to ask institutions before making consequential decisions.
        </p>
      </div>

      {/* Known Limitations */}
      <div className="p-5 rounded-xs border border-crack/20 border-l-2 border-l-crack bg-crack/[0.03] space-y-3">
        <div className="flex items-center gap-2 text-crack">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="font-heading font-bold text-xs sm:text-sm text-seed">
            Known Limitations
          </h4>
        </div>
        <p className="text-xs text-seed-muted leading-relaxed">
          While Digital Dark Spot significantly improves visibility into public web information, the engine cannot guarantee discovering offline, unindexed, or restricted materials:
        </p>
        <ul className="text-xs text-seed-muted space-y-1.5 list-disc pl-5">
          <li><strong>Paywalled & Restricted Content:</strong> Subscription portals, password-protected databases, and CAPTCHA services cannot be ingested.</li>
          <li><strong>Client-Side Single-Page Applications:</strong> JavaScript portals that require complex stateful sessions or render text exclusively post-hydration may yield limited text snippets.</li>
          <li><strong>Non-Text PDFs & Scanned Circulars:</strong> Image-only scanned PDFs without OCR text streams cannot be parsed verbatim by standard text extractors.</li>
          <li><strong>Unindexed Circulars:</strong> Newly issued physical circulars or unindexed government notices remain outside the public search index.</li>
        </ul>
      </div>
    </div>
  );
};
