import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox';
import { getDiscoveryJob, startAnalysis, SourcePayload, DiscoveredSource } from '@/lib/api';
import {
  Search,
  Globe,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  ExternalLink,
  Info,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const Discover: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [sources, setSources] = useState<DiscoveredSource[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [message, setMessage] = useState('Finding relevant sources automatically...');

  // Manual source add state
  const [extraUrl, setExtraUrl] = useState('');
  const [extraText, setExtraText] = useState('');
  const [extraTextTitle, setExtraTextTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable Expected Attributes state
  const [attributes, setAttributes] = useState<string[]>([
    'application_deadline',
    'eligibility_income_limit',
    'required_documents',
    'official_application_portal',
    'selection_process',
    'award_amount'
  ]);
  const [newAttrInput, setNewAttrInput] = useState('');

  const handleAddAttribute = () => {
    const trimmed = newAttrInput.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    if (!trimmed) return;
    if (attributes.includes(trimmed)) return;
    setAttributes(prev => [...prev, trimmed]);
    setNewAttrInput('');
  };

  const handleRemoveAttribute = (attr: string) => {
    setAttributes(prev => prev.filter(a => a !== attr));
  };

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    let isCancelled = false;

    const pollJob = async () => {
      try {
        const data = await getDiscoveryJob(id);
        if (isCancelled) return;

        const job = data.job;
        setQuestion(job.question);
        setMessage(job.message);
        if (Array.isArray(job.queriesGenerated)) {
          setQueries(job.queriesGenerated);
        }

        if (job.status === 'ready') {
          setSources(job.sourcesFound || []);
          // By default, select all discovered sources
          setSelectedUrls(new Set((job.sourcesFound || []).map((s: any) => s.url)));
          setLoading(false);
        } else if (job.status === 'error') {
          setError(job.error || 'Source discovery failed');
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to poll discovery job');
          setLoading(false);
        }
      }
    };

    pollJob();
    const interval = setInterval(pollJob, 800);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [id, navigate]);

  const toggleSourceSelection = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleAddExtraUrl = () => {
    const trimmed = extraUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      let domain = 'custom-source';
      try {
        domain = new URL(trimmed).hostname;
      } catch {}

      const newSrc: DiscoveredSource = {
        title: trimmed,
        url: trimmed,
        snippet: 'Manually added custom source URL.',
        domain,
        isOfficial: domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.nic.in')
      };

      setSources(prev => [newSrc, ...prev]);
      setSelectedUrls(prev => new Set([...prev, trimmed]));
      setExtraUrl('');
    } catch {
      setError('Please enter a valid HTTP or HTTPS URL.');
    }
  };

  const handleAddExtraText = () => {
    const trimmed = extraText.trim();
    if (trimmed.length < 15) {
      setError('Pasted text must be at least 15 characters.');
      return;
    }

    const syntheticUrl = `text://custom-note-${Date.now()}`;
    const newSrc: DiscoveredSource = {
      title: extraTextTitle.trim() || 'Custom Pasted Note',
      url: syntheticUrl,
      snippet: trimmed.slice(0, 200),
      domain: 'pasted-note',
      isOfficial: false
    };

    setSources(prev => [newSrc, ...prev]);
    setSelectedUrls(prev => new Set([...prev, syntheticUrl]));
    setExtraText('');
    setExtraTextTitle('');
    setError(null);
  };

  const handleAnalyzeSelected = async () => {
    const chosenSources: SourcePayload[] = sources
      .filter(s => selectedUrls.has(s.url))
      .map(s => {
        if (s.url.startsWith('text://')) {
          return {
            type: 'text',
            value: s.snippet,
            title: s.title
          };
        }
        return {
          type: 'url',
          value: s.url,
          title: s.title
        };
      });

    if (chosenSources.length === 0) {
      setError('Please select at least one source before proceeding with analysis.');
      return;
    }

    setIsSubmitting(true);
    try {
      // If sample dataset
      if (id?.includes('sample')) {
        navigate('/analyzing/sample-scholarship-report');
        return;
      }

      const res = await startAnalysis(question, chosenSources, false, attributes);
      navigate(`/analyzing/${res.jobId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-8 pb-16">
      {/* Top Header */}
      <div className="space-y-2 border-b border-seed/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-sans font-medium">
          <Search className="w-3 h-3" />
          <span>Automatic source discovery</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-seed tracking-tight">
          Discovered Sources
        </h1>
        <p className="text-seed-muted text-sm sm:text-base">
          Research Topic: <strong className="text-seed">"{question}"</strong>
        </p>
      </div>

      {/* Mandatory Disclaimer Note */}
      <div className="p-3.5 rounded-sm bg-seed/[0.02] border border-seed/10 flex items-center gap-2.5 text-xs text-seed-muted">
        <Info className="w-4 h-4 text-rind shrink-0" />
        <span>
          <strong className="text-seed font-semibold">Disclosure:</strong> Search results are not a complete view of the web. Review and select the sources you wish to cross-examine.
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-sm bg-flesh/10 border border-flesh/30 text-flesh flex items-start gap-2.5 text-xs font-medium" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading Search State */}
      {loading ? (
        <div className="p-8 sm:p-12 text-center space-y-4 border border-seed/10 rounded-sm bg-seed/[0.01]">
          <Loader2 className="w-7 h-7 animate-spin text-rind mx-auto" />
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-seed">{message}</h3>
            <p className="text-xs text-seed-muted max-w-md mx-auto">
              Running multi-angle search query generation across government, institutional, and reference portals...
            </p>
          </div>

          {queries.length > 0 && (
            <div className="pt-4 max-w-md mx-auto space-y-1.5 text-left">
              <span className="text-[11px] font-mono uppercase tracking-wider text-seed-muted block">
                Investigative Queries Formulated:
              </span>
              {queries.map((q, idx) => (
                <div key={idx} className="p-2 rounded-xs bg-pith text-xs font-mono text-seed border border-seed/10 truncate">
                  • {q}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Discovered Sources List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-seed-muted">
                {selectedUrls.size} of {sources.length} Sources Selected for Audit
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUrls(new Set(sources.map(s => s.url)))}
                  className="text-xs text-rind hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-seed-muted/50">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedUrls(new Set())}
                  className="text-xs text-seed-muted hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="divide-y divide-seed/10 border border-seed/10 rounded-sm">
              {sources.map((source, idx) => {
                const isSelected = selectedUrls.has(source.url);

                return (
                  <div
                    key={idx}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-pith' : 'bg-seed/[0.02] opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <AnimatedCheckbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSourceSelection(source.url)}
                        />
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                            {source.title}
                          </h4>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {source.isOfficial ? (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-rind/10 text-rind border border-rind/20 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Official Authority</span>
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-seed/5 text-seed-muted border border-seed/10 inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>Secondary Source</span>
                              </span>
                            )}
                            {source.limited && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-crack/10 text-crack border border-crack/20">
                                Limited Snippet
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-seed-muted font-mono">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 opacity-60" />
                            {source.domain}
                          </span>
                          {source.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 opacity-60" />
                              {source.date}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-seed-muted leading-relaxed line-clamp-2 pt-0.5">
                          {source.snippet}
                        </p>

                        {!source.url.startsWith('text://') && (
                          <div className="pt-1">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-rind hover:underline inline-flex items-center gap-1"
                            >
                              Visit external link
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supplement with Additional Sources */}
          <div className="p-5 rounded-sm border border-dashed border-seed/20 bg-seed/[0.01] space-y-4">
            <h4 className="font-heading font-bold text-sm text-seed flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rind" />
              Add Additional Sources (Optional)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Add Custom URL */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-seed block">Add Specific URL:</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={extraUrl}
                    onChange={(e) => setExtraUrl(e.target.value)}
                    placeholder="https://example.gov/specific-page"
                    className="flex-1 px-3 py-1.5 rounded-sm border border-seed/15 bg-pith text-xs focus:ring-1 focus:ring-rind text-seed placeholder:text-seed-muted/60"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddExtraUrl}>
                    Add URL
                  </Button>
                </div>
              </div>

              {/* Paste Text */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-seed block">Paste Document Excerpt:</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={extraTextTitle}
                    onChange={(e) => setExtraTextTitle(e.target.value)}
                    placeholder="Note Label"
                    className="w-full px-3 py-1 rounded-sm border border-seed/15 bg-pith text-xs text-seed"
                  />
                  <div className="flex gap-2">
                    <textarea
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      placeholder="Paste text notes..."
                      rows={1}
                      className="flex-1 p-2 rounded-sm border border-seed/15 bg-pith text-xs resize-none text-seed"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddExtraText}>
                      Add Text
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Attributes Configuration */}
          <div className="p-5 rounded-sm border border-seed/15 bg-pith space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-seed/10 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-seed">
                    Expected Audit Parameters
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-[11px] font-medium">
                    AI-suggested, editable
                  </span>
                </div>
                <p className="text-xs text-seed-muted">
                  Define which critical decision parameters the engine should extract, cross-examine, and audit for gaps.
                </p>
              </div>
            </div>

            {/* Chip List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-seed/5 border border-seed/10 text-xs text-seed font-mono"
                >
                  <span>{attr}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(attr)}
                    className="text-seed-muted hover:text-crack text-sm leading-none ml-0.5"
                    title="Remove parameter"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add new attribute */}
            <div className="flex gap-2 pt-2 max-w-md">
              <input
                type="text"
                value={newAttrInput}
                onChange={(e) => setNewAttrInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttribute();
                  }
                }}
                placeholder="e.g. stipend_amount, renewal_gpa"
                className="flex-1 px-3 py-1.5 rounded-sm border border-seed/15 bg-pith text-xs focus:ring-1 focus:ring-rind text-seed placeholder:text-seed-muted/60"
              />
              <Button variant="outline" size="sm" onClick={handleAddAttribute}>
                Add Parameter
              </Button>
            </div>
          </div>

          {/* Action Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-seed/10">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Change Question
            </Button>

            <Button
              variant="rind"
              size="lg"
              onClick={handleAnalyzeSelected}
              disabled={isSubmitting || selectedUrls.size === 0}
              className="px-8 font-bold"
            >
              {isSubmitting ? 'Starting Analysis...' : `Analyze Selected Sources (${selectedUrls.size})`}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
