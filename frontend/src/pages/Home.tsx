import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SourcePayload, startAnalysis, fetchSampleData, startDiscovery } from '@/lib/api';
import { Plus, X, FileText, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Globe, FileCode2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { DotField } from '@/components/DotField';
import { RedactedDocumentBackground } from '@/components/visual/RedactedDocumentBackground';
import { cn } from '@/lib/utils';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Core Form State
  const [question, setQuestion] = useState('');
  const [sources, setSources] = useState<SourcePayload[]>([]);
  const [activeModal, setActiveModal] = useState<'url' | 'text' | null>(null);
  const [isQuestionFocused, setIsQuestionFocused] = useState(false);

  // Input states for intake modals (starts with URL 1 and URL 2)
  const [urlList, setUrlList] = useState<string[]>(['', '']);
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');

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

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Quick suggestions (Topic-independent)
  const suggestions = [
    "What should I verify before applying for this program?",
    "What are the conflicting requirements across these official guidelines?",
    "What critical continuation criteria are missing in these specifications?"
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

  // Add Pasted Text source
  const handleAddText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) {
      setError('Please paste text content before adding.');
      return;
    }
    if (trimmed.length < 20) {
      setError('Pasted text should contain at least 20 characters.');
      return;
    }

    setSources([
      ...sources,
      {
        id: `txt-${Date.now()}-${sources.length + 1}`,
        type: 'text',
        value: trimmed,
        title: textTitle.trim() || undefined
      }
    ]);

    setTextInput('');
    setTextTitle('');
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
    <div className="relative max-w-[1100px] mx-auto py-3 sm:py-5 space-y-6 sm:space-y-8">
      {/* Background "Redacted Document" with soft cursor spotlight and radial depth */}
      <RedactedDocumentBackground />

      {/* Hero Section Container */}
      <div className="radial-structure-glow relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-3 sm:p-5 rounded-xl">
        {/* Left Column: Staggered Headline and Form (visible without scrolling at 1440x900 and 390px) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Staggered Load: Small label, Headline, Description */}
          <div className="space-y-2">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-structure/10 text-structure-text text-xs font-sans font-medium"
            >
              <span>Information gap & conflict detection</span>
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.08, ease: 'easeOut' }}
              className="font-heading text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-seed tracking-tight leading-tight [text-wrap:balance] max-w-lg"
            >
              Find what the sources don't tell you.
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.16, ease: 'easeOut' }}
              className="font-sans text-xs sm:text-sm text-seed-muted leading-relaxed max-w-xl"
            >
              Digital Dark Spot compares sources to uncover potential gaps, possible conflicts and stale information, with evidence you can inspect.
            </motion.p>
          </div>

          {/* Mobile DotField (visible below text on screens < lg, ~300px) */}
          <div className="block lg:hidden w-[300px] mx-auto pt-2 pb-2">
            <DotField />
          </div>

          {/* Question & Evidence Investigation Area (Staggered fourth step) */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.24, ease: 'easeOut' }}
            className="space-y-5 pt-0.5"
          >
            {/* Step 1: Ask — stronger focus state with bottom animated signal line and character counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-xs font-semibold text-rind tracking-normal">
                  Step 1: Ask
                </h2>
                <span className="text-xs font-mono text-seed-muted">
                  {question.length}/500
                </span>
              </div>

              <div
                className={cn(
                  "relative border-b transition-all duration-200 pb-1 rounded-xs",
                  isQuestionFocused
                    ? "border-structure-text shadow-xs"
                    : "border-seed/20"
                )}
              >
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                  onFocus={() => setIsQuestionFocused(true)}
                  onBlur={() => setIsQuestionFocused(false)}
                  placeholder="What are you trying to verify?"
                  rows={2}
                  className="w-full resize-none bg-transparent font-heading text-base sm:text-lg font-bold text-seed placeholder:text-seed-muted/40 outline-none leading-snug"
                />

                {/* Animated thin signal line along the bottom */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-structure-text origin-left pointer-events-none"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isQuestionFocused ? 1 : 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                />
              </div>

              {/* Example suggestion chips with small lift on hover */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {suggestions.map((s, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={shouldReduceMotion ? {} : { y: -1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setQuestion(s)}
                    className="text-[11px] text-seed-muted hover:text-seed transition-colors border border-seed/12 rounded-xs px-2 py-0.5 hover:border-rind/40 hover:bg-rind/[0.03] cursor-pointer"
                  >
                    + {s.slice(0, 42)}...
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Step 2: Bring Evidence — Evidence Tray with animated rows, status icon + text, and removal */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-xs font-semibold text-rind tracking-normal">
                  Step 2: Bring evidence
                </h2>
                <span className="text-xs font-mono text-seed-muted">
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'} in tray
                </span>
              </div>

              {/* Evidence Tray Container */}
              <div className="p-3 rounded-sm border border-seed/15 bg-pith-card/50 space-y-3">
                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('url')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-rind" />
                    <span>+ URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('text')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-rind" />
                    <span>Paste Text</span>
                  </button>

                  <div className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => handleLoadSample('scenario-a-aurora')}
                      disabled={isLoadingSample}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-xs border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                      title="Load Scenario A (Education Guidelines)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-crack" />
                      <span>{isLoadingSample ? 'Loading...' : 'Sample A'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('scenario-b-solarbridge')}
                      disabled={isLoadingSample}
                      className="inline-flex items-center px-2 py-1.5 border-t border-b border-r border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                      title="Load Scenario B (Rooftop Clean Energy)"
                    >
                      <span>Sample B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('scenario-c-nimbus-air')}
                      disabled={isLoadingSample}
                      className="inline-flex items-center px-2 py-1.5 rounded-r-xs border-t border-b border-r border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
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
                      className="p-3 border border-seed/15 rounded-xs bg-pith space-y-2.5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-seed/10">
                        <span className="text-xs font-bold font-heading text-seed">Add Specific URLs</span>
                        <button onClick={() => setActiveModal(null)} className="text-seed-muted hover:text-seed cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {urlList.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-seed-muted shrink-0 w-12 font-medium">
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
                              className="flex-1 text-xs p-2 rounded-xs border border-seed/15 bg-seed/[0.02] text-seed outline-none focus:border-rind"
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

                      <div className="flex items-center justify-between pt-1 border-t border-seed/10">
                        <button
                          type="button"
                          onClick={addUrlRow}
                          className="text-[11px] text-structure-text hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add URL {urlList.length + 1}</span>
                        </button>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                          <Button size="sm" variant="signal" onClick={handleAddUrl}>
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
                      className="p-3 border border-seed/15 rounded-xs bg-pith space-y-2.5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-heading text-seed">Paste Source Text</span>
                        <button onClick={() => setActiveModal(null)} className="text-seed-muted hover:text-seed cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Optional title (e.g. Community Discussion Post)"
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        className="w-full text-xs p-2 rounded-xs border border-seed/15 bg-pith text-seed outline-none focus:border-structure-text"
                      />
                      <textarea
                        rows={3}
                        placeholder="Paste excerpt, circular text, or scheme rules here..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="w-full text-xs p-2 rounded-xs border border-seed/15 bg-pith text-seed outline-none focus:border-structure-text resize-none"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                        <Button size="sm" variant="signal" onClick={handleAddText}>Add Text</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Evidence Tray Items List */}
                <div className="space-y-2 pt-1">
                  <AnimatePresence mode="popLayout">
                    {sources.length > 0 ? (
                      sources.map((s, idx) => {
                        const status = getSourceStatus(s);
                        return (
                          <motion.div
                            key={s.id || idx}
                            layout
                            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="flex items-center justify-between gap-3 p-2 rounded-xs border border-seed/10 bg-pith hover:border-seed/25 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {s.type === 'url' ? (
                                <Globe className="w-3.5 h-3.5 text-rind shrink-0" />
                              ) : (
                                <FileCode2 className="w-3.5 h-3.5 text-rind shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-seed truncate">
                                  {getSourceTitle(s)}
                                </p>
                                <p className="text-[10px] font-mono text-seed-muted truncate">
                                  {getSourceDomain(s)} • {s.type === 'url' ? 'URL' : 'Document'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
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
                                    <AlertCircle className="w-3.5 h-3.5 text-crack" />
                                    <span className="text-crack">{status.label}</span>
                                  </>
                                )}
                                {status.tone === 'failed' && (
                                  <>
                                    <X className="w-3.5 h-3.5 text-flesh" />
                                    <span className="text-flesh">{status.label}</span>
                                  </>
                                )}
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveSource(idx)}
                                className="text-seed-muted hover:text-flesh transition-colors p-1 cursor-pointer"
                                aria-label={`Remove source ${getSourceTitle(s)}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-seed-muted italic py-1">
                        No sources attached yet — add URLs or documents, or click &ldquo;Discover Sources & Slice Open&rdquo; to find sources automatically.
                      </p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xs border border-flesh/30 bg-flesh/10 text-xs text-seed flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-flesh shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 3: Main Action Button ("Discover Sources & Slice Open" / "Slice It Open") */}
            <div className="pt-1">
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? {} : { y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                onClick={handleSliceOpen}
                disabled={isSubmitting}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xs bg-signal text-signal-ink font-heading font-bold text-sm tracking-wide shadow-xs hover:bg-signal/90 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {/* Short subtle scan line animation while loading */}
                {isSubmitting && !shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
                    Discover Sources & Slice Open
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Slice It Open
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: DotField (Desktop, ~560px wide, bleeding slightly off right edge) */}
        <div className="hidden lg:block lg:col-span-5 relative">
          <div className="w-[500px] xl:w-[560px] -mr-8 xl:-mr-16 pt-2">
            <DotField />
          </div>
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="border-t border-seed/10" />

      {/* Lower Section: How it works as four numbered hairline-separated columns */}
      <div className="space-y-3">
        <h2 className="font-sans text-xs font-semibold text-seed-muted tracking-normal">
          Forensic investigation process
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-0.5">
          {/* Column 01 */}
          <div className="border-t border-seed/10 pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-rind">01</span>
            <h3 className="font-heading font-bold text-sm text-seed">Read</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Ingests raw text and URLs with SSRF protection, auditing publication dates and academic cycles.
            </p>
          </div>

          {/* Column 02 */}
          <div className="border-t border-seed/10 pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-rind">02</span>
            <h3 className="font-heading font-bold text-sm text-seed">Compare</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Extracts core claims strictly verified as verbatim substrings against primary source text.
            </p>
          </div>

          {/* Column 03 */}
          <div className="border-t border-seed/10 pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-crack">03</span>
            <h3 className="font-heading font-bold text-sm text-seed">Expose</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Exposes unmentioned gaps, cross-source contradictions, and stale temporal mismatches.
            </p>
          </div>

          {/* Column 04 */}
          <div className="border-t border-seed/10 pt-3.5 space-y-1">
            <span className="text-xs font-mono font-bold text-rind">04</span>
            <h3 className="font-heading font-bold text-sm text-seed">Verify</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Generates an actionable checklist with verbatim evidence quotes and exportable Markdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
