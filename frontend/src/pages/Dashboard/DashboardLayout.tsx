import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon, BowlIcon } from '@/components/common/Icons';
import { FullAnalysisReport } from '@/lib/types';
import { getReport, fetchSampleData, startAnalysis } from '@/lib/api';
import { HalfMelonSliceView } from '@/components/visual/HalfMelonSliceView';
import { CoverageMatrixTable } from '@/components/visual/CoverageMatrixTable';
import { ReportContext } from './ReportContext';
import { RefreshCw, Sparkles, AlertCircle, ArrowLeft, Loader2, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rind" />
        <span className="text-xs font-mono uppercase tracking-wider text-seed-muted">
          Loading Investigation Report...
        </span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-sm bg-flesh/10 text-flesh border border-flesh/30">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <h3 className="font-heading font-bold text-base">Unable to Load Report</h3>
          <p className="text-xs mt-1">{error || 'Report could not be retrieved.'}</p>
        </div>
        <Button variant="rind" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Return to Investigation Home
        </Button>
      </div>
    );
  }

  const shortSessionId = id ? (id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id) : '';
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
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-8 pb-16">
        {/* Header Strip */}
        <div className="space-y-3 border-b border-seed/10 pb-6">
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
              <span className="text-xs text-seed-muted flex items-center gap-1">
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleRerun}
              disabled={isRerunning}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRerunning ? 'animate-spin' : ''}`} />
              Re-run Fresh
            </Button>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-seed tracking-tight">
            "{report.question}"
          </h1>
        </div>

        {/* Signal Strip: 4 compact hairline-separated counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-seed/10 border border-seed/10 rounded-sm bg-pith">
          {/* Sources Reviewed */}
          <button
            type="button"
            onClick={() => handleTabChange('sources')}
            className="p-4 text-left hover:bg-seed/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Sources reviewed
              </span>
              <VerifiedCheckIcon className="w-3.5 h-3.5 text-rind" />
            </div>
            <div className="font-mono text-2xl font-bold text-seed mt-1">
              {report.metrics.sourcesCount}
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
              {report.metrics.gapsCount}
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
              {report.metrics.conflictsCount}
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-crack transition-colors">
              Value contradictions →
            </span>
          </button>

          {/* Stale / Prior Cycle */}
          <button
            type="button"
            onClick={() => handleTabChange('freshness')}
            className="p-4 text-left hover:bg-seed/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-seed-muted font-medium">
                Stale / undated
              </span>
              <WiltIcon className="w-3.5 h-3.5 text-wilt" />
            </div>
            <div className="font-mono text-2xl font-bold text-wilt mt-1">
              {report.metrics.staleCount}
            </div>
            <span className="text-[11px] text-seed-muted group-hover:text-wilt transition-colors">
              Temporal warnings →
            </span>
          </button>
        </div>

        {/* Two-Column Body: Half-Melon Slice View & Accessible Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <HalfMelonSliceView
              matrix={report.coverageMatrix}
              selectedAttribute={selectedAttribute}
              onSelectAttribute={(attr) => setSelectedAttribute(selectedAttribute === attr ? null : attr)}
            />
          </div>
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

        {/* Plain Underlined Tab Bar */}
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
                    "py-3 px-1 text-xs font-medium border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "border-rind text-seed font-semibold"
                      : "border-transparent text-seed-muted hover:text-seed hover:border-seed/20"
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Outlet for active nested tab */}
        <div className="pt-2">
          <Outlet />
        </div>

        {/* Footer Disclaimer Banner */}
        <div className="p-3.5 rounded-sm bg-seed/[0.02] border border-seed/10 flex items-center gap-2.5 text-xs text-seed-muted">
          <Info className="w-4 h-4 text-rind shrink-0" />
          <span>
            <strong className="text-seed font-semibold">Disclosure:</strong> Potential signals, not verified facts. Cross-examine primary sources before making decisions.
          </span>
        </div>
      </div>
    </ReportContext.Provider>
  );
};
