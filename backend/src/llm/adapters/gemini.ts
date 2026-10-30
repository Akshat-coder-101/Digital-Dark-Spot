import { ProviderAdapter, LLMCompletionOptions } from '../types.js';

export const geminiAdapter: ProviderAdapter = {
  provider: 'gemini',
  async complete(apiKey: string, model: string, options: LLMCompletionOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body: Record<string, any> = {
      systemInstruction: {
        parts: [{ text: options.system }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: options.user }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    if (options.jsonSchema) {
      body.generationConfig.responseSchema = options.jsonSchema;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const error = new Error(`Gemini API error (${res.status}): ${errorText}`);
        (error as any).status = res.status;
        throw error;
      }

      const data: any = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned empty response candidates');
      }

      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
