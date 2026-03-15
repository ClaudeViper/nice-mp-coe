import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BenchmarkType } from "@prisma/client";

// ─── Metric direction ───────────────────────────────────────────────────────
// Returns true when a lower numeric value is better (WER, latency, RTF …).
// Returns false when a higher value is better (MOS, ELO, accuracy …).
function isLowerBetter(metricName: string): boolean {
  const m = metricName.toLowerCase();
  return (
    m.includes("wer")          ||   // Word Error Rate
    m.includes("cer")          ||   // Character Error Rate
    m.includes("rtf")          ||   // Real-Time Factor
    m.includes("ttfb")         ||   // Time to First Byte
    m.includes("latency")      ||   // any latency metric
    m.includes("delay")        ||   // round-trip delay
    m.includes("error rate")   ||   // generic error rate
    m.includes("false positive")||  // FPR
    m.includes("hallucination")||   // hallucination rate
    m.includes("disfluency")   ||   // disfluency rate
    m.includes("insertion")    ||   // insertion error
    m.includes("deletion")     ||   // deletion error
    m.includes("substitution")      // substitution error
  );
}

// ─── Deduplication ──────────────────────────────────────────────────────────
// Multiple sources (Papers With Code, HuggingFace, vendor docs …) can each
// report a value for the same (vendor, model, metric, dataset, language).
// The DB unique constraint includes sourceName, so all of them are stored.
// Here we collapse each canonical group to a single "best" row so the table
// shows one authoritative number per model×metric×dataset combination.
type Row = Awaited<ReturnType<typeof prisma.benchmarkResult.findMany>>[number] & {
  vendor: { name: string; slug: string };
};

function deduplicateBestPerMetric(rows: Row[]): Row[] {
  const best = new Map<string, Row>();

  for (const row of rows) {
    const key = [
      row.vendorId,
      row.modelName,
      row.metricName,
      row.dataset,
      row.language,
    ].join("|");

    const current = best.get(key);
    if (!current) {
      best.set(key, row);
      continue;
    }

    const newVal = Number(row.metricValue);
    const curVal = Number(current.metricValue);

    const newIsBetter = isLowerBetter(row.metricName)
      ? newVal < curVal   // prefer lower  (e.g. WER 4.8 % beats 5.0 %)
      : newVal > curVal;  // prefer higher (e.g. MOS 4.5 beats 4.2)

    // Tie-break: prefer the more recently collected row
    const tiedAndNewer =
      newVal === curVal &&
      new Date(row.collectedAt) > new Date(current.collectedAt);

    if (newIsBetter || tiedAndNewer) {
      best.set(key, row);
    }
  }

  return Array.from(best.values());
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type       = searchParams.get("type") as BenchmarkType | null;
    const vendorSlug = searchParams.get("vendor");
    const metric     = searchParams.get("metric");
    const limit      = parseInt(searchParams.get("limit") ?? "500");
    // Pass ?dedup=false to get the raw rows (useful for debugging)
    const dedup      = searchParams.get("dedup") !== "false";

    const rows = await prisma.benchmarkResult.findMany({
      where: {
        ...(type       ? { benchmarkType: type }          : {}),
        ...(metric     ? { metricName: metric }           : {}),
        ...(vendorSlug ? { vendor: { slug: vendorSlug } } : {}),
      },
      include: { vendor: { select: { name: true, slug: true } } },
      orderBy: [{ metricName: "asc" }, { metricValue: "asc" }],
      take: limit,
    });

    const results = dedup ? deduplicateBestPerMetric(rows as Row[]) : rows;

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/benchmarks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks", detail: String(error) },
      { status: 500 },
    );
  }
}
