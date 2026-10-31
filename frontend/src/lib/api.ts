export interface SourcePayload {
  id?: string;
  type: 'url' | 'text';
  value: string;
  title?: string;
  domain?: string;
  date?: string;
  rawContent?: string;
  sourceType?: string;
}

export interface DiscoveredSource {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  domain: string;
  isOfficial: boolean;
  limited?: boolean;
  rawContent?: string;
  sourceType?: string;
}

export async function getSnapshots(): Promise<{ available: boolean; count: number; snapshots: string[] }> {
  try {
    const res = await fetch('/api/snapshots');
    if (!res.ok) return { available: false, count: 0, snapshots: [] };
    return await res.json();
  } catch {
    return { available: false, count: 0, snapshots: [] };
  }
}

export async function fetchSampleData(scenarioId?: string) {
  const url = scenarioId ? `/api/sample/${encodeURIComponent(scenarioId)}` : '/api/sample';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load sample data: ${res.statusText}`);
  }
  return res.json();
}

export async function startAnalysis(
  question: string,
  sources: SourcePayload[],
  forceRerun: boolean = false,
  expectedAttributes?: string[]
) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sources, forceRerun, expectedAttributes })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis request failed with HTTP ${res.status}`);
  }

  return res.json() as Promise<{ jobId: string; status: string; message: string }>;
}

export async function getJobStatus(jobId: string) {
  const res = await fetch(`/api/analyze/${encodeURIComponent(jobId)}/status`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch job status: HTTP ${res.status}`);
  }
  return res.json();
}

export async function getAnalysisReport(reportId: string) {
  const res = await fetch(`/api/analyze/report/${encodeURIComponent(reportId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch analysis report: HTTP ${res.status}`);
  }
  return res.json();
}

export const getReport = getAnalysisReport;

export async function startDiscovery(question: string) {
  const res = await fetch('/api/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start automated source discovery.');
  }

  return res.json() as Promise<{ discoveryId: string; status: string; message: string }>;
}

export async function getDiscoveryJob(discoveryId: string) {
  const res = await fetch(`/api/discover/${encodeURIComponent(discoveryId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch discovery job status.');
  }
  return res.json();
}
