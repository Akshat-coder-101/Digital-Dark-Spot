import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DiscoveryJob } from '../search/types.js';
import { FullAnalysisReport } from '../analysis/types.js';

const STORE_BASE_DIR = path.resolve(process.cwd(), 'data/store');
const DISCOVERY_DIR = path.join(STORE_BASE_DIR, 'discovery');
const REPORTS_DIR = path.join(STORE_BASE_DIR, 'reports');
const SEARCH_CACHE_DIR = path.join(STORE_BASE_DIR, 'search-cache');
const SNAPSHOTS_DIR = path.join(STORE_BASE_DIR, 'snapshots');

function ensureDir(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err: any) {
    console.warn(`[Store] Could not create directory ${dirPath}:`, err.message);
  }
}

// Initialize directory structure
ensureDir(DISCOVERY_DIR);
ensureDir(REPORTS_DIR);
ensureDir(SEARCH_CACHE_DIR);
ensureDir(SNAPSHOTS_DIR);

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export const persistentStore = {
  // Discovery Jobs
  saveDiscoveryJob(job: DiscoveryJob): void {
    try {
      ensureDir(DISCOVERY_DIR);
      const filePath = path.join(DISCOVERY_DIR, `${job.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(job, null, 2), 'utf8');
      
      // Also map question hash to job id for recovery
      if (job.question) {
        const qHash = hashKey(job.question);
        const mapPath = path.join(DISCOVERY_DIR, `q-${qHash}.json`);
        fs.writeFileSync(mapPath, JSON.stringify({ jobId: job.id, question: job.question }, null, 2), 'utf8');
      }
    } catch (err: any) {
      console.warn(`[Store] Failed to persist discovery job ${job.id}:`, err.message);
    }
  },

  getDiscoveryJob(id: string): DiscoveryJob | null {
    try {
      const filePath = path.join(DISCOVERY_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content) as DiscoveryJob;
      }
    } catch (err: any) {
      console.warn(`[Store] Failed to read discovery job ${id}:`, err.message);
    }
    return null;
  },

  findDiscoveryJobByQuestion(question: string): DiscoveryJob | null {
    try {
      const qHash = hashKey(question);
      const mapPath = path.join(DISCOVERY_DIR, `q-${qHash}.json`);
      if (fs.existsSync(mapPath)) {
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        if (mapData.jobId) {
          return this.getDiscoveryJob(mapData.jobId);
        }
      }
    } catch {}
    return null;
  },

  // Analysis Reports
  saveReport(report: FullAnalysisReport): void {
    try {
      ensureDir(REPORTS_DIR);
      const filePath = path.join(REPORTS_DIR, `${report.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
    } catch (err: any) {
      console.warn(`[Store] Failed to persist report ${report.id}:`, err.message);
    }
  },

  getReport(id: string): FullAnalysisReport | null {
    try {
      const filePath = path.join(REPORTS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content) as FullAnalysisReport;
      }
    } catch (err: any) {
      console.warn(`[Store] Failed to read report ${id}:`, err.message);
    }
    return null;
  },

  // Session Search Results Cache
  saveSearchCache(question: string, results: any[], suggestedAttributes?: string[]): void {
    try {
      ensureDir(SEARCH_CACHE_DIR);
      const qHash = hashKey(question);
      const filePath = path.join(SEARCH_CACHE_DIR, `${qHash}.json`);
      fs.writeFileSync(filePath, JSON.stringify({
        question,
        results,
        suggestedAttributes,
        cachedAt: Date.now()
      }, null, 2), 'utf8');
    } catch (err: any) {
      console.warn(`[Store] Failed to cache search for question:`, err.message);
    }
  },

  getSearchCache(question: string): (any[] & { suggestedAttributes?: string[] }) | null {
    try {
      const qHash = hashKey(question);
      const filePath = path.join(SEARCH_CACHE_DIR, `${qHash}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // Cache valid for the active session (up to 24 hours)
        if (Date.now() - data.cachedAt < 24 * 60 * 60 * 1000) {
          const arr = Array.isArray(data.results) ? data.results : [];
          if (data.suggestedAttributes) {
            (arr as any).suggestedAttributes = data.suggestedAttributes;
          }
          return arr as any;
        }
      }
    } catch {}
    return null;
  },

  // Demo Snapshots
  saveDemoSnapshot(report: FullAnalysisReport): { snapshotId: string; filePath: string } {
    ensureDir(SNAPSHOTS_DIR);
    const snapshotId = `demo-snapshot-${report.id.replace(/^rep-/, '')}`;
    const filePath = path.join(SNAPSHOTS_DIR, `${snapshotId}.json`);
    const dateFormatted = new Date().toISOString().split('T')[0];
    const snapshotReport: FullAnalysisReport = {
      ...report,
      id: snapshotId,
      summary: `[Saved snapshot of a live run (${dateFormatted})] ${report.summary || ''}`,
      analyzedWith: {
        provider: 'snapshot',
        model: 'demo-replay-cache',
        cached: true
      }
    };
    fs.writeFileSync(filePath, JSON.stringify(snapshotReport, null, 2), 'utf8');
    return { snapshotId, filePath };
  },

  getDemoSnapshot(id: string): FullAnalysisReport | null {
    try {
      const filePath = path.join(SNAPSHOTS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as FullAnalysisReport;
      }
    } catch (err: any) {
      console.warn(`[Store] Failed to load snapshot ${id}:`, err.message);
    }
    return null;
  }
};

