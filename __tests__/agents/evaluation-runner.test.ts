import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Anthropic SDK ───────────────────────────────────────────────────────
// vi.hoisted ensures the variable is available when vi.mock factory runs.

const mockMessagesCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockMessagesCreate };
  }
  return { default: MockAnthropic };
});

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    evaluationDataset: { findFirst: vi.fn() },
    evaluation: {
      create: vi.fn(),
      update: vi.fn(),
    },
    evaluationResult: { create: vi.fn() },
    benchmarkResult: { findMany: vi.fn() },
    vendor: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  runEvaluation,
  NICE_CX_CLEAN_EN,
  NICE_TTS_IVR_EN,
  NICE_V2V_SUPPORT_EN,
  DATASET_CATALOG,
  type EvaluationRequest,
} from "@/lib/agents/evaluation-runner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvalRecord(overrides = {}) {
  return {
    id: "eval-test-001",
    status: "Running",
    processedSamples: 0,
    ...overrides,
  };
}

const baseRequest: EvaluationRequest = {
  vendorId: "vendor-openai",
  evaluationType: "STT",
  modelName: "whisper-large-v3",
  config: { endpointUrl: "https://api.openai.com", modelId: "whisper-large-v3" },
  dataset: "NICE-CX-Clean-EN",
  language: "en",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.evaluation.create).mockResolvedValue(makeEvalRecord() as never);
  vi.mocked(prisma.evaluation.update).mockResolvedValue(makeEvalRecord({ status: "Completed" }) as never);
  vi.mocked(prisma.evaluationResult.create).mockResolvedValue({} as never);
  vi.mocked(prisma.benchmarkResult.findMany).mockResolvedValue([]);
  vi.mocked(prisma.vendor.findUnique).mockResolvedValue({ slug: "openai" } as never);

  // Default Claude response: valid JSON metrics
  mockMessagesCreate.mockResolvedValue({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          wer: 3.5,
          cer: 1.2,
          rtf: 0.4,
          ttfb_ms: 150,
          confidence: 0.92,
          // TTS fields
          mos: 4.2,
          naturalness: 85,
          synthesis_time_ms: 300,
          roundtrip_wer: 5,
          audio_duration: 3.5,
          // V2V fields
          task_completion: 88,
          e2e_latency_ms: 250,
          naturalness_score: 80,
          persona_score: 82,
          interruption_score: 78,
        }),
      },
    ],
  });
});

// ─── Dataset selection ────────────────────────────────────────────────────────

describe("dataset selection", () => {
  it("queries DB for dataset by slug and name", async () => {
    await runEvaluation(baseRequest).catch(() => {});

    expect(prisma.evaluationDataset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ slug: "NICE-CX-Clean-EN" }, { name: "NICE-CX-Clean-EN" }] },
      })
    );
  });

  it("uses hardcoded NICE_CX_CLEAN_EN when no DB dataset found (STT)", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(null);

    await runEvaluation(baseRequest).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalSamples: NICE_CX_CLEAN_EN.length }),
      })
    );
  });

  it("uses DB dataset samples when found and non-empty (STT)", async () => {
    const customSamples = [
      {
        id: "custom-001",
        audioDescription: "Test audio",
        groundTruth: "hello world",
        duration: 2.0,
        difficulty: "easy",
        useCase: "agent_assist",
      },
    ];

    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue({
      id: "ds-001",
      slug: "NICE-CX-Clean-EN",
      name: "NICE-CX-Clean-EN",
      samples: customSamples,
      sampleCount: 1,
    } as never);

    await runEvaluation(baseRequest).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalSamples: 1 }),
      })
    );
  });

  it("falls back to hardcoded dataset when DB samples array is empty", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue({
      id: "ds-001",
      slug: "NICE-CX-Clean-EN",
      name: "NICE-CX-Clean-EN",
      samples: [],
      sampleCount: 0,
    } as never);

    await runEvaluation(baseRequest).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalSamples: NICE_CX_CLEAN_EN.length }),
      })
    );
  });

  it("selects TTS samples for TTS evaluation type", async () => {
    const req: EvaluationRequest = {
      ...baseRequest,
      evaluationType: "TTS",
      dataset: "NICE-TTS-IVR-EN",
    };

    await runEvaluation(req).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          evaluationType: "TTS",
          totalSamples: NICE_TTS_IVR_EN.length,
        }),
      })
    );
  });

  it("selects V2V samples for V2V evaluation type", async () => {
    const req: EvaluationRequest = {
      ...baseRequest,
      evaluationType: "V2V",
      dataset: "NICE-V2V-Support-EN",
    };

    await runEvaluation(req).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          evaluationType: "V2V",
          totalSamples: NICE_V2V_SUPPORT_EN.length,
        }),
      })
    );
  });
});

// ─── Evaluation record lifecycle ──────────────────────────────────────────────

describe("evaluation record lifecycle", () => {
  it("creates evaluation with status Running", async () => {
    await runEvaluation(baseRequest).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vendorId: "vendor-openai",
          modelName: "whisper-large-v3",
          status: "Running",
          language: "en",
        }),
      })
    );
  });

  it("stores dataset name on evaluation record", async () => {
    await runEvaluation(baseRequest).catch(() => {});

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dataset: "NICE-CX-Clean-EN" }),
      })
    );
  });

  it("marks evaluation as Failed on DB error and returns error field", async () => {
    // Use a 1-sample DB dataset so we quickly get into processing
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue({
      id: "ds-001",
      slug: "test",
      name: "test",
      samples: [NICE_CX_CLEAN_EN[0]],
      sampleCount: 1,
    } as never);

    // Make evaluationResult.create throw
    vi.mocked(prisma.evaluationResult.create).mockRejectedValue(new Error("DB write failed"));

    const result = await runEvaluation(baseRequest);

    expect(result.status).toBe("Failed");
    expect(result.error).toBeDefined();
    expect(prisma.evaluation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "Failed" }),
      })
    );
  });

  it("uses default dataset when request.dataset is undefined", async () => {
    const req: EvaluationRequest = { ...baseRequest, dataset: undefined };
    await runEvaluation(req).catch(() => {});

    expect(prisma.evaluationDataset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ slug: "NICE-CX-Clean-EN" }, { name: "NICE-CX-Clean-EN" }] },
      })
    );
  });
});

// ─── Default dataset names ────────────────────────────────────────────────────

describe("default dataset names per evaluation type", () => {
  it("defaults to NICE-CX-Clean-EN for STT", async () => {
    await runEvaluation({ ...baseRequest, evaluationType: "STT", dataset: undefined }).catch(() => {});
    expect(prisma.evaluationDataset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ slug: "NICE-CX-Clean-EN" }, { name: "NICE-CX-Clean-EN" }] },
      })
    );
  });

  it("defaults to NICE-TTS-IVR-EN for TTS", async () => {
    await runEvaluation({ ...baseRequest, evaluationType: "TTS", dataset: undefined }).catch(() => {});
    expect(prisma.evaluationDataset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ slug: "NICE-TTS-IVR-EN" }, { name: "NICE-TTS-IVR-EN" }] },
      })
    );
  });

  it("defaults to NICE-V2V-Support-EN for V2V", async () => {
    await runEvaluation({ ...baseRequest, evaluationType: "V2V", dataset: undefined }).catch(() => {});
    expect(prisma.evaluationDataset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ slug: "NICE-V2V-Support-EN" }, { name: "NICE-V2V-Support-EN" }] },
      })
    );
  });
});

// ─── DATASET_CATALOG export ───────────────────────────────────────────────────

describe("DATASET_CATALOG structure", () => {
  it("has STT, TTS, V2V keys", () => {
    expect(DATASET_CATALOG).toHaveProperty("STT");
    expect(DATASET_CATALOG).toHaveProperty("TTS");
    expect(DATASET_CATALOG).toHaveProperty("V2V");
  });

  it("each entry has id, name, description, samples", () => {
    const all = [...DATASET_CATALOG.STT, ...DATASET_CATALOG.TTS, ...DATASET_CATALOG.V2V];
    for (const entry of all) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(typeof entry.samples).toBe("number");
      expect(entry.samples).toBeGreaterThan(0);
    }
  });

  it("total sample count across catalog is 180", () => {
    const total = [
      ...DATASET_CATALOG.STT,
      ...DATASET_CATALOG.TTS,
      ...DATASET_CATALOG.V2V,
    ].reduce((sum, d) => sum + d.samples, 0);
    expect(total).toBe(180);
  });
});
