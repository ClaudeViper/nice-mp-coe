import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

// POST /api/datasets/[id]/samples — add a new sample
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    const dataset = await prisma.evaluationDataset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = Array.isArray(dataset.samples) ? (dataset.samples as Record<string, unknown>[]) : [];

    // Assign a new id if not provided
    const newSample = { ...body, id: (body.id as string) || `custom-${shortId()}` };
    const updated = [...existing, newSample];

    const result = await prisma.evaluationDataset.update({
      where: { id: dataset.id },
      data: { samples: updated as never, sampleCount: updated.length },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
