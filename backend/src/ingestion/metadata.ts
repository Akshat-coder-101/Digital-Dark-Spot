/**
 * Metadata extractor for publication dates and cycle information.
 * 
 * HARD RULE: Publication dates must strictly come from explicit labels/metadata
 * ('Published', 'Updated', 'Posted on', 'Dated', 'Notice date', etc.)
 * NEVER from deadlines, validity periods, or closing dates.
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
  dateKind?: 'publication' | 'deadline' | 'validity' | 'unknown';
}

const EXPLICIT_PUB_PREFIX = /\b(?:published|updated|posted(?:\s+on)?|dated|last\s+modified|as\s+of|issue\s+date|circular\s+date|release\s+date|notice\s+dated?|gazette(?:\s+date)?|issued|circular\s+issued)\s*[:#\-]?\s*/i;
const EXPLICIT_DEADLINE_PREFIX = /\b(?:deadline|last\s+date|closing\s+date|due\s+date|valid\s+(?:until|through)|expires(?:\s+on)?|application\s+window\s+closes|submit\s+before)\s*[:#\-]?\s*/i;

export function detectTemporalMetadata(
  text: string,
  title?: string,
  currentTimestamp: number = Date.now()
): DetectedTemporalInfo {
  const combined = `${title || ''}\n${text.slice(0, 5000)}`;

  let detectedDate: string | null = null;
  let parsedDate: Date | undefined = undefined;
  let detectedCycle: string | null = null;
  let dateKind: 'publication' | 'deadline' | 'validity' | 'unknown' = 'unknown';

  // 1. Detect Cycle
  const cyclePrefixedRegex = /\b(?:AY|FY|Session|Academic\s+Year|Financial\s+Year|Cycle|Cohort|Batch|Phase)?\s*[:#]?\s*(20\d{2}|\d{2})\s*[-–/]\s*(\d{2,4})\s*(?:cycle|cohort|applicants|admissions|edition|grant\s+cycle)?\b/i;
  const editionRegex = /\b(202[0-9])\s+(?:edition|cycle|cohort)\b/i;
  const versionCycleRegex = /\b(?:cycle|cohort|phase)\s+v?(\d+(?:\.\d+)?)\b/i;

  const prefMatch = combined.match(cyclePrefixedRegex);
  if (prefMatch && (prefMatch[0].includes('-') || prefMatch[0].includes('/') || prefMatch[0].includes('–'))) {
    const rawStart = prefMatch[1];
    const startYear = rawStart.length === 2 ? parseInt(`20${rawStart}`, 10) : parseInt(rawStart, 10);
    const rawEnd = prefMatch[2];
    const endYear = rawEnd.length === 2 ? parseInt(`20${rawEnd}`, 10) : parseInt(rawEnd, 10);
    if (endYear === startYear + 1 || endYear === startYear) {
      detectedCycle = `${startYear}-${rawEnd.length === 4 ? rawEnd.slice(2) : rawEnd}`;
    }
  } else {
    const edMatch = combined.match(editionRegex);
    if (edMatch) {
      detectedCycle = `${edMatch[1]} edition`;
    } else {
      const verMatch = combined.match(versionCycleRegex);
      if (verMatch) {
        detectedCycle = `Cycle ${verMatch[1]}`;
      }
    }
  }

  // 2. Detect Publication Date
  // Split into lines/sentences to find explicit publication markers
  const lines = combined.split(/\n+/);
  
  for (const line of lines) {
    if (EXPLICIT_DEADLINE_PREFIX.test(line) && !EXPLICIT_PUB_PREFIX.test(line)) {
      // Exclude deadline lines from being publication dates
      continue;
    }

    const hasPubMarker = EXPLICIT_PUB_PREFIX.test(line);
    // If not an explicit marker, only consider title line if it contains a clear standalone date
    const isTitleLine = line === title;

    if (!hasPubMarker && !isTitleLine) {
      continue;
    }

    dateKind = 'publication';

    // Pattern A: "12 January 2026" or "15th March 2026"
    const datePatternA = /\b([0-3]?[0-9])(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})[.,]?\s+(202[0-9])\b/i;
    // Pattern B: "January 12, 2026"
    const datePatternB = /\b([A-Za-z]{3,9})\s+([0-3]?[0-9])(?:st|nd|rd|th)?[.,]?\s+(202[0-9])\b/i;
    // Pattern C: ISO "2026-01-12"
    const datePatternC = /\b(202[0-9])[-/.](0[1-9]|1[0-2])[-/.]([0-3][0-9])\b/;
    // Pattern D: "12/01/2026"
    const datePatternD = /\b([0-3]?[0-9])[/.-]([0-1]?[0-9])[/.-](202[0-9])\b/;

    const matchA = line.match(datePatternA);
    const matchB = line.match(datePatternB);
    const matchC = line.match(datePatternC);
    const matchD = line.match(datePatternD);

    if (matchA) {
      const mStr = matchA[2].toLowerCase();
      const monthIdx = MONTHS.findIndex(m => m.startsWith(mStr.slice(0, 3)));
      if (monthIdx !== -1) {
        detectedDate = `${matchA[1]} ${matchA[2]} ${matchA[3]}`;
        parsedDate = new Date(parseInt(matchA[3], 10), monthIdx, parseInt(matchA[1], 10));
        break;
      }
    }

    if (matchB) {
      const mStr = matchB[1].toLowerCase();
      const monthIdx = MONTHS.findIndex(m => m.startsWith(mStr.slice(0, 3)));
      if (monthIdx !== -1) {
        detectedDate = `${matchB[2]} ${matchB[1]} ${matchB[3]}`;
        parsedDate = new Date(parseInt(matchB[3], 10), monthIdx, parseInt(matchB[2], 10));
        break;
      }
    }

    if (matchC) {
      detectedDate = `${matchC[1]}-${matchC[2]}-${matchC[3]}`;
      parsedDate = new Date(parseInt(matchC[1], 10), parseInt(matchC[2], 10) - 1, parseInt(matchC[3], 10));
      break;
    }

    if (matchD) {
      let day = parseInt(matchD[1], 10);
      let month = parseInt(matchD[2], 10);
      if (month > 12 && day <= 12) {
        const temp = day;
        day = month;
        month = temp;
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        detectedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${matchD[3]}`;
        parsedDate = new Date(parseInt(matchD[3], 10), month - 1, day);
        break;
      }
    }
  }

  // 3. Freshness / Staleness audit using injectable clock
  const currentYear = new Date(currentTimestamp).getFullYear();
  const eighteenMonthsMs = 18 * 30.5 * 24 * 60 * 60 * 1000; // ~549 days

  let isStale = false;
  if (parsedDate && !isNaN(parsedDate.getTime())) {
    const age = currentTimestamp - parsedDate.getTime();
    if (age > eighteenMonthsMs) {
      isStale = true;
    }
  }

  // Cycle check: if cycle starts before (currentYear - 1) or earlier than 2025
  if (detectedCycle) {
    const numPart = detectedCycle.match(/\b(202[0-9])\b/);
    if (numPart) {
      const cycleStart = parseInt(numPart[1], 10);
      if (cycleStart < Math.min(2025, currentYear - 1)) {
        isStale = true;
      }
    }
  }

  const isUndated = !detectedDate && !detectedCycle;

  return {
    detectedDate,
    detectedCycle,
    isStale,
    isUndated,
    parsedDate,
    dateKind: detectedDate ? 'publication' : 'unknown'
  };
}
