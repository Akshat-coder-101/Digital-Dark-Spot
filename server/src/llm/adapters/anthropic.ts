import { ProviderAdapter, LLMCompletionOptions } from '../types.js';

export const anthropicAdapter: ProviderAdapter = {
  provider: 'anthropic',
  async complete(apiKey: string, model: string, options: LLMCompletionOptions): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';

    const systemPrompt = `${options.system}\n\nIMPORTANT: Return ONLY raw, valid JSON matching the schema. No markdown formatting, no conversational text, no backticks.`;

    const body: Record<string, any> = {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: options.user }
      ],
      temperature: 0.1
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const error = new Error(`Anthropic API error (${res.status}): ${errorText}`);
        (error as any).status = res.status;
        throw error;
      }

      const data: any = await res.json();
      const text = data?.content?.[0]?.text;
      if (!text) {
        throw new Error('Anthropic API returned empty message content');
      }

      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
