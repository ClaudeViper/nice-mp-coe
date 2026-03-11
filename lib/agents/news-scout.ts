import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SEARCH_QUERIES = [
  "speech to text new model release 2026",
  "text to speech AI breakthrough",
  "voice AI agent new product",
  "ASR benchmark SOTA",
  "TTS arena leaderboard update",
];

export interface NewsItemOutput {
  title: string;
  date: string; // ISO8601
  source: string;
  url: string;
  summary: string;
  category: "STT" | "TTS" | "V2V" | "General" | "Research";
  relevance_score: number; // 1-10
  tags: string[];
}

export interface NewsScoutResult {
  found: number;
  inserted: number;
  duplicates: number;
  items: NewsItemOutput[];
}

export async function runNewsScout(baseUrl: string): Promise<NewsScoutResult> {
  const allItems: NewsItemOutput[] = [];

  for (const query of SEARCH_QUERIES) {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
      messages: [
        {
          role: "user",
          content: `Search for: "${query}"

Find the most relevant and recent news articles about this topic, focusing on results from 2025-2026.

For each relevant result, extract and return a JSON array of objects with this exact schema:
{
  "title": string,
  "date": ISO8601 string (e.g. "2026-01-15T00:00:00Z"),
  "source": string (publication name),
  "url": string,
  "summary": string (2-3 sentences describing the key points),
  "category": "STT" | "TTS" | "V2V" | "General" | "Research",
  "relevance_score": number between 1-10 (how relevant to NICE's speech/voice AI products),
  "tags": string[] (relevant keywords)
}

Only include items with relevance_score >= 6. Return only the JSON array, no other text.`,
        },
      ],
    });

    // Extract JSON from the response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") continue;

    try {
      // Extract JSON array from text (handle markdown code blocks)
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const items: NewsItemOutput[] = JSON.parse(jsonMatch[0]);
      allItems.push(...items);
    } catch {
      // Skip malformed responses
      continue;
    }
  }

  // Deduplicate by URL
  const uniqueItems = Array.from(
    new Map(allItems.map((item) => [item.url, item])).values()
  );

  // Post each item to the API
  let inserted = 0;
  let duplicates = 0;

  for (const item of uniqueItems) {
    try {
      const res = await fetch(`${baseUrl}/api/news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (res.status === 201) inserted++;
      else if (res.status === 409) duplicates++;
    } catch {
      // Network error, skip
    }
  }

  return {
    found: uniqueItems.length,
    inserted,
    duplicates,
    items: uniqueItems,
  };
}
