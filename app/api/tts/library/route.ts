import fs from "fs";
import path from "path";
import os from "os";

interface ManifestRow {
  file_path: string;
  sentence_id: string;
  text: string;
  voice: string;
  speed: string;
  emotion: string;
  duration_seconds: string;
  sample_rate: string;
  filename?: string;
  format?: string;
}

function parseCSV(content: string): ManifestRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1)
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      // Handle quoted fields with commas inside
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (values[i] !== undefined ? values[i] : "") as string; });
      return row as unknown as ManifestRow;
    });
}

function findManifests(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findManifests(fullPath, results);
      } else if (entry.name === "manifest.csv") {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

export async function GET() {
  const baseDir = path.join(os.homedir(), "audio_samples");
  const manifests = findManifests(baseDir);

  const allFiles: (ManifestRow & { filename: string; format: string })[] = [];

  for (const manifestPath of manifests) {
    try {
      const content = fs.readFileSync(manifestPath, "utf-8");
      const rows = parseCSV(content);
      for (const row of rows) {
        const filename = path.basename(row.file_path);
        const format = path.extname(filename).slice(1).toLowerCase() || "wav";
        allFiles.push({ ...row, filename, format });
      }
    } catch {}
  }

  return Response.json(allFiles);
}

export async function DELETE(request: Request) {
  const { filenames } = (await request.json()) as { filenames: string[] };

  const baseDir = path.join(os.homedir(), "audio_samples");
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const filename of filenames) {
    // Security: no path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      failed.push(filename);
      continue;
    }
    // Find and delete
    const found = findFile(baseDir, filename);
    if (found) {
      try {
        fs.unlinkSync(found);
        deleted.push(filename);
      } catch {
        failed.push(filename);
      }
    } else {
      failed.push(filename);
    }
  }

  return Response.json({ deleted, failed });
}

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
