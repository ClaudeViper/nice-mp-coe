import { spawn } from "child_process";
import path from "path";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    text,
    voice = "default",
    speed = 1.0,
    emotion = 0.5,
    pitch = 0.0,
    format = "wav",
    outputDir,
    sampleRate = 22050,
  } = body as {
    text: string;
    voice?: string;
    speed?: number;
    emotion?: number;
    pitch?: number;
    format?: string;
    outputDir?: string;
    sampleRate?: number;
  };

  if (!text || text.trim().length === 0) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 500) {
    return Response.json({ error: "text exceeds 500 characters" }, { status: 400 });
  }

  const scriptPath = path.join(process.cwd(), "generate_audio.py");
  const resolvedOutputDir = outputDir ?? "~/audio_samples/single";

  const args = [
    scriptPath,
    "--text", text,
    "--voice", voice,
    "--speed", String(speed),
    "--emotion", String(emotion),
    "--pitch", String(pitch),
    "--format", format,
    "--output-dir", resolvedOutputDir,
    "--sample-rate", String(sampleRate),
  ];

  return new Promise<Response>((resolve) => {
    const proc = spawn("python3", args);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) {
        resolve(Response.json({ error: stderr || "TTS generation failed" }, { status: 500 }));
        return;
      }
      try {
        // stdout may contain log lines before the JSON line — find the last JSON object
        const jsonLine = stdout.trim().split("\n").reverse().find((l) => l.startsWith("{"));
        if (!jsonLine) throw new Error("No JSON in output");
        const result = JSON.parse(jsonLine);
        if (result.error) {
          resolve(Response.json({ error: result.error }, { status: 500 }));
        } else {
          resolve(Response.json(result));
        }
      } catch (e) {
        resolve(Response.json({ error: "Failed to parse TTS output", raw: stdout }, { status: 500 }));
      }
    });

    proc.on("error", (err) => {
      resolve(Response.json({ error: `Failed to start python3: ${err.message}` }, { status: 500 }));
    });
  });
}
