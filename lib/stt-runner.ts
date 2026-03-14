/**
 * lib/stt-runner.ts
 *
 * Shared utility that spawns stt_evaluate.py and optionally persists
 * results to the Evaluation / EvaluationResult tables.
 */

import { spawn } from "child_process";
import path from "path";
import os from "os";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SttModelResult {
  model: string;
  model_label: string;
  transcript: string;
  wer: number;        // 0–1
  cer: number;        // 0–1
  latency_ms: number;
  cost_estimate: number;
  duration_secs: number;
  evaluation_id: string | null;
  error?: string;
}

export interface SttEvaluateOutput {
  audio_file: string;
  reference_text: string;
  models: string[];
  results: SttModelResult[];
  jiwer_available: boolean;
}

// ─── Model → Vendor mappings ──────────────────────────────────────────────────

const MODEL_VENDOR_SLUGS: Record<string, string> = {
  whisper:    "openai",
  google:     "google",
  aws:        "amazon",
  azure:      "microsoft",
  assemblyai: "assemblyai",
};

const MODEL_DB_NAMES: Record<string, string> = {
  whisper:    "whisper-large-v3",
  google:     "Google Cloud STT v2",
  aws:        "Amazon Transcribe",
  azure:      "Azure Speech Services",
  assemblyai: "AssemblyAI Universal-2",
};

// ─── Core runner ──────────────────────────────────────────────────────────────

export async function runSttEvaluate(
  audioFile: string,
  models: string[],
  referenceText: string,
  metadata: Record<string, unknown> = {}
): Promise<SttEvaluateOutput> {
  const resolvedPath = audioFile.replace(/^~/, os.homedir());
  const scriptPath = path.join(process.cwd(), "stt_evaluate.py");

  // ── Run Python evaluator ──────────────────────────────────────────────────
  const rawOutput = await new Promise<string>((resolve, reject) => {
    const proc = spawn("python3", [
      scriptPath,
      "--audio-file", resolvedPath,
      "--models",     models.join(","),
      "--reference-text", referenceText,
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr || "stt_evaluate.py exited with code " + code));
      else resolve(stdout);
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn python3: ${err.message}`));
    });
  });

  // Find the last JSON object in stdout (there may be warning lines before it)
  const jsonLine = rawOutput.trim().split("\n").reverse().find((l) => l.startsWith("{"));
  if (!jsonLine) throw new Error("stt_evaluate.py produced no JSON output");

  const output: SttEvaluateOutput = JSON.parse(jsonLine);

  // ── Persist to DB (best-effort; skip if vendor not found) ────────────────
  const evaluationIds: Record<string, string> = {};

  for (const result of output.results) {
    if (result.error) continue;
    const vendorSlug = MODEL_VENDOR_SLUGS[result.model];
    if (!vendorSlug) continue;

    try {
      const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
      if (!vendor) continue;

      const ev = await prisma.evaluation.create({
        data: {
          vendorId:       vendor.id,
          evaluationType: "STT",
          modelName:      MODEL_DB_NAMES[result.model] ?? result.model_label,
          status:         "Completed",
          config: {
            source:        "tts_audio_lab",
            audioFile,
            referenceText,
            jiwerAvailable: output.jiwer_available,
            ...metadata,
          },
          dataset:          "TTS-Audio-Lab",
          language:         "en",
          totalSamples:     1,
          processedSamples: 1,
          startedAt:        new Date(),
          completedAt:      new Date(),
          results: {
            create: [
              { metricName: "WER",           metricValue: result.wer * 100,        metricUnit: "%"    },
              { metricName: "CER",           metricValue: result.cer * 100,        metricUnit: "%"    },
              { metricName: "avg_latency",   metricValue: result.latency_ms,       metricUnit: "ms"   },
              { metricName: "cost_per_file", metricValue: result.cost_estimate,    metricUnit: "USD"  },
            ],
          },
        },
      });

      evaluationIds[result.model] = ev.id;
    } catch {
      // Vendor not in DB, or unique-constraint collision — silently skip
    }
  }

  // ── Attach evaluation IDs ─────────────────────────────────────────────────
  output.results = output.results.map((r) => ({
    ...r,
    evaluation_id: evaluationIds[r.model] ?? null,
  }));

  return output;
}
