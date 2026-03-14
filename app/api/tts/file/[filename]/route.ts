import fs from "fs";
import path from "path";
import os from "os";

function findFile(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFile(fullPath, filename);
        if (found) return found;
      } else if (entry.name === filename) {
        return fullPath;
      }
    }
  } catch {}
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;

  // Security: prevent path traversal
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new Response("Invalid filename", { status: 400 });
  }

  const baseDir = path.join(os.homedir(), "audio_samples");
  const filePath = findFile(baseDir, filename);

  if (!filePath) {
    return new Response("File not found", { status: 404 });
  }

  const ext = path.extname(filename).slice(1).toLowerCase();
  const contentType =
    ext === "mp3" ? "audio/mpeg" :
    ext === "ogg" ? "audio/ogg" :
    "audio/wav";

  const download = _request.url.includes("download=1");

  try {
    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Error reading file", { status: 500 });
  }
}
