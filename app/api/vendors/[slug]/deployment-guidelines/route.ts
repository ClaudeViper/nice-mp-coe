import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RawGuideline {
  id: string;
  product_slug: string | null;
  content: string;
  status: string;
  generated_at: Date;
  error_msg: string | null;
  updated_at: Date;
}

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

    // Use raw SQL — prisma.deploymentGuideline may not exist on a stale client
    const rows = await prisma.$queryRawUnsafe<RawGuideline[]>(
      `SELECT id, product_slug, content, status, generated_at, error_msg, updated_at
       FROM deployment_guidelines
       WHERE vendor_id = $1
       ORDER BY updated_at DESC`,
      vendor.id,
    ).catch(() => [] as RawGuideline[]);

    // Normalise to camelCase for the frontend
    const guidelines = rows.map((r) => ({
      id: r.id,
      productSlug: r.product_slug,
      content: r.content,
      status: r.status,
      generatedAt: r.generated_at,
      errorMsg: r.error_msg,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json(guidelines);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch guidelines", detail: String(error) },
      { status: 500 },
    );
  }
}
