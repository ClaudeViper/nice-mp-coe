import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    evaluationDataset: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
    evaluation: {
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET as listDatasets, POST as createDataset } from "@/app/api/datasets/route";
import { GET as getDataset, PATCH as patchDataset, DELETE as deleteDataset } from "@/app/api/datasets/[id]/route";
import { POST as addSample } from "@/app/api/datasets/[id]/samples/route";
import { PATCH as patchSample, DELETE as deleteSample } from "@/app/api/datasets/[id]/samples/[sampleId]/route";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const sttSample = {
  id: "clean-001",
  audioDescription: "Clear male voice",
  groundTruth: "Hello world",
  duration: 2.5,
  difficulty: "easy",
  useCase: "agent_assist",
};

const mockDataset = {
  id: "ds-001",
  name: "NICE-CX-Clean-EN",
  slug: "nice-cx-clean-en",
  type: "STT",
  description: "Clean audio samples",
  sampleCount: 1,
  language: "en",
  samples: [sttSample],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── GET /api/datasets ────────────────────────────────────────────────────────

describe("GET /api/datasets", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findMany).mockResolvedValue([mockDataset] as never);
    vi.mocked(prisma.evaluation.groupBy).mockResolvedValue([
      { dataset: "nice-cx-clean-en", _count: { id: 3 } },
    ] as never);
  });

  it("returns 200 with dataset array", async () => {
    const req = new Request("http://localhost/api/datasets");
    const res = await listDatasets(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe("ds-001");
  });

  it("attaches _evalCount to each dataset", async () => {
    const req = new Request("http://localhost/api/datasets");
    const res = await listDatasets(req);
    const data = await res.json();
    expect(data[0]._evalCount).toBe(3);
  });

  it("returns _evalCount 0 when no evaluations use the dataset", async () => {
    vi.mocked(prisma.evaluation.groupBy).mockResolvedValueOnce([] as never);
    const req = new Request("http://localhost/api/datasets");
    const res = await listDatasets(req);
    const data = await res.json();
    expect(data[0]._evalCount).toBe(0);
  });

  it("passes type filter to Prisma when provided", async () => {
    const req = new Request("http://localhost/api/datasets?type=STT");
    await listDatasets(req);
    expect(prisma.evaluationDataset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: "STT" },
      })
    );
  });

  it("does not apply where clause when no type filter", async () => {
    const req = new Request("http://localhost/api/datasets");
    await listDatasets(req);
    expect(prisma.evaluationDataset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it("returns 500 on DB error", async () => {
    vi.mocked(prisma.evaluationDataset.findMany).mockRejectedValueOnce(new Error("db down"));
    const req = new Request("http://localhost/api/datasets");
    const res = await listDatasets(req);
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/datasets ────────────────────────────────────────────────────────

describe("POST /api/datasets", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.create).mockResolvedValue(mockDataset as never);
  });

  it("creates dataset and returns 201", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({ name: "My Dataset", type: "STT" }),
    });
    const res = await createDataset(req);
    expect(res.status).toBe(201);
  });

  it("generates slug from name", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({ name: "My Custom Dataset!", type: "TTS" }),
    });
    await createDataset(req);
    expect(prisma.evaluationDataset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "my-custom-dataset" }),
      })
    );
  });

  it("defaults language to 'en' when not provided", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({ name: "Test", type: "V2V" }),
    });
    await createDataset(req);
    expect(prisma.evaluationDataset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ language: "en" }),
      })
    );
  });

  it("uses provided language", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({ name: "French Dataset", type: "STT", language: "fr" }),
    });
    await createDataset(req);
    expect(prisma.evaluationDataset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ language: "fr" }),
      })
    );
  });

  it("returns 400 when name is missing", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({ type: "STT" }),
    });
    const res = await createDataset(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 when type is missing", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({ name: "My Dataset" }),
    });
    const res = await createDataset(req);
    expect(res.status).toBe(400);
  });

  it("sets sampleCount from provided samples array", async () => {
    const req = new Request("http://localhost/api/datasets", {
      method: "POST",
      body: JSON.stringify({
        name: "With Samples",
        type: "STT",
        samples: [sttSample, { ...sttSample, id: "clean-002" }],
      }),
    });
    await createDataset(req);
    expect(prisma.evaluationDataset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sampleCount: 2 }),
      })
    );
  });
});

// ─── GET /api/datasets/[id] ───────────────────────────────────────────────────

describe("GET /api/datasets/[id]", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(mockDataset as never);
  });

  it("returns 200 with dataset", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001");
    const res = await getDataset(req, { params: Promise.resolve({ id: "ds-001" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("ds-001");
    expect(data.samples).toHaveLength(1);
  });

  it("queries by id OR slug (allows slug lookup)", async () => {
    const req = new Request("http://localhost/api/datasets/nice-cx-clean-en");
    await getDataset(req, { params: Promise.resolve({ id: "nice-cx-clean-en" }) });
    expect(prisma.evaluationDataset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ id: "nice-cx-clean-en" }, { slug: "nice-cx-clean-en" }] },
      })
    );
  });

  it("returns 404 when not found", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/datasets/nonexistent");
    const res = await getDataset(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/datasets/[id] ─────────────────────────────────────────────────

describe("PATCH /api/datasets/[id]", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(mockDataset as never);
    vi.mocked(prisma.evaluationDataset.update).mockResolvedValue({
      ...mockDataset,
      name: "Updated Name",
    } as never);
  });

  it("updates dataset name", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const res = await patchDataset(req, { params: Promise.resolve({ id: "ds-001" }) });
    expect(res.status).toBe(200);
    expect(prisma.evaluationDataset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Updated Name" }),
      })
    );
  });

  it("updates description and language independently", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001", {
      method: "PATCH",
      body: JSON.stringify({ description: "New desc", language: "fr" }),
    });
    await patchDataset(req, { params: Promise.resolve({ id: "ds-001" }) });
    expect(prisma.evaluationDataset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: "New desc", language: "fr" }),
      })
    );
  });

  it("returns 404 when dataset not found", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/datasets/ghost", {
      method: "PATCH",
      body: JSON.stringify({ name: "X" }),
    });
    const res = await patchDataset(req, { params: Promise.resolve({ id: "ghost" }) });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/datasets/[id] ────────────────────────────────────────────────

describe("DELETE /api/datasets/[id]", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(mockDataset as never);
    vi.mocked(prisma.evaluationDataset.delete).mockResolvedValue(mockDataset as never);
  });

  it("deletes and returns { success: true }", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001", { method: "DELETE" });
    const res = await deleteDataset(req, { params: Promise.resolve({ id: "ds-001" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 when not found", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/datasets/ghost", { method: "DELETE" });
    const res = await deleteDataset(req, { params: Promise.resolve({ id: "ghost" }) });
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/datasets/[id]/samples ──────────────────────────────────────────

describe("POST /api/datasets/[id]/samples", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(mockDataset as never);
    vi.mocked(prisma.evaluationDataset.update).mockResolvedValue({
      ...mockDataset,
      samples: [sttSample, { ...sttSample, id: "clean-002" }],
      sampleCount: 2,
    } as never);
  });

  it("adds sample and returns 201", async () => {
    const newSample = { ...sttSample, id: "clean-002" };
    const req = new Request("http://localhost/api/datasets/ds-001/samples", {
      method: "POST",
      body: JSON.stringify(newSample),
    });
    const res = await addSample(req, { params: Promise.resolve({ id: "ds-001" }) });
    expect(res.status).toBe(201);
  });

  it("appends to existing samples array", async () => {
    const newSample = { ...sttSample, id: "clean-002" };
    const req = new Request("http://localhost/api/datasets/ds-001/samples", {
      method: "POST",
      body: JSON.stringify(newSample),
    });
    await addSample(req, { params: Promise.resolve({ id: "ds-001" }) });
    expect(prisma.evaluationDataset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sampleCount: expect.any(Number),
        }),
      })
    );
  });

  it("auto-generates id when not provided", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001/samples", {
      method: "POST",
      body: JSON.stringify({ audioDescription: "Test", groundTruth: "Hello" }),
    });
    await addSample(req, { params: Promise.resolve({ id: "ds-001" }) });
    const updateCall = vi.mocked(prisma.evaluationDataset.update).mock.calls.at(-1)!;
    const updatedSamples = (updateCall[0] as { data: { samples: { id: string }[] } }).data.samples;
    const addedSample = updatedSamples[updatedSamples.length - 1];
    expect(addedSample.id).toMatch(/^custom-/);
  });

  it("returns 404 when dataset not found", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/datasets/ghost/samples", {
      method: "POST",
      body: JSON.stringify(sttSample),
    });
    const res = await addSample(req, { params: Promise.resolve({ id: "ghost" }) });
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/datasets/[id]/samples/[sampleId] ─────────────────────────────

describe("PATCH /api/datasets/[id]/samples/[sampleId]", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(mockDataset as never);
    vi.mocked(prisma.evaluationDataset.update).mockResolvedValue({
      ...mockDataset,
      samples: [{ ...sttSample, groundTruth: "Updated truth" }],
    } as never);
  });

  it("updates sample and returns 200", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001/samples/clean-001", {
      method: "PATCH",
      body: JSON.stringify({ groundTruth: "Updated truth" }),
    });
    const res = await patchSample(req, {
      params: Promise.resolve({ id: "ds-001", sampleId: "clean-001" }),
    });
    expect(res.status).toBe(200);
  });

  it("preserves sample id when updating", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001/samples/clean-001", {
      method: "PATCH",
      body: JSON.stringify({ groundTruth: "New truth" }),
    });
    await patchSample(req, {
      params: Promise.resolve({ id: "ds-001", sampleId: "clean-001" }),
    });
    const updateCall = vi.mocked(prisma.evaluationDataset.update).mock.calls.at(-1)!;
    const samples = (updateCall[0] as { data: { samples: { id: string }[] } }).data.samples;
    expect(samples[0].id).toBe("clean-001");
  });

  it("returns 404 when sampleId not found", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001/samples/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ groundTruth: "X" }),
    });
    const res = await patchSample(req, {
      params: Promise.resolve({ id: "ds-001", sampleId: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/datasets/[id]/samples/[sampleId] ────────────────────────────

describe("DELETE /api/datasets/[id]/samples/[sampleId]", () => {
  beforeEach(() => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValue(mockDataset as never);
    vi.mocked(prisma.evaluationDataset.update).mockResolvedValue({
      ...mockDataset,
      samples: [],
      sampleCount: 0,
    } as never);
  });

  it("removes sample and updates sampleCount", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001/samples/clean-001", {
      method: "DELETE",
    });
    const res = await deleteSample(req, {
      params: Promise.resolve({ id: "ds-001", sampleId: "clean-001" }),
    });
    expect(res.status).toBe(200);
    expect(prisma.evaluationDataset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sampleCount: 0 }),
      })
    );
  });

  it("filters out the sample by ID", async () => {
    const req = new Request("http://localhost/api/datasets/ds-001/samples/clean-001", {
      method: "DELETE",
    });
    await deleteSample(req, {
      params: Promise.resolve({ id: "ds-001", sampleId: "clean-001" }),
    });
    const updateCall = vi.mocked(prisma.evaluationDataset.update).mock.calls.at(-1)!;
    const samples = (updateCall[0] as { data: { samples: unknown[] } }).data.samples;
    expect(samples).toHaveLength(0);
  });

  it("returns 404 when dataset not found", async () => {
    vi.mocked(prisma.evaluationDataset.findFirst).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/datasets/ghost/samples/s1", {
      method: "DELETE",
    });
    const res = await deleteSample(req, {
      params: Promise.resolve({ id: "ghost", sampleId: "s1" }),
    });
    expect(res.status).toBe(404);
  });
});
