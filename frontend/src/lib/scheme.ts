export interface SchemeInfo {
  name: string;
  cycle?: string | null;
  officialDomain?: string | null;
  officialTitle?: string | null;
  hasOfficialSource: boolean;
}

export function extractSchemeInfo(report: {
  id?: string;
  question: string;
  sources: Array<{
    title?: string;
    domain?: string;
    detectedCycle?: string | null;
    isOfficialDomain?: boolean;
  }>;
}): SchemeInfo {
  // If sample report
  if (report.id === 'sample-scholarship-report' || report.id?.includes('sample')) {
    return {
      name: 'National Scholarship Scheme 2026 (NSP)',
      cycle: '2026-27',
      officialDomain: 'scholarships.gov.in',
      officialTitle: 'National Scholarship Portal (NSP) — Central Guidelines 2026-27',
      hasOfficialSource: true
    };
  }

  const q = report.question ? report.question.trim() : '';

  // If question explicitly mentions NSP or National Scholarship Portal
  if (/\b(nsp|national scholarship portal)\b/i.test(q)) {
    return {
      name: 'National Scholarship Portal (NSP)',
      cycle: report.sources.find(s => s.detectedCycle)?.detectedCycle || null,
      officialDomain: 'scholarships.gov.in',
      officialTitle: 'National Scholarship Portal (scholarships.gov.in)',
      hasOfficialSource: true
    };
  }

  let name = '';

  // 1. Direct regex on question: "applying for (the )?..." or "about (the )?..."
  const applyMatch = q.match(/applying for (?:the )?([^?]+)/i);
  if (applyMatch && applyMatch[1] && !applyMatch[1].toLowerCase().includes('this scholarship')) {
    name = applyMatch[1].trim();
  } else {
    const aboutMatch = q.match(/(?:about|regarding|for) (?:the )?([^?]+)/i);
    if (aboutMatch && aboutMatch[1] && !aboutMatch[1].toLowerCase().includes('this scholarship')) {
      name = aboutMatch[1].trim();
    }
  }

  // 2. Fallback to searching official or first source title
  const officialSource = report.sources.find(s =>
    s.isOfficialDomain ||
    (s.domain && (s.domain.endsWith('.gov') || s.domain.endsWith('.gov.in') || s.domain.includes('.gov.')))
  ) || report.sources[0];

  const detectedCycle = report.sources.find(s => s.detectedCycle)?.detectedCycle || null;

  if (!name && officialSource?.title) {
    name = officialSource.title
      .replace(/\s*\((Official Notice|Guidelines|Official Portal)\)/gi, '')
      .replace(/\s*Guidelines\b/gi, '')
      .trim();
  }

  if (!name) {
    name = 'Scholarship / Aid Program';
  }

  return {
    name,
    cycle: detectedCycle,
    officialDomain: officialSource?.domain || null,
    officialTitle: officialSource?.title || null,
    hasOfficialSource: Boolean(report.sources.some(s => s.isOfficialDomain || (s.domain && (s.domain.endsWith('.gov') || s.domain.endsWith('.gov.in')))))
  };
}

