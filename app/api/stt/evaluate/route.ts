import { runSttEvaluate } from "@/lib/stt-runner";

export async function POST(request: Request) {
  const body = await request.json() as {
    audio_file: string;
    models: string[];
    reference_text: string;
    metadata?: Record<string, unknown>;
  };

  const { audio_file, models, reference_text, metadata = {} } = body;

  if (!audio_file) return Response.json({ error: "audio_file is required" }, { status: 400 });
  if (!models?.length) return Response.json({ error: "models array is required" }, { status: 400 });
  if (!reference_text) return Response.json({ error: "reference_text is required" }, { status: 400 });

  try {
    const result = await runSttEvaluate(audio_file, models, reference_text, metadata);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "STT evaluation failed" },
      { status: 500 }
    );
  }
}
