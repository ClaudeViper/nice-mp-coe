import { NextRequest, NextResponse } from "next/server";
import { runNewsScout } from "@/lib/agents/news-scout";

export async function POST(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;

  try {
    const result = await runNewsScout(baseUrl);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Agent run failed", detail: String(error) },
      { status: 500 }
    );
  }
}
