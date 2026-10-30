import React, { useState } from 'react';
import { useReport } from './ReportContext';
import { ExternalLink, ChevronDown, ChevronUp, FileText, Globe, Calendar } from 'lucide-react';

export const SourcesTab: React.FC = () => {
  const { report } = useReport();
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSourceId(prev => (prev === id ? null : id));
  };

  // Official domain detector
  const isOfficialDomain = (domain: string, sourceId?: string, isOfficial?: boolean) => {
    if (isOfficial) return true;
    if (sourceId === 'src-sample-official') return true;
    if (!domain) return false;
    return (
      domain.endsWith('.gov') ||
      domain.endsWith('.gov.in') ||
      domain.endsWith('.nic.in') ||
      domain.endsWith('.edu') ||
      domain.endsWith('.ac.in') ||
      domain.includes('.gov.') ||
      domain.includes('.gov.fictional')
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-seed">
            Reviewed Source Material ({report.sources.length})
          </h3>
          <p className="text-xs text-seed-muted">
            All ingested URLs, pasted texts, extracted metadata, and fetch statuses.
          </p>
        </div>
      </div>

      {/* Structured Table of Sources */}
      <div className="w-full overflow-x-auto rounded-sm border border-seed/10 bg-pith">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-seed/10 bg-seed/[0.02]">
              <th scope="col" className="py-2.5 px-3 font-heading font-bold text-seed">Source Title & Domain</th>
              <th scope="col" className="py-2.5 px-2 font-heading font-bold text-seed">Authority Hint</th>
              <th scope="col" className="py-2.5 px-2 font-heading font-bold text-seed">Date Status</th>
              <th scope="col" className="py-2.5 px-2 font-heading font-bold text-seed">Fetch Status</th>
              <th scope="col" className="py-2.5 px-2 font-heading font-bold text-seed text-center">Extracted</th>
              <th scope="col" className="py-2.5 px-2 font-heading font-bold text-seed text-center">Discarded</th>
              <th scope="col" className="py-2.5 px-3 font-heading font-bold text-seed text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-seed/10">
            {report.sources.map((source, idx) => {
              const claimsExtracted = report.claims.filter(c => c.source_id === source.id).length;
              const isOfficial = isOfficialDomain(source.domain, source.id, (source as any).isOfficialDomain);

              return (
                <tr key={source.id} className="hover:bg-seed/[0.015] transition-colors">
                  {/* Title & Domain */}
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-2.5 min-w-[200px]">
                      <div className="p-1 rounded-xs bg-seed/5 text-seed shrink-0 mt-0.5">
                        {source.type === 'url' ? <Globe className="w-3.5 h-3.5 text-rind" /> : <FileText className="w-3.5 h-3.5 text-seed" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-xs text-seed truncate max-w-[240px]">
                          {source.title}
                        </p>
                        <p className="text-[10px] font-mono text-seed-muted">
                          {source.domain} • S0{idx + 1}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Authority Hint */}
                  <td className="py-3 px-2">
                    {isOfficial ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-rind/10 text-rind border border-rind/20">
                        Official (.gov/.edu)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-seed/5 text-seed-muted">
                        Secondary source
                      </span>
                    )}
                  </td>

                  {/* Date Status */}
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-seed">
                      <Calendar className="w-3 h-3 text-seed-muted opacity-70" />
                      {source.detectedDate || source.detectedCycle || 'Undated'}
                    </span>
                  </td>

                  {/* Fetch Status */}
                  <td className="py-3 px-2">
                    <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs ${
                      source.status === 'ready' ? 'bg-rind/10 text-rind' : 'bg-flesh/10 text-flesh'
                    }`}>
                      {source.status === 'ready' ? 'Ready' : 'Failed'}
                    </span>
                  </td>

                  {/* Claims Extracted */}
                  <td className="py-3 px-2 text-center font-mono font-semibold text-seed">
                    {claimsExtracted}
                  </td>

                  {/* Claims Discarded */}
                  <td className="py-3 px-2 text-center font-mono text-seed-muted">
                    0
                  </td>

                  {/* Action Link & Preview Toggle */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-xs border border-seed/15 text-xs text-seed hover:bg-seed/5 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleExpand(source.id)}
                        className="p-1 rounded-xs border border-seed/15 text-seed-muted hover:text-seed cursor-pointer"
                        aria-label="Toggle preview"
                      >
                        {expandedSourceId === source.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Preview Drawer/Accordion if toggled */}
      {expandedSourceId && (
        <div className="p-4 rounded-sm border border-seed/10 bg-pith space-y-2">
          <div className="flex items-center justify-between text-xs text-seed-muted border-b border-seed/10 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Source Text Excerpt (S{report.sources.findIndex(s => s.id === expandedSourceId) + 1})
            </span>
            <button
              onClick={() => setExpandedSourceId(null)}
              className="text-xs text-seed-muted hover:text-seed cursor-pointer"
            >
              Close excerpt
            </button>
          </div>
          <p className="text-xs text-seed-muted font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
            {report.sources.find(s => s.id === expandedSourceId)?.rawText?.slice(0, 800) || 'Raw text unavailable.'}...
          </p>
        </div>
      )}
    </div>
  );
};
