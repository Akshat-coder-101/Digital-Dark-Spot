export interface SchemeInfo {
  name: string;
  cycle?: string | null;
  officialDomain?: string | null;
  officialTitle?: string | null;
  hasOfficialSource: boolean;
  isSpecific: boolean;
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
      name: 'National Scholarship Scheme 2026',
      cycle: '2026-27',
      officialDomain: 'scholarships.gov.in',
      officialTitle: 'National Scholarship Portal (NSP) — Central Guidelines 2026-27',
      hasOfficialSource: true,
      isSpecific: true
    };
  }

  const q = report.question ? report.question.trim() : '';

  // Generic phrase blacklist: these are general questions, NOT specific scheme names
  const isGenericPhrase = (str: string) => {
    const s = str.toLowerCase().trim();
    return (
      !s ||
      s.includes('this scholarship') ||
      s.includes('this program') ||
      s.includes('these programs') ||
      s.includes('these aid programs') ||
      s.includes('these contracts') ||
      s.includes('these documents') ||
      s.includes('this grant') ||
      s.length < 3
    );
  };

  let name = '';
  let isSpecific = false;

  // 1. Direct regex on question: "applying for (the )?..." or "about (the )?..."
  const applyMatch = q.match(/applying for (?:the )?([^?]+)/i);
  if (applyMatch && applyMatch[1] && !isGenericPhrase(applyMatch[1])) {
    name = applyMatch[1].trim();
    isSpecific = true;
  } else {
    const aboutMatch = q.match(/(?:about|regarding|for) (?:the )?([^?]+)/i);
    if (aboutMatch && aboutMatch[1] && !isGenericPhrase(aboutMatch[1])) {
      name = aboutMatch[1].trim();
      isSpecific = true;
    }
  }

  // 2. Fallback to searching official or first source title
  const officialSource = report.sources.find(s =>
    s.isOfficialDomain ||
    (s.domain && (s.domain.endsWith('.gov') || s.domain.endsWith('.gov.in') || s.domain.includes('.gov.')))
  ) || report.sources[0];

  const detectedCycle = report.sources.find(s => s.detectedCycle)?.detectedCycle || null;

  if (!isSpecific && officialSource?.title && !isGenericPhrase(officialSource.title)) {
    const cleanedTitle = officialSource.title
      .replace(/\s*\((Official Notice|Guidelines|Official Portal)\)/gi, '')
      .replace(/\s*Guidelines\b/gi, '')
      .trim();

    if (cleanedTitle.length > 3 && !cleanedTitle.toLowerCase().includes('document') && !cleanedTitle.toLowerCase().includes('untitled')) {
      name = cleanedTitle;
      isSpecific = true;
    }
  }

  // Only if question explicitly typed "NSP"
  if (/\b(nsp|national scholarship portal)\b/i.test(q)) {
    name = 'National Scholarship Portal (NSP)';
    isSpecific = true;
  }

  return {
    name: name || 'General Inquiry',
    cycle: detectedCycle,
    officialDomain: officialSource?.domain || null,
    officialTitle: officialSource?.title || null,
    hasOfficialSource: Boolean(report.sources.some(s => s.isOfficialDomain || (s.domain && (s.domain.endsWith('.gov') || s.domain.endsWith('.gov.in'))))),
    isSpecific
  };
}
