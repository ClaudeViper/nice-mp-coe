import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NEWS_SOURCES } from "@/lib/agents/news-scout";

export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const src of NEWS_SOURCES) {
      const keywords = src.keywords === "all" ? [] : src.keywords;
      const frequency = src.frequency === "6h" ? "six_hours" : "daily";

      try {
        await prisma.newsSource.create({
          data: {
            name: src.name,
            method: src.method,
            url: src.url,
            frequency,
            keywords,
            enabled: true,
          },
        });
        created++;
      } catch {
        // Unique constraint — already exists
        skipped++;
      }
    }

    return NextResponse.json({ created, skipped, total: NEWS_SOURCES.length });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to seed sources", detail },
      { status: 500 }
    );
  }
}
