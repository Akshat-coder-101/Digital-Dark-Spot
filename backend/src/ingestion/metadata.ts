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

  // 1. Detect Cycle (e.g. 2024-25, 2024-2025, 2023-24)
  const cycleRegex = /\b(202[0-9])\s*[-–/]\s*([0-9]{2,4})\b/i;
  const cycleMatch = combined.match(cycleRegex);
  if (cycleMatch) {
    const startYear = parseInt(cycleMatch[1], 10);
    const rawEnd = cycleMatch[2];
    const endYear = rawEnd.length === 2 ? parseInt(`20${rawEnd}`, 10) : parseInt(rawEnd, 10);
    if (endYear === startYear + 1 || endYear === startYear) {
      detectedCycle = `${startYear}-${rawEnd.length === 4 ? rawEnd.slice(2) : rawEnd}`;
    }
  }

  // 2. Detect Natural Dates (e.g. "12 January 2026", "January 12, 2026", "2026-01-12")
  // Pattern A: "12 January 2026" or "12th Jan 2026"
  const datePatternA = /\b([0-3]?[0-9])(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[.,]?\s+(202[0-9])\b/i;
  // Pattern B: "January 12, 2026"
  const datePatternB = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+([0-3]?[0-9])(?:st|nd|rd|th)?[.,]\s+(202[0-9])\b/i;
  // Pattern C: ISO "2026-01-12"
  const datePatternC = /\b(202[0-9])[-/](0[1-9]|1[0-2])[-/]([0-3][0-9])\b/;

  const matchA = combined.match(datePatternA);
  const matchB = combined.match(datePatternB);
  const matchC = combined.match(datePatternC);

  if (matchA) {
    detectedDate = `${matchA[1]} ${matchA[2]} ${matchA[3]}`;
    const monthIdx = MONTHS.findIndex(m => m.startsWith(matchA[2].toLowerCase().slice(0, 3)));
    if (monthIdx !== -1) {
      parsedDate = new Date(parseInt(matchA[3], 10), monthIdx, parseInt(matchA[1], 10));
    }
  } else if (matchB) {
    detectedDate = `${matchB[2]} ${matchB[1]} ${matchB[3]}`;
    const monthIdx = MONTHS.findIndex(m => m.startsWith(matchB[1].toLowerCase().slice(0, 3)));
    if (monthIdx !== -1) {
      parsedDate = new Date(parseInt(matchB[3], 10), monthIdx, parseInt(matchB[2], 10));
    }
  } else if (matchC) {
    detectedDate = `${matchC[3]}-${matchC[2]}-${matchC[1]}`;
    parsedDate = new Date(parseInt(matchC[1], 10), parseInt(matchC[2], 10) - 1, parseInt(matchC[3], 10));
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

