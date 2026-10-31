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
  FileText,
  Database,
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

  // Editable Expected Attributes state
  const [attributes, setAttributes] = useState<string[]>([
    'application_deadline',
    'primary_qualifying_criteria',
    'required_documents',
    'official_portal_or_link',
    'continuation_policy',
    'pricing_or_financial_terms'
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
          rawContent: s.rawContent || (isSample ? s.snippet : undefined),
          sourceType: isSample ? 'sample' : (s.sourceType || 'real')
        };
      });

    if (chosenSources.length === 0) {
      setError('Please select or add at least one source before proceeding with analysis.');
      return;
    }

    setIsSubmitting(true);
    try {
      // If sample dataset
      if (id?.includes('sample')) {
        navigate('/analyzing/sample-report-default');
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
          <span>Automatic Multi-Source Discovery</span>
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
          <strong className="text-seed font-semibold">Transparency:</strong> Information gap analysis cross-examines verified content across multiple sources. Select which sources to include, or add custom URLs and notes below.
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
          {/* Fallback Banner When No Search Keys are Configured / 0 Sources Found */}
          {sources.length === 0 ? (
            <div className="p-6 rounded-sm bg-seed/[0.02] border border-seed/15 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xs bg-crack/15 text-crack shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-seed">
                    Web discovery is currently unavailable.
                  </h3>
                  <p className="text-xs text-seed-muted leading-relaxed">
                    No external web search provider keys are active in this environment. To proceed with the information gap audit, you can add specific source URLs or paste document excerpts below, or explore the pre-verified offline demonstration dataset.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
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
          <div className="p-5 rounded-sm border border-dashed border-seed/20 bg-seed/[0.01] space-y-4">
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
                            ? 'https://scholarships.gov.in/guidelines-2026.html'
                            : idx === 1
                            ? 'https://education.gov.in/notice-2026.pdf'
                            : `https://example.gov/source-${idx + 1}`
                        }
                        className="flex-1 px-3 py-1.5 rounded-sm border border-seed/15 bg-seed/[0.02] text-xs focus:ring-1 focus:ring-rind text-seed placeholder:text-seed-muted/60"
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
                    className="w-full px-3 py-1.5 rounded-sm border border-seed/15 bg-seed/[0.02] text-xs text-seed placeholder:text-seed-muted/60"
                  />
                  <div className="space-y-2">
                    <textarea
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      placeholder="Paste official text rules, clauses, or excerpts..."
                      rows={3}
                      className="w-full p-2.5 rounded-sm border border-seed/15 bg-seed/[0.02] text-xs resize-none text-seed placeholder:text-seed-muted/60"
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
