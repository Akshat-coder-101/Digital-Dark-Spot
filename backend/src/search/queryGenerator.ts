import { llmManager } from '../llm/manager.js';

export async function generateDiverseSearchQueries(question: string): Promise<string[]> {
  const currentYear = new Date().getFullYear();

  // Try LLM generation first if keys exist
  if (llmManager.hasAnyKeys()) {
    try {
      const systemPrompt = `You are an expert investigative search planner.
Given a user's research question, generate 4 to 6 diverse, high-precision search engine queries aimed at uncovering:
1. Official primary government / institutional notice
2. Primary qualifying criteria and restrictions
3. Mandatory document requirements
4. Deadlines, schedules, and cycle timeline
5. Ongoing continuation terms and extension conditions (often missing!)
6. Official application portal or submission link

Include the current year (${currentYear}) in relevant queries.
Return ONLY raw JSON matching: { "queries": string[] }`;

      const userPrompt = `Research Question: "${question}"`;

      const res = await llmManager.complete<{ queries: string[] }>({
        system: systemPrompt,
        user: userPrompt,
        jsonSchema: {
          type: 'object',
          properties: {
            queries: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['queries']
        }
      });

      if (Array.isArray(res.data?.queries) && res.data.queries.length >= 3) {
        return res.data.queries.slice(0, 6);
      }
    } catch (err) {
      console.warn('[Search] LLM query generation fallback triggered:', err);
    }
  }

  // Deterministic fallback query builder
  const base = question
    .replace(/[?.,!]/g, '')
    .trim();

  return [
    `${base} official notice guidelines ${currentYear}`,
    `${base} qualifying criteria requirements`,
    `${base} mandatory required documents checklist`,
    `${base} application deadline schedule ${currentYear}`,
    `${base} continuation terms policy extension`,
    `${base} official portal link application submission`
  ];
}

