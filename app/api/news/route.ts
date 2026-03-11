import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NewsCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as NewsCategory | null;
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const items = await prisma.newsItem.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ relevanceScore: "desc" }, { date: "desc" }],
    take: limit,
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Check for duplicate by URL
  const existing = await prisma.newsItem.findUnique({
    where: { url: body.url },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Duplicate: item with this URL already exists", id: existing.id },
      { status: 409 }
    );
  }

  const item = await prisma.newsItem.create({
    data: {
      title: body.title,
      date: new Date(body.date),
      source: body.source,
      url: body.url,
      summary: body.summary,
      category: body.category as NewsCategory,
      relevanceScore: body.relevance_score,
      tags: body.tags ?? [],
    },
  });

  return NextResponse.json(item, { status: 201 });
}
