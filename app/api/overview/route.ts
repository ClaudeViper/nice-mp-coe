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

    return NextResponse.json({
      vendorsTracked: vendorCount,
      benchmarksRun: benchmarkCount,
      newsItems: newsCount,
      vendorsWithProducts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load overview", detail: String(error) },
      { status: 500 }
    );
  }
}
