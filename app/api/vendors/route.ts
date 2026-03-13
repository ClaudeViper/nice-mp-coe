import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get("detail") === "true";
    const type = searchParams.get("type"); // STT, TTS, V2V

    const vendors = await prisma.vendor.findMany({
      where: {
        isTracked: true,
        ...(type
          ? { products: { some: { category: type } } }
          : {}),
      },
      orderBy: { name: "asc" },
      include: detail
        ? {
            products: { orderBy: { name: "asc" } },
            deploymentOptions: true,
            securityCerts: { orderBy: { certName: "asc" } },
            niceCompatibility: true,
            _count: {
              select: {
                benchmarkResults: true,
                supportedLanguages: true,
                pricingTiers: true,
              },
            },
          }
        : {
            niceCompatibility: {
              select: {
                buildVsBuyScore: true,
                cxoneIntegrationStatus: true,
              },
            },
            products: {
              select: { category: true },
            },
            deploymentOptions: {
              select: { type: true },
            },
            benchmarkResults: {
              select: {
                metricName: true,
                metricValue: true,
                metricUnit: true,
                benchmarkType: true,
              },
              orderBy: { collectedAt: "desc" },
              take: 10,
            },
            _count: {
              select: {
                products: true,
                benchmarkResults: true,
                evaluations: true,
              },
            },
          },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load vendors", detail: String(error) },
      { status: 500 }
    );
  }
}
