import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BenchmarkType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as BenchmarkType | null;
  const vendorSlug = searchParams.get("vendor");
  const metric = searchParams.get("metric");
  const limit = parseInt(searchParams.get("limit") ?? "100");

  const results = await prisma.benchmarkResult.findMany({
    where: {
      ...(type ? { benchmarkType: type } : {}),
      ...(metric ? { metricName: metric } : {}),
      ...(vendorSlug
        ? { vendor: { slug: vendorSlug } }
        : {}),
    },
    include: { vendor: { select: { name: true, slug: true } } },
    orderBy: [{ metricName: "asc" }, { metricValue: "asc" }],
    take: limit,
  });

  return NextResponse.json(results);
}
