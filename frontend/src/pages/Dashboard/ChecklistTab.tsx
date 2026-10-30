import React, { useState, useEffect } from 'react';
import { useReport } from './ReportContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox';
import { BowlIcon } from '@/components/common/Icons';
import { ChecklistItem } from '@/lib/types';
import { Copy, Download, Check } from 'lucide-react';

export const ChecklistTab: React.FC = () => {
  const { report } = useReport();
  const storageKey = `dd_checklist_ticks_${report.id}`;

  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(checkedMap));
    } catch (e) {
      console.warn('Failed to save to sessionStorage', e);
    }
  }, [checkedMap, storageKey]);

  const toggleCheck = (itemId: string, isChecked: boolean) => {
    setCheckedMap(prev => ({
      ...prev,
      [itemId]: isChecked
    }));
  };

  const highPriority = report.checklist.filter(c => c.priority === 'High');
  const mediumPriority = report.checklist.filter(c => c.priority === 'Medium');
  const lowPriority = report.checklist.filter(c => c.priority === 'Low');

  const totalItems = report.checklist.length;
  const completedCount = Object.values(checkedMap).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Format checklist as Markdown
  const generateMarkdown = () => {
    let md = `# Digital Dark Spot — Verification Checklist\n\n`;
    md += `**Topic / Question:** ${report.question}\n`;
    md += `**Generated:** ${new Date().toLocaleDateString()}\n`;
    md += `**Progress:** ${completedCount}/${totalItems} items confirmed (${progressPercent}%)\n\n`;
    md += `> **Disclaimer:** Potential signals, not verified facts. Always confirm with primary authorities.\n\n`;

    const formatGroup = (title: string, items: ChecklistItem[]) => {
      if (items.length === 0) return '';
      let text = `## ${title} Priority Items\n\n`;
      for (const it of items) {
        const isDone = Boolean(checkedMap[it.id]);
        text += `- [${isDone ? 'x' : ' '}] **${it.title}** (${it.signalTag})\n`;
        text += `  - *Reason:* ${it.description}\n`;
        text += `  - *Suggested Authority:* ${it.suggestedOfficialSource}\n\n`;
      }
      return text;
    };

    md += formatGroup('High', highPriority);
    md += formatGroup('Medium', mediumPriority);
    md += formatGroup('Low', lowPriority);

    return md;
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-dark-spot-checklist-${report.id.slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-pith-card border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BowlIcon className="w-5 h-5 text-rind" />
            <h3 className="font-heading font-bold text-lg text-seed">
              Next-Step Verification Checklist
            </h3>
          </div>
          <p className="text-xs text-seed-muted">
            {completedCount} of {totalItems} items completed ({progressPercent}%). Ticks are automatically saved to your session.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="text-xs font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-rind" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied Markdown' : 'Copy as Markdown'}
          </Button>

          <Button
            variant="rind"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download .md
          </Button>
        </div>
      </div>

      {/* Checklist Groups */}
      <div className="space-y-6">
        {/* HIGH PRIORITY */}
        {highPriority.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-flesh animate-pulse" />
              <h4 className="font-heading font-bold text-base text-seed uppercase tracking-wider text-xs">
                High Priority — Direct Contradictions & Critical Gaps ({highPriority.length})
              </h4>
            </div>

            <div className="space-y-2.5">
              {highPriority.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 border transition-all ${
                    checkedMap[item.id] ? 'bg-pith-muted/30 border-border/50' : 'bg-pith-card border-border hover:border-rind/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AnimatedCheckbox
                      id={item.id}
                      checked={Boolean(checkedMap[item.id])}
                      onCheckedChange={(checked) => toggleCheck(item.id, checked)}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-sm font-semibold leading-snug ${checkedMap[item.id] ? 'line-through text-seed-muted' : 'text-seed'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-flesh/15 text-flesh shrink-0">
                          {item.signalTag}
                        </span>
                      </div>

                      <p className="text-xs text-seed-muted leading-relaxed">
                        {item.description}
                      </p>

                      <div className="pt-1.5 text-[11px] text-seed-muted flex items-center gap-1.5">
                        <strong className="text-seed">Suggested Authority:</strong>
                        <span>{item.suggestedOfficialSource}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MEDIUM PRIORITY */}
        {mediumPriority.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-crack" />
              <h4 className="font-heading font-bold text-base text-seed uppercase tracking-wider text-xs">
                Medium Priority — Uncovered Parameters & Cycle Checks ({mediumPriority.length})
              </h4>
            </div>

            <div className="space-y-2.5">
              {mediumPriority.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 border transition-all ${
                    checkedMap[item.id] ? 'bg-pith-muted/30 border-border/50' : 'bg-pith-card border-border hover:border-rind/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AnimatedCheckbox
                      id={item.id}
                      checked={Boolean(checkedMap[item.id])}
                      onCheckedChange={(checked) => toggleCheck(item.id, checked)}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-sm font-semibold leading-snug ${checkedMap[item.id] ? 'line-through text-seed-muted' : 'text-seed'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-pith-muted text-seed-muted shrink-0">
                          {item.signalTag}
                        </span>
                      </div>

                      <p className="text-xs text-seed-muted leading-relaxed">
                        {item.description}
                      </p>

                      <div className="pt-1.5 text-[11px] text-seed-muted flex items-center gap-1.5">
                        <strong className="text-seed">Suggested Authority:</strong>
                        <span>{item.suggestedOfficialSource}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* LOW PRIORITY */}
        {lowPriority.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-wilt" />
              <h4 className="font-heading font-bold text-base text-seed uppercase tracking-wider text-xs">
                Low Priority — Undated Audits ({lowPriority.length})
              </h4>
            </div>

            <div className="space-y-2.5">
              {lowPriority.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 border transition-all ${
                    checkedMap[item.id] ? 'bg-pith-muted/30 border-border/50' : 'bg-pith-card border-border hover:border-rind/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AnimatedCheckbox
                      id={item.id}
                      checked={Boolean(checkedMap[item.id])}
                      onCheckedChange={(checked) => toggleCheck(item.id, checked)}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-sm font-semibold leading-snug ${checkedMap[item.id] ? 'line-through text-seed-muted' : 'text-seed'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-pith-muted text-seed-muted shrink-0">
                          {item.signalTag}
                        </span>
                      </div>

                      <p className="text-xs text-seed-muted leading-relaxed">
                        {item.description}
                      </p>

                      <div className="pt-1.5 text-[11px] text-seed-muted flex items-center gap-1.5">
                        <strong className="text-seed">Suggested Authority:</strong>
                        <span>{item.suggestedOfficialSource}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
