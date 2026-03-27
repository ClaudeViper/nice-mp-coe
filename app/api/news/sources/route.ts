import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sources = await prisma.newsSource.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(sources);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load news sources", detail },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const source = await prisma.newsSource.create({
      data: {
        name: body.name,
        method: body.method ?? "web_scrape",
        url: body.url,
        frequency: body.frequency ?? "six_hours",
        keywords: body.keywords ?? [],
        enabled: body.enabled ?? true,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (detail.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A source with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create news source", detail },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const source = await prisma.newsSource.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.method !== undefined && { method: data.method }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.keywords !== undefined && { keywords: data.keywords }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });

    return NextResponse.json(source);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to update news source", detail },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.newsSource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to delete news source", detail },
      { status: 500 }
    );
  }
}
