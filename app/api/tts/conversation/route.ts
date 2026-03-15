import { spawn } from "child_process";
import os from "os";
import path from "path";
import { prisma } from "@/lib/prisma";

const DATASET_SLUG = "tts-lab-generated";
const DATASET_NAME = "TTS Lab Generated";

async function saveToDatasets(filename: string, text: string, duration: number, voice: string) {
  try {
    let dataset = await prisma.evaluationDataset.findFirst({ where: { slug: DATASET_SLUG } });
    if (!dataset) {
      dataset = await prisma.evaluationDataset.create({
        data: {
          name: DATASET_NAME, slug: DATASET_SLUG, type: "STT",
          description: "Audio samples auto-saved from TTS Audio Lab",
          language: "en", sampleCount: 0, samples: [],
        },
      });
    }
    const existing = Array.isArray(dataset.samples) ? (dataset.samples as Record<string, unknown>[]) : [];
    const newSample = {
      id: `lab-${Date.now()}`,
      audioDescription: `${filename} · ${voice} · conversation`,
      groundTruth: text,
      duration: Math.round(duration * 10) / 10,
      difficulty: "medium",
      useCase: "conversation_sim",
    };
    const updated = [...existing, newSample];
    await prisma.evaluationDataset.update({
      where: { id: dataset.id },
      data: { samples: updated as never, sampleCount: updated.length },
    });
  } catch (e) {
    console.error("conversation save-to-datasets:", e);
  }
}

export async function POST(request: Request) {
  const body = await request.json() as {
    transcript: Array<{ speaker: string; text: string }>;
    title?: string;
    agentVoice?: string;
    customerVoice?: string;
    supervisorVoice?: string;
    speed?: number;
    emotion?: number;
    outputDir?: string;
  };

  const {
    transcript,
    title = "conversation",
    agentVoice = "male-1",
    customerVoice = "female-1",
    supervisorVoice = "british-f",
    speed = 1.0,
    emotion = 0.5,
    outputDir,
  } = body;

  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return Response.json({ error: "transcript is required" }, { status: 400 });
  }

  const scriptPath   = path.join(process.cwd(), "generate_conversation.py");
  const resolvedDir  = outputDir ?? path.join(os.homedir(), "audio_samples", "conversations");
  const encoder      = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn("python3", [
        scriptPath,
        "--transcript",     JSON.stringify(transcript),
        "--title",          title,
        "--output-dir",     resolvedDir,
        "--agent-voice",      agentVoice,
        "--customer-voice",   customerVoice,
        "--supervisor-voice", supervisorVoice,
        "--speed",          String(speed),
        "--emotion",        String(emotion),
      ]);

      let stderr = "";
      let lastResult: Record<string, unknown> | null = null;

      proc.stdout.on("data", (d: Buffer) => {
        for (const line of d.toString().split("\n")) {
          const t = line.trim();
          if (!t.startsWith("{")) continue;
          try {
            const obj = JSON.parse(t) as Record<string, unknown>;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
            // The final result has "filename" (not "progress")
            if (obj.filename) lastResult = obj;
          } catch { /* skip */ }
        }
      });

      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

      proc.on("close", async (code) => {
        if (code !== 0) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ error: stderr || "Conversation generation failed" })}\n\n`
          ));
        } else if (lastResult) {
          // Auto-save to Datasets page
          const fullText = transcript.map((u) => `${u.speaker}: ${u.text}`).join(" | ");
          await saveToDatasets(
            String(lastResult.filename),
            fullText,
            Number(lastResult.duration_seconds),
            `agent:${agentVoice} customer:${customerVoice} supervisor:${supervisorVoice}`,
          );
        }
        controller.close();
      });

      proc.on("error", (err) => {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ error: `Failed to start python3: ${err.message}` })}\n\n`
        ));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
