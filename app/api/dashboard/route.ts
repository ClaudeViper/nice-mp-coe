import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ── Core counts + lists ────────────────────────────────────────────────
    const [
      vendorCount,
      vendorsThisMonth,
      benchmarkCount,
      benchmarksToday,
      newsCount,
      recentEvaluations,
    ] = await Promise.all([
      prisma.vendor.count({ where: { isTracked: true } }),
      prisma.vendor.count({ where: { isTracked: true, createdAt: { gte: startOfMonth } } }),
      prisma.benchmarkResult.count(),
      prisma.benchmarkResult.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.newsItem.count(),
      prisma.evaluation
        .findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { vendor: { select: { name: true } } },
        })
        .catch(() => []),
    ]);

    // ── Top benchmarks — diverse mix across types & metrics ───────────────
    // Fetch top STT (WER, lowest = best), top TTS (MOS, highest = best),
    // and a general fallback so the card is never empty.
    const [topWer, topMos, topGeneral] = await Promise.all([
      prisma.benchmarkResult
        .findMany({
          take: 3,
          orderBy: { metricValue: "asc" },
          include: { vendor: { select: { name: true } } },
          where: { metricName: "WER" },
        })
        .catch(() => []),
      prisma.benchmarkResult
        .findMany({
          take: 3,
          orderBy: { metricValue: "desc" },
          include: { vendor: { select: { name: true } } },
          where: { metricName: "MOS" },
        })
        .catch(() => []),
      prisma.benchmarkResult
        .findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { vendor: { select: { name: true } } },
          where: { metricName: { notIn: ["WER", "MOS"] } },
        })
        .catch(() => []),
    ]);

    // Merge: WER + MOS first, then fill remaining slots from general pool
    const merged = [...topWer, ...topMos];
    for (const b of topGeneral) {
      if (merged.length >= 6) break;
      // Avoid duplicates by vendor+model+metric combo
      const dup = merged.some(
        (m) => m.vendorId === b.vendorId && m.modelName === b.modelName && m.metricName === b.metricName,
      );
      if (!dup) merged.push(b);
    }
    const topBenchmarks = merged.slice(0, 6);

    let evaluationCount = 0;
    try {
      evaluationCount = await prisma.evaluation.count();
    } catch { /* table may not exist yet */ }

    // ── Most recent news item (for "Updated X ago" label) ─────────────────
    const latestNews = await prisma.newsItem
      .findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } })
      .catch(() => null);

    // ── Agent last-run times ───────────────────────────────────────────────
    const [
      lastBenchmarkRun,
      lastVendorRun,
      lastNewsItem,
      lastEvaluation,
      lastReport,
      lastPricingUpdate,
    ] = await Promise.all([
      prisma.benchmarkRunLog
        .findFirst({ orderBy: { completedAt: "desc" }, select: { completedAt: true } })
        .catch(() => null),
      prisma.vendorRegistryRunLog
        .findFirst({ orderBy: { completedAt: "desc" }, select: { completedAt: true } })
        .catch(() => null),
      prisma.newsItem
        .findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } })
        .catch(() => null),
      prisma.evaluation
        .findFirst({
          orderBy: { completedAt: "desc" },
          where: { completedAt: { not: null } },
          select: { completedAt: true },
        })
        .catch(() => null),
      prisma.report
        .findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } })
        .catch(() => null),
      prisma.vendorPricingTier
        .findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
        .catch(() => null),
    ]);

    const agentLastRuns: Record<string, string | null> = {
      "vendor-scout":        lastVendorRun?.completedAt?.toISOString()    ?? null,
      "benchmark-runner":    lastBenchmarkRun?.completedAt?.toISOString() ?? null,
      "news-digest":         lastNewsItem?.createdAt?.toISOString()       ?? null,
      "audio-lab":           lastEvaluation?.completedAt?.toISOString()   ?? null,
      "standards-publisher": lastReport?.createdAt?.toISOString()         ?? null,
      "cost-optimizer":      lastPricingUpdate?.updatedAt?.toISOString()  ?? null,
    };

    return NextResponse.json({
      totalVendors:      vendorCount,
      vendorsThisMonth,
      totalBenchmarks:   benchmarkCount,
      benchmarksToday,
      totalNews:         newsCount,
      newsLastUpdatedAt: latestNews?.createdAt?.toISOString() ?? null,
      totalEvaluations:  evaluationCount,
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
