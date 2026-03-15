import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ── Core counts + lists ────────────────────────────────────────────────
    const [
      vendorCount,
      benchmarkCount,
      newsCount,
      recentEvaluations,
      topBenchmarks,
    ] = await Promise.all([
      prisma.vendor.count({ where: { isTracked: true } }),
      prisma.benchmarkResult.count(),
      prisma.newsItem.count(),
      prisma.evaluation
        .findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { vendor: { select: { name: true } } },
        })
        .catch(() => []),
      prisma.benchmarkResult
        .findMany({
          take: 6,
          orderBy: { metricValue: "asc" },
          include: { vendor: { select: { name: true } } },
          where: { metricName: "WER" },
        })
        .catch(() => []),
    ]);

    let evaluationCount = 0;
    try {
      evaluationCount = await prisma.evaluation.count();
    } catch { /* table may not exist yet */ }

    // ── Agent last-run times ───────────────────────────────────────────────
    // Each agent maps to its authoritative run-log or latest DB record.
    const [
      lastBenchmarkRun,   // benchmark-runner  → BenchmarkRunLog
      lastVendorRun,      // vendor-scout      → VendorRegistryRunLog
      lastNewsItem,       // news-digest       → NewsItem (most recently scouted)
      lastEvaluation,     // audio-lab         → Evaluation (most recent completed)
      lastReport,         // standards-publisher → Report
      lastPricingUpdate,  // cost-optimizer    → VendorPricingTier (most recently updated)
    ] = await Promise.all([
      prisma.benchmarkRunLog
        .findFirst({
          orderBy: { completedAt: "desc" },
          select: { completedAt: true, startedAt: true, status: true },
        })
        .catch(() => null),
      prisma.vendorRegistryRunLog
        .findFirst({
          orderBy: { completedAt: "desc" },
          select: { completedAt: true, startedAt: true, status: true },
        })
        .catch(() => null),
      prisma.newsItem
        .findFirst({
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
        .catch(() => null),
      prisma.evaluation
        .findFirst({
          orderBy: { completedAt: "desc" },
          where: { completedAt: { not: null } },
          select: { completedAt: true, status: true },
        })
        .catch(() => null),
      prisma.report
        .findFirst({
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, status: true },
        })
        .catch(() => null),
      prisma.vendorPricingTier
        .findFirst({
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        })
        .catch(() => null),
    ]);

    const agentLastRuns: Record<string, string | null> = {
      "vendor-scout":       lastVendorRun?.completedAt?.toISOString()    ?? null,
      "benchmark-runner":   lastBenchmarkRun?.completedAt?.toISOString() ?? null,
      "news-digest":        lastNewsItem?.createdAt?.toISOString()       ?? null,
      "audio-lab":          lastEvaluation?.completedAt?.toISOString()   ?? null,
      "standards-publisher":lastReport?.createdAt?.toISOString()         ?? null,
      "cost-optimizer":     lastPricingUpdate?.updatedAt?.toISOString()  ?? null,
    };

    return NextResponse.json({
      totalVendors:     vendorCount,
      totalBenchmarks:  benchmarkCount,
      totalNews:        newsCount,
      totalEvaluations: evaluationCount,
      recentEvaluations: recentEvaluations.map((e) => ({
        id:             e.id,
        vendor:         e.vendor,
        evaluationType: e.evaluationType,
        status:         e.status,
        modelName:      e.modelName,
        completedAt:    e.completedAt?.toISOString() ?? null,
        dataset:        e.dataset,
      })),
      topBenchmarks: topBenchmarks.map((b) => ({
        vendor:        b.vendor,
        modelName:     b.modelName,
        metricName:    b.metricName,
        metricValue:   b.metricValue.toString(),
        metricUnit:    b.metricUnit,
        benchmarkType: b.benchmarkType,
      })),
      agentLastRuns,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load dashboard", detail: String(error) },
      { status: 500 },
    );
  }
}
