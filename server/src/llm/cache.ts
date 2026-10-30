import crypto from 'crypto';

export class LLMCache {
  private cache: Map<string, { data: any; provider: string; model: string; timestamp: number }> = new Map();

  static computeHash(question: string, sourceTexts: string[]): string {
    const normalized = [
      question.trim().toLowerCase(),
      ...sourceTexts.map(s => s.trim())
    ].join('|||');

    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  get(key: string): { data: any; provider: string; model: string } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return { data: entry.data, provider: entry.provider, model: entry.model };
  }

  set(key: string, data: any, provider: string, model: string): void {
    this.cache.set(key, {
      data,
      provider,
      model,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const llmCache = new LLMCache();

