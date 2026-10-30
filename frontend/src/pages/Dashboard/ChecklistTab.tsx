import React, { useState, useEffect } from 'react';
import { useReport } from './ReportContext';
import { Button } from '@/components/ui/button';
import { SeedCheckMorph } from '@/components/motion/SeedCheckMorph';
import CopyConfirm from '@/components/copy-confirm';
import { BowlIcon } from '@/components/common/Icons';
import { ChecklistItem } from '@/lib/types';
import { Download } from 'lucide-react';

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

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(checkedMap));
    } catch (e) {
      console.warn('Failed to save to sessionStorage', e);
    }
  }, [checkedMap, storageKey]);

  const toggleCheck = (itemId: string) => {
    setCheckedMap(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
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

  const markdownString = generateMarkdown();

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-sm bg-pith border border-seed/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BowlIcon className="w-4 h-4 text-rind" />
            <h3 className="font-heading font-bold text-base text-seed">
              Verification Checklist
            </h3>
          </div>
          <p className="text-xs text-seed-muted">
            {completedCount} of {totalItems} items confirmed ({progressPercent}%). Checkmarks persist in your session.
          </p>
        </div>

        {/* Action Controls: CopyConfirm + Download */}
        <div className="flex items-center gap-2 flex-wrap">
          <CopyConfirm
            title="Markdown Checklist"
            valueToCopy={markdownString}
            copyText="Copy as Markdown"
            copiedText="Copied Markdown"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download .md
          </Button>
        </div>
      </div>

      {/* Checklist Priority Groups */}
      <div className="space-y-8">
        {/* HIGH PRIORITY */}
        {highPriority.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-seed/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-flesh animate-pulse" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-seed">
                  High Priority — Critical Gaps & Contradictions ({highPriority.length})
                </h4>
              </div>
              <span className="text-[11px] font-mono text-flesh font-semibold">Immediate Action</span>
            </div>

            <div className="divide-y divide-seed/10 border border-seed/10 rounded-sm">
              {highPriority.map((item) => {
                const isChecked = Boolean(checkedMap[item.id]);

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      isChecked ? 'bg-seed/[0.01] opacity-70' : 'bg-pith hover:bg-seed/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <SeedCheckMorph
                          checked={isChecked}
                          onToggle={() => toggleCheck(item.id)}
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-sm font-semibold leading-snug ${isChecked ? 'line-through text-seed-muted' : 'text-seed'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-xs bg-flesh/10 text-flesh border border-flesh/20 shrink-0">
                            {item.signalTag}
                          </span>
                        </div>

                        <p className="text-xs text-seed-muted leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-1 text-[11px] text-seed-muted flex items-center gap-1.5 font-mono">
                          <strong className="text-seed">Suggested Authority:</strong>
                          <span>{item.suggestedOfficialSource}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MEDIUM PRIORITY */}
        {mediumPriority.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-seed/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crack" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-seed">
                  Medium Priority — Unverified Conditions & Cycle Checks ({mediumPriority.length})
                </h4>
              </div>
              <span className="text-[11px] font-mono text-crack font-semibold">Prior Cycle / Thin</span>
            </div>

            <div className="divide-y divide-seed/10 border border-seed/10 rounded-sm">
              {mediumPriority.map((item) => {
                const isChecked = Boolean(checkedMap[item.id]);

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      isChecked ? 'bg-seed/[0.01] opacity-70' : 'bg-pith hover:bg-seed/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <SeedCheckMorph
                          checked={isChecked}
                          onToggle={() => toggleCheck(item.id)}
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-sm font-semibold leading-snug ${isChecked ? 'line-through text-seed-muted' : 'text-seed'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-xs bg-crack/10 text-crack border border-crack/20 shrink-0">
                            {item.signalTag}
                          </span>
                        </div>

                        <p className="text-xs text-seed-muted leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-1 text-[11px] text-seed-muted flex items-center gap-1.5 font-mono">
                          <strong className="text-seed">Suggested Authority:</strong>
                          <span>{item.suggestedOfficialSource}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOW PRIORITY */}
        {lowPriority.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-seed/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-wilt" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-seed">
                  Low Priority — Undated Audits & Advisory ({lowPriority.length})
                </h4>
              </div>
              <span className="text-[11px] font-mono text-wilt font-semibold">Advisory Check</span>
            </div>

            <div className="divide-y divide-seed/10 border border-seed/10 rounded-sm">
              {lowPriority.map((item) => {
                const isChecked = Boolean(checkedMap[item.id]);

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      isChecked ? 'bg-seed/[0.01] opacity-70' : 'bg-pith hover:bg-seed/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <SeedCheckMorph
                          checked={isChecked}
                          onToggle={() => toggleCheck(item.id)}
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-sm font-semibold leading-snug ${isChecked ? 'line-through text-seed-muted' : 'text-seed'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-xs bg-seed/5 text-seed-muted border border-seed/10 shrink-0">
                            {item.signalTag}
                          </span>
                        </div>

                        <p className="text-xs text-seed-muted leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-1 text-[11px] text-seed-muted flex items-center gap-1.5 font-mono">
                          <strong className="text-seed">Suggested Authority:</strong>
                          <span>{item.suggestedOfficialSource}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
