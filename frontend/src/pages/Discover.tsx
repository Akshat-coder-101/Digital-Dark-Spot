import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox';
import { getDiscoveryJob, startAnalysis, startDiscovery, SourcePayload, DiscoveredSource } from '@/lib/api';
import {
  Search,
  Globe,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Info,
  ShieldCheck,
  FileText,
  Database,
  RefreshCw,
  Sparkles,
  X
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

  // Multi-URL Intake State (starts with URL 1 and URL 2 by default)
  const [urlList, setUrlList] = useState<string[]>(['', '']);
  const [extraText, setExtraText] = useState('');
  const [extraTextTitle, setExtraTextTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable Expected Attributes state (Topic-tailored from discovery)
  const [attributes, setAttributes] = useState<string[]>([]);
  const [hasCustomizedAttributes, setHasCustomizedAttributes] = useState(false);
  const [newAttrInput, setNewAttrInput] = useState('');

  const handleAddAttribute = () => {
    const trimmed = newAttrInput.trim();
    if (!trimmed) return;
    if (attributes.some(a => a.toLowerCase() === trimmed.toLowerCase())) return;
    setAttributes(prev => [...prev, trimmed]);
    setHasCustomizedAttributes(true);
    setNewAttrInput('');
  };

  const handleRemoveAttribute = (attr: string) => {
    setAttributes(prev => prev.filter(a => a !== attr));
    setHasCustomizedAttributes(true);
  };

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    let isCancelled = false;

    const pollJob = async () => {
      try {
        const data = await getDiscoveryJob(id, question);
        if (isCancelled) return;

        const job = data.job;
        setQuestion(job.question);
        setMessage(job.message);
        if (Array.isArray(job.queriesGenerated)) {
          setQueries(job.queriesGenerated);
        }

        if (Array.isArray(job.suggestedAttributes) && job.suggestedAttributes.length > 0 && !hasCustomizedAttributes) {
          const formatted = job.suggestedAttributes.map((a: string) => {
            const cleaned = a.replace(/_/g, ' ').trim();
            return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          });
          setAttributes(formatted);
        }

        if (job.status === 'ready') {
          const found = job.sourcesFound || [];
          setSources(found);
          // By default, select all discovered sources
          setSelectedUrls(new Set(found.map((s: any) => s.url)));
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

  // Multi-URL Handlers
  const updateUrlItem = (index: number, val: string) => {
    setUrlList(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const addUrlRow = () => {
    setUrlList(prev => [...prev, '']);
  };

  const removeUrlRow = (index: number) => {
    setUrlList(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']));
  };

  const handleAddAllUrls = () => {
    const validUrls: string[] = [];
    const invalidEntries: string[] = [];

    for (const raw of urlList) {
      const parts = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        try {
          new URL(p);
          validUrls.push(p);
        } catch {
          invalidEntries.push(p);
        }
      }
    }

    if (validUrls.length === 0) {
      if (invalidEntries.length > 0) {
        setError('Please enter valid HTTP or HTTPS URLs (e.g. https://example.gov/doc).');
      } else {
        setError('Please enter at least one URL before adding.');
      }
      return;
    }

    const newSources: DiscoveredSource[] = validUrls.map(trimmed => {
      let domain = 'custom-source';
      try {
        domain = new URL(trimmed).hostname;
      } catch {}

      return {
        title: trimmed,
        url: trimmed,
        snippet: 'User-provided source URL for gap verification.',
        domain,
        isOfficial:
          domain.endsWith('.gov') ||
          domain.endsWith('.gov.in') ||
          domain.endsWith('.edu') ||
          domain.endsWith('.ac.in') ||
          domain.endsWith('.nic.in'),
        sourceType: 'user_url'
      };
    });

    setSources(prev => [...newSources, ...prev]);
    setSelectedUrls(prev => {
      const next = new Set(prev);
      validUrls.forEach(u => next.add(u));
      return next;
    });

    // Reset to 2 empty rows for next additions
    setUrlList(['', '']);
    setError(null);
  };

  const handleAddExtraText = () => {
    const trimmed = extraText.trim();
    if (trimmed.length < 15) {
      setError('Pasted text must be at least 15 characters.');
      return;
    }

    const syntheticUrl = `text://custom-note-${Date.now()}`;
    const newSrc: DiscoveredSource = {
      title: extraTextTitle.trim() || 'Custom Pasted Document',
      url: syntheticUrl,
      snippet: trimmed,
      rawContent: trimmed,
      domain: 'user-pasted-text',
      isOfficial: false,
      sourceType: 'user_text'
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
        const isSample = s.url.startsWith('sample://') || id?.includes('sample');
        if (s.url.startsWith('text://')) {
          return {
            type: 'text',
            value: s.rawContent || s.snippet,
            title: s.title,
            domain: 'user-pasted-text',
            sourceType: 'user_text'
          };
        }
        return {
          type: 'url',
          value: s.url,
          title: s.title,
          domain: s.domain,
          date: s.date,
          rawContent: s.rawContent || s.snippet || undefined,
          snippet: s.snippet,
          sourceType: isSample ? 'sample' : (s.sourceType || 'real')
        };
      });

    setError(null);

    // Only prompt if sources were actually discovered, but user actively unselected all of them.
    // In question-only fallback mode (0 sources found), allow proceeding with empty sources directly.
    if (sources.length > 0 && chosenSources.length === 0) {
      setError('Please select at least one of the discovered sources or add your own.');
      return;
    }

    setIsSubmitting(true);
    try {
      // If sample dataset
      if (id?.includes('sample')) {
        navigate('/analyzing/sample-report-default');
        return;
      }

      const customAttrsToSend = hasCustomizedAttributes && attributes.length > 0 ? attributes : undefined;
      const res = await startAnalysis(question, chosenSources, false, customAttrsToSend);
      navigate(`/analyzing/${res.jobId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 py-8 space-y-6 pb-16">
      {/* Back to Query Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/', { state: { question } })}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to query & edit</span>
        </button>
      </div>

      {/* Top Header */}
      <div className="space-y-2 border-b border-seed/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-sans font-medium">
          <Search className="w-3 h-3" />
          <span>Automatic Multi-Source Discovery</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-seed tracking-tight">
          Discovered Sources
        </h1>
        <p className="text-seed-muted text-sm sm:text-base">
          Research Topic: <strong className="text-seed">"{question}"</strong>
        </p>
      </div>

      {/* Mandatory Transparency Note */}
      <div className="p-3.5 rounded-sm bg-seed/2 border border-seed/10 flex items-center gap-2.5 text-xs text-seed-muted">
        <Info className="w-4 h-4 text-rind shrink-0" />
        <span>
          These are sources retrieved for your question. Search results are not a complete view of the web.
        </span>
      </div>

      {/* Error Banner with Actionable Return */}
      {error && !(sources.length === 0 && error.toLowerCase().includes('select')) && (
        <div className="p-4 rounded-lg bg-gap/10 border border-gap/30 text-gap space-y-2.5 text-xs" role="alert">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Source Discovery Issue</span>
          </div>
          <p className="text-text leading-relaxed">{error}</p>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/', { state: { question } })}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Edit Query
            </Button>
          </div>
        </div>
      )}

      {/* Loading Search State */}
      {loading ? (
        <div className="p-8 sm:p-12 text-center space-y-4 border border-seed/10 rounded-sm bg-seed/1">
          <Loader2 className="w-7 h-7 animate-spin text-rind mx-auto" />
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-seed">{message}</h3>
            <p className="text-xs text-seed-muted max-w-md mx-auto">
              Formulating investigative query angles across institutional and reference databases...
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
          {/* Phase 5 Honest Fallback Banner When 0 Sources Found */}
          {sources.length === 0 ? (
            <div className="p-6 rounded-sm bg-seed/2 border border-seed/15 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xs bg-crack/15 text-crack shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-seed">
                    {message || "No sources reviewed. AI-suggested: no sources could be retrieved for this question. These are verification suggestions, not source-backed findings."}
                  </h3>
                  <p className="text-xs text-seed-muted leading-relaxed">
                    Automated web search could not retrieve external sources for this question at this time (provider limits, quota, or offline sandbox). You can proceed to view AI-suggested verification guidance and open questions, retry discovery, add direct URLs, or paste document text excerpts below.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="rind"
                  size="sm"
                  onClick={handleAnalyzeSelected}
                  disabled={isSubmitting}
                  className="font-bold gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Preparing Guidance...' : 'Proceed with AI-Suggested Checklist'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const discRes = await startDiscovery(question);
                      navigate(`/discover/${discRes.discoveryId}`, { replace: true });
                    } catch (err: any) {
                      setError(err.message || 'Retry failed');
                      setLoading(false);
                    }
                  }}
                  className="text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Discovery</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/discover/sample-default')}
                  className="border-rind/40 text-rind hover:bg-rind/10 text-xs font-semibold gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  Load Sample Dataset (Offline Demo)
                </Button>
              </div>
            </div>
          ) : (
            /* Discovered Sources List */
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
                  const isSample = source.url.startsWith('sample://') || id?.includes('sample');
                  const isPasted = source.url.startsWith('text://');

                  return (
                    <div
                      key={idx}
                      className={`p-4 transition-colors ${
                        isSelected ? 'bg-pith' : 'bg-seed/2 opacity-75'
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
                              {isSample ? (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-crack/15 text-crack border border-crack/30 inline-flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  <span>SAMPLE DATA</span>
                                </span>
                              ) : isPasted ? (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-seed/10 text-seed border border-seed/20 inline-flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>USER-PROVIDED TEXT</span>
                                </span>
                              ) : source.isOfficial ? (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-rind/10 text-rind border border-rind/20 inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>OFFICIAL AUTHORITY</span>
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-seed/5 text-seed-muted border border-seed/10 inline-flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>REAL SOURCE</span>
                                </span>
                              )}
                              {source.limited && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-crack/10 text-crack border border-crack/20">
                                  Limited (supporting text only)
                                </span>
                              )}
                              {source.unavailable && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-gap/10 text-gap border border-gap/20">
                                  Unavailable
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
                            {source.relevanceHint && (
                              <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-xs bg-rind/5 text-rind border border-rind/15">
                                {source.relevanceHint}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-seed-muted leading-relaxed line-clamp-2 pt-0.5">
                            {source.snippet}
                          </p>

                          {!isPasted && !isSample && (
                            <div className="pt-1">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-semibold text-rind hover:underline inline-flex items-center gap-1"
                              >
                                Visit verified source URL
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {isSample && (
                            <div className="pt-1 text-[11px] font-mono text-crack/80">
                              Offline demo document reference ({source.domain})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Supplement with Additional Sources */}
          <div className="p-5 rounded-sm border border-dashed border-seed/20 bg-seed/1 space-y-4">
            <h4 className="font-heading font-bold text-sm text-seed flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rind" />
              Add User-Provided Sources (Multiple URLs or Document Excerpt)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Add Multiple URLs Together */}
              <div className="space-y-2.5 p-3.5 rounded-sm border border-seed/15 bg-pith">
                <div className="flex items-center justify-between pb-1 border-b border-seed/10">
                  <span className="text-xs font-semibold text-seed block">Add Specific URLs:</span>
                  <button
                    type="button"
                    onClick={addUrlRow}
                    className="text-[11px] text-rind hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add another URL row</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {urlList.map((urlVal, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-seed-muted shrink-0 w-12 font-medium">
                        URL {idx + 1}:
                      </span>
                      <input
                        type="url"
                        value={urlVal}
                        onChange={(e) => updateUrlItem(idx, e.target.value)}
                        placeholder={
                          idx === 0
                            ? 'https://example.org/specifications.html'
                            : idx === 1
                            ? 'https://example.org/guidelines.pdf'
                            : `https://example.org/source-${idx + 1}`
                        }
                        className="flex-1 px-3 py-1.5 rounded-sm border border-seed/15 bg-seed/2 text-xs focus:ring-1 focus:ring-rind text-seed placeholder:text-seed-muted/60"
                      />
                      {urlList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrlRow(idx)}
                          className="text-seed-muted hover:text-crack text-sm p-1 cursor-pointer"
                          title="Remove row"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-seed/10">
                  <button
                    type="button"
                    onClick={addUrlRow}
                    className="text-[11px] text-seed-muted hover:text-seed inline-flex items-center gap-1 font-mono cursor-pointer"
                  >
                    + Add URL {urlList.length + 1}
                  </button>
                  <Button variant="outline" size="sm" onClick={handleAddAllUrls} className="text-xs font-semibold">
                    Add {urlList.filter(u => u.trim()).length > 1 ? `All ${urlList.filter(u => u.trim()).length} URLs` : 'URLs'}
                  </Button>
                </div>
              </div>

              {/* Paste Text */}
              <div className="space-y-2.5 p-3.5 rounded-sm border border-seed/15 bg-pith">
                <span className="text-xs font-semibold text-seed block pb-1 border-b border-seed/10">
                  Paste Document Excerpt:
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={extraTextTitle}
                    onChange={(e) => setExtraTextTitle(e.target.value)}
                    placeholder="Document Label / Title (e.g. Official Gazette Circular)"
                    className="w-full px-3 py-1.5 rounded-sm border border-seed/15 bg-seed/2 text-xs text-seed placeholder:text-seed-muted/60"
                  />
                  <div className="space-y-2">
                    <textarea
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      placeholder="Paste official text rules, clauses, or excerpts..."
                      rows={3}
                      className="w-full p-2.5 rounded-sm border border-seed/15 bg-seed/2 text-xs resize-none text-seed placeholder:text-seed-muted/60"
                    />
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={handleAddExtraText} className="text-xs font-semibold">
                        Add Document Text
                      </Button>
                    </div>
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
              {attributes.length === 0 ? (
                <span className="text-xs text-seed-muted/70 italic">
                  AI will derive topic-specific decision parameters from the question and retrieved sources...
                </span>
              ) : (
                attributes.map((attr, idx) => (
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
                ))
              )}
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
                placeholder="e.g. warranty_period, battery_specifications"
                className="flex-1 px-3 py-1.5 rounded-sm border border-seed/15 bg-pith text-xs focus:ring-1 focus:ring-rind text-seed placeholder:text-seed-muted/60"
              />
              <Button variant="outline" size="sm" onClick={handleAddAttribute}>
                Add Parameter
              </Button>
            </div>
          </div>

          {/* Action Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-seed/10">
            <Button variant="ghost" size="sm" onClick={() => navigate('/', { state: { question } })} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
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
