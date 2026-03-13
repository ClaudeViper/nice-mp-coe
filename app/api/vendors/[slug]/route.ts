import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { slug },
      include: {
        products: { orderBy: { name: "asc" } },
        deploymentOptions: true,
        securityCerts: { orderBy: { certName: "asc" } },
        supportedLanguages: { orderBy: { language: "asc" } },
        pricingTiers: { orderBy: { tierName: "asc" } },
        niceCompatibility: true,
        benchmarkResults: {
          orderBy: { metricName: "asc" },
          take: 50,
          include: { vendor: { select: { name: true, slug: true } } },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load vendor", detail: String(error) },
      { status: 500 }
    );
  }
}
