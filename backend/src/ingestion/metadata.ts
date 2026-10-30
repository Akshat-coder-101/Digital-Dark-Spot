/**
 * Metadata extractor for publication dates and cycle information.
 */

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export interface DetectedTemporalInfo {
  detectedDate: string | null;
  detectedCycle: string | null;
  isStale: boolean;
  isUndated: boolean;
  parsedDate?: Date;
}

export function detectTemporalMetadata(text: string, title?: string): DetectedTemporalInfo {
  const combined = `${title || ''}\n${text.slice(0, 5000)}`; // search title and top 5000 chars

  let detectedDate: string | null = null;
  let parsedDate: Date | undefined = undefined;
  let detectedCycle: string | null = null;

  // 1. Detect Cycle (e.g. AY 2025-26, FY 24-25, session 2025-2026, 2024/25, 2025-2026)
  const cyclePrefixedRegex = /\b(?:AY|FY|Session|Academic\s+Year|Financial\s+Year)\s*[:#]?\s*(20\d{2}|\d{2})\s*[-–/]\s*(\d{2,4})\b/i;
  const cycleGenericRegex = /\b(202[0-9])\s*[-–/]\s*([0-9]{2,4})\b/i;

  const prefMatch = combined.match(cyclePrefixedRegex);
  if (prefMatch) {
    let rawStart = prefMatch[1];
    let startYear = rawStart.length === 2 ? parseInt(`20${rawStart}`, 10) : parseInt(rawStart, 10);
    const rawEnd = prefMatch[2];
    const endYear = rawEnd.length === 2 ? parseInt(`20${rawEnd}`, 10) : parseInt(rawEnd, 10);
    if (endYear === startYear + 1 || endYear === startYear) {
      detectedCycle = `${startYear}-${rawEnd.length === 4 ? rawEnd.slice(2) : rawEnd}`;
    }
  } else {
    const cycleMatch = combined.match(cycleGenericRegex);
    if (cycleMatch) {
      const startYear = parseInt(cycleMatch[1], 10);
      const rawEnd = cycleMatch[2];
      const endYear = rawEnd.length === 2 ? parseInt(`20${rawEnd}`, 10) : parseInt(rawEnd, 10);
      if (endYear === startYear + 1 || endYear === startYear) {
        detectedCycle = `${startYear}-${rawEnd.length === 4 ? rawEnd.slice(2) : rawEnd}`;
      }
    }
  }

  // 2. Detect Dates
  // Pattern A: "15th March 2026" or "15 March 2026" or "15-Mar-2026"
  const datePatternA = /\b([0-3]?[0-9])(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})[.,]?\s+(202[0-9])\b/i;
  // Pattern B: "March 15, 2026" or "Mar 15 2026"
  const datePatternB = /\b([A-Za-z]{3,9})\s+([0-3]?[0-9])(?:st|nd|rd|th)?[.,]?\s+(202[0-9])\b/i;
  // Pattern C: ISO "2026-03-15"
  const datePatternC = /\b(202[0-9])[-/.](0[1-9]|1[0-2])[-/.]([0-3][0-9])\b/;
  // Pattern D: Slash / Dot numeric date "15/03/2026" or "15.03.2026" (DD/MM/YYYY)
  const datePatternD = /\b([0-3]?[0-9])[/.-]([0-1]?[0-9])[/.-](202[0-9])\b/;

  const matchA = combined.match(datePatternA);
  const matchB = combined.match(datePatternB);
  const matchC = combined.match(datePatternC);
  const matchD = combined.match(datePatternD);

  if (matchA) {
    const mStr = matchA[2].toLowerCase();
    const monthIdx = MONTHS.findIndex(m => m.startsWith(mStr.slice(0, 3)));
    if (monthIdx !== -1) {
      detectedDate = `${matchA[1]} ${matchA[2]} ${matchA[3]}`;
      parsedDate = new Date(parseInt(matchA[3], 10), monthIdx, parseInt(matchA[1], 10));
    }
  }

  if (!detectedDate && matchB) {
    const mStr = matchB[1].toLowerCase();
    const monthIdx = MONTHS.findIndex(m => m.startsWith(mStr.slice(0, 3)));
    if (monthIdx !== -1) {
      detectedDate = `${matchB[2]} ${matchB[1]} ${matchB[3]}`;
      parsedDate = new Date(parseInt(matchB[3], 10), monthIdx, parseInt(matchB[2], 10));
    }
  }

  if (!detectedDate && matchC) {
    detectedDate = `${matchC[1]}-${matchC[2]}-${matchC[3]}`;
    parsedDate = new Date(parseInt(matchC[1], 10), parseInt(matchC[2], 10) - 1, parseInt(matchC[3], 10));
  }

  if (!detectedDate && matchD) {
    let day = parseInt(matchD[1], 10);
    let month = parseInt(matchD[2], 10);
    // If month > 12 and day <= 12, swap for MM/DD/YYYY
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      detectedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${matchD[3]}`;
      parsedDate = new Date(parseInt(matchD[3], 10), month - 1, day);
    }
  }

  // 3. Freshness / Staleness audit
  // Reference date: current system time or hackathon anchor (Oct 2026)
  const referenceTime = new Date('2026-10-30T00:00:00Z').getTime();
  const eighteenMonthsMs = 18 * 30.5 * 24 * 60 * 60 * 1000; // ~549 days

  let isStale = false;
  if (parsedDate && !isNaN(parsedDate.getTime())) {
    const age = referenceTime - parsedDate.getTime();
    if (age > eighteenMonthsMs) {
      isStale = true;
    }
  }

  // Cycle check: if cycle starts before 2025 (e.g. 2023-24, 2024-25), flag as earlier/stale cycle
  if (detectedCycle) {
    const cycleStart = parseInt(detectedCycle.split('-')[0], 10);
    if (cycleStart < 2025) {
      isStale = true;
    }
  }

  const isUndated = !detectedDate && !detectedCycle;

  return {
    detectedDate,
    detectedCycle,
    isStale,
    isUndated,
    parsedDate
  };
}

