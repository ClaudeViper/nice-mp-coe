import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Source Configuration ────────────────────────────────────────────────────

export interface NewsSource {
  name: string;
  method: "arxiv_api" | "rss_feed" | "web_scrape" | "reddit_api" | "api";
  url: string;
  frequency: "6h" | "daily";
  keywords: string[] | "all";
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: "ArXiv cs.SD, cs.CL, eess.AS",
    method: "web_scrape",
    url: "https://arxiv.org",
    frequency: "6h",
    keywords: ["speech recognition", "speech synthesis", "text-to-speech", "voice cloning"],
  },
  {
    name: "HuggingFace Blog",
    method: "web_scrape",
    url: "https://huggingface.co/blog",
    frequency: "6h",
    keywords: ["speech", "audio", "ASR", "TTS"],
  },
  {
    name: "OpenAI Blog",
    method: "web_scrape",
    url: "https://openai.com/blog",
    frequency: "6h",
    keywords: ["audio", "voice", "speech", "realtime", "whisper"],
  },
  {
    name: "Google AI Blog",
    method: "web_scrape",
    url: "https://blog.google/technology/ai/",
    frequency: "6h",
    keywords: ["speech", "voice", "audio", "WaveNet", "Gemini"],
  },
  {
    name: "ElevenLabs Blog",
    method: "web_scrape",
    url: "https://elevenlabs.io/blog",
    frequency: "6h",
    keywords: "all",
  },
  {
    name: "Deepgram Blog",
    method: "web_scrape",
    url: "https://deepgram.com/learn",
    frequency: "6h",
    keywords: "all",
  },
  {
    name: "Speechmatics Blog",
    method: "web_scrape",
    url: "https://www.speechmatics.com/company/articles-and-news",
    frequency: "6h",
    keywords: "all",
  },
  {
    name: "TechCrunch AI",
    method: "web_scrape",
    url: "https://techcrunch.com/category/artificial-intelligence/",
    frequency: "6h",
    keywords: ["speech", "voice AI", "transcription"],
  },
  {
    name: "VentureBeat AI",
    method: "web_scrape",
    url: "https://venturebeat.com/ai/",
    frequency: "6h",
    keywords: ["speech technology", "voice"],
  },
  {
    name: "Reddit r/MachineLearning",
    method: "web_scrape",
    url: "https://reddit.com/r/MachineLearning",
    frequency: "6h",
    keywords: ["STT", "TTS", "ASR", "speech"],
  },
  {
    name: "Papers With Code",
    method: "web_scrape",
    url: "https://paperswithcode.com",
    frequency: "daily",
    keywords: ["speech-recognition", "text-to-speech"],
  },
  {
    name: "Microsoft Research",
    method: "web_scrape",
    url: "https://www.microsoft.com/en-us/research/blog/",
    frequency: "daily",
    keywords: ["speech", "audio", "voice"],
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

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
  sourcesQueried: number;
  items: NewsItemOutput[];
}

// ─── Build search queries from source config ─────────────────────────────────

function buildSearchQueries(sources: NewsSource[]): { query: string; sourceName: string }[] {
  const queries: { query: string; sourceName: string }[] = [];

  for (const source of sources) {
    if (source.keywords === "all") {
      queries.push({
        query: `site:${new URL(source.url).hostname} speech voice AI latest news 2026`,
        sourceName: source.name,
      });
    } else {
      // Group keywords into 1-2 queries per source
      const keywordChunks: string[][] = [];
      for (let i = 0; i < source.keywords.length; i += 3) {
        keywordChunks.push(source.keywords.slice(i, i + 3));
      }

      for (const chunk of keywordChunks) {
        queries.push({
          query: `site:${new URL(source.url).hostname} ${chunk.join(" OR ")} 2026`,
          sourceName: source.name,
        });
      }
    }
  }

  return queries;
}

// ─── Main Agent ──────────────────────────────────────────────────────────────

export async function runNewsScout(baseUrl: string): Promise<NewsScoutResult> {
  const allItems: NewsItemOutput[] = [];
  const queries = buildSearchQueries(NEWS_SOURCES);

  // Process queries in parallel batches of 3
  const BATCH_SIZE = 3;
  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async ({ query, sourceName }) => {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
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

You are a news scout for a speech technology Center of Excellence at NICE.
Find the most relevant and recent news articles about speech/voice AI from this source: ${sourceName}.

Focus on results from 2025-2026. For each relevant result, extract and return a JSON array of objects:
{
  "title": string,
  "date": ISO8601 string (e.g. "2026-01-15T00:00:00Z"),
  "source": "${sourceName}",
  "url": string (full URL),
  "summary": string (2-3 concise sentences describing the key points and why it matters),
  "category": "STT" | "TTS" | "V2V" | "General" | "Research",
  "relevance_score": number 1-10 (how relevant to enterprise speech AI and NICE CXone contact center),
  "tags": string[] (e.g. "New Model", "Benchmark", "Open Source", "Pricing Change", "Integration", "Research Paper")
}

Scoring guide:
- 9-10: Major model release, SOTA benchmark, direct NICE competitor news
- 7-8: Significant industry development, new product launch, important research
- 5-6: Interesting but not critical, tangential developments
- 1-4: Low relevance, skip these

Only include items with relevance_score >= 5. Return ONLY the JSON array, no other text.`,
            },
          ],
        });

        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") return [];

        try {
          const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
          if (!jsonMatch) return [];
          return JSON.parse(jsonMatch[0]) as NewsItemOutput[];
        } catch {
          return [];
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allItems.push(...result.value);
      }
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
    sourcesQueried: queries.length,
    items: uniqueItems,
  };
}
