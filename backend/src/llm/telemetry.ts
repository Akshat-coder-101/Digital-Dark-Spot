import fs from 'fs';
import path from 'path';

export interface LLMTimingRecord {
  provider: string;
  sourceId?: string;
  inputChars: number;
  outputChars: number;
  durationMs: number;
  attempt: number;
  outcome: 'success' | 'failover' | 'timeout' | 'error';
  cooldownWaitMs?: number;
  timestamp: string;
}

class TelemetryLogger {
  private records: LLMTimingRecord[] = [];
  private logPath: string = path.resolve(process.cwd(), 'docs', 'PERF.md');

  public logCall(record: Omit<LLMTimingRecord, 'timestamp'>): void {
    const fullRecord: LLMTimingRecord = {
      ...record,
      timestamp: new Date().toISOString()
    };
    this.records.push(fullRecord);

    // Kept server log (never printing keys)
    console.log(
      `[LLM Perf] provider=${fullRecord.provider} source=${fullRecord.sourceId || 'general'} ` +
      `in=${fullRecord.inputChars} out=${fullRecord.outputChars} ms=${fullRecord.durationMs} ` +
      `attempt=${fullRecord.attempt} outcome=${fullRecord.outcome}` +
      (fullRecord.cooldownWaitMs ? ` cooldownWaitMs=${fullRecord.cooldownWaitMs}` : '')
    );
  }

  public getRecords(): LLMTimingRecord[] {
    return [...this.records];
  }

  public clear(): void {
    this.records = [];
  }

  public flushToDoc(summaryHeader?: string): void {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let md = summaryHeader ? `${summaryHeader}\n\n` : '# LLM Performance & Timing Log\n\n';
      md += `*Recorded at: ${new Date().toISOString()}*\n\n`;
      md += '| Timestamp | Provider | Source / Task | In Chars | Out Chars | Duration (ms) | Attempt | Outcome |\n';
      md += '|---|---|---|---|---|---|---|---|\n';

      for (const r of this.records) {
        md += `| ${r.timestamp.slice(11, 19)} | ${r.provider} | ${r.sourceId || 'n/a'} | ${r.inputChars} | ${r.outputChars} | ${r.durationMs} | ${r.attempt} | ${r.outcome} |\n`;
      }

      fs.writeFileSync(this.logPath, md, 'utf8');
    } catch (err) {
      console.warn('[Telemetry] Failed to write docs/PERF.md:', err);
    }
  }
}

export const telemetry = new TelemetryLogger();

