import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getJobStatus, fetchSampleData } from '@/lib/api';
import { AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import { SeedIcon } from '@/components/common/Icons';

interface SourceChip {
  id: string;
  title: string;
  status: 'pending' | 'ready' | 'error';
  errorMessage?: string;
}

interface TimelineStage {
  id: string;
  name: string;
  detail: string;
}

export const Analyzing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeStage, setActiveStage] = useState(1); // 0 to 5
  const [currentAction, setCurrentAction] = useState('Initializing investigation pipeline...');
  const [sourceChips, setSourceChips] = useState<SourceChip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const stages: TimelineStage[] = [
    { id: 'search', name: 'Discovery & Intake', detail: 'Formulating investigative queries and identifying source URLs.' },
    { id: 'fetch', name: 'Fetching Documents', detail: 'Safe retrieval with SSRF protection, readability cleaning, and domain validation.' },
    { id: 'read', name: 'Reading & Grounding', detail: 'Extracting candidate claims with strict verbatim quote substring checks.' },
    { id: 'compare', name: 'Deterministic Cross-Examination', detail: 'Matrix comparison across sources for dark spots, gaps, and value fractures.' },
    { id: 'freshness', name: 'Auditing Temporal Freshness', detail: 'Checking cycles, publication dates, and flagging references older than 18 months.' },
    { id: 'checklist', name: 'Compiling Verification Checklist', detail: 'Synthesizing actionable checklist prioritized by High, Medium, and Low risk.' },
  ];

  // If sample demonstration dataset is requested
  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    if (id === 'sample-report-default' || id.startsWith('sample')) {
      setSourceChips([
        { id: 's1', title: 'Primary Governing Notice Guidelines', status: 'pending' },
        { id: 's2', title: 'Independent Review (2024-25 Cycle)', status: 'pending' },
        { id: 's3', title: 'Community Discussion Forum Thread', status: 'pending' }
      ]);

      const stageDelays = [
        { stage: 0, text: '3 reference sources loaded into investigative workspace...', action: () => {} },
        { stage: 1, text: 'Fetching and cleaning 3 documents (HTML sanitized, SSRF verified)...', action: () => {
          setSourceChips(prev => prev.map(s => ({ ...s, status: 'ready' })));
        }},
        { stage: 2, text: 'Extracting 8 expected attributes & verifying verbatim quotes...', action: () => {} },
        { stage: 3, text: 'Cross-examining attributes: identifying potential gaps and parameter conflicts...', action: () => {} },
        { stage: 4, text: 'Checking temporal markers: 2024-25 cycle marked stale, forum post marked undated...', action: () => {} },
        { stage: 5, text: 'Compiling coverage matrix and prioritized verification checklist...', action: () => {} },
      ];

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < stageDelays.length) {
          const item = stageDelays[currentStep];
          setActiveStage(item.stage);
          setCurrentAction(item.text);
          item.action();
          currentStep++;
        } else {
          clearInterval(interval);
          fetchSampleData().finally(() => {
            navigate('/report/sample-report-default/summary');
          });
        }
      }, 500);

      return () => clearInterval(interval);
    }

    // Real backend job polling
    let isCancelled = false;
    const pollInterval = setInterval(async () => {
      try {
        const data = await getJobStatus(id);
        if (isCancelled) return;

        const progress = data.progress;
        if (progress.error) {
          setError(progress.error);
          clearInterval(pollInterval);
          return;
        }

        // Map backend 1-based stageIndex (1: Fetching -> 5: Building checklist) to timeline 1 to 5
        const mappedStage = Math.max(1, Math.min(5, progress.stageIndex || 1));
        setActiveStage(mappedStage);
        setCurrentAction(progress.currentAction || 'Cross-examining documents...');

        if (Array.isArray(progress.sourcesStatus)) {
          setSourceChips(progress.sourcesStatus);
        }

        if (progress.stage === 'Done' || progress.progressPercent >= 100) {
          clearInterval(pollInterval);
          const targetReportId = progress.reportId || id;
          setReportId(targetReportId);
          setTimeout(() => {
            navigate(`/report/${targetReportId}/summary`);
          }, 350);
        }
      } catch (pollErr: any) {
        if (!isCancelled) {
          console.error('Error polling job status:', pollErr);
        }
      }
    }, 700);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [id, navigate]);

  const shortSessionId = id ? (id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id) : '';

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 space-y-8 pb-16">
      {/* Calm Header */}
      <div className="border-b border-border pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-structure/10 text-structure-text text-xs font-sans font-medium">
            <SeedIcon className="w-3 h-3 fill-current" />
            <span>Forensic investigation</span>
          </div>
          <span className="font-mono text-xs text-text-muted">
            Session: <span className="text-text font-semibold">{shortSessionId}</span>
          </span>
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          Auditing Information Integrity
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Cross-examining evidence with deterministic attribute verification and strict verbatim quote validation.
        </p>
      </div>

      {/* Current Status Callout */}
      <div className="p-4 rounded-sm bg-surface border border-border flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <span className="font-sans text-xs text-text-muted font-medium block">
            Current operation
          </span>
          <p className="font-medium text-text">
            {currentAction}
          </p>
        </div>
        <div className="text-right font-mono text-[11px] text-structure-text font-semibold shrink-0">
          Stage {activeStage + 1} of 6
        </div>
      </div>

      {/* Forensic Vertical Timeline */}
      <div className="space-y-6">
        <h3 className="font-heading font-bold text-sm text-text">
          Pipeline audit stages
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
          {stages.map((st, idx) => {
            const isDone = idx < activeStage;
            const isRunning = idx === activeStage;

            return (
              <div key={st.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                    isDone
                      ? 'bg-signal text-signal-ink font-bold'
                      : isRunning
                      ? 'border-2 border-structure-text bg-surface text-structure-text font-bold animate-pulse'
                      : 'border border-border bg-surface text-text-muted/60'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-heading text-sm font-bold tracking-tight ${
                        isDone || isRunning ? 'text-text' : 'text-text-muted/60'
                      }`}
                    >
                      {st.name}
                    </h4>
                    {isRunning && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-xs bg-structure/15 text-structure-text font-semibold">
                        In Progress
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-mono uppercase text-text-muted">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {st.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Source Chips */}
      {sourceChips.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-seed/10">
          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-sm text-seed">
              Source material status ({sourceChips.length})
            </span>
          </div>

          <div className="divide-y divide-seed/10 border border-seed/10 rounded-sm">
            {sourceChips.map((chip, idx) => (
              <div
                key={chip.id || idx}
                className="p-3 bg-pith flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate mr-3">
                  <span className="font-mono text-[10px] text-seed-muted">
                    0{idx + 1}
                  </span>
                  <span className="font-medium text-seed truncate" title={chip.title}>
                    {chip.title}
                  </span>
                </div>

                <div className="shrink-0 font-mono text-[11px]">
                  {chip.status === 'ready' && (
                    <span className="text-rind font-semibold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Ready
                    </span>
                  )}
                  {chip.status === 'pending' && (
                    <span className="text-seed-muted inline-flex items-center gap-1">
                      Processing
                    </span>
                  )}
                  {chip.status === 'error' && (
                    <span className="text-flesh font-semibold inline-flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Blocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Error Card */}
      {error && (
        <div className="p-4 rounded-sm bg-flesh/10 border border-flesh/30 text-flesh space-y-2 text-xs" role="alert">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Analysis Issue Encountered</span>
          </div>
          <p className="leading-relaxed">{error}</p>
          <div className="pt-2 text-seed font-medium">
            <p><strong>Suggested Next Step:</strong> If a URL was blocked by SSRF or timeout, try copying its text content and pasting it directly instead.</p>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Return & Paste Text
            </Button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-seed/10 text-xs">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Cancel Investigation
        </Button>

        {reportId && (
          <Button variant="rind" size="sm" onClick={() => navigate(`/report/${reportId}/summary`)}>
            <span>View Full Report</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
