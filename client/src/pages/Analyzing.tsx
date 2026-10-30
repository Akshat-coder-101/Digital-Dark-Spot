import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stepper, StepItem } from '@/components/ui/stepper';
import { getJobStatus, fetchSampleData } from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface SourceChip {
  id: string;
  title: string;
  status: 'pending' | 'ready' | 'error';
  errorMessage?: string;
}

export const Analyzing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stageIndex, setStageIndex] = useState(0); // 0-based: 0 to 4
  const [currentAction, setCurrentAction] = useState('Initializing analysis job...');
  const [sourceChips, setSourceChips] = useState<SourceChip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const steps: StepItem[] = [
    { id: '1', label: 'Fetching', description: 'SSRF & text extraction' },
    { id: '2', label: 'Reading', description: 'Claims & verbatim quotes' },
    { id: '3', label: 'Comparing', description: 'Deterministic gaps & conflicts' },
    { id: '4', label: 'Checking dates', description: 'Freshness & cycle audit' },
    { id: '5', label: 'Building checklist', description: 'Prioritized verification matrix' }
  ];

  // If sample scholarship dataset is requested
  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    if (id === 'sample-scholarship-report') {
      // Simulate step-by-step progress for the sample dataset
      setSourceChips([
        { id: 's1', title: 'National Merit Scholarship 2026 Guidelines', status: 'pending' },
        { id: 's2', title: 'Student Aid Review (2024-25 Cycle)', status: 'pending' },
        { id: 's3', title: 'CollegeForum Community Thread', status: 'pending' }
      ]);

      const stageDelays = [
        { idx: 0, text: 'Fetching and cleaning 3 scholarship documents...', action: () => {
          setSourceChips(prev => prev.map(s => ({ ...s, status: 'ready' })));
        }},
        { idx: 1, text: 'Extracting 8 expected attributes & verifying verbatim quotes...', action: () => {} },
        { idx: 2, text: 'Detecting missing renewal conditions and income conflicts...', action: () => {} },
        { idx: 3, text: 'Flagging 2024-25 cycle as stale and forum post as undated...', action: () => {} },
        { idx: 4, text: 'Compiling coverage matrix and generating verification checklist...', action: () => {} },
      ];

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < stageDelays.length) {
          const item = stageDelays[currentStep];
          setStageIndex(item.idx);
          setCurrentAction(item.text);
          item.action();
          currentStep++;
        } else {
          clearInterval(interval);
          // Make sure sample report is loaded in backend
          fetchSampleData().finally(() => {
            navigate('/report/sample-scholarship-report/summary');
          });
        }
      }, 550);

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

        setStageIndex(Math.max(0, Math.min(4, progress.stageIndex - 1)));
        setCurrentAction(progress.currentAction || 'Analyzing...');

        if (Array.isArray(progress.sourcesStatus)) {
          setSourceChips(progress.sourcesStatus);
        }

        if (progress.stage === 'Done' || progress.progressPercent >= 100) {
          clearInterval(pollInterval);
          const targetReportId = progress.reportId || id;
          setReportId(targetReportId);
          setTimeout(() => {
            navigate(`/report/${targetReportId}/summary`);
          }, 400);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      {/* Top Breadcrumb & Title */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl font-extrabold text-seed">
          Auditing Information Integrity
        </h1>
        <p className="text-xs font-mono text-seed-muted">
          Job Reference: {id}
        </p>
      </div>

      {/* Stepper Card */}
      <Card className="shadow-lg border-border/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pipeline Progress</CardTitle>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rind/15 text-rind flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Stage {stageIndex + 1} of 5
            </span>
          </div>
          <CardDescription className="font-medium text-seed">
            {currentAction}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 5-Stage Stepper */}
          <Stepper steps={steps} activeStepIndex={stageIndex} />

          {/* Per-Source Chips */}
          {sourceChips.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-seed-muted block">
                Reviewed Sources Status:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sourceChips.map((chip, idx) => (
                  <div
                    key={chip.id || idx}
                    className="p-3 rounded-xl border border-border bg-pith flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-seed truncate mr-2" title={chip.title}>
                      {chip.title}
                    </span>
                    <span className="shrink-0 flex items-center gap-1">
                      {chip.status === 'ready' && (
                        <span className="text-rind flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready
                        </span>
                      )}
                      {chip.status === 'pending' && (
                        <span className="text-seed-muted flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Reading
                        </span>
                      )}
                      {chip.status === 'error' && (
                        <span className="text-flesh flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Blocked
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Error Card */}
          {error && (
            <div className="p-4 rounded-xl bg-flesh/10 border border-flesh/30 text-flesh space-y-2" role="alert">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Analysis Issue Encountered</span>
              </div>
              <p className="text-xs leading-relaxed">{error}</p>
              <div className="pt-2 text-xs text-seed font-medium">
                <p><strong>Suggested Next Step:</strong> If a URL was blocked by SSRF or timeout, try copying its text content and pasting it directly instead.</p>
              </div>
              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Return & Paste Text
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-border/80 pt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Cancel Analysis
          </Button>

          {reportId && (
            <Button variant="rind" size="sm" onClick={() => navigate(`/report/${reportId}/summary`)}>
              View Report Now
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
