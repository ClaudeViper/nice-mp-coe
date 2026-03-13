import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface SeedEvaluation {
  vendorSlug: string;
  evaluationType: "STT" | "TTS" | "V2V";
  modelName: string;
  status: "Completed" | "Failed";
  totalSamples: number;
  processedSamples: number;
  metrics: Array<{
    metricName: string;
    metricValue: number;
    metricUnit: string;
  }>;
  sampleMetrics: Array<{
    sampleId: string;
    metricName: string;
    metricValue: number;
    metricUnit: string;
    details: Record<string, unknown>;
  }>;
}

const EVALUATIONS: SeedEvaluation[] = [
  // ── STT Evaluations ──────────────────────────────────────────────────────
  {
    vendorSlug: "openai",
    evaluationType: "STT",
    modelName: "whisper-large-v3",
    status: "Completed",
    totalSamples: 10,
    processedSamples: 10,
    metrics: [
      { metricName: "WER", metricValue: 3.2, metricUnit: "%" },
      { metricName: "CER", metricValue: 1.8, metricUnit: "%" },
      { metricName: "avg_latency", metricValue: 420, metricUnit: "ms" },
      { metricName: "RTF", metricValue: 0.105, metricUnit: "ratio" },
    ],
    sampleMetrics: [
      { sampleId: "stt-001", metricName: "sample_wer", metricValue: 0.0, metricUnit: "%", details: { transcript: "The quarterly earnings report shows a significant increase in revenue compared to last year.", wer: 0.0, cer: 0.0, latency_ms: 380, confidence: 0.98 } },
      { sampleId: "stt-002", metricName: "sample_wer", metricValue: 2.1, metricUnit: "%", details: { transcript: "I'd like to schedule an appointment for next Tuesday at three o'clock please.", wer: 2.1, cer: 1.2, latency_ms: 350, confidence: 0.95 } },
      { sampleId: "stt-003", metricName: "sample_wer", metricValue: 8.5, metricUnit: "%", details: { transcript: "The patient presented with acute myocardial infarction and was administered tissue plasminogen activator.", wer: 8.5, cer: 4.2, latency_ms: 520, confidence: 0.87 } },
      { sampleId: "stt-004", metricName: "sample_wer", metricValue: 3.1, metricUnit: "%", details: { transcript: "Have you tried restarting your router and checking if the ethernet cable is properly connected to the modem?", wer: 3.1, cer: 1.5, latency_ms: 440, confidence: 0.94 } },
      { sampleId: "stt-005", metricName: "sample_wer", metricValue: 1.2, metricUnit: "%", details: { transcript: "Could you please help me understand my monthly statement? I don't recognize some of these charges.", wer: 1.2, cer: 0.8, latency_ms: 410, confidence: 0.97 } },
    ],
  },
  {
    vendorSlug: "deepgram",
    evaluationType: "STT",
    modelName: "nova-2",
    status: "Completed",
    totalSamples: 10,
    processedSamples: 10,
    metrics: [
      { metricName: "WER", metricValue: 4.1, metricUnit: "%" },
      { metricName: "CER", metricValue: 2.3, metricUnit: "%" },
      { metricName: "avg_latency", metricValue: 280, metricUnit: "ms" },
      { metricName: "RTF", metricValue: 0.07, metricUnit: "ratio" },
    ],
    sampleMetrics: [
      { sampleId: "stt-001", metricName: "sample_wer", metricValue: 0.0, metricUnit: "%", details: { wer: 0.0, cer: 0.0, latency_ms: 250, confidence: 0.97 } },
      { sampleId: "stt-002", metricName: "sample_wer", metricValue: 3.5, metricUnit: "%", details: { wer: 3.5, cer: 1.8, latency_ms: 230, confidence: 0.93 } },
      { sampleId: "stt-003", metricName: "sample_wer", metricValue: 10.2, metricUnit: "%", details: { wer: 10.2, cer: 5.1, latency_ms: 310, confidence: 0.84 } },
    ],
  },
  {
    vendorSlug: "assemblyai",
    evaluationType: "STT",
    modelName: "universal-2",
    status: "Completed",
    totalSamples: 10,
    processedSamples: 10,
    metrics: [
      { metricName: "WER", metricValue: 2.8, metricUnit: "%" },
      { metricName: "CER", metricValue: 1.5, metricUnit: "%" },
      { metricName: "avg_latency", metricValue: 510, metricUnit: "ms" },
      { metricName: "RTF", metricValue: 0.128, metricUnit: "ratio" },
    ],
    sampleMetrics: [
      { sampleId: "stt-001", metricName: "sample_wer", metricValue: 0.0, metricUnit: "%", details: { wer: 0.0, latency_ms: 480, confidence: 0.99 } },
      { sampleId: "stt-002", metricName: "sample_wer", metricValue: 1.8, metricUnit: "%", details: { wer: 1.8, latency_ms: 460, confidence: 0.96 } },
      { sampleId: "stt-003", metricName: "sample_wer", metricValue: 6.2, metricUnit: "%", details: { wer: 6.2, latency_ms: 580, confidence: 0.89 } },
    ],
  },

  // ── TTS Evaluations ──────────────────────────────────────────────────────
  {
    vendorSlug: "elevenlabs",
    evaluationType: "TTS",
    modelName: "multilingual-v2",
    status: "Completed",
    totalSamples: 8,
    processedSamples: 8,
    metrics: [
      { metricName: "MOS", metricValue: 4.5, metricUnit: "score" },
      { metricName: "naturalness", metricValue: 92, metricUnit: "score" },
      { metricName: "TTFB", metricValue: 180, metricUnit: "ms" },
      { metricName: "roundtrip_WER", metricValue: 3.2, metricUnit: "%" },
    ],
    sampleMetrics: [
      { sampleId: "tts-001", metricName: "sample_mos", metricValue: 4.6, metricUnit: "score", details: { mos: 4.6, naturalness: 94, ttfb_ms: 160, synthesis_time_ms: 820 } },
      { sampleId: "tts-002", metricName: "sample_mos", metricValue: 4.4, metricUnit: "score", details: { mos: 4.4, naturalness: 90, ttfb_ms: 175, synthesis_time_ms: 950 } },
      { sampleId: "tts-003", metricName: "sample_mos", metricValue: 4.7, metricUnit: "score", details: { mos: 4.7, naturalness: 95, ttfb_ms: 155, synthesis_time_ms: 1100 } },
    ],
  },
  {
    vendorSlug: "openai",
    evaluationType: "TTS",
    modelName: "tts-1-hd",
    status: "Completed",
    totalSamples: 8,
    processedSamples: 8,
    metrics: [
      { metricName: "MOS", metricValue: 4.2, metricUnit: "score" },
      { metricName: "naturalness", metricValue: 87, metricUnit: "score" },
      { metricName: "TTFB", metricValue: 250, metricUnit: "ms" },
      { metricName: "roundtrip_WER", metricValue: 4.8, metricUnit: "%" },
    ],
    sampleMetrics: [
      { sampleId: "tts-001", metricName: "sample_mos", metricValue: 4.3, metricUnit: "score", details: { mos: 4.3, naturalness: 88, ttfb_ms: 230, synthesis_time_ms: 720 } },
      { sampleId: "tts-002", metricName: "sample_mos", metricValue: 4.1, metricUnit: "score", details: { mos: 4.1, naturalness: 85, ttfb_ms: 260, synthesis_time_ms: 840 } },
    ],
  },

  // ── V2V Evaluations ──────────────────────────────────────────────────────
  {
    vendorSlug: "hume",
    evaluationType: "V2V",
    modelName: "evi-2",
    status: "Completed",
    totalSamples: 6,
    processedSamples: 6,
    metrics: [
      { metricName: "task_completion_rate", metricValue: 82, metricUnit: "%" },
      { metricName: "e2e_latency", metricValue: 1200, metricUnit: "ms" },
      { metricName: "naturalness", metricValue: 85, metricUnit: "score" },
      { metricName: "persona_consistency", metricValue: 88, metricUnit: "score" },
      { metricName: "interruption_handling", metricValue: 78, metricUnit: "score" },
    ],
    sampleMetrics: [
      { sampleId: "v2v-001", metricName: "sample_task_completion", metricValue: 95, metricUnit: "%", details: { task_completion: 95, e2e_latency_ms: 1100, naturalness: 87, persona_consistency: 90 } },
      { sampleId: "v2v-002", metricName: "sample_task_completion", metricValue: 75, metricUnit: "%", details: { task_completion: 75, e2e_latency_ms: 1350, naturalness: 82, persona_consistency: 85 } },
      { sampleId: "v2v-005", metricName: "sample_task_completion", metricValue: 70, metricUnit: "%", details: { task_completion: 70, e2e_latency_ms: 1400, naturalness: 80, interruption_handling: 72 } },
    ],
  },
  {
    vendorSlug: "retell",
    evaluationType: "V2V",
    modelName: "voice-agent-v1",
    status: "Completed",
    totalSamples: 6,
    processedSamples: 6,
    metrics: [
      { metricName: "task_completion_rate", metricValue: 78, metricUnit: "%" },
      { metricName: "e2e_latency", metricValue: 950, metricUnit: "ms" },
      { metricName: "naturalness", metricValue: 76, metricUnit: "score" },
      { metricName: "persona_consistency", metricValue: 80, metricUnit: "score" },
      { metricName: "interruption_handling", metricValue: 65, metricUnit: "score" },
    ],
    sampleMetrics: [
      { sampleId: "v2v-001", metricName: "sample_task_completion", metricValue: 90, metricUnit: "%", details: { task_completion: 90, e2e_latency_ms: 880, naturalness: 78 } },
      { sampleId: "v2v-002", metricName: "sample_task_completion", metricValue: 68, metricUnit: "%", details: { task_completion: 68, e2e_latency_ms: 1050, naturalness: 74 } },
    ],
  },
];

async function main() {
  console.log("Seeding evaluation data...\n");

  const vendors = await prisma.vendor.findMany();
  const vendorMap = new Map(vendors.map((v) => [v.slug, v.id]));

  for (const ev of EVALUATIONS) {
    const vendorId = vendorMap.get(ev.vendorSlug);
    if (!vendorId) {
      console.log(`  ✗ Vendor "${ev.vendorSlug}" not found, skipping`);
      continue;
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        vendorId,
        evaluationType: ev.evaluationType,
        modelName: ev.modelName,
        status: ev.status,
        config: {} as Prisma.InputJsonValue,
        dataset: "standard",
        language: "en",
        totalSamples: ev.totalSamples,
        processedSamples: ev.processedSamples,
        startedAt: new Date(Date.now() - 300000),
        completedAt: ev.status === "Completed" ? new Date() : null,
      },
    });

    // Insert aggregate metrics
    for (const m of ev.metrics) {
      await prisma.evaluationResult.create({
        data: {
          evaluationId: evaluation.id,
          metricName: m.metricName,
          metricValue: new Prisma.Decimal(m.metricValue),
          metricUnit: m.metricUnit,
          sampleId: null,
          details: null,
        },
      });
    }

    // Insert per-sample metrics
    for (const s of ev.sampleMetrics) {
      await prisma.evaluationResult.create({
        data: {
          evaluationId: evaluation.id,
          metricName: s.metricName,
          metricValue: new Prisma.Decimal(s.metricValue),
          metricUnit: s.metricUnit,
          sampleId: s.sampleId,
          details: s.details as Prisma.InputJsonValue,
        },
      });
    }

    console.log(`  ✓ ${ev.vendorSlug} / ${ev.modelName} (${ev.evaluationType}) — ${ev.metrics.length} metrics, ${ev.sampleMetrics.length} samples`);
  }

  console.log(`\nSeeded ${EVALUATIONS.length} evaluations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
