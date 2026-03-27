import { NextRequest, NextResponse } from "next/server";
import { runNewsScout } from "@/lib/agents/news-scout";
import { prisma } from "@/lib/prisma";

async function ensureRunLogTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "news_scout_runs" (
      "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "status"      TEXT NOT NULL DEFAULT 'running',
      "found"       INT NOT NULL DEFAULT 0,
      "inserted"    INT NOT NULL DEFAULT 0,
      "duplicates"  INT NOT NULL DEFAULT 0,
      "sources_queried" INT NOT NULL DEFAULT 0,
      "error"       TEXT,
      "started_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
      "completed_at" TIMESTAMPTZ
    );
  `);
}

export async function GET() {
  try {
    await ensureRunLogTable();
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "news_scout_runs" ORDER BY "started_at" DESC LIMIT 10`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;

  await ensureRunLogTable();
  const runRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "news_scout_runs" ("id","status","started_at") VALUES (gen_random_uuid()::text, 'running', now()) RETURNING "id"`
  );
  const runId = runRows[0]?.id;

  try {
    const result = await runNewsScout(baseUrl);

    if (runId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "news_scout_runs" SET "status"='completed', "found"=$1, "inserted"=$2, "duplicates"=$3, "sources_queried"=$4, "completed_at"=now() WHERE "id"=$5`,
        result.found, result.inserted, result.duplicates, result.sourcesQueried, runId
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const detail = String(error);

    if (runId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "news_scout_runs" SET "status"='failed', "error"=$1, "completed_at"=now() WHERE "id"=$2`,
        detail.slice(0, 2000), runId
      ).catch(() => {});
    }

    return NextResponse.json(
      { error: "Agent run failed", detail },
      { status: 500 }
    );
  }
}
