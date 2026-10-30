import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Counter } from '@/components/ui/counter';
import { Button } from '@/components/ui/button';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon, BowlIcon } from '@/components/common/Icons';
import { FullAnalysisReport } from '@/lib/types';
import { getReport, fetchSampleData, startAnalysis } from '@/lib/api';
import { HalfMelonSliceView } from '@/components/visual/HalfMelonSliceView';
import { CoverageMatrixTable } from '@/components/visual/CoverageMatrixTable';
import { ReportContext } from './ReportContext';
import { RefreshCw, Sparkles, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

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
        <Loader2 className="w-10 h-10 animate-spin text-rind" />
        <span className="text-sm font-semibold text-seed-muted">Loading Information Audit...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-flesh/10 text-flesh border border-flesh/30">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-heading font-bold text-lg">Unable to Load Report</h3>
          <p className="text-xs mt-1">{error || 'Report not found.'}</p>
        </div>
        <Button variant="rind" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Return to Detection Home
        </Button>
      </div>
    );
  }

  return (
    <ReportContext.Provider
      value={{
        report,
        selectedAttribute,
        setSelectedAttribute,
        refetchReport: loadData
      }}
    >
      <div className="space-y-8 pb-16">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rind/15 text-rind">
                Audited Report
              </span>
              <span className="text-xs text-seed-muted flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-rind" />
                Analyzed with: <strong className="text-seed">{report.analyzedWith.provider}</strong>
                {report.analyzedWith.cached && (
                  <span className="px-1.5 py-0.2 rounded bg-pith-muted text-[10px] text-seed-muted">
                    (cached)
                  </span>
                )}
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-seed tracking-tight">
              "{report.question}"
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRerun}
              disabled={isRerunning}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRerunning ? 'animate-spin' : ''}`} />
              Re-run Fresh
            </Button>
          </div>
        </div>

        {/* Counter Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Counter
            value={report.metrics.sourcesCount}
            label="Sources Reviewed"
            icon={<VerifiedCheckIcon className="w-4 h-4" />}
            variant="rind"
            subtext="Inspected"
            onClick={() => handleTabChange('sources')}
          />
          <Counter
            value={report.metrics.gapsCount}
            label="Potential Gaps"
            icon={<SeedIcon className="w-4 h-4 fill-current" />}
            variant="seed"
            subtext="Black seeds"
            onClick={() => handleTabChange('gaps')}
          />
          <Counter
            value={report.metrics.conflictsCount}
            label="Possible Conflicts"
            icon={<CrackIcon className="w-4 h-4" />}
            variant="crack"
            subtext="Contradictions"
            onClick={() => handleTabChange('conflicts')}
          />
          <Counter
            value={report.metrics.staleCount}
            label="Potentially Stale"
            icon={<WiltIcon className="w-4 h-4" />}
            variant="wilt"
            subtext="Dated/prior cycle"
            onClick={() => handleTabChange('freshness')}
          />
        </div>

        {/* Half-Melon Slice View & Accessible Matrix (Side by Side / Stacked) */}
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

        {/* Tabs Bar */}
        <div className="border-b border-border pb-2 pt-2">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="gaps" className="flex items-center gap-1.5">
                <SeedIcon className="w-3.5 h-3.5 fill-current" />
                <span>Gaps ({report.metrics.gapsCount})</span>
              </TabsTrigger>
              <TabsTrigger value="conflicts" className="flex items-center gap-1.5">
                <CrackIcon className="w-3.5 h-3.5" />
                <span>Conflicts ({report.metrics.conflictsCount})</span>
              </TabsTrigger>
              <TabsTrigger value="freshness" className="flex items-center gap-1.5">
                <WiltIcon className="w-3.5 h-3.5" />
                <span>Freshness ({report.metrics.staleCount})</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-1.5">
                <BowlIcon className="w-3.5 h-3.5" />
                <span>Checklist ({report.checklist.length})</span>
              </TabsTrigger>
              <TabsTrigger value="sources">Sources ({report.sources.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Outlet for active nested tab */}
        <Outlet />
      </div>
    </ReportContext.Provider>
  );
};
