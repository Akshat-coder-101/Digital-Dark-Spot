import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon, BowlIcon } from '@/components/common/Icons';
import { FullAnalysisReport } from '@/lib/types';
import { getReport, fetchSampleData, startAnalysis } from '@/lib/api';
import { HalfMelonSliceView } from '@/components/visual/HalfMelonSliceView';
import { CoverageMatrixTable } from '@/components/visual/CoverageMatrixTable';
import { ReportContext } from './ReportContext';
import { RefreshCw, Sparkles, AlertCircle, ArrowLeft, FileText, Info, Copy, Check, Edit3 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

// Performant 0.6s count-up component
function CounterNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }
    const startTime = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(ease * value));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, shouldReduceMotion]);

  return <span>{display}</span>;
}

export const DashboardLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  // Extract current tab from pathname e.g. /report/123/conflicts -> 'conflicts'
  const pathParts = location.pathname.split('/');
  const currentTab = pathParts[3] || 'summary';

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (id === 'sample-scholarship-report') {
        const sampleRes = await fetchSampleData();
        setReport(sampleRes.report);
      } else {
        const res = await getReport(id);
        setReport(res.report);
      }
    } catch (err: any) {
      console.warn('Failed to load report from server, trying sample fallback:', err);
      try {
        const sampleRes = await fetchSampleData();
        setReport(sampleRes.report);
      } catch (fallbackErr: any) {
        setError(`Failed to retrieve report: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (val: string) => {
    navigate(`/report/${id}/${val}`);
  };

  const handleRerun = async () => {
    if (!report) return;
    setIsRerunning(true);
    try {
      const inputs = report.sources.map(s => ({
        id: s.id,
        type: s.type,
        value: s.type === 'url' ? s.url! : s.rawText,
        title: s.title
      }));
      const res = await startAnalysis(report.question, inputs, true);
      navigate(`/analyzing/${res.jobId}`);
    } catch (err: any) {
      setError(`Re-run failed: ${err.message}`);
      setIsRerunning(false);
    }
  };

  // Copy checklist as Markdown directly from the header
  const handleCopyChecklist = () => {
    if (!report) return;
    let md = `# Verification Checklist — ${report.question}\n\n`;
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    for (const item of report.checklist) {
      md += `- [ ] **${item.title}** (${item.priority} Priority)\n`;
      md += `  - *Reason:* ${item.description}\n`;
      md += `  - *Authority to contact:* ${item.suggestedOfficialSource}\n\n`;
    }
    navigator.clipboard.writeText(md).then(() => {
      setCopiedChecklist(true);
      setTimeout(() => setCopiedChecklist(false), 2000);
    });
  };

  // 7. Loading Skeleton (Clean editorial blocks, NO spinner)
  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-3 border-b border-seed/10 pb-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 bg-seed/10 rounded-xs" />
            <div className="h-4 w-32 bg-seed/5 rounded-xs" />
            <div className="h-4 w-24 bg-seed/5 rounded-xs" />
          </div>
          <div className="h-8 w-3/4 bg-seed/10 rounded-xs" />
        </div>

        {/* Signal Strip Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-seed/10 border border-seed/10 rounded-sm bg-pith">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-3 w-20 bg-seed/10 rounded-xs" />
              <div className="h-7 w-12 bg-seed/15 rounded-xs" />
            </div>
          ))}
        </div>

        {/* 2-Column Main Body Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 h-[320px] rounded-sm border border-seed/10 bg-seed/[0.02]" />
          <div className="lg:col-span-7 h-[320px] rounded-sm border border-seed/10 bg-seed/[0.02]" />
        </div>
      </div>
    );
  }

  // Error / Failed Analysis State
  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-5">
        <div className="p-5 rounded-sm bg-flesh/10 text-seed border border-flesh/30 space-y-2">
          <AlertCircle className="w-6 h-6 text-flesh mx-auto" />
          <h3 className="font-heading font-bold text-base text-seed">Analysis Could Not Be Loaded</h3>
          <p className="text-xs text-seed-muted">{error || 'Report could not be retrieved from the server or cache.'}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry Load
          </Button>
          <Button variant="rind" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Return to Investigation Home
          </Button>
        </div>
      </div>
    );
  }

  const shortSessionId = id ? (id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id) : 'sample';
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText, count: null },
    { id: 'gaps', label: 'Potential Gaps', icon: SeedIcon, count: report.metrics.gapsCount },
    { id: 'conflicts', label: 'Possible Conflicts', icon: CrackIcon, count: report.metrics.conflictsCount },
    { id: 'freshness', label: 'Freshness Warnings', icon: WiltIcon, count: report.metrics.staleCount },
    { id: 'checklist', label: 'Verification Checklist', icon: BowlIcon, count: report.checklist.length },
    { id: 'sources', label: 'Reviewed Sources', icon: VerifiedCheckIcon, count: report.sources.length },
  ];

  return (
    <ReportContext.Provider
      value={{
        report,
        selectedAttribute,
        setSelectedAttribute,
        refetchReport: loadData
      }}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8 pb-16">
        {/* 1. HEADER */}
        <div className="space-y-3 border-b border-seed/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-semibold px-2 py-0.5 rounded-xs bg-rind/10 text-rind border border-rind/20">
                Research report
              </span>
              <span className="text-xs text-seed-muted font-mono">
                Session: <strong className="text-seed">{shortSessionId}</strong>
              </span>
              <span className="text-seed-muted/40">•</span>
              <span className="text-xs text-seed-muted">
                {reportDate}
              </span>
              <span className="text-seed-muted/40">•</span>
              <span className="text-xs text-seed-muted flex items-center gap-1 font-sans">
                <Sparkles className="w-3 h-3 text-rind" />
                {report.analyzedWith.provider ? (
                  <>Analyzed with: <strong className="text-seed font-mono">{report.analyzedWith.provider}</strong></>
                ) : (
                  <strong className="text-seed font-mono">Sample data</strong>
                )}
                {report.analyzedWith.cached && (
                  <span className="text-[10px] text-seed-muted/70 font-mono">(cached)</span>
                )}
              </span>
            </div>

            {/* Header Action Buttons: Re-run & Copy checklist */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyChecklist}
                className="text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedChecklist ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-rind" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-seed-muted" />
                    <span>Copy checklist</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRerun}
                disabled={isRerunning}
                className="text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRerunning ? 'animate-spin' : ''}`} />
                <span>Re-run</span>
              </Button>
            </div>
          </div>

          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold text-seed tracking-tight leading-snug">
            &ldquo;{report.question}&rdquo;
          </h1>
        </div>

        {/* 2. SIGNAL STRIP: 4 compact counters with hairline dividers & 0.6s count-up */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-seed/10 border border-seed/10 rounded-sm bg-pith">
          {/* Sources */}
          <button
            type="button"
            onClick={() => handleTabChange('sources')}
            className="p-4 text-left hover:bg-seed/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Sources
              </span>
              <VerifiedCheckIcon className="w-3.5 h-3.5 text-rind" />
            </div>
            <div className="font-mono text-2xl font-bold text-seed mt-1">
              <CounterNumber value={report.metrics.sourcesCount} />
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-rind transition-colors">
              Inspected & verified →
            </span>
          </button>

          {/* Potential Gaps */}
          <button
            type="button"
            onClick={() => handleTabChange('gaps')}
            className="p-4 text-left hover:bg-seed/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Potential gaps
              </span>
              <SeedIcon className="w-3.5 h-3.5 fill-current text-seed" />
            </div>
            <div className="font-mono text-2xl font-bold text-seed mt-1">
              <CounterNumber value={report.metrics.gapsCount} />
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-seed transition-colors">
              Missing parameters →
            </span>
          </button>

          {/* Possible Conflicts */}
          <button
            type="button"
            onClick={() => handleTabChange('conflicts')}
            className="p-4 text-left hover:bg-seed/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Possible conflicts
              </span>
              <CrackIcon className="w-3.5 h-3.5 text-crack" />
            </div>
            <div className="font-mono text-2xl font-bold text-crack mt-1">
              <CounterNumber value={report.metrics.conflictsCount} />
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-crack transition-colors">
              Value contradictions →
            </span>
          </button>

          {/* Stale or undated */}
          <button
            type="button"
            onClick={() => handleTabChange('freshness')}
            className="p-4 text-left hover:bg-seed/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Stale or undated
              </span>
              <WiltIcon className="w-3.5 h-3.5 text-wilt" />
            </div>
            <div className="font-mono text-2xl font-bold text-wilt mt-1">
              <CounterNumber value={report.metrics.staleCount} />
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-wilt transition-colors">
              Temporal warnings →
            </span>
          </button>
        </div>

        {/* 3. MAIN BODY, two columns (stack on mobile) */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Half-Melon Slice View */}
            <div className="lg:col-span-5">
              <HalfMelonSliceView
                reportId={report.id}
                matrix={report.coverageMatrix}
                selectedAttribute={selectedAttribute}
                onSelectAttribute={(attr) => setSelectedAttribute(selectedAttribute === attr ? null : attr)}
              />
            </div>

            {/* Right: Coverage Matrix Table */}
            <div className="lg:col-span-7">
              <CoverageMatrixTable
                reportId={report.id}
                matrix={report.coverageMatrix}
                sources={report.sources}
                selectedAttribute={selectedAttribute}
                onSelectAttribute={(attr) => setSelectedAttribute(selectedAttribute === attr ? null : attr)}
              />
            </div>
          </div>

          {/* Under both: Expected information disclaimer with edit link */}
          <div className="flex items-center justify-between text-xs text-seed-muted px-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-rind shrink-0" />
              <span>Expected information list is AI-suggested and editable</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-rind hover:underline font-medium cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit question & parameters</span>
            </button>
          </div>
        </div>

        {/* 4. TABS (nested routes with shared layoutId indicator 0.2s) */}
        <div className="border-b border-seed/10">
          <nav className="flex items-center gap-1 sm:gap-6 overflow-x-auto" aria-label="Report sections">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id || (tab.id === 'summary' && currentTab === 'evidence');
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative py-3 px-1 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "text-seed font-semibold"
                      : "text-seed-muted hover:text-seed"
                  )}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={cn(
                      "font-mono text-[10px] px-1.5 py-0.2 rounded-xs",
                      isActive ? "bg-seed/10 text-seed font-semibold" : "bg-seed/5 text-seed-muted"
                    )}>
                      {tab.count}
                    </span>
                  )}

                  {/* Shared layoutId indicator for smooth 0.2s tab transitions */}
                  {isActive && (
                    <motion.div
                      layoutId="dashboard-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-rind rounded-full"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Outlet for active nested tab */}
        <div className="pt-2">
          <Outlet />
        </div>

        {/* 8. FOOTER DISCLAIMER */}
        <div className="p-3.5 rounded-sm bg-seed/[0.02] border border-seed/10 flex items-center gap-2.5 text-xs text-seed-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-flesh shrink-0" />
          <span>
            <strong className="text-seed font-semibold">Potential signals, not verified facts.</strong> Always inspect primary sources before taking decisions.
          </span>
        </div>
      </div>
    </ReportContext.Provider>
  );
};
