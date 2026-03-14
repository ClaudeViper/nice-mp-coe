import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DATASET_NAME = "TTS Lab Generated";
const DATASET_SLUG = "tts-lab-generated";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      filename: string;
      text: string;
      duration_seconds: number;
      voice: string;
      mode?: string; // "single" | "conversation"
    };

    if (!body.filename || !body.text) {
      return NextResponse.json({ error: "filename and text are required" }, { status: 400 });
    }

    // Upsert the shared "TTS Lab Generated" STT dataset
    let dataset = await prisma.evaluationDataset.findFirst({ where: { slug: DATASET_SLUG } });
    if (!dataset) {
      dataset = await prisma.evaluationDataset.create({
        data: {
          name: DATASET_NAME,
          slug: DATASET_SLUG,
          type: "STT",
          description: "Audio samples auto-saved from TTS Audio Lab",
          language: "en",
          sampleCount: 0,
          samples: [],
        },
      });
    }

    const existing = Array.isArray(dataset.samples)
      ? (dataset.samples as Record<string, unknown>[])
      : [];

    const mode = body.mode ?? "single";
    const newSample = {
      id: `lab-${Date.now()}`,
      audioDescription: `${body.filename} · voice: ${body.voice} · ${mode}`,
      groundTruth: body.text,
      duration: Math.round(body.duration_seconds * 10) / 10,
      difficulty: "medium",
      useCase: mode === "conversation" ? "conversation_sim" : "tts_output",
    };

    const updated = [...existing, newSample];
    await prisma.evaluationDataset.update({
      where: { id: dataset.id },
      data: { samples: updated as never, sampleCount: updated.length },
    });

    return NextResponse.json({ ok: true, sampleId: newSample.id, datasetId: dataset.id });
  } catch (error) {
    console.error("save-to-datasets:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
