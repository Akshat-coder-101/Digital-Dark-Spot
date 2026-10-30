import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SeedIcon } from '@/components/common/Icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SourcePayload, startAnalysis, fetchSampleData } from '@/lib/api';
import { Plus, Trash2, Link2, FileText, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [question, setQuestion] = useState('');
  const [sources, setSources] = useState<SourcePayload[]>([]);
  const [sourceType, setSourceType] = useState<'url' | 'text'>('url');

  // Input fields for adding a source
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Quick prompt suggestions
  const suggestions = [
    "What should I verify before applying for this scholarship?",
    "What are the conflicting eligibility rules across these aid programs?",
    "What critical terms or renewal criteria are missing in these contracts?"
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

  // Submit / "Slice it open"
  const handleSliceOpen = async () => {
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter a research question or topic.');
      return;
    }

    if (sources.length === 0) {
      setError('Please add at least one source (URL or pasted text), or click "Use sample data".');
      return;
    }

    setIsSubmitting(true);
    try {
      // If this is the sample dataset, directly initialize or run
      if (sources.length === 3 && sources[0].id?.includes('sample')) {
        navigate('/analyzing/sample-scholarship-report');
        return;
      }

      const res = await startAnalysis(trimmedQuestion, sources);
      navigate(`/analyzing/${res.jobId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate analysis pipeline');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Hero Visual Section */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rind/15 text-rind text-xs font-semibold border border-rind/30">
          <SeedIcon className="w-3.5 h-3.5 fill-current" />
          <span>Information Gap & Contradiction Detection</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-seed tracking-tight">
          Slice Open What's Missing.
        </h1>

        <p className="text-seed-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Search engines summarize what exists. <strong>Digital Dark Spot</strong> reveals what is{' '}
          <span className="font-semibold text-seed underline decoration-rind decoration-2 underline-offset-4">missing</span>,{' '}
          <span className="font-semibold text-seed underline decoration-crack decoration-2 underline-offset-4">conflicting</span>, or{' '}
          <span className="font-semibold text-seed underline decoration-wilt decoration-2 underline-offset-4">outdated</span> across your sources.
        </p>

        {/* Quick Sample Data Button */}
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            disabled={isLoadingSample}
            className="border-flesh/30 hover:border-flesh hover:bg-flesh/10 text-flesh font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {isLoadingSample ? 'Loading Sample...' : 'Try Demo: Fictional Scholarship Dataset'}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-flesh/10 border border-flesh/30 text-flesh flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* Primary Intake Form Card */}
      <Card className="shadow-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">1. Research Question or Topic</CardTitle>
          <CardDescription>
            What decision, policy, or claim are you researching? Formulate a clear question.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What should I verify before applying for this scholarship?"
              rows={3}
              className="w-full p-4 rounded-xl border border-border bg-pith text-seed placeholder:text-seed-muted/60 focus:outline-none focus:ring-2 focus:ring-rind text-base leading-relaxed resize-none transition-colors"
            />

            {/* Suggestions list */}
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              <span className="text-xs text-seed-muted font-medium">Examples:</span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(s)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-pith-muted hover:bg-pith-card text-seed-muted hover:text-seed transition-colors text-left"
                >
                  "{s.slice(0, 45)}..."
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources Intake Card */}
      <Card className="shadow-lg border-border/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">2. Add Review Sources</CardTitle>
              <CardDescription>
                Provide official websites, articles, or pasted notes to cross-examine.
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-pith-muted text-seed">
              {sources.length} Staged {sources.length === 1 ? 'Source' : 'Sources'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as 'url' | 'text')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="url" className="flex-1 sm:flex-initial">
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
                Add URL
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 sm:flex-initial">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            {/* URL Input Tab */}
            <TabsContent value="url" className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.gov/scholarships/notice"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-pith text-sm focus:outline-none focus:ring-2 focus:ring-rind text-seed placeholder:text-seed-muted/60"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    placeholder="Source Label (optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-pith text-sm focus:outline-none focus:ring-2 focus:ring-rind text-seed placeholder:text-seed-muted/60"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-seed-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-rind" />
                  SSRF protected (private and loopback IPs strictly rejected).
                </span>
                <Button variant="rind" size="sm" onClick={() => handleAddUrl()}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add URL
                </Button>
              </div>
            </TabsContent>

            {/* Paste Text Tab */}
            <TabsContent value="text" className="space-y-3 pt-2">
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Title or Label (e.g. Official Gazette 2026 excerpt)"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-pith text-sm focus:outline-none focus:ring-2 focus:ring-rind text-seed placeholder:text-seed-muted/60"
              />
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste verbatim text content or excerpt from document or notice..."
                rows={4}
                className="w-full p-3.5 rounded-xl border border-border bg-pith text-sm focus:outline-none focus:ring-2 focus:ring-rind text-seed placeholder:text-seed-muted/60 resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-seed-muted">
                  {textInput.length} characters entered
                </span>
                <Button variant="rind" size="sm" onClick={() => handleAddText()}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Text Source
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Staged Sources List */}
          {sources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-seed-muted block mb-2">
                Staged Source Documents:
              </span>
              <div className="divide-y divide-border border border-border rounded-xl bg-pith overflow-hidden">
                {sources.map((src, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-pith-card border border-border flex items-center justify-center shrink-0 text-xs font-mono font-bold text-seed">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-seed truncate flex items-center gap-1.5">
                          {src.title || (src.type === 'url' ? src.value : 'Pasted Text Document')}
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-pith-muted text-seed-muted shrink-0">
                            {src.type}
                          </span>
                        </div>
                        <p className="text-xs text-seed-muted truncate font-mono">
                          {src.value.slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(idx)}
                      className="p-1.5 rounded-lg text-seed-muted hover:text-flesh hover:bg-flesh/10 transition-colors shrink-0"
                      aria-label="Remove source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/80">
          <div className="text-xs text-seed-muted text-center sm:text-left">
            <span>Ready to detect gaps, conflicts, and freshness across {sources.length} sources.</span>
          </div>

          {/* Primary Action Button */}
          <Button
            variant="rind"
            size="lg"
            onClick={handleSliceOpen}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 font-bold text-base shadow-md shadow-rind/25"
          >
            {isSubmitting ? 'Slicing open...' : 'Slice it open'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
