import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    evaluation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET as listEvaluations } from "@/app/api/evaluations/route";
import { GET as getEvaluation } from "@/app/api/evaluations/[id]/route";

const mockEvaluation = {
  id: "eval-001",
  vendorId: "vendor-openai",
  evaluationType: "STT",
  modelName: "whisper-large-v3",
  status: "Completed",
  config: {},
  dataset: "NICE-CX-Clean-EN",
  language: "en",
  totalSamples: 50,
  processedSamples: 50,
  startedAt: new Date("2025-01-01T10:00:00Z"),
  completedAt: new Date("2025-01-01T10:15:00Z"),
  errorMessage: null,
  createdAt: new Date("2025-01-01T09:59:00Z"),
  vendor: { name: "OpenAI", slug: "openai" },
  results: [
    { metricName: "WER", metricValue: "4.2", metricUnit: "%" },
    { metricName: "CER", metricValue: "1.8", metricUnit: "%" },
  ],
};

// ─── GET /api/evaluations ─────────────────────────────────────────────────────

describe("GET /api/evaluations", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluation.findMany).mockResolvedValue([mockEvaluation] as never);
  });

  it("returns 200 with evaluation array", async () => {
    const req = new Request("http://localhost/api/evaluations");
    const res = await listEvaluations(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("eval-001");
  });

  it("passes type filter to Prisma", async () => {
    const req = new Request("http://localhost/api/evaluations?type=STT");
    await listEvaluations(req);
    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ evaluationType: "STT" }),
      })
    );
  });

  it("passes status filter to Prisma", async () => {
    const req = new Request("http://localhost/api/evaluations?status=Completed");
    await listEvaluations(req);
    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "Completed" }),
      })
    );
  });

  it("passes vendorId filter to Prisma", async () => {
    const req = new Request("http://localhost/api/evaluations?vendorId=vendor-openai");
    await listEvaluations(req);
    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ vendorId: "vendor-openai" }),
      })
    );
  });

  it("defaults limit to 50", async () => {
    const req = new Request("http://localhost/api/evaluations");
    await listEvaluations(req);
    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });

  it("respects custom limit parameter", async () => {
    const req = new Request("http://localhost/api/evaluations?limit=10");
    await listEvaluations(req);
    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it("includes vendor and results in response", async () => {
    const req = new Request("http://localhost/api/evaluations");
    const res = await listEvaluations(req);
    const data = await res.json();
    expect(data[0].vendor).toBeDefined();
    expect(data[0].vendor.name).toBe("OpenAI");
    expect(data[0].results).toBeDefined();
  });

  it("returns 500 when Prisma throws", async () => {
    vi.mocked(prisma.evaluation.findMany).mockRejectedValueOnce(
      new Error("DB connection refused")
    );
    const req = new Request("http://localhost/api/evaluations");
    const res = await listEvaluations(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });
});

// ─── GET /api/evaluations/[id] ────────────────────────────────────────────────

describe("GET /api/evaluations/[id]", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluation.findUnique).mockResolvedValue(mockEvaluation as never);
  });

  it("returns 200 with evaluation data", async () => {
    const req = new Request("http://localhost/api/evaluations/eval-001");
    const res = await getEvaluation(req, { params: Promise.resolve({ id: "eval-001" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("eval-001");
    expect(data.evaluationType).toBe("STT");
    expect(data.status).toBe("Completed");
  });

  it("queries by the provided ID", async () => {
    const req = new Request("http://localhost/api/evaluations/eval-001");
    await getEvaluation(req, { params: Promise.resolve({ id: "eval-001" }) });
    expect(prisma.evaluation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "eval-001" } })
    );
  });

  it("includes vendor and all results", async () => {
    const req = new Request("http://localhost/api/evaluations/eval-001");
    const res = await getEvaluation(req, { params: Promise.resolve({ id: "eval-001" }) });
    const data = await res.json();
    expect(data.vendor.slug).toBe("openai");
    expect(data.results).toHaveLength(2);
  });

  it("returns 404 when evaluation not found", async () => {
    vi.mocked(prisma.evaluation.findUnique).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/evaluations/nonexistent");
    const res = await getEvaluation(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/not found/i);
  });

  it("returns 500 on DB error", async () => {
    vi.mocked(prisma.evaluation.findUnique).mockRejectedValueOnce(
      new Error("timeout")
    );
    const req = new Request("http://localhost/api/evaluations/eval-001");
    const res = await getEvaluation(req, { params: Promise.resolve({ id: "eval-001" }) });
    expect(res.status).toBe(500);
  });
});
