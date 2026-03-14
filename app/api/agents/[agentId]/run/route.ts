import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __agentJobs: Map<string, { status: "running" | "completed" | "failed"; startedAt: string; completedAt?: string; result?: string }> | undefined;
}

if (!globalThis.__agentJobs) {
  globalThis.__agentJobs = new Map();
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  const jobId = `${agentId}-${Date.now()}`;
  const startedAt = new Date().toISOString();
  globalThis.__agentJobs!.set(jobId, { status: "running", startedAt });

  // Simulate async agent work (replace with real agent invocation)
  setTimeout(() => {
    const existing = globalThis.__agentJobs!.get(jobId);
    if (existing) {
      globalThis.__agentJobs!.set(jobId, {
        ...existing,
        status: "completed",
        completedAt: new Date().toISOString(),
        result: `Agent "${agentId}" completed successfully.`,
      });
    }
  }, 3000 + Math.random() * 4000);

  return NextResponse.json({ jobId, status: "running", startedAt });
}
