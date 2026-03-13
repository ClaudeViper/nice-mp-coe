import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const guidelines = await prisma.deploymentGuideline.findMany({
      where: { vendorId: vendor.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        productSlug: true,
        content: true,
        status: true,
        generatedAt: true,
        errorMsg: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(guidelines);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch guidelines", detail: String(error) },
      { status: 500 },
    );
  }
}
