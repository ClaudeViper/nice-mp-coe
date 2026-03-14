import { runSttEvaluate, SttModelResult } from "@/lib/stt-runner";

interface BatchFile {
  audio_file: string;
  reference_text: string;
  sentence_id?: string;
  voice?: string;
  speed?: string;
  emotion?: string;
}

interface BatchFileResult {
  sentence_id: string;
  audio_file: string;
  reference_text: string;
  results: SttModelResult[];
  error?: string;
}

export async function POST(request: Request) {
  const body = await request.json() as { files: BatchFile[]; models: string[] };
  const { files, models } = body;

  if (!files?.length) return Response.json({ error: "files array is required" }, { status: 400 });
  if (!models?.length) return Response.json({ error: "models array is required" }, { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "start", total: files.length, models });

      const allResults: BatchFileResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const sentenceId = file.sentence_id ?? `file-${i + 1}`;

        send({
          type: "progress",
          done: i,
          total: files.length,
          current_id: sentenceId,
        });

        try {
          const out = await runSttEvaluate(
            file.audio_file,
            models,
            file.reference_text,
            {
              sentence_id: sentenceId,
              voice:       file.voice,
              speed:       file.speed,
              emotion:     file.emotion,
              batch:       true,
            }
          );
          allResults.push({
            sentence_id:    sentenceId,
            audio_file:     file.audio_file,
            reference_text: file.reference_text,
            results:        out.results,
          });
        } catch (e) {
          allResults.push({
            sentence_id:    sentenceId,
            audio_file:     file.audio_file,
            reference_text: file.reference_text,
            results:        [],
            error:          e instanceof Error ? e.message : String(e),
          });
        }

        send({ type: "progress", done: i + 1, total: files.length });
      }

      // ── Aggregate per-model stats ────────────────────────────────────────
      const modelStats: Record<string, {
        count: number;
        wer_sum: number;
        cer_sum: number;
        latency_sum: number;
        cost_sum: number;
        wer_min: number;
        wer_max: number;
      }> = {};

      for (const fileResult of allResults) {
        for (const mr of fileResult.results) {
          if (mr.error) continue;
          if (!modelStats[mr.model]) {
            modelStats[mr.model] = {
              count: 0, wer_sum: 0, cer_sum: 0,
              latency_sum: 0, cost_sum: 0,
              wer_min: Infinity, wer_max: -Infinity,
            };
          }
          const s = modelStats[mr.model]!;
          s.count++;
          s.wer_sum     += mr.wer;
          s.cer_sum     += mr.cer;
          s.latency_sum += mr.latency_ms;
          s.cost_sum    += mr.cost_estimate;
          s.wer_min      = Math.min(s.wer_min, mr.wer);
          s.wer_max      = Math.max(s.wer_max, mr.wer);
        }
      }

      const aggregates = Object.entries(modelStats).map(([model, s]) => ({
        model,
        model_label: allResults
          .flatMap((f) => f.results)
          .find((r) => r.model === model)?.model_label ?? model,
        files_processed: s.count,
        avg_wer:     s.count ? Math.round((s.wer_sum / s.count) * 10000) / 10000 : 0,
        avg_cer:     s.count ? Math.round((s.cer_sum / s.count) * 10000) / 10000 : 0,
        avg_latency: s.count ? Math.round(s.latency_sum / s.count)                : 0,
        total_cost:  Math.round(s.cost_sum * 100000) / 100000,
        wer_min:     s.wer_min === Infinity ? 0 : s.wer_min,
        wer_max:     s.wer_max === -Infinity ? 0 : s.wer_max,
      }));

      send({
        type:       "done",
        files:      allResults,
        aggregates,
        total:      files.length,
        done:       files.length,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
