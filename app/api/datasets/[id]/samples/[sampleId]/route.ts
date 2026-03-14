import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; sampleId: string }> };

// PATCH — update an existing sample
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, sampleId } = await params;
    const patch = await request.json() as Record<string, unknown>;

    const dataset = await prisma.evaluationDataset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const samples = Array.isArray(dataset.samples)
      ? (dataset.samples as Record<string, unknown>[])
      : [];

    const idx = samples.findIndex((s) => s.id === sampleId);
    if (idx === -1) return NextResponse.json({ error: "Sample not found" }, { status: 404 });

    const updated = [...samples];
    updated[idx] = { ...updated[idx], ...patch, id: sampleId };

    const result = await prisma.evaluationDataset.update({
      where: { id: dataset.id },
      data: { samples: updated as never },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE — remove a sample
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, sampleId } = await params;

    const dataset = await prisma.evaluationDataset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const samples = Array.isArray(dataset.samples)
      ? (dataset.samples as Record<string, unknown>[])
      : [];

    const updated = samples.filter((s) => s.id !== sampleId);

    const result = await prisma.evaluationDataset.update({
      where: { id: dataset.id },
      data: { samples: updated as never, sampleCount: updated.length },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
