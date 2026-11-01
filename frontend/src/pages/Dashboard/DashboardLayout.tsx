import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon, BowlIcon } from '@/components/common/Icons';
import { FullAnalysisReport } from '@/lib/types';
import { getReport, fetchSampleData, startAnalysis } from '@/lib/api';
import { CoverageMap } from '@/components/visual/CoverageMap';
import { KeyFactsTable } from '@/components/visual/KeyFactsTable';
import { KeyDatesBlock } from '@/components/visual/KeyDatesBlock';
import { ReportContext } from './ReportContext';
import { extractSchemeInfo } from '@/lib/scheme';
import { RefreshCw, Sparkles, AlertCircle, AlertTriangle, ArrowLeft, FileText, Info, Copy, Check, Edit3, ArrowRight, Layers } from 'lucide-react';
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
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const tabsNavRef = useRef<HTMLDivElement>(null);

  // Extract current tab from pathname e.g. /report/123/conflicts -> 'conflicts'
  const pathParts = location.pathname.split('/');
  const currentTab = pathParts[3] || 'summary';

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (id.startsWith('sample-') || id === 'sample') {
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
    // Reset scroll to top on initial report load so it never starts in the middle
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [loadData]);

  // Smoothly scroll to target accounting for prefers-reduced-motion and sticky header offset
  const smoothScrollToTarget = (el: HTMLElement | null) => {
    if (!el) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start'
    });
    el.focus({ preventScroll: true });
  };

  // Tab change: Smoothly bring tabs section into view
  const handleTabChange = (val: string) => {
    navigate(`/report/${id}/${val}`, { preventScrollReset: true });
    setTimeout(() => {
      if (tabsNavRef.current) {
        smoothScrollToTarget(tabsNavRef.current);
      }
    }, 50);
  };

  // Signal strip counter click: smoothly scroll down to the tabs section and move focus
  const handleSignalStripClick = (val: string) => {
    navigate(`/report/${id}/${val}`, { preventScrollReset: true });
    setTimeout(() => {
      if (tabsNavRef.current) {
        smoothScrollToTarget(tabsNavRef.current);
      }
    }, 50);
  };

  const handleRerun = async () => {
    if (!report) return;
    setIsRerunning(true);
    try {
      const inputs = report.sources.map((s) => ({
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

  // Loading Skeleton
  if (loading) {
    return (
      <div className="max-w-275 mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
        <div className="space-y-3 border-b border-seed/10 pb-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 bg-seed/10 rounded-xs" />
            <div className="h-4 w-32 bg-seed/5 rounded-xs" />
            <div className="h-4 w-24 bg-seed/5 rounded-xs" />
          </div>
          <div className="h-8 w-3/4 bg-seed/10 rounded-xs" />
        </div>

        <div className="h-10 w-full bg-seed/5 rounded-xs" />
        <div className="h-24 w-full bg-seed/5 rounded-xs" />

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-seed/10 border border-seed/10 rounded-sm bg-pith">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-3 w-20 bg-seed/10 rounded-xs" />
              <div className="h-7 w-12 bg-seed/15 rounded-xs" />
            </div>
          ))}
        </div>

        <div className="h-85 rounded-sm border border-seed/10 bg-seed/2" />
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

  // Top 5 checklist items for "Verify next" section (High priority first)
  const priorityRank: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
  const topChecklistItems = [...report.checklist]
    .sort((a, b) => (priorityRank[a.priority] || 4) - (priorityRank[b.priority] || 4))
    .slice(0, 5);

  const fullSourcesCount = report.sources.filter(s => s.status === 'ready' && !s.isLimited && s.sourceType !== 'limited').length;
  const limitedSourcesCount = report.sources.filter(s => s.isLimited || s.sourceType === 'limited').length;

  const schemeInfo = extractSchemeInfo(report);

  const cycleWarning = report.freshnessWarnings?.find(w => w.warningType === 'earlier_cycle');
  const cycleNotice = report.cycleNotice || (cycleWarning?.detectedCycle
    ? `The reviewed sources refer to the "${cycleWarning.detectedCycle}" cycle, which precedes the current decision period. Treat dates and values as potentially outdated.`
    : undefined);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText, count: null },
    { id: 'gaps', label: 'Potential Gaps', icon: SeedIcon, count: report.metrics.gapsCount },
    { id: 'conflicts', label: 'Possible Conflicts', icon: CrackIcon, count: report.metrics.conflictsCount },
    { id: 'freshness', label: 'Freshness Warnings', icon: WiltIcon, count: report.metrics.staleCount },
    { id: 'checklist', label: 'Verification Checklist', icon: BowlIcon, count: report.checklist.length },
    { id: 'claims', label: 'All claims', icon: Layers, count: report.claims.length },
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
      <div className="max-w-275 mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-7 pb-16 overflow-x-clip">
        {/* 1. HEADER (question, session ID, date, "Analyzed with" or "Sample data", Re-run, Copy checklist) */}
        <div className="radial-structure-glow space-y-3 border-b border-seed/10 pb-5 p-4 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-semibold px-2 py-0.5 rounded-xs bg-structure/10 text-structure-text border border-structure-text/20">
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
                <Sparkles className="w-3 h-3 text-structure-text" />
                {report.analyzedWith?.provider ? (
                  <>Analyzed with: <strong className="text-seed font-mono">{report.analyzedWith.provider}</strong></>
                ) : (
                  <strong className="text-seed font-mono">Verified sources</strong>
                )}
                {report.analyzedWith?.cached && (
                  <span className="text-[10px] text-seed-muted/70 font-mono">(cached)</span>
                )}
              </span>
            </div>

            {/* Header Action Buttons: Re-run & Copy checklist */}
            <div className="flex flex-wrap items-center gap-2">
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

          {/* Topic & Verified Authority Badge */}
          {schemeInfo.isSpecific && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-rind/15 text-rind border border-rind/30 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rind" />
                <span>Topic: <strong className="text-seed font-bold underline decoration-rind/40">{schemeInfo.name}</strong></span>
                {schemeInfo.cycle && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-2xs bg-rind/20 text-[10px] font-mono">
                    Cycle {schemeInfo.cycle}
                  </span>
                )}
              </span>
              {schemeInfo.hasOfficialSource && schemeInfo.officialDomain && (
                <span className="text-xs text-seed-muted flex items-center gap-1 font-mono">
                  Official source: <span className="text-seed font-medium underline decoration-seed/30">{schemeInfo.officialDomain}</span>
                </span>
              )}
            </div>
          )}

          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold text-seed tracking-tight leading-snug">
            &ldquo;{report.question}&rdquo;
          </h1>
        </div>

        {/* 2. CYCLE NOTICE (If earlier cycle detected) */}
        {cycleNotice && (
          <div
            onClick={() => handleTabChange('freshness')}
            className="p-3.5 sm:p-4 rounded-sm bg-wilt/10 border border-wilt/30 flex items-start justify-between gap-3 text-xs text-seed cursor-pointer hover:bg-wilt/15 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <WiltIcon className="w-4 h-4 text-wilt shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-heading font-bold text-seed flex items-center gap-2">
                  <span>Cycle notice</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-2xs bg-wilt/20 text-wilt border border-wilt/30">
                    Potentially outdated
                  </span>
                </div>
                <p className="text-seed-muted leading-relaxed font-sans">
                  {cycleNotice}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-wilt hover:underline shrink-0 hidden sm:inline-flex items-center gap-1 pt-0.5">
              <span>View freshness</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* 3. VERIFY NEXT: Top 5 checklist items (High priority first) */}
        {topChecklistItems.length > 0 && (
          <div className="p-4 sm:p-5 rounded-sm border border-seed/10 bg-pith space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crack" />
                <h3 className="font-heading font-bold text-xs sm:text-sm text-seed">
                  Verify next
                </h3>
                <span className="text-xs text-seed-muted hidden sm:inline">
                  — High priority items before making decisions
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('checklist')}
                className="text-xs text-structure-text hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View full checklist ({report.checklist.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topChecklistItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => handleTabChange('checklist')}
                  className="p-3.5 rounded-xs border border-seed/10 bg-seed/1.5 hover:border-rind/30 transition-colors cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs border",
                        item.priority === 'High'
                          ? "bg-flesh/10 text-flesh border-flesh/20"
                          : "bg-crack/10 text-crack border-crack/20"
                      )}
                    >
                      {item.priority} Priority
                    </span>
                    <span className="text-[10px] text-seed-muted font-sans truncate max-w-30">
                      {item.signalTag}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-xs text-seed line-clamp-1 group-hover:text-rind transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-seed-muted line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. KEY FACTS BLOCK (Compact table with one row per canonical parameter, max 12) */}
        <KeyFactsTable
          report={report}
          onSelectAttribute={(attr) => setSelectedAttribute(attr)}
        />

        {/* 5. KEY DATES BLOCK (Deadlines, validity, events, passed collapsed) */}
        <KeyDatesBlock report={report} />

        {/* 4. SIGNAL STRIP: 4 counters with hairline dividers */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-seed/10 border border-seed/10 rounded-sm bg-pith shadow-2xs">
          {/* Sources */}
          <button
            type="button"
            onClick={() => handleSignalStripClick('sources')}
            className="p-4 text-left hover:bg-seed/2 transition-colors cursor-pointer group"
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
            <div className="text-[11px] text-seed-muted mt-0.5 space-y-0.5">
              <span className="block font-medium text-seed">
                {fullSourcesCount} full, {limitedSourcesCount} limited
              </span>
              <span className="text-[10px] text-seed-muted/80 group-hover:text-rind transition-colors block">
                Inspected & verified →
              </span>
            </div>
          </button>

          {/* Potential Gaps */}
          <button
            type="button"
            onClick={() => handleSignalStripClick('gaps')}
            className="p-4 text-left hover:bg-seed/2 transition-colors cursor-pointer group"
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
            onClick={() => handleSignalStripClick('conflicts')}
            className="p-4 text-left hover:bg-seed/2 transition-colors cursor-pointer group"
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

          {/* Outdated & Undated */}
          <button
            type="button"
            onClick={() => handleSignalStripClick('freshness')}
            className="p-4 text-left hover:bg-seed/2 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Outdated & Undated
              </span>
              <WiltIcon className="w-3.5 h-3.5 text-wilt" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <div className="font-mono text-2xl font-bold text-wilt">
                <CounterNumber value={typeof report.metrics.outdatedCount === 'number' ? report.metrics.outdatedCount : (report.sources.filter(s => s.isStale).length)} />
                <span className="text-xs font-sans font-normal text-seed-muted ml-1">outdated</span>
              </div>
              <span className="text-xs font-mono text-seed-muted/60">•</span>
              <div className="font-mono text-base font-semibold text-seed-muted">
                <CounterNumber value={typeof report.metrics.undatedCount === 'number' ? report.metrics.undatedCount : (report.sources.filter(s => s.isUndated).length)} />
                <span className="text-[11px] font-sans font-normal ml-1">undated</span>
              </div>
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-wilt transition-colors">
              Temporal warnings →
            </span>
          </button>
        </div>

        {/* 5. COVERAGE MAP (Full width with compact / collapse toggle) */}
        <div className="space-y-2.5">
          {/* Low Coverage Warning Banner */}
          {report.coverageMatrix.length > 0 &&
            report.coverageMatrix.filter(row => row.overallStatus === 'gap' || (row as any).overallStatus === 'missing').length >= report.coverageMatrix.length / 2 && (
              <div className="p-3.5 rounded-sm bg-crack/10 border border-crack/25 flex flex-wrap items-center justify-between gap-3 text-xs text-crack">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">
                    Most parameters were not covered by the reviewed sources. Add sources or retry discovery.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/', { state: { question: report.question } })}
                  className="text-xs font-semibold text-seed hover:underline shrink-0 font-mono cursor-pointer"
                >
                  Add sources or retry →
                </button>
              </div>
            )}

          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-seed-muted font-sans">
              Parameter verification matrix across {report.sources.length} sources
            </span>
            <button
              type="button"
              onClick={() => setIsMapCollapsed(!isMapCollapsed)}
              className="text-xs font-mono text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              {isMapCollapsed ? 'Expand Coverage Map ▼' : 'Collapse Coverage Map ▲'}
            </button>
          </div>

          {!isMapCollapsed ? (
            <CoverageMap
              reportId={report.id}
              matrix={report.coverageMatrix}
              sources={report.sources}
              selectedAttribute={selectedAttribute}
              onSelectAttribute={(attr) => setSelectedAttribute(selectedAttribute === attr ? null : attr)}
            />
          ) : (
            <div
              onClick={() => setIsMapCollapsed(false)}
              className="p-3.5 rounded-sm border border-seed/10 bg-seed/2 flex items-center justify-between text-xs text-seed-muted hover:border-rind/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold text-seed">Coverage Map (Collapsed)</span>
                <span>•</span>
                <span>{report.coverageMatrix.length} parameters inspected</span>
                <span>•</span>
                <span className="text-rind font-medium">Click to expand matrix</span>
              </div>
              <span className="text-rind font-mono text-xs">Expand ▼</span>
            </div>
          )}

          {/* Under Coverage Map: Expected information disclaimer with edit link */}
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

        {/* 6. TABS (nested routes with shared layoutId underline 0.2s) */}
        <div ref={tabsNavRef} tabIndex={-1} className="border-b border-seed/10 pt-2 scroll-mt-24 focus:outline-none">
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
                    <span
                      className={cn(
                        "font-mono text-[10px] px-1.5 py-0.2 rounded-xs",
                        isActive ? "bg-seed/10 text-seed font-semibold" : "bg-seed/5 text-seed-muted"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}

                  {/* Shared layoutId indicator for smooth 0.2s tab transitions */}
                  {isActive && (
                    <motion.div
                      layoutId="dashboard-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-structure-text rounded-full"
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

        {/* 7. FOOTER DISCLAIMER */}
        <div className="p-3.5 rounded-sm bg-seed/2 border border-seed/10 flex items-center gap-2.5 text-xs text-seed-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-flesh shrink-0" />
          <span>
            <strong className="text-seed font-semibold">Potential signals, not verified facts.</strong> Always inspect primary sources before taking decisions.
          </span>
        </div>
      </div>
    </ReportContext.Provider>
  );
};