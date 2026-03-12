import { NextResponse } from "next/server";
import { runBenchmarkCollector } from "@/lib/agents/benchmark-collector";

export async function POST() {
  try {
    const result = await runBenchmarkCollector();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Agent run failed", detail: String(error) },
      { status: 500 }
    );
  }
}
