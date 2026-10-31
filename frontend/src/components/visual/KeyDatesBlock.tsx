import React, { useState } from 'react';
import { FullAnalysisReport } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface KeyDatesBlockProps {
  report: FullAnalysisReport;
  className?: string;
}

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

interface DateItem {
  id: string;
  claimId?: string;
  dateStr: string;
  isoDate?: string;
  what: string;
  sourceTitle: string;
  chipText: string;
  chipVariant: 'passed' | 'upcoming' | 'undated';
  isPassed: boolean;
}

export const KeyDatesBlock: React.FC<KeyDatesBlockProps> = ({ report, className }) => {
  const navigate = useNavigate();
  const [showPassed, setShowPassed] = useState(false);

  // Today reference (2026-10-31 or current system date)
  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Gather all claims with dates or dateKind
  const dateClaims: DateItem[] = [];

  for (const c of report.claims || []) {
    const val = c.value || '';
    const attr = c.attribute || '';
    const attrLower = attr.toLowerCase();
    const isDateAttr = attrLower.includes('date') ||
                       attrLower.includes('deadline') ||
                       attrLower.includes('validity') ||
                       attrLower.includes('period') ||
                       attrLower.includes('closing') ||
                       attrLower.includes('timeline');

    // Extract date pattern if present
    const dateMatch = val.match(/\b\d{4}-\d{2}-\d{2}\b/) ||
                      val.match(/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i) ||
                      val.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/);

    const hasDateKind = Boolean(c.dateKind && ['deadline', 'validity', 'opening', 'event', 'publication'].includes(c.dateKind));

    if (dateMatch || isDateAttr || hasDateKind || c.isDeadlinePassed) {
      let isoDate: string | undefined;
      const dateStr = dateMatch ? dateMatch[0] : (hasDateKind || isDateAttr ? val : '');

      if (!dateStr) continue;

      // Attempt parsing date
      try {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString().split('T')[0];
        }
      } catch {}

      const isPassed = Boolean(c.isDeadlinePassed || (isoDate && isoDate < todayIso));

      let chipText = 'Undated';
      let chipVariant: 'passed' | 'upcoming' | 'undated' = 'undated';

      if (isPassed) {
        chipText = 'Passed';
        chipVariant = 'passed';
      } else if (isoDate && isoDate >= todayIso) {
        try {
          const diffDays = Math.ceil((new Date(isoDate).getTime() - new Date(todayIso).getTime()) / (1000 * 60 * 60 * 24));
          chipText = diffDays > 0 ? `Upcoming in ${diffDays} days` : 'Today';
          chipVariant = 'upcoming';
        } catch {
          chipText = 'Upcoming';
          chipVariant = 'upcoming';
        }
      }

      dateClaims.push({
        id: `date-${c.id}`,
        claimId: c.id,
        dateStr,
        isoDate,
        what: formatSentenceCase(c.attribute),
        sourceTitle: c.source_title || c.source_domain,
        chipText,
        chipVariant,
        isPassed
      });
    }
  }

  // Deduplicate by dateStr + what
  const uniqueItems: DateItem[] = [];
  const seen = new Set<string>();
  for (const item of dateClaims) {
    const key = `${item.dateStr.toLowerCase()}|${item.what.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  // Separate passed and upcoming/active dates
  const passedItems = uniqueItems.filter(i => i.isPassed);
  const activeItems = uniqueItems.filter(i => !i.isPassed);

  // Sort upcoming chronologically (earliest upcoming first)
  activeItems.sort((a, b) => {
    if (a.isoDate && b.isoDate) return a.isoDate.localeCompare(b.isoDate);
    return a.dateStr.localeCompare(b.dateStr);
  });

  // Sort passed descending (most recent passed first)
  passedItems.sort((a, b) => {
    if (a.isoDate && b.isoDate) return b.isoDate.localeCompare(a.isoDate);
    return b.dateStr.localeCompare(a.dateStr);
  });

  // Max 10 visible items total
  const visibleActive = activeItems.slice(0, 10);

  if (uniqueItems.length === 0) {
    return null;
  }

  const handleItemClick = (claimId?: string) => {
    if (claimId) {
      navigate(`/report/${report.id}/evidence/${encodeURIComponent(claimId)}`);
    }
  };

  return (
    <div className={cn("w-full min-w-0 max-w-full rounded-sm border border-seed/10 bg-pith space-y-3 p-4 sm:p-5 shadow-2xs overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seed/10 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-rind" />
          <h3 className="font-heading font-bold text-xs sm:text-sm text-seed">
            Key dates
          </h3>
          <span className="text-xs text-seed-muted hidden sm:inline">
            — Deadlines, validity periods, and event milestones
          </span>
        </div>
        <span className="text-[11px] font-mono text-seed-muted">
          {uniqueItems.length} extracted date{uniqueItems.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Active / Upcoming Dates List */}
      <div className="divide-y divide-seed/10">
        {visibleActive.length > 0 ? (
          visibleActive.map((item) => (
            <div
              key={item.id}
              tabIndex={0}
              role="button"
              onClick={() => handleItemClick(item.claimId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item.claimId);
                }
              }}
              className="py-2.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-seed/2 transition-colors cursor-pointer rounded-xs focus:outline-none focus:bg-rind/5 group"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-bold text-seed shrink-0 w-32 group-hover:text-rind transition-colors">
                  {item.dateStr}
                </span>
                <span className="text-xs font-heading font-semibold text-seed truncate">
                  {item.what}
                </span>
                <span className="text-[11px] text-seed-muted truncate max-w-44 hidden md:inline">
                  via {item.sourceTitle}
                </span>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold border",
                    item.chipVariant === 'upcoming'
                      ? "bg-rind/10 text-rind border-rind/20"
                      : "bg-seed/5 text-seed-muted border-seed/10"
                  )}
                >
                  {item.chipText}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-2 text-xs text-seed-muted italic">
            No upcoming deadlines found in reviewed sources.
          </div>
        )}
      </div>

      {/* Collapsed Passed Dates Section */}
      {passedItems.length > 0 && (
        <div className="pt-2 border-t border-seed/10">
          <button
            type="button"
            onClick={() => setShowPassed(!showPassed)}
            className="text-xs font-mono text-seed-muted hover:text-seed inline-flex items-center gap-1.5 cursor-pointer py-1"
          >
            <Clock className="w-3.5 h-3.5 text-wilt" />
            <span className="font-medium">Passed ({passedItems.length})</span>
            {showPassed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showPassed && (
            <div className="mt-2 divide-y divide-seed/10 bg-seed/1 rounded-xs border border-seed/10 p-1">
              {passedItems.map((item) => (
                <div
                  key={item.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => handleItemClick(item.claimId)}
                  className="py-2 px-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-seed/2 transition-colors cursor-pointer rounded-xs"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-wilt line-through shrink-0 w-32">
                      {item.dateStr}
                    </span>
                    <span className="text-xs text-seed-muted truncate">
                      {item.what}
                    </span>
                    <span className="text-[11px] text-seed-muted/60 truncate max-w-44 hidden md:inline">
                      via {item.sourceTitle}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-2xs text-[10px] font-mono font-semibold bg-wilt/15 text-wilt border border-wilt/30 shrink-0">
                    Passed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
