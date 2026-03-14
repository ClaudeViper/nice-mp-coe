import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

interface BatchConfig {
  sentences: Array<{ id: string; text: string }>;
  voices: string[];
  speeds: number[];
  emotions: number[];
  output_dir: string;
  format?: string;
  sample_rate?: number;
}

export async function POST(request: Request) {
  const config: BatchConfig = await request.json();

  if (!config.sentences?.length) {
    return Response.json({ error: "sentences array is required" }, { status: 400 });
  }

  const total =
    config.sentences.length *
    (config.voices?.length ?? 1) *
    (config.speeds?.length ?? 1) *
    (config.emotions?.length ?? 1);

  // Write config to a temp file
  const tmpConfigPath = path.join(os.tmpdir(), `batch_config_${Date.now()}.json`);
  fs.writeFileSync(tmpConfigPath, JSON.stringify(config, null, 2));

  const resolvedOutputDir = config.output_dir.replace(/^~/, os.homedir());
  const scriptPath = path.join(process.cwd(), "batch_generate_audio.py");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "start", total });

      // Ensure output dir exists before we start polling
      fs.mkdirSync(resolvedOutputDir, { recursive: true });

      const proc = spawn("python3", [scriptPath, "--config", tmpConfigPath]);
      let processDone = false;
      let exitCode: number | null = null;

      const pollInterval = setInterval(() => {
        if (processDone) return;
        try {
          const files = fs
            .readdirSync(resolvedOutputDir)
            .filter((f) => f.endsWith(".wav") || f.endsWith(".mp3"));
          send({ type: "progress", completed: files.length, total });
        } catch {
          // dir may not exist yet; ignore
        }
      }, 800);

      proc.on("close", (code) => {
        processDone = true;
        exitCode = code;
        clearInterval(pollInterval);

        // Clean up temp config
        try { fs.unlinkSync(tmpConfigPath); } catch {}

        const manifestPath = path.join(resolvedOutputDir, "manifest.csv");
        send({
          type: "done",
          success: code === 0,
          completed: total,
          total,
          manifest_path: code === 0 ? manifestPath : null,
          output_dir: resolvedOutputDir,
        });

        controller.close();
      });

      proc.on("error", (err) => {
        processDone = true;
        clearInterval(pollInterval);
        try { fs.unlinkSync(tmpConfigPath); } catch {}
        send({ type: "error", message: `Failed to start python3: ${err.message}` });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
