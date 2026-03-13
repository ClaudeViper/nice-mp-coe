import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NewsCategory, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as NewsCategory | null;
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") ?? "relevance"; // relevance | date | category
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Prisma.NewsItemWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (search?.trim()) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
      { source: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  let orderBy: Prisma.NewsItemOrderByWithRelationInput[];
  switch (sort) {
    case "date":
      orderBy = [{ date: "desc" }];
      break;
    case "category":
      orderBy = [{ category: "asc" }, { relevanceScore: "desc" }];
      break;
    case "relevance":
    default:
      orderBy = [{ relevanceScore: "desc" }, { date: "desc" }];
      break;
  }

  const items = await prisma.newsItem.findMany({
    where,
    orderBy,
    take: limit,
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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
