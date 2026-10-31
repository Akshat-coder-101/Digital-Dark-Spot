import { llmManager } from '../llm/manager.js';

export async function generateDiverseSearchQueries(question: string): Promise<string[]> {
  const currentYear = new Date().getFullYear();

  // Try LLM generation first if keys exist
  if (llmManager.hasAnyKeys()) {
    try {
      const systemPrompt = `You are an expert investigative search planner.
Given a user's research question, generate 4 to 6 diverse, high-precision search engine queries aimed at uncovering:
1. Primary official sources, manufacturer specifications, or authoritative notices
2. Key qualifying criteria, core specifications, or essential standards
3. Critical requirements, mandatory documentation, or hardware/software terms
4. Timeline, deadlines, release schedules, or validity periods
5. Caveats, ongoing conditions, exclusions, or warranty terms
6. Official portal, verification links, or purchase/application channels

Include the current year (${currentYear}) where relevant.
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

  // Topic-neutral deterministic fallback queries
  const base = question
    .replace(/[?.,!]/g, '')
    .trim();

  return [
    `${base} official specifications documentation ${currentYear}`,
    `${base} key criteria requirements`,
    `${base} critical verification factors considerations`,
    `${base} schedule timeline dates ${currentYear}`,
    `${base} limitations exceptions policy`,
    `${base} official primary source link`
  ];
}

