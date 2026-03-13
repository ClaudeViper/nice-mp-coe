import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const where: Record<string, unknown> = {};
    if (type) where.evaluationType = type;
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        vendor: { select: { name: true, slug: true } },
        results: {
          where: { sampleId: null },
          orderBy: { metricName: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load evaluations", detail: String(error) },
      { status: 500 }
    );
  }
}
