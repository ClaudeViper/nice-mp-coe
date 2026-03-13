import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const reports = await prisma.report.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        summary: true,
        generatedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load reports", detail: String(error) },
      { status: 500 }
    );
  }
}
