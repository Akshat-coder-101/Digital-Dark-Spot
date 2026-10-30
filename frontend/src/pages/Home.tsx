import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SourcePayload, startAnalysis, fetchSampleData, startDiscovery } from '@/lib/api';
import { Plus, X, FileText, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { HeroMelon } from '@/components/visual/HeroMelon';
import { RedactedDocumentBackground } from '@/components/visual/RedactedDocumentBackground';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Core Form State
  const [question, setQuestion] = useState('');
  const [sources, setSources] = useState<SourcePayload[]>([]);
  const [activeModal, setActiveModal] = useState<'url' | 'text' | null>(null);

  // Input states for intake modals
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Quick suggestions
  const suggestions = [
    "What should I verify before applying for this scholarship?",
    "What are the conflicting eligibility rules across these aid programs?",
    "What critical renewal criteria are missing in these contracts?"
  ];

  // Add URL source
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Please enter a valid website URL.');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setSources([
      ...sources,
      {
        id: `url-${Date.now()}-${sources.length + 1}`,
        type: 'url',
        value: trimmed,
        title: urlTitle.trim() || undefined
      }
    ]);

    setUrlInput('');
    setUrlTitle('');
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
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setError(null);
    try {
      const data = await fetchSampleData();
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

  // Helper to extract domain from URL or label
  const getSourceLabel = (s: SourcePayload) => {
    if (s.title) return s.title;
    if (s.type === 'url') {
      try {
        return new URL(s.value).hostname.replace('www.', '');
      } catch {
        return s.value;
      }
    }
    return 'Pasted Text Document';
  };

  // Submit / "Slice it open"
  const handleSliceOpen = async () => {
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter what you are trying to verify.');
      return;
    }

    setIsSubmitting(true);

    const delay = shouldReduceMotion ? 0 : 500;

    setTimeout(async () => {
      try {
        // CASE A: User entered ONLY a question -> Automatic Source Discovery (Step 3B)
        if (sources.length === 0) {
          const discRes = await startDiscovery(trimmedQuestion);
          navigate(`/discover/${discRes.discoveryId}`);
          return;
        }

        // CASE B: User provided sample data
        if (sources.length === 3 && sources[0].id?.includes('sample')) {
          navigate('/analyzing/sample-scholarship-report');
          return;
        }

        // CASE C: User provided custom sources
        const res = await startAnalysis(trimmedQuestion, sources);
        navigate(`/analyzing/${res.jobId}`);
      } catch (err: any) {
        setError(err.message || 'Failed to initiate analysis pipeline');
        setIsSubmitting(false);
      }
    }, delay);
  };

  return (
    <div className="relative max-w-[1100px] mx-auto py-6 sm:py-8 space-y-8 sm:space-y-10">
      {/* Background "Redacted Document" with soft cursor spotlight */}
      <RedactedDocumentBackground />

      {/* Hero Section Container */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Headline and Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Animated Headline revealed line by line */}
          <div className="space-y-2.5">
            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-seed tracking-tight leading-[1.12]"
            >
              Find what the sources don't tell you.
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.1, ease: 'easeOut' }}
              className="font-sans text-sm sm:text-base text-seed-muted leading-relaxed max-w-xl"
            >
              Digital Dark Spot cross-examines sources to uncover potential gaps, possible conflicts, and stale information, with verbatim evidence quotes you can inspect.
            </motion.p>
          </div>

          {/* Mobile Hero Melon (visible below text on screens < lg) */}
          <div className="block lg:hidden w-full max-w-[340px] sm:max-w-[420px] mx-auto pt-1 pb-2">
            <HeroMelon />
          </div>

          {/* Three short investigation steps in one cohesive column */}
          <div className="space-y-6 pt-1">
            {/* Step 1: Ask */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-xs font-semibold text-rind tracking-normal">
                  Step 1: Ask
                </h2>
                <span className="text-xs font-mono text-seed-muted">
                  {question.length}/500
                </span>
              </div>

              <div className="relative border-b border-seed/20 focus-within:border-rind transition-colors pb-1">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                  placeholder="What are you trying to verify?"
                  rows={2}
                  className="w-full resize-none bg-transparent font-heading text-lg sm:text-xl font-bold text-seed placeholder:text-seed-muted/40 outline-none leading-snug"
                />
              </div>

              {/* Suggestions pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuestion(s)}
                    className="text-[11px] text-seed-muted hover:text-seed transition-colors border border-seed/10 rounded-sm px-2 py-0.5 hover:border-seed/30 cursor-pointer"
                  >
                    + {s.slice(0, 42)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Bring Evidence */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-xs font-semibold text-rind tracking-normal">
                  Step 2: Bring evidence
                </h2>
                <span className="text-xs font-mono text-seed-muted">
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'} attached
                </span>
              </div>

              {/* Action Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('url')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-rind" />
                  <span>+ URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('text')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-rind" />
                  <span>Paste Text</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={isLoadingSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-seed/15 text-xs font-medium text-seed hover:bg-seed/5 hover:border-seed/30 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-crack" />
                  <span>{isLoadingSample ? 'Loading sample...' : 'Use sample'}</span>
                </button>
              </div>

              {/* Inline Intake Modal / Drawer */}
              <AnimatePresence>
                {activeModal === 'url' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 border border-seed/15 rounded-sm bg-pith-card space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-heading text-seed">Add Source URL</span>
                      <button onClick={() => setActiveModal(null)} className="text-seed-muted hover:text-seed cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://scholarships.gov.in/notice-2026.html"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full text-xs p-2 rounded-sm border border-seed/15 bg-pith text-seed outline-none focus:border-rind"
                    />
                    <input
                      type="text"
                      placeholder="Optional title (e.g. Official Guidelines 2026)"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded-sm border border-seed/15 bg-pith text-seed outline-none focus:border-rind"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                      <Button size="sm" variant="rind" onClick={handleAddUrl}>Add URL</Button>
                    </div>
                  </motion.div>
                )}

                {activeModal === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 border border-seed/15 rounded-sm bg-pith-card space-y-2.5"
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
                      className="w-full text-xs p-2 rounded-sm border border-seed/15 bg-pith text-seed outline-none focus:border-rind"
                    />
                    <textarea
                      rows={3}
                      placeholder="Paste excerpt, press release, or document text here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full text-xs p-2 rounded-sm border border-seed/15 bg-pith text-seed outline-none focus:border-rind resize-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                      <Button size="sm" variant="rind" onClick={handleAddText}>Add Text</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attached Sources: Removable chips with domain and status dot */}
              {sources.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {sources.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-seed/15 bg-pith-card text-xs text-seed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rind" />
                      <span className="max-w-[200px] truncate font-medium">
                        {getSourceLabel(s)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSource(idx)}
                        className="text-seed-muted hover:text-flesh transition-colors ml-0.5 cursor-pointer"
                        aria-label="Remove source"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-seed-muted italic">
                  No sources attached yet — or let us find sources for you.
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-sm border border-flesh/30 bg-flesh/10 text-xs text-seed flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-flesh shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 3: Slice It Open */}
            <div className="pt-1">
              <Button
                size="lg"
                variant="rind"
                onClick={handleSliceOpen}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-sm font-heading font-bold text-sm tracking-wide cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Slicing open...
                  </span>
                ) : sources.length === 0 ? (
                  <span className="flex items-center gap-2">
                    Discover Sources & Slice Open
                    <ArrowRight className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Slice It Open
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Melon (Desktop, ~520px wide, bleeding slightly off the right edge) */}
        <div className="hidden lg:block lg:col-span-5 relative">
          <div className="w-[480px] xl:w-[530px] -mr-8 xl:-mr-12 pt-2">
            <HeroMelon />
          </div>
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="border-t border-seed/10" />

      {/* Lower Section: How it works as four numbered hairline-separated columns */}
      <div className="space-y-4">
        <h2 className="font-sans text-xs font-semibold text-seed-muted tracking-normal">
          Forensic investigation process
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-1">
          {/* Column 01 */}
          <div className="border-t border-seed/10 pt-4 space-y-1.5">
            <span className="text-xs font-mono font-bold text-rind">01</span>
            <h3 className="font-heading font-bold text-sm text-seed">Read</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Ingests raw text and URLs with SSRF protection, auditing publication dates and academic cycles.
            </p>
          </div>

          {/* Column 02 */}
          <div className="border-t border-seed/10 pt-4 space-y-1.5">
            <span className="text-xs font-mono font-bold text-rind">02</span>
            <h3 className="font-heading font-bold text-sm text-seed">Compare</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Extracts core claims strictly verified as verbatim substrings against raw ground truth.
            </p>
          </div>

          {/* Column 03 */}
          <div className="border-t border-seed/10 pt-4 space-y-1.5">
            <span className="text-xs font-mono font-bold text-crack">03</span>
            <h3 className="font-heading font-bold text-sm text-seed">Expose</h3>
            <p className="text-xs text-seed-muted leading-relaxed">
              Exposes unmentioned gaps, cross-source contradictions, and stale temporal mismatches.
            </p>
          </div>

          {/* Column 04 */}
          <div className="border-t border-seed/10 pt-4 space-y-1.5">
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
