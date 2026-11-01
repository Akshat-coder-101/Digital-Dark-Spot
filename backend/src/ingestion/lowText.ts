/**
 * Domain-agnostic detection for sources unlikely to hold extractable structured text.
 * Covers social media / video platforms, login walls, and pages below usable text thresholds.
 */

const LOW_TEXT_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'fb.com',
  'twitter.com',
  'x.com',
  'pinterest.com',
  'vimeo.com',
  'threads.net',
  'linkedin.com'
];

const LOGIN_WALL_KEYWORDS = [
  'login',
  'sign in',
  'log in',
  'access denied',
  'subscription required',
  'please sign in',
  'login required',
  'subscribe to read',
  'members only'
];

export function isLowTextDomain(urlOrDomain: string): boolean {
  if (!urlOrDomain) return false;
  const lower = urlOrDomain.toLowerCase();
  return LOW_TEXT_DOMAINS.some(d => lower.includes(d));
}

export function isLoginWall(url?: string, title?: string, snippet?: string): boolean {
  const combined = `${url || ''} ${title || ''} ${snippet || ''}`.toLowerCase();
  return LOGIN_WALL_KEYWORDS.some(k => combined.includes(k));
}

export function isLowTextSource(src: {
  url?: string;
  domain?: string;
  title?: string;
  snippet?: string;
  rawContent?: string;
  cleanedText?: string;
  limited?: boolean;
  isLimited?: boolean;
  unavailable?: boolean;
  isUnavailable?: boolean;
}): boolean {
  if (src.unavailable || src.isUnavailable) return true;
  if (isLowTextDomain(src.url || '') || isLowTextDomain(src.domain || '')) return true;
  if (isLoginWall(src.url, src.title, src.snippet)) return true;
  if (src.limited || src.isLimited) return true;

  const content = src.cleanedText || src.rawContent || src.snippet || '';
  if (content.trim().length < 300) return true;

  return false;
}

