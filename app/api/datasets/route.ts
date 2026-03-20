import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BenchmarkType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as BenchmarkType | null;

    const datasets = await prisma.evaluationDataset.findMany({
      ...(type && { where: { type } }),
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // Attach evaluation usage counts
    const slugs = datasets.map((d) => d.slug);
    const evalCounts = await prisma.evaluation.groupBy({
      by: ["dataset"],
      where: { dataset: { in: slugs } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(evalCounts.map((e) => [e.dataset, e._count.id]));

    return NextResponse.json(
      datasets.map((d) => ({ ...d, _evalCount: countMap[d.slug] ?? 0 }))
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name: string;
      type: string;
      description?: string;
      language?: string;
      samples?: unknown[];
    };

    if (!body.name || !body.type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 });
    }

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const samples = body.samples ?? [];

    const dataset = await prisma.evaluationDataset.create({
      data: {
        name: body.name,
        slug,
        type: body.type as BenchmarkType,
        description: body.description ?? null,
        language: body.language ?? "en",
        sampleCount: samples.length,
        samples: samples as never,
      },
    });

    return NextResponse.json(dataset, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
