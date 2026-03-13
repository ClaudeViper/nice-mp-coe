import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [vendorCount, benchmarkCount, newsCount, vendorsWithProducts] =
      await Promise.all([
        prisma.vendor.count({ where: { isTracked: true } }),
        prisma.benchmarkResult.count(),
        prisma.newsItem.count(),
        prisma.vendor.count({
          where: { isTracked: true, products: { some: {} } },
        }),
      ]);

    // Evaluation count (may fail if table doesn't exist yet)
    let evaluationCount = 0;
    try {
      evaluationCount = await prisma.evaluation.count();
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({
      vendorsTracked: vendorCount,
      benchmarksRun: benchmarkCount,
      newsItems: newsCount,
      vendorsWithProducts,
      evaluationsRun: evaluationCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load overview", detail: String(error) },
      { status: 500 }
    );
  }
}
