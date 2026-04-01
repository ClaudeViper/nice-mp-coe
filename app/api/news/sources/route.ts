import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function ensureTable() {
  const stmts = [
    `DO $$ BEGIN CREATE TYPE "SourceMethod" AS ENUM ('web_scrape','rss_feed','arxiv_api','reddit_api','api'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "SourceFrequency" AS ENUM ('6h','daily'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `CREATE TABLE IF NOT EXISTS "news_sources" (
      "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "name"       TEXT NOT NULL UNIQUE,
      "method"     "SourceMethod" NOT NULL DEFAULT 'web_scrape',
      "url"        TEXT NOT NULL,
      "frequency"  "SourceFrequency" NOT NULL DEFAULT '6h',
      "keywords"   TEXT[] NOT NULL DEFAULT '{}',
      "enabled"    BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS "news_sources_enabled_idx" ON "news_sources" ("enabled")`,
  ];
  for (const sql of stmts) {
    await prisma.$executeRawUnsafe(sql).catch(() => { /* already exists — safe to ignore */ });
  }
}

export async function GET() {
  try {
    await ensureTable();
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
    await ensureTable();
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
    await ensureTable();
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
    await ensureTable();
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
