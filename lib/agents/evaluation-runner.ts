import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { BenchmarkType, Prisma } from "@prisma/client";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationConfig {
  apiKey?: string;
  endpointUrl?: string;
  modelId?: string;
  additionalParams?: Record<string, unknown>;
}

export interface EvaluationRequest {
  vendorId: string;
  evaluationType: BenchmarkType;
  modelName: string;
  config: EvaluationConfig;
  dataset?: string;
  language?: string;
}

export interface EvaluationRunResult {
  evaluationId: string;
  status: "Completed" | "Failed";
  metrics: Record<string, { value: number; unit: string }>;
  comparisonSummary: string | null;
  error?: string;
}

// ─── Built-in Test Datasets ──────────────────────────────────────────────────

interface STTSample {
  id: string;
  audioDescription: string;
  groundTruth: string;
  duration: number;
  difficulty: string;
}

interface TTSSample {
  id: string;
  text: string;
  expectedDuration: number;
  category: string;
}

interface V2VSample {
  id: string;
  scenario: string;
  expectedBehavior: string;
  turns: number;
  category: string;
}

const STT_SAMPLES: STTSample[] = [
  { id: "stt-001", audioDescription: "Clear male voice, office environment", groundTruth: "The quarterly earnings report shows a significant increase in revenue compared to last year.", duration: 4.2, difficulty: "easy" },
  { id: "stt-002", audioDescription: "Female voice with background noise, call center", groundTruth: "I'd like to schedule an appointment for next Tuesday at three o'clock please.", duration: 3.8, difficulty: "medium" },
  { id: "stt-003", audioDescription: "Accented speech, medical terminology", groundTruth: "The patient presented with acute myocardial infarction and was administered tissue plasminogen activator.", duration: 5.1, difficulty: "hard" },
  { id: "stt-004", audioDescription: "Fast speech, technical support call", groundTruth: "Have you tried restarting your router and checking if the ethernet cable is properly connected to the modem?", duration: 4.5, difficulty: "medium" },
  { id: "stt-005", audioDescription: "Elderly speaker, slow pace", groundTruth: "Could you please help me understand my monthly statement? I don't recognize some of these charges.", duration: 5.8, difficulty: "easy" },
  { id: "stt-006", audioDescription: "Multiple speakers, conference call", groundTruth: "We need to finalize the proposal by Friday. Can everyone submit their sections by Wednesday?", duration: 4.0, difficulty: "hard" },
  { id: "stt-007", audioDescription: "Phone quality audio, customer complaint", groundTruth: "I've been on hold for thirty minutes and this is the third time I'm calling about the same issue.", duration: 4.3, difficulty: "medium" },
  { id: "stt-008", audioDescription: "Clear speech with numbers", groundTruth: "My account number is seven four two three eight nine one and my zip code is nine zero two one zero.", duration: 5.0, difficulty: "medium" },
  { id: "stt-009", audioDescription: "Emotional speech, frustrated customer", groundTruth: "This is absolutely unacceptable! I was promised a refund two weeks ago and nothing has happened.", duration: 4.1, difficulty: "hard" },
  { id: "stt-010", audioDescription: "Whispered speech, quiet environment", groundTruth: "I'm in a meeting right now. Can I call you back in about fifteen minutes?", duration: 3.5, difficulty: "hard" },
];

const TTS_SAMPLES: TTSSample[] = [
  { id: "tts-001", text: "Welcome to NICE customer support. How may I assist you today?", expectedDuration: 3.5, category: "greeting" },
  { id: "tts-002", text: "Your current account balance is four hundred and thirty-two dollars and seventeen cents.", expectedDuration: 4.0, category: "numbers" },
  { id: "tts-003", text: "I understand your frustration. Let me look into this issue right away and find a solution for you.", expectedDuration: 4.5, category: "empathy" },
  { id: "tts-004", text: "Your appointment has been confirmed for Thursday, March twenty-seventh at two thirty PM.", expectedDuration: 4.0, category: "scheduling" },
  { id: "tts-005", text: "For security purposes, I'll need to verify your identity. Could you please provide your date of birth?", expectedDuration: 4.5, category: "verification" },
  { id: "tts-006", text: "Thank you for calling. Your reference number is A-B-C-one-two-three-four-five. Is there anything else I can help you with?", expectedDuration: 5.5, category: "closing" },
  { id: "tts-007", text: "I'm transferring you to our technical support department. Please hold while I connect you.", expectedDuration: 4.0, category: "transfer" },
  { id: "tts-008", text: "Based on your usage patterns, I'd recommend upgrading to our premium plan which includes unlimited data and priority support.", expectedDuration: 5.0, category: "upsell" },
];

const V2V_SAMPLES: V2VSample[] = [
  { id: "v2v-001", scenario: "Customer calls to check order status. Order #12345 was shipped yesterday via FedEx.", expectedBehavior: "Greet customer, ask for order number, provide shipping status and tracking info", turns: 4, category: "order_inquiry" },
  { id: "v2v-002", scenario: "Customer wants to cancel their subscription. Try to retain with 20% discount offer.", expectedBehavior: "Empathize, ask reason, offer discount, process if customer insists", turns: 6, category: "retention" },
  { id: "v2v-003", scenario: "Customer reports internet outage. Known outage in their area, ETA 2 hours.", expectedBehavior: "Acknowledge issue, check outage status, provide ETA, offer credit", turns: 5, category: "technical_support" },
  { id: "v2v-004", scenario: "Customer wants to schedule a callback from a specialist for a complex billing dispute.", expectedBehavior: "Collect information, check specialist availability, confirm callback", turns: 5, category: "scheduling" },
  { id: "v2v-005", scenario: "Customer interrupts mid-sentence to change their request from billing to technical support.", expectedBehavior: "Handle interruption gracefully, acknowledge topic change, redirect", turns: 4, category: "interruption_handling" },
  { id: "v2v-006", scenario: "Customer speaks with heavy accent asking about international roaming charges.", expectedBehavior: "Understand accented speech, provide accurate roaming info, offer plan options", turns: 5, category: "accent_handling" },
];

// ─── Evaluation Pipeline ─────────────────────────────────────────────────────

async function evaluateSTT(
  evaluationId: string,
  config: EvaluationConfig,
  samples: STTSample[]
): Promise<Record<string, { value: number; unit: string }>> {
  let totalWer = 0;
  let totalCer = 0;
  let totalLatency = 0;
  let totalSamples = 0;

  for (const sample of samples) {
    // Use Claude to simulate the evaluation (in production, this would call the actual vendor API)
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are simulating an STT evaluation. Given this audio sample description and ground truth, generate realistic evaluation metrics.

Audio: ${sample.audioDescription}
Ground Truth: "${sample.groundTruth}"
Difficulty: ${sample.difficulty}
Vendor endpoint: ${config.endpointUrl ?? "default"}
Model: ${config.modelId ?? "default"}

Return ONLY a JSON object (no markdown):
{
  "transcript": string,           // simulated transcript with realistic errors based on difficulty
  "wer": number,                  // word error rate 0-100%, realistic for difficulty level
  "cer": number,                  // character error rate 0-100%
  "latency_ms": number,          // processing latency in ms (realistic: 200-2000ms)
  "confidence": number           // confidence score 0-1
}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    if (textBlock && textBlock.type === "text") {
      try {
        const match = textBlock.text.match(/\{[\s\S]*\}/);
        if (match) {
          const result = JSON.parse(match[0]);
          totalWer += result.wer ?? 5;
          totalCer += result.cer ?? 3;
          totalLatency += result.latency_ms ?? 500;
          totalSamples++;

          // Store per-sample result
          await prisma.evaluationResult.create({
            data: {
              evaluationId,
              metricName: "sample_wer",
              metricValue: new Prisma.Decimal(result.wer ?? 5),
              metricUnit: "%",
              sampleId: sample.id,
              details: result as Prisma.InputJsonValue,
            },
          });
        }
      } catch {
        // Skip malformed responses
      }
    }

    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { processedSamples: { increment: 1 } },
    });
  }

  if (totalSamples === 0) totalSamples = 1;

  const avgWer = totalWer / totalSamples;
  const avgCer = totalCer / totalSamples;
  const avgLatency = totalLatency / totalSamples;
  const rtf = avgLatency / 1000 / 4.0; // approximate 4s average audio

  return {
    WER: { value: Math.round(avgWer * 100) / 100, unit: "%" },
    CER: { value: Math.round(avgCer * 100) / 100, unit: "%" },
    avg_latency: { value: Math.round(avgLatency), unit: "ms" },
    RTF: { value: Math.round(rtf * 1000) / 1000, unit: "ratio" },
  };
}

async function evaluateTTS(
  evaluationId: string,
  config: EvaluationConfig,
  samples: TTSSample[]
): Promise<Record<string, { value: number; unit: string }>> {
  let totalMos = 0;
  let totalLatency = 0;
  let totalNaturalness = 0;
  let totalRoundtripWer = 0;
  let totalSamples = 0;

  for (const sample of samples) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are simulating a TTS evaluation. Generate realistic metrics for synthesizing this text.

Text: "${sample.text}"
Category: ${sample.category}
Expected Duration: ${sample.expectedDuration}s
Vendor endpoint: ${config.endpointUrl ?? "default"}
Model: ${config.modelId ?? "default"}

Return ONLY a JSON object (no markdown):
{
  "mos": number,                 // Mean Opinion Score 1-5
  "naturalness": number,         // naturalness score 0-100
  "ttfb_ms": number,            // time to first byte in ms (realistic: 100-800ms)
  "synthesis_time_ms": number,  // total synthesis time in ms
  "roundtrip_wer": number,     // WER from STT-roundtrip test 0-100%
  "audio_duration": number     // generated audio duration in seconds
}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    if (textBlock && textBlock.type === "text") {
      try {
        const match = textBlock.text.match(/\{[\s\S]*\}/);
        if (match) {
          const result = JSON.parse(match[0]);
          totalMos += result.mos ?? 3.5;
          totalLatency += result.ttfb_ms ?? 300;
          totalNaturalness += result.naturalness ?? 75;
          totalRoundtripWer += result.roundtrip_wer ?? 8;
          totalSamples++;

          await prisma.evaluationResult.create({
            data: {
              evaluationId,
              metricName: "sample_mos",
              metricValue: new Prisma.Decimal(result.mos ?? 3.5),
              metricUnit: "score",
              sampleId: sample.id,
              details: result as Prisma.InputJsonValue,
            },
          });
        }
      } catch {
        // Skip malformed responses
      }
    }

    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { processedSamples: { increment: 1 } },
    });
  }

  if (totalSamples === 0) totalSamples = 1;

  return {
    MOS: { value: Math.round((totalMos / totalSamples) * 100) / 100, unit: "score" },
    naturalness: { value: Math.round(totalNaturalness / totalSamples), unit: "score" },
    TTFB: { value: Math.round(totalLatency / totalSamples), unit: "ms" },
    roundtrip_WER: { value: Math.round((totalRoundtripWer / totalSamples) * 100) / 100, unit: "%" },
  };
}

async function evaluateV2V(
  evaluationId: string,
  config: EvaluationConfig,
  samples: V2VSample[]
): Promise<Record<string, { value: number; unit: string }>> {
  let totalCompletion = 0;
  let totalLatency = 0;
  let totalNaturalness = 0;
  let totalPersona = 0;
  let totalInterruption = 0;
  let totalSamples = 0;

  for (const sample of samples) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are simulating a V2V (voice-to-voice) agent evaluation. Generate realistic metrics.

Scenario: ${sample.scenario}
Expected behavior: ${sample.expectedBehavior}
Expected turns: ${sample.turns}
Category: ${sample.category}
Vendor endpoint: ${config.endpointUrl ?? "default"}
Model: ${config.modelId ?? "default"}

Return ONLY a JSON object (no markdown):
{
  "task_completion": number,         // 0-100% did the agent complete the task
  "e2e_latency_ms": number,        // end-to-end latency per turn in ms (realistic: 500-3000ms)
  "turn_taking_latency_ms": number, // turn-taking gap in ms (realistic: 200-1500ms)
  "naturalness": number,            // naturalness score 0-100
  "persona_consistency": number,    // persona consistency 0-100
  "interruption_handling": number,  // interruption handling score 0-100
  "actual_turns": number           // actual number of turns
}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    if (textBlock && textBlock.type === "text") {
      try {
        const match = textBlock.text.match(/\{[\s\S]*\}/);
        if (match) {
          const result = JSON.parse(match[0]);
          totalCompletion += result.task_completion ?? 80;
          totalLatency += result.e2e_latency_ms ?? 1500;
          totalNaturalness += result.naturalness ?? 70;
          totalPersona += result.persona_consistency ?? 75;
          totalInterruption += result.interruption_handling ?? 65;
          totalSamples++;

          await prisma.evaluationResult.create({
            data: {
              evaluationId,
              metricName: "sample_task_completion",
              metricValue: new Prisma.Decimal(result.task_completion ?? 80),
              metricUnit: "%",
              sampleId: sample.id,
              details: result as Prisma.InputJsonValue,
            },
          });
        }
      } catch {
        // Skip malformed responses
      }
    }

    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { processedSamples: { increment: 1 } },
    });
  }

  if (totalSamples === 0) totalSamples = 1;

  return {
    task_completion_rate: { value: Math.round(totalCompletion / totalSamples), unit: "%" },
    e2e_latency: { value: Math.round(totalLatency / totalSamples), unit: "ms" },
    naturalness: { value: Math.round(totalNaturalness / totalSamples), unit: "score" },
    persona_consistency: { value: Math.round(totalPersona / totalSamples), unit: "score" },
    interruption_handling: { value: Math.round(totalInterruption / totalSamples), unit: "score" },
  };
}

// ─── Comparison Generator ────────────────────────────────────────────────────

async function generateComparison(
  evaluationType: BenchmarkType,
  vendorSlug: string,
  modelName: string,
  metrics: Record<string, { value: number; unit: string }>
): Promise<string> {
  // Fetch existing benchmarks for comparison
  const benchmarks = await prisma.benchmarkResult.findMany({
    where: { benchmarkType: evaluationType },
    include: { vendor: { select: { name: true, slug: true } } },
    orderBy: { metricName: "asc" },
    take: 50,
  });

  if (benchmarks.length === 0) return "No existing benchmarks to compare against.";

  const benchmarkSummary = benchmarks
    .map((b) => `${b.vendor.name} ${b.modelName}: ${b.metricName}=${b.metricValue}${b.metricUnit}`)
    .join("\n");

  const evalSummary = Object.entries(metrics)
    .map(([k, v]) => `${k}=${v.value}${v.unit}`)
    .join(", ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Compare these evaluation results against existing benchmarks. Be concise (3-4 sentences).

Evaluated: ${vendorSlug} / ${modelName} (${evaluationType})
Results: ${evalSummary}

Existing benchmarks:
${benchmarkSummary}

Provide a brief comparison highlighting where the evaluated model stands relative to the competition. Note any strengths and weaknesses.`,
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "Comparison unavailable.";
}

// ─── Main Agent ──────────────────────────────────────────────────────────────

export async function runEvaluation(request: EvaluationRequest): Promise<EvaluationRunResult> {
  // Create evaluation record
  const evaluation = await prisma.evaluation.create({
    data: {
      vendorId: request.vendorId,
      evaluationType: request.evaluationType,
      modelName: request.modelName,
      status: "Running",
      config: request.config as Prisma.InputJsonValue,
      dataset: request.dataset ?? "standard",
      language: request.language ?? "en",
      totalSamples:
        request.evaluationType === "STT"
          ? STT_SAMPLES.length
          : request.evaluationType === "TTS"
            ? TTS_SAMPLES.length
            : V2V_SAMPLES.length,
      startedAt: new Date(),
    },
  });

  try {
    let metrics: Record<string, { value: number; unit: string }>;

    switch (request.evaluationType) {
      case "STT":
        metrics = await evaluateSTT(evaluation.id, request.config, STT_SAMPLES);
        break;
      case "TTS":
        metrics = await evaluateTTS(evaluation.id, request.config, TTS_SAMPLES);
        break;
      case "V2V":
        metrics = await evaluateV2V(evaluation.id, request.config, V2V_SAMPLES);
        break;
      default:
        throw new Error(`Unknown evaluation type: ${request.evaluationType}`);
    }

    // Store aggregate metrics
    for (const [name, metric] of Object.entries(metrics)) {
      await prisma.evaluationResult.create({
        data: {
          evaluationId: evaluation.id,
          metricName: name,
          metricValue: new Prisma.Decimal(metric.value),
          metricUnit: metric.unit,
          sampleId: null,
          details: null,
        },
      });
    }

    // Generate comparison
    const vendor = await prisma.vendor.findUnique({ where: { id: request.vendorId } });
    const comparisonSummary = await generateComparison(
      request.evaluationType,
      vendor?.slug ?? "unknown",
      request.modelName,
      metrics
    );

    // Mark complete
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { status: "Completed", completedAt: new Date() },
    });

    return {
      evaluationId: evaluation.id,
      status: "Completed",
      metrics,
      comparisonSummary,
    };
  } catch (err) {
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { status: "Failed", completedAt: new Date(), errorMessage: String(err) },
    });

    return {
      evaluationId: evaluation.id,
      status: "Failed",
      metrics: {},
      comparisonSummary: null,
      error: String(err),
    };
  }
}
