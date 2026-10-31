import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SourcePayload, startAnalysis, fetchSampleData, startDiscovery } from '@/lib/api';
import { Plus, X, FileText, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Globe, FileCode2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { DotField } from '@/components/DotField';
import { RedactedDocumentBackground } from '@/components/visual/RedactedDocumentBackground';
import { cn } from '@/lib/utils';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Core Form State (persisted across navigation and errors via sessionStorage and location.state)
  const [question, setQuestion] = useState<string>(() => {
    try {
      if ((location.state as any)?.question) {
        return (location.state as any).question;
      }
      return sessionStorage.getItem('dds-draft-question') || '';
    } catch {
      return '';
    }
  });

  const [sources, setSources] = useState<SourcePayload[]>(() => {
    try {
      if (Array.isArray((location.state as any)?.sources)) {
        return (location.state as any).sources;
      }
      const saved = sessionStorage.getItem('dds-draft-sources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep sessionStorage in sync so user never loses their draft
  useEffect(() => {
    try {
      sessionStorage.setItem('dds-draft-question', question);
    } catch {}
  }, [question]);

  useEffect(() => {
    try {
      sessionStorage.setItem('dds-draft-sources', JSON.stringify(sources));
    } catch {}
  }, [sources]);

  // Sync if location.state changes (e.g. user navigated back from Discover or Analyzing)
  useEffect(() => {
    if ((location.state as any)?.question) {
      setQuestion((location.state as any).question);
    }
    if (Array.isArray((location.state as any)?.sources)) {
      setSources((location.state as any).sources);
    }
  }, [location.state]);

  const handleClear = () => {
    setQuestion('');
    setSources([]);
    try {
      sessionStorage.removeItem('dds-draft-question');
      sessionStorage.removeItem('dds-draft-sources');
    } catch {}
  };

  const [activeModal, setActiveModal] = useState<'url' | 'text' | null>(null);
  const [isQuestionFocused, setIsQuestionFocused] = useState(false);

  // Input states for intake modals (starts with URL 1 & 2, and Text 1 & 2)
  const [urlList, setUrlList] = useState<string[]>(['', '']);
  const [textList, setTextList] = useState<Array<{ title: string; text: string }>>([
    { title: '', text: '' },
    { title: '', text: '' }
  ]);

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

  const updateTextItem = (index: number, field: 'title' | 'text', val: string) => {
    setTextList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addTextRow = () => {
    setTextList(prev => [...prev, { title: '', text: '' }]);
  };

  const removeTextRow = (index: number) => {
    setTextList(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ title: '', text: '' }]));
  };

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Quick suggestions (Topic-independent)
  const suggestions = [
    { label: 'Find conflicting claims', query: 'What are the conflicting claims across these sources?' },
    { label: 'What information is missing?', query: 'What critical information is missing or unverified?' },
    { label: 'What should I verify next?', query: 'What should I verify next before proceeding?' }
  ];

  // Add multiple URL sources together
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        setError('Please enter valid URLs starting with http:// or https://');
      } else {
        setError('Please enter at least one URL before adding.');
      }
      return;
    }

    const newSources: SourcePayload[] = validUrls.map((trimmed, idx) => ({
      id: `url-${Date.now()}-${sources.length + idx + 1}`,
      type: 'url',
      value: trimmed,
      title: trimmed
    }));

    setSources(prev => [...prev, ...newSources]);
    setUrlList(['', '']);
    setActiveModal(null);
    setError(null);
  };

  // Add multiple Pasted Text sources
  const handleAddText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validItems = textList
      .map(item => ({ title: item.title.trim(), text: item.text.trim() }))
      .filter(item => item.text.length > 0);

    if (validItems.length === 0) {
      setError('Please paste text content before adding.');
      return;
    }

    const tooShort = validItems.find(item => item.text.length < 20);
    if (tooShort) {
      setError('Each pasted text should contain at least 20 characters.');
      return;
    }

    const newSources: SourcePayload[] = validItems.map((item, idx) => ({
      id: `txt-${Date.now()}-${sources.length + idx + 1}`,
      type: 'text',
      value: item.text,
      title: item.title || undefined
    }));

    setSources(prev => [...prev, ...newSources]);
    setTextList([
      { title: '', text: '' },
      { title: '', text: '' }
    ]);
    setActiveModal(null);
    setError(null);
  };

  // Remove source
  const handleRemoveSource = (idx: number) => {
    setSources(sources.filter((_, i) => i !== idx));
  };

  // Load sample dataset
  const handleLoadSample = async (scenarioId: string = 'scenario-a-aurora') => {
    setIsLoadingSample(true);
    setError(null);
    try {
      const data = await fetchSampleData(scenarioId);
      setQuestion(data.question);
      setSources(
        data.sources.map((s: any) => ({
          id: s.id,
          type: s.type,
          value: s.type === 'url' ? s.url : s.rawText,
          title: s.title
        }))
      );
    } catch (err: any) {
      setError(`Failed to load sample data: ${err.message}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Helper functions for evidence tray items
  const getSourceDomain = (s: SourcePayload) => {
    if (s.type === 'url') {
      try {
        return new URL(s.value).hostname.replace('www.', '');
      } catch {
        return 'web source';
      }
    }
    return 'local document';
  };

  const getSourceTitle = (s: SourcePayload) => {
    if (s.title) return s.title;
    if (s.type === 'url') {
      return getSourceDomain(s);
    }
    return 'Pasted Text Excerpt';
  };

  const getSourceStatus = (s: SourcePayload) => {
    if (s.type === 'url') {
      try {
        new URL(s.value);
        return { label: 'Ready', tone: 'ready' as const };
      } catch {
        return { label: 'Failed', tone: 'failed' as const };
      }
    }
    if (s.value.length < 35) {
      return { label: 'Needs attention', tone: 'attention' as const };
    }
    return { label: 'Ready', tone: 'ready' as const };
  };

  // Submit / "Slice it open" — starts immediately with zero delay
  const handleSliceOpen = async () => {
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter what you are trying to verify.');
      return;
    }

    setIsSubmitting(true);

    try {
      // CASE A: User entered ONLY a question -> Automatic Source Discovery (Step 3B)
      if (sources.length === 0) {
        const discRes = await startDiscovery(trimmedQuestion);
        navigate(`/discover/${discRes.discoveryId}`);
        return;
      }

      // CASE B: User provided sample data
      if (sources.length >= 1 && sources[0].id?.includes('sample')) {
        navigate('/analyzing/sample-report-default');
        return;
      }

      // CASE C: User provided custom sources
      const res = await startAnalysis(trimmedQuestion, sources);
      navigate(`/analyzing/${res.jobId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate analysis pipeline');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative max-w-275 mx-auto py-3 sm:py-5 space-y-6 sm:space-y-8 overflow-x-clip">
      {/* Background "Redacted Document" with soft cursor spotlight and radial depth */}
      <RedactedDocumentBackground />

      {/* Hero Section Container */}
      <div className="radial-structure-glow relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start p-2 sm:p-4 rounded-xl">
        {/* Left Column: Headline and Unified Investigation Card */}
        <div className="lg:col-span-7 space-y-4">
          {/* Staggered Load: Small label, Headline, Description */}
          <div className="space-y-1.5">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-structure/10 text-structure-text text-xs font-sans font-medium w-fit"
            >
              <span>Information gap & conflict detection</span>
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : 0.06, ease: 'easeOut' }}
              className="font-heading text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-text tracking-tight leading-tight text-balance"
            >
              Find what the sources don't tell you.
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : 0.12, ease: 'easeOut' }}
              className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed max-w-xl"
            >
              Digital Dark Spot compares sources to uncover potential gaps, possible conflicts and stale information, with evidence you can inspect.
            </motion.p>
          </div>

          {/* Mobile DotField (visible below text on screens < lg) */}
          <div className="block lg:hidden w-70 mx-auto py-1">
            <DotField isFocused={isQuestionFocused} charCount={question.length} />
          </div>

          {/* Continuous Investigation Interface */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="space-y-5 pt-1"
          >
            {/* Investigation Flow Breadcrumb */}
            <div className="text-[10px] font-mono text-text-muted/70 tracking-tight hidden sm:block">
              Question → Discovering sources → Review sources → Analyze → Findings → Verify next
            </div>

            {/* STEP 1: Research Question (Transparent, Large Command Input) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-rind">
                    01 QUESTION
                  </span>
                  <label htmlFor="question-input" className="text-xs text-text-muted font-medium">
                    What are you trying to verify?
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {question.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-[11px] text-text-muted hover:text-gap transition-colors cursor-pointer"
                      title="Clear draft question and sources"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-xs font-mono text-text-muted">
                    {question.length}/500
                  </span>
                </div>
              </div>

              {/* Large, transparent command input with responsive focus baseline */}
              <div className="relative pt-1">
                <textarea
                  id="question-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                  onFocus={() => setIsQuestionFocused(true)}
                  onBlur={() => setIsQuestionFocused(false)}
                  placeholder="What should I verify before making a decision on this topic?"
                  rows={3}
                  className="w-full min-h-[84px] resize-none bg-transparent font-sans text-sm sm:text-base font-normal text-text placeholder:text-text-muted/50 outline-none leading-relaxed border-none focus:ring-0 p-0 transition-colors"
                />

                {/* Baseline underline with lime accent on focus */}
                <div className="relative w-full h-px bg-border/80 mt-1">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-rind h-0.5 top-[-0.5px] origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isQuestionFocused ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Suggested Query Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-text-muted font-sans mr-0.5">Suggestions:</span>
                {suggestions.map((s, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={shouldReduceMotion ? {} : { y: -1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setQuestion(s.query)}
                    className="text-xs text-text-muted hover:text-text transition-all border border-border/70 hover:border-rind/50 bg-surface-2/30 hover:bg-rind/5 rounded-md px-2.5 py-1 cursor-pointer"
                  >
                    + {s.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* STEP 2: Evidence Sources (Connected Investigation Flow) */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-rind">
                    02 EVIDENCE
                  </span>
                  <span className="text-xs text-text-muted font-medium">
                    Add your own evidence (optional)
                  </span>
                  <span className="text-[11px] text-text-muted/60 hidden sm:inline">
                    ({sources.length === 0 ? 'automated web discovery runs if empty' : `${sources.length} attached`})
                  </span>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'} in tray
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === 'url' ? null : 'url')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                    activeModal === 'url'
                      ? "border-rind/50 bg-rind/10 text-rind"
                      : "border-border/80 bg-surface-2/40 text-text hover:bg-surface-2 hover:border-border"
                  )}
                >
                  <Plus className="w-3.5 h-3.5 text-rind" />
                  <span>+ URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === 'text' ? null : 'text')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                    activeModal === 'text'
                      ? "border-rind/50 bg-rind/10 text-rind"
                      : "border-border/80 bg-surface-2/40 text-text hover:bg-surface-2 hover:border-border"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 text-rind" />
                  <span>Paste Text</span>
                </button>

                {/* Sample Buttons */}
                <div className="relative inline-flex items-center rounded-md border border-border/80 bg-surface-2/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('scenario-a-aurora')}
                    disabled={isLoadingSample}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors cursor-pointer border-r border-border/80"
                    title="Load Scenario A (Education Guidelines)"
                  >
                    <Sparkles className="w-3 h-3 text-conflict" />
                    <span>{isLoadingSample ? 'Loading...' : 'Sample A'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('scenario-b-solarbridge')}
                    disabled={isLoadingSample}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors cursor-pointer border-r border-border/80"
                    title="Load Scenario B (Rooftop Clean Energy)"
                  >
                    <span>Sample B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('scenario-c-nimbus-air')}
                    disabled={isLoadingSample}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors cursor-pointer"
                    title="Load Scenario C (Hardware Specifications)"
                  >
                    <span>Sample C</span>
                  </button>
                </div>
              </div>

              {/* Inline Intake Modal / Drawer */}
              <AnimatePresence>
                {activeModal === 'url' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 border border-border rounded-lg bg-surface/90 backdrop-blur-md space-y-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-border/70">
                      <span className="text-xs font-bold font-heading text-text">Add Specific URLs</span>
                      <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-text cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {urlList.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-text-muted shrink-0 w-12 font-medium">
                            URL {idx + 1}:
                          </span>
                          <input
                            type="url"
                            placeholder={
                              idx === 0
                                ? 'https://department.gov.in/notice-2026.html'
                                : idx === 1
                                ? 'https://education.gov.in/guidelines.pdf'
                                : `https://example.gov/source-${idx + 1}`
                            }
                            value={val}
                            onChange={(e) => updateUrlItem(idx, e.target.value)}
                            className="flex-1 text-xs p-2 rounded-md border border-border bg-surface text-text outline-none focus:border-rind"
                          />
                          {urlList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUrlRow(idx)}
                              className="text-text-muted hover:text-gap text-sm p-1 cursor-pointer"
                              title="Remove row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={addUrlRow}
                        className="text-[11px] text-rind hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add URL {urlList.length + 1}</span>
                      </button>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                        <Button size="sm" variant="rind" onClick={handleAddUrl}>
                          Add {urlList.filter(u => u.trim()).length > 1 ? `All ${urlList.filter(u => u.trim()).length} URLs` : 'URLs'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeModal === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 border border-border rounded-lg bg-surface/90 backdrop-blur-md space-y-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-border/70">
                      <span className="text-xs font-bold font-heading text-text">Paste Source Texts</span>
                      <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-text cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {textList.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-md border border-border/70 bg-surface/50 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-text-muted font-medium">
                              Text {idx + 1}:
                            </span>
                            {textList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTextRow(idx)}
                                className="text-text-muted hover:text-gap text-sm p-1 cursor-pointer"
                                title="Remove row"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Optional title (e.g. Official Gazette Circular)"
                            value={item.title}
                            onChange={(e) => updateTextItem(idx, 'title', e.target.value)}
                            className="w-full text-xs p-2 rounded-md border border-border bg-surface text-text outline-none focus:border-rind"
                          />
                          <textarea
                            rows={3}
                            placeholder="Paste excerpt, circular text, or scheme rules here..."
                            value={item.text}
                            onChange={(e) => updateTextItem(idx, 'text', e.target.value)}
                            className="w-full text-xs p-2 rounded-md border border-border bg-surface text-text outline-none focus:border-rind resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={addTextRow}
                        className="text-[11px] text-rind hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Text {textList.length + 1}</span>
                      </button>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                        <Button size="sm" variant="rind" onClick={handleAddText}>
                          Add {textList.filter(t => t.text.trim()).length > 1 ? `All ${textList.filter(t => t.text.trim()).length} Texts` : 'Text'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Evidence Tray Items List */}
              <div className="space-y-1.5 pt-0.5">
                <AnimatePresence mode="popLayout">
                  {sources.length > 0 ? (
                    sources.map((s, idx) => {
                      const status = getSourceStatus(s);
                      return (
                        <motion.div
                          key={s.id || idx}
                          layout
                          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/80 bg-surface/40 hover:bg-surface/70 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {s.type === 'url' ? (
                              <Globe className="w-3.5 h-3.5 text-rind shrink-0" />
                            ) : (
                              <FileCode2 className="w-3.5 h-3.5 text-rind shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text truncate">
                                {getSourceTitle(s)}
                              </p>
                              <p className="text-[10px] font-mono text-text-muted truncate">
                                {getSourceDomain(s)} • {s.type === 'url' ? 'URL' : 'Document'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Status with Icon AND Text */}
                            <div className="flex items-center gap-1.5 text-[11px] font-medium">
                              {status.tone === 'ready' && (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-rind" />
                                  <span className="text-rind">{status.label}</span>
                                </>
                              )}
                              {status.tone === 'attention' && (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-conflict" />
                                  <span className="text-conflict">{status.label}</span>
                                </>
                              )}
                              {status.tone === 'failed' && (
                                <>
                                  <X className="w-3.5 h-3.5 text-gap" />
                                  <span className="text-gap">{status.label}</span>
                                </>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveSource(idx)}
                              className="text-text-muted hover:text-gap transition-colors p-1 cursor-pointer"
                              aria-label={`Remove source ${getSourceTitle(s)}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-text-muted italic py-0.5">
                      No sources attached yet — add URLs or excerpts above, or click below to discover sources automatically.
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg border border-gap/30 bg-gap/10 text-xs text-text flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-gap shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Bottom Action Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
                <Sparkles className="w-3.5 h-3.5 text-rind shrink-0" />
                <span>
                  {sources.length === 0
                    ? 'Automated web discovery will formulate targeted queries'
                    : `Ready to audit ${sources.length} sources for gaps and conflicts`}
                </span>
              </div>

              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? {} : { y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                onClick={handleSliceOpen}
                disabled={isSubmitting}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-rind text-signal-ink font-heading font-bold text-sm tracking-wide shadow-xs hover:bg-rind-hover transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shrink-0"
              >
                {/* Short subtle scan line animation while loading */}
                {isSubmitting && !shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-signal-ink/30 border-t-signal-ink rounded-full animate-spin" />
                    Slicing open...
                  </span>
                ) : sources.length === 0 ? (
                  <span className="flex items-center gap-2">
                    Find sources and analyze
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze sources
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: DotField (Desktop, connected to input focus & charCount) */}
        <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative self-center">
          <div className="w-full max-w-105 aspect-square">
            <DotField isFocused={isQuestionFocused} charCount={question.length} />
          </div>
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="border-t border-border/60" />

      {/* Lower Section: How it works as four numbered hairline-separated columns */}
      <div className="space-y-3 pt-1">
        <h2 className="font-sans text-xs font-semibold text-text-muted tracking-normal">
          Forensic investigation process
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-0.5">
          {/* Column 01 */}
          <div className="border-t border-border pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-rind">01</span>
            <h3 className="font-heading font-bold text-sm text-text">Read</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Ingests raw text and URLs with SSRF protection, auditing publication dates and temporal cycles.
            </p>
          </div>

          {/* Column 02 */}
          <div className="border-t border-border pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-rind">02</span>
            <h3 className="font-heading font-bold text-sm text-text">Compare</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Extracts core claims strictly verified as verbatim substrings against primary source text.
            </p>
          </div>

          {/* Column 03 */}
          <div className="border-t border-border pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-conflict">03</span>
            <h3 className="font-heading font-bold text-sm text-text">Expose</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Exposes unmentioned gaps, cross-source contradictions, and stale temporal mismatches.
            </p>
          </div>

          {/* Column 04 */}
          <div className="border-t border-border pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-rind">04</span>
            <h3 className="font-heading font-bold text-sm text-text">Verify</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Generates an actionable checklist with verbatim evidence quotes and exportable Markdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
