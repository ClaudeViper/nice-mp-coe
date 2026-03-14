import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(request: Request) {
  const { manifest_path } = (await request.json()) as { manifest_path: string };

  if (!manifest_path) {
    return Response.json({ error: "manifest_path is required" }, { status: 400 });
  }

  const resolvedManifest = manifest_path.replace(/^~/, os.homedir());
  if (!fs.existsSync(resolvedManifest)) {
    return Response.json({ error: "manifest not found" }, { status: 404 });
  }

  const outputDir = path.dirname(resolvedManifest);
  const zipName = `tts_batch_${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);

  return new Promise<Response>((resolve) => {
    // Use system zip to archive all audio files in the batch dir
    const proc = spawn("zip", ["-j", zipPath, path.join(outputDir, "*.wav"), path.join(outputDir, "*.mp3"), resolvedManifest], {
      shell: true,
    });

    proc.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(zipPath)) {
        resolve(Response.json({ error: "ZIP creation failed" }, { status: 500 }));
        return;
      }
      const buffer = fs.readFileSync(zipPath);
      try { fs.unlinkSync(zipPath); } catch {}
      resolve(
        new Response(buffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipName}"`,
            "Content-Length": String(buffer.byteLength),
          },
        })
      );
    });

    proc.on("error", () => {
      resolve(Response.json({ error: "zip command not available on this system" }, { status: 500 }));
    });
  });
}
