import { ProviderAdapter, LLMCompletionOptions } from '../types.js';

export const groqAdapter: ProviderAdapter = {
  provider: 'groq',
  async complete(apiKey: string, model: string, options: LLMCompletionOptions): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const body: Record<string, any> = {
      model: model || 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const error = new Error(`Groq API error (${res.status}): ${errorText}`);
        (error as any).status = res.status;
        throw error;
      }

      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Groq API returned empty response content');
      }

      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

