import { NextRequest, NextResponse } from "next/server";

// Shared in-memory store — same module as run/route.ts won't work across files,
// so we use a global to persist between requests in the same process.
declare global {
  // eslint-disable-next-line no-var
  var __agentJobs: Map<string, { status: "running" | "completed" | "failed"; startedAt: string; completedAt?: string; result?: string }> | undefined;
}

if (!globalThis.__agentJobs) {
  globalThis.__agentJobs = new Map();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId query parameter" }, { status: 400 });
  }

  const job = globalThis.__agentJobs!.get(jobId);
  if (!job) {
    // Treat unknown jobId as still running (could have been reset)
    return NextResponse.json({ agentId, jobId, status: "running" });
  }

  return NextResponse.json({ agentId, jobId, ...job });
}
