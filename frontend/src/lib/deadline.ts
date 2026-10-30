/**
 * Parses natural language or structured dates from claim values and computes deadline status.
 */
export interface DeadlineInfo {
  isDeadline: boolean;
  text: string;
  daysRemaining: number;
  isPassed: boolean;
}

export function parseDeadlineFromText(attribute: string, value: string): DeadlineInfo | null {
  if (!attribute || !value) return null;

  const attrLower = attribute.toLowerCase();

  const isDeadlineAttribute =
    attrLower.includes('deadline') ||
    attrLower.includes('due') ||
    attrLower.includes('last_date') ||
    attrLower.includes('closing') ||
    attrLower.includes('date');

  if (!isDeadlineAttribute) return null;

  // Try extracting date pattern
  // Matches "31 March 2026", "March 31, 2026", "31st March 2026", "2026-03-31", "31/03/2026"
  const cleanVal = value.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

  // Try standard Date.parse
  let timestamp = Date.parse(cleanVal);

  // If Date.parse failed on slash formats like DD/MM/YYYY
  if (isNaN(timestamp)) {
    const slashMatch = cleanVal.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const d = parseInt(slashMatch[1], 10);
      const m = parseInt(slashMatch[2], 10) - 1;
      const y = parseInt(slashMatch[3], 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) {
        timestamp = dt.getTime();
      }
    }
  }

  if (isNaN(timestamp)) return null;

  const targetDate = new Date(timestamp);
  const now = new Date();
  // Strip time for clean day comparison
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffMs = targetDay - today;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return {
      isDeadline: true,
      text: `Deadline in ${days} day${days === 1 ? '' : 's'}`,
      daysRemaining: days,
      isPassed: false,
    };
  } else {
    return {
      isDeadline: true,
      text: 'Deadline passed',
      daysRemaining: days,
      isPassed: true,
    };
  }
}
