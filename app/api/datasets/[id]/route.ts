import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const dataset = await prisma.evaluationDataset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(dataset);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      name?: string;
      description?: string;
      language?: string;
    };

    const dataset = await prisma.evaluationDataset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.evaluationDataset.update({
      where: { id: dataset.id },
      data: {
        ...(body.name        !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.language    !== undefined && { language: body.language }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const dataset = await prisma.evaluationDataset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.evaluationDataset.delete({ where: { id: dataset.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
