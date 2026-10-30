export interface SourcePayload {
  id?: string;
  type: 'url' | 'text';
  value: string;
  title?: string;
}

export async function fetchSampleData() {
  const res = await fetch('/api/sample');
  if (!res.ok) {
    throw new Error(`Failed to load sample data: ${res.statusText}`);
  }
  return res.json();
}

export async function startAnalysis(question: string, sources: SourcePayload[], forceRerun: boolean = false) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sources, forceRerun })
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

export async function getReport(reportId: string) {
  const res = await fetch(`/api/report/${encodeURIComponent(reportId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch report: HTTP ${res.status}`);
  }
  return res.json();
}
