import { describe, it, expect, vi } from "vitest";

// Mock Anthropic SDK and Prisma so evaluation-runner can be imported in jsdom
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: vi.fn() };
  }
  return { default: MockAnthropic };
});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    evaluationDataset: { findFirst: vi.fn() },
    evaluation: { create: vi.fn(), update: vi.fn() },
    evaluationResult: { create: vi.fn() },
    benchmarkResult: { findMany: vi.fn() },
    vendor: { findUnique: vi.fn() },
  },
}));
import {
  NICE_CX_CLEAN_EN,
  NICE_CX_NOISY_EN,
  NICE_TTS_IVR_EN,
  NICE_TTS_AGENT_EN,
  NICE_V2V_SUPPORT_EN,
  NICE_V2V_IVR_EN,
  DATASET_CATALOG,
  type STTSample,
  type TTSSample,
  type V2VSample,
} from "@/lib/agents/evaluation-runner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function allUniqueIds(samples: { id: string }[]): boolean {
  const ids = samples.map((s) => s.id);
  return new Set(ids).size === ids.length;
}

// ─── STT Datasets ─────────────────────────────────────────────────────────────

describe("NICE_CX_CLEAN_EN (STT clean)", () => {
  it("has exactly 50 samples", () => {
    expect(NICE_CX_CLEAN_EN).toHaveLength(50);
  });

  it("all sample IDs are unique", () => {
    expect(allUniqueIds(NICE_CX_CLEAN_EN)).toBe(true);
  });

  it("every sample has required STT fields", () => {
    for (const s of NICE_CX_CLEAN_EN) {
      expect(s.id).toBeTruthy();
      expect(s.audioDescription).toBeTruthy();
      expect(s.groundTruth).toBeTruthy();
      expect(typeof s.duration).toBe("number");
      expect(s.duration).toBeGreaterThan(0);
      expect(s.difficulty).toBeTruthy();
      expect(s.useCase).toBeTruthy();
    }
  });

  it("difficulty values are valid", () => {
    const valid = new Set(["easy", "medium", "hard"]);
    for (const s of NICE_CX_CLEAN_EN) {
      expect(valid.has(s.difficulty), `Invalid difficulty: ${s.difficulty}`).toBe(true);
    }
  });

  it("contains at least one easy, medium sample", () => {
    expect(NICE_CX_CLEAN_EN.some((s) => s.difficulty === "easy")).toBe(true);
    expect(NICE_CX_CLEAN_EN.some((s) => s.difficulty === "medium")).toBe(true);
  });
});

describe("NICE_CX_NOISY_EN (STT noisy)", () => {
  it("has exactly 50 samples", () => {
    expect(NICE_CX_NOISY_EN).toHaveLength(50);
  });

  it("all sample IDs are unique", () => {
    expect(allUniqueIds(NICE_CX_NOISY_EN)).toBe(true);
  });

  it("every sample has required STT fields", () => {
    for (const s of NICE_CX_NOISY_EN) {
      expect(s.id).toBeTruthy();
      expect(typeof s.duration).toBe("number");
      expect(s.duration).toBeGreaterThan(0);
      expect(["easy", "medium", "hard"]).toContain(s.difficulty);
    }
  });

  it("noisy dataset skews medium-hard difficulty", () => {
    const hard = NICE_CX_NOISY_EN.filter((s) => s.difficulty === "hard").length;
    const medium = NICE_CX_NOISY_EN.filter((s) => s.difficulty === "medium").length;
    expect(hard + medium).toBeGreaterThan(NICE_CX_NOISY_EN.length / 2);
  });

  it("IDs do not overlap with clean dataset", () => {
    const cleanIds = new Set(NICE_CX_CLEAN_EN.map((s) => s.id));
    const noisyIds = NICE_CX_NOISY_EN.map((s) => s.id);
    expect(noisyIds.every((id) => !cleanIds.has(id))).toBe(true);
  });
});

// ─── TTS Datasets ─────────────────────────────────────────────────────────────

describe("NICE_TTS_IVR_EN (TTS IVR)", () => {
  it("has exactly 30 samples", () => {
    expect(NICE_TTS_IVR_EN).toHaveLength(30);
  });

  it("all sample IDs are unique", () => {
    expect(allUniqueIds(NICE_TTS_IVR_EN)).toBe(true);
  });

  it("every sample has required TTS fields", () => {
    for (const s of NICE_TTS_IVR_EN) {
      expect(s.id).toBeTruthy();
      expect(s.text).toBeTruthy();
      expect(typeof s.expectedDuration).toBe("number");
      expect(s.expectedDuration).toBeGreaterThan(0);
      expect(s.category).toBeTruthy();
      expect(s.useCase).toBeTruthy();
    }
  });

  it("useCase is 'ivr' for all samples", () => {
    expect(NICE_TTS_IVR_EN.every((s) => s.useCase === "ivr")).toBe(true);
  });
});

describe("NICE_TTS_AGENT_EN (TTS agent)", () => {
  it("has exactly 30 samples", () => {
    expect(NICE_TTS_AGENT_EN).toHaveLength(30);
  });

  it("all sample IDs are unique", () => {
    expect(allUniqueIds(NICE_TTS_AGENT_EN)).toBe(true);
  });

  it("every sample has required TTS fields", () => {
    for (const s of NICE_TTS_AGENT_EN) {
      expect(s.id).toBeTruthy();
      expect(s.text.length).toBeGreaterThan(5);
      expect(s.expectedDuration).toBeGreaterThan(0);
    }
  });

  it("IDs do not overlap with IVR dataset", () => {
    const ivrIds = new Set(NICE_TTS_IVR_EN.map((s) => s.id));
    expect(NICE_TTS_AGENT_EN.every((s) => !ivrIds.has(s.id))).toBe(true);
  });
});

// ─── V2V Datasets ─────────────────────────────────────────────────────────────

describe("NICE_V2V_SUPPORT_EN (V2V customer support)", () => {
  it("has exactly 10 samples", () => {
    expect(NICE_V2V_SUPPORT_EN).toHaveLength(10);
  });

  it("all sample IDs are unique", () => {
    expect(allUniqueIds(NICE_V2V_SUPPORT_EN)).toBe(true);
  });

  it("every sample has required V2V fields", () => {
    for (const s of NICE_V2V_SUPPORT_EN) {
      expect(s.id).toBeTruthy();
      expect(s.scenario).toBeTruthy();
      expect(s.expectedBehavior).toBeTruthy();
      expect(typeof s.turns).toBe("number");
      expect(s.turns).toBeGreaterThanOrEqual(1);
      expect(s.category).toBeTruthy();
      expect(s.useCase).toBeTruthy();
    }
  });

  it("all samples have multi-turn conversations (≥ 4 turns)", () => {
    expect(NICE_V2V_SUPPORT_EN.every((s) => s.turns >= 4)).toBe(true);
  });

  it("useCase is 'customer_support' for all samples", () => {
    expect(NICE_V2V_SUPPORT_EN.every((s) => s.useCase === "customer_support")).toBe(true);
  });
});

describe("NICE_V2V_IVR_EN (V2V conversational IVR)", () => {
  it("has exactly 10 samples", () => {
    expect(NICE_V2V_IVR_EN).toHaveLength(10);
  });

  it("all sample IDs are unique", () => {
    expect(allUniqueIds(NICE_V2V_IVR_EN)).toBe(true);
  });

  it("every sample has required V2V fields", () => {
    for (const s of NICE_V2V_IVR_EN) {
      expect(s.id).toBeTruthy();
      expect(s.scenario).toBeTruthy();
      expect(s.turns).toBeGreaterThan(0);
    }
  });

  it("IDs do not overlap with support dataset", () => {
    const supportIds = new Set(NICE_V2V_SUPPORT_EN.map((s) => s.id));
    expect(NICE_V2V_IVR_EN.every((s) => !supportIds.has(s.id))).toBe(true);
  });
});

// ─── DATASET_CATALOG ──────────────────────────────────────────────────────────

describe("DATASET_CATALOG", () => {
  it("has STT, TTS, V2V keys", () => {
    expect(DATASET_CATALOG).toHaveProperty("STT");
    expect(DATASET_CATALOG).toHaveProperty("TTS");
    expect(DATASET_CATALOG).toHaveProperty("V2V");
  });

  it("STT catalog has 2 entries", () => {
    expect(DATASET_CATALOG.STT).toHaveLength(2);
  });

  it("TTS catalog has 2 entries", () => {
    expect(DATASET_CATALOG.TTS).toHaveLength(2);
  });

  it("V2V catalog has 2 entries", () => {
    expect(DATASET_CATALOG.V2V).toHaveLength(2);
  });

  it("catalog sampleCounts match actual dataset lengths", () => {
    expect(DATASET_CATALOG.STT[0].samples).toBe(NICE_CX_CLEAN_EN.length);
    expect(DATASET_CATALOG.STT[1].samples).toBe(NICE_CX_NOISY_EN.length);
    expect(DATASET_CATALOG.TTS[0].samples).toBe(NICE_TTS_IVR_EN.length);
    expect(DATASET_CATALOG.TTS[1].samples).toBe(NICE_TTS_AGENT_EN.length);
    expect(DATASET_CATALOG.V2V[0].samples).toBe(NICE_V2V_SUPPORT_EN.length);
    expect(DATASET_CATALOG.V2V[1].samples).toBe(NICE_V2V_IVR_EN.length);
  });

  it("every catalog entry has id, name, description", () => {
    const all = [...DATASET_CATALOG.STT, ...DATASET_CATALOG.TTS, ...DATASET_CATALOG.V2V];
    for (const entry of all) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
    }
  });

  it("total sample count across all datasets is 180", () => {
    const total = [
      ...DATASET_CATALOG.STT,
      ...DATASET_CATALOG.TTS,
      ...DATASET_CATALOG.V2V,
    ].reduce((sum, d) => sum + d.samples, 0);
    expect(total).toBe(180);
  });
});
