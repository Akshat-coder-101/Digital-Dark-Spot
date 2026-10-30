import React, { useState } from 'react';
import { useReport } from './ReportContext';
import { ExternalLink, ChevronDown, ChevronUp, FileText, Globe, Calendar } from 'lucide-react';

export const SourcesTab: React.FC = () => {
  const { report } = useReport();
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSourceId(prev => (prev === id ? null : id));
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

      <div className="divide-y divide-seed/10 border border-seed/10 rounded-sm">
        {report.sources.map((source, idx) => {
          const isExpanded = expandedSourceId === source.id;

          return (
            <div key={source.id} className="p-5 bg-pith transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xs bg-seed/5 text-seed shrink-0 mt-0.5">
                    {source.type === 'url' ? <Globe className="w-4 h-4 text-rind" /> : <FileText className="w-4 h-4 text-seed" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-sm sm:text-base text-seed">
                        {source.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-xs bg-seed/5 text-seed-muted">
                        Source 0{idx + 1}
                      </span>
                      <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.2 rounded-xs ${
                        source.status === 'ready' ? 'bg-rind/10 text-rind border border-rind/20' : 'bg-flesh/10 text-flesh border border-flesh/20'
                      }`}>
                        {source.status === 'ready' ? 'Ingested' : 'Error'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-seed-muted">
                      Domain: <strong className="text-seed">{source.domain}</strong> • Word Count: {source.wordCount} words
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-seed-muted">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        {source.detectedDate || source.detectedCycle || 'Undated document'}
                      </span>
                      {source.isStale && (
                        <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.2 rounded-xs bg-wilt/15 text-wilt border border-wilt/30">
                          Prior Cycle / Stale
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-start">
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-xs border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(source.id)}
                    className="p-1 rounded-xs border border-seed/15 text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer"
                    aria-label={isExpanded ? 'Collapse text' : 'Expand text preview'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cleaned Text Preview */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-seed/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-seed-muted">
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      Extracted Clean Text Content ({source.cleanedText.length} characters):
                    </span>
                  </div>
                  <pre className="p-4 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs font-mono text-seed whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {source.cleanedText || 'No text extracted.'}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
