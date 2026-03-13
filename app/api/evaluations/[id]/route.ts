import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        vendor: { select: { name: true, slug: true } },
        results: { orderBy: { metricName: "asc" } },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load evaluation", detail: String(error) },
      { status: 500 }
    );
  }
}
