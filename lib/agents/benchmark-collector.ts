import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { BenchmarkType, Prisma } from "@prisma/client";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BenchmarkEntry {
  vendor_slug: string;
  model_name: string;
  benchmark_type: "STT" | "TTS" | "V2V";
  source_name: string;
  source_url: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  dataset: string;
  language: string;
  raw_data?: Record<string, unknown>;
}

export interface BenchmarkCollectorResult {
  sources_checked: number;
  results_upserted: number;
  results_unchanged: number;
  errors: string[];
}

// ─── Source definitions ───────────────────────────────────────────────────────

const SOURCES: Array<{
  name: string;
  query: string;
  prompt: string;
}> = [
  {
    name: "HuggingFace Open ASR Leaderboard",
    query: "HuggingFace Open ASR Leaderboard top STT models WER 2025 2026",
    prompt: `Search the HuggingFace Open ASR Leaderboard and extract WER scores for the top STT models.

Return ONLY a JSON array (no markdown, no explanation) matching this schema:
[{
  "vendor_slug": string,        // e.g. "openai", "google", "assemblyai", "deepgram", "azure", "meta", "nvidia", "speechmatics"
  "model_name": string,         // e.g. "whisper-large-v3"
  "benchmark_type": "STT",
  "source_name": "HuggingFace Open ASR Leaderboard",
  "source_url": string,
  "metric_name": "WER",
  "metric_value": number,       // percentage, e.g. 2.7
  "metric_unit": "%",
  "dataset": string,            // e.g. "LibriSpeech test-clean"
  "language": "en"
}]

Include all available dataset/model combinations. Top 20 models max.`,
  },
  {
    name: "TTS Arena",
    query: "TTS Arena leaderboard ELO scores text-to-speech models ranking 2025 2026",
    prompt: `Search the TTS Arena (HuggingFace Spaces TTS-AGI/TTS-Arena) leaderboard and extract ELO scores.

Return ONLY a JSON array (no markdown, no explanation) matching this schema:
[{
  "vendor_slug": string,        // e.g. "elevenlabs", "openai", "google", "azure", "amazon"
  "model_name": string,
  "benchmark_type": "TTS",
  "source_name": "TTS Arena",
  "source_url": string,
  "metric_name": "ELO",
  "metric_value": number,
  "metric_unit": "score",
  "dataset": "ALL",
  "language": "en"
}]`,
  },
  {
    name: "Papers With Code - LibriSpeech",
    query: "Papers With Code LibriSpeech test-clean WER speech recognition benchmark 2025 2026",
    prompt: `Search Papers With Code for the LibriSpeech test-clean speech recognition benchmark and extract WER scores.

Return ONLY a JSON array (no markdown, no explanation) matching this schema:
[{
  "vendor_slug": string,
  "model_name": string,
  "benchmark_type": "STT",
  "source_name": "Papers With Code",
  "source_url": string,
  "metric_name": "WER",
  "metric_value": number,
  "metric_unit": "%",
  "dataset": "LibriSpeech test-clean",
  "language": "en"
}]

Top 20 results only.`,
  },
  {
    name: "Vendor Pricing - STT",
    query: "OpenAI Whisper AssemblyAI Deepgram Google Cloud STT pricing per minute 2025 2026",
    prompt: `Search for current pricing of the major STT APIs: OpenAI Whisper, AssemblyAI, Deepgram, Google Cloud Speech-to-Text, Azure Speech, AWS Transcribe.

Return ONLY a JSON array (no markdown, no explanation) matching this schema:
[{
  "vendor_slug": string,        // "openai", "assemblyai", "deepgram", "google", "azure", "aws-transcribe"
  "model_name": string,         // specific model name or "default"
  "benchmark_type": "STT",
  "source_name": "Vendor Documentation",
  "source_url": string,         // actual pricing page URL
  "metric_name": "price_per_minute",
  "metric_value": number,       // USD per minute, e.g. 0.006
  "metric_unit": "$/min",
  "dataset": "ALL",
  "language": "en"
}]`,
  },
  {
    name: "Vendor Pricing - TTS",
    query: "ElevenLabs OpenAI TTS Azure TTS Google TTS pricing per million characters 2025 2026",
    prompt: `Search for current pricing of the major TTS APIs: ElevenLabs, OpenAI TTS, Azure Neural TTS, Google Cloud TTS, Amazon Polly.

Return ONLY a JSON array (no markdown, no explanation) matching this schema:
[{
  "vendor_slug": string,        // "elevenlabs", "openai", "azure", "google", "amazon"
  "model_name": string,
  "benchmark_type": "TTS",
  "source_name": "Vendor Documentation",
  "source_url": string,
  "metric_name": "price_per_1m_chars",
  "metric_value": number,       // USD per 1M characters
  "metric_unit": "$/1M chars",
  "dataset": "ALL",
  "language": "en"
}]`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJsonArray(text: string): BenchmarkEntry[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]) as BenchmarkEntry[];
  } catch {
    return [];
  }
}

function normalizeVendorSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/\s+/g, "-");
}

// ─── Main agent ───────────────────────────────────────────────────────────────

export async function runBenchmarkCollector(): Promise<BenchmarkCollectorResult> {
  const startedAt = new Date();
  const errors: string[] = [];
  let sourcesChecked = 0;
  let resultsUpserted = 0;
  let resultsUnchanged = 0;

  // Load all tracked vendors into a slug→id map
  const vendors = await prisma.vendor.findMany({ where: { isTracked: true } });
  const vendorMap = new Map(vendors.map((v) => [v.slug, v.id]));

  const allEntries: BenchmarkEntry[] = [];

  // ── Step 1: collect from all sources ──────────────────────────────────────
  for (const source of SOURCES) {
    try {
      const response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" } as never],
        messages: [
          {
            role: "user",
            content: `Search query: "${source.query}"\n\n${source.prompt}`,
          },
        ],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      if (textBlock && textBlock.type === "text") {
        const entries = extractJsonArray(textBlock.text);
        allEntries.push(...entries);
      }

      sourcesChecked++;
    } catch (err) {
      errors.push(`Source "${source.name}": ${String(err)}`);
    }
  }

  // ── Step 2: deduplicate & upsert ──────────────────────────────────────────
  // Deduplicate by natural key before hitting DB
  type EntryKey = string;
  const seen = new Map<EntryKey, BenchmarkEntry>();
  for (const entry of allEntries) {
    const key = [
      normalizeVendorSlug(entry.vendor_slug),
      entry.model_name,
      entry.metric_name,
      entry.dataset ?? "ALL",
      entry.language ?? "en",
      entry.source_name,
    ].join("|");
    seen.set(key, entry);
  }

  for (const entry of seen.values()) {
    const slug = normalizeVendorSlug(entry.vendor_slug);
    const vendorId = vendorMap.get(slug);
    if (!vendorId) {
      // Unknown vendor — skip (could log if desired)
      continue;
    }

    const dataset = entry.dataset ?? "ALL";
    const language = entry.language ?? "en";

    try {
      // Check if value changed
      const existing = await prisma.benchmarkResult.findUnique({
        where: {
          vendorId_modelName_metricName_dataset_language_sourceName: {
            vendorId,
            modelName: entry.model_name,
            metricName: entry.metric_name,
            dataset,
            language,
            sourceName: entry.source_name,
          },
        },
      });

      const newValue = new Prisma.Decimal(entry.metric_value);
      if (existing && existing.metricValue.equals(newValue)) {
        resultsUnchanged++;
        continue;
      }

      await prisma.benchmarkResult.upsert({
        where: {
          vendorId_modelName_metricName_dataset_language_sourceName: {
            vendorId,
            modelName: entry.model_name,
            metricName: entry.metric_name,
            dataset,
            language,
            sourceName: entry.source_name,
          },
        },
        update: {
          metricValue: newValue,
          sourceUrl: entry.source_url,
          collectedAt: new Date(),
          rawData: (entry.raw_data ?? {}) as Prisma.InputJsonValue,
        },
        create: {
          vendorId,
          modelName: entry.model_name,
          benchmarkType: entry.benchmark_type as BenchmarkType,
          sourceName: entry.source_name,
          sourceUrl: entry.source_url,
          metricName: entry.metric_name,
          metricValue: newValue,
          metricUnit: entry.metric_unit,
          dataset,
          language,
          collectedAt: new Date(),
          rawData: (entry.raw_data ?? {}) as Prisma.InputJsonValue,
        },
      });

      resultsUpserted++;
    } catch (err) {
      errors.push(`Upsert [${slug}/${entry.model_name}/${entry.metric_name}]: ${String(err)}`);
    }
  }

  // ── Step 3: write audit log ───────────────────────────────────────────────
  await prisma.benchmarkRunLog.create({
    data: {
      status: errors.length === 0 ? "success" : resultsUpserted > 0 ? "partial" : "failed",
      sourcesChecked,
      resultsUpserted,
      resultsUnchanged,
      errors: errors.length > 0 ? (errors as Prisma.InputJsonValue) : Prisma.JsonNull,
      startedAt,
      completedAt: new Date(),
    },
  });

  return { sources_checked: sourcesChecked, results_upserted: resultsUpserted, results_unchanged: resultsUnchanged, errors };
}
