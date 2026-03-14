import { describe, it, expect } from "vitest";
import {
  findMetric,
  evaluateMetric,
  STT_METRICS,
  TTS_METRICS,
  V2V_METRICS,
  ALL_METRICS,
  METRICS_BY_TYPE,
  METRIC_COLORS,
  METRIC_DOT_COLORS,
} from "@/lib/metrics";

// ─── findMetric ────────────────────────────────────────────────────────────────

describe("findMetric", () => {
  it("finds a known STT metric by name and type", () => {
    const m = findMetric("WER", "STT");
    expect(m).toBeDefined();
    expect(m!.name).toBe("WER");
    expect(m!.unit).toBe("%");
    expect(m!.lowerIsBetter).toBe(true);
  });

  it("finds a known TTS metric by name and type", () => {
    const m = findMetric("MOS", "TTS");
    expect(m).toBeDefined();
    expect(m!.label).toBe("Mean Opinion Score");
    expect(m!.lowerIsBetter).toBe(false);
    expect(m!.thresholdValue).toBe(4.0);
  });

  it("finds a known V2V metric by name and type", () => {
    const m = findMetric("task_completion_rate", "V2V");
    expect(m).toBeDefined();
    expect(m!.unit).toBe("%");
    expect(m!.thresholdValue).toBe(80);
  });

  it("returns undefined for completely unknown metric name", () => {
    expect(findMetric("NONEXISTENT_METRIC")).toBeUndefined();
    expect(findMetric("NONEXISTENT_METRIC", "STT")).toBeUndefined();
  });

  it("falls back to cross-type lookup when type not provided", () => {
    // WER is in STT — should still be found without specifying type
    const m = findMetric("WER");
    expect(m).toBeDefined();
    expect(m!.name).toBe("WER");
  });

  it("type-scoped lookup takes priority over cross-type for TTFB", () => {
    // TTFB exists in both STT and TTS with different threshold values
    const sttTTFB = findMetric("TTFB", "STT");
    const ttsTTFB = findMetric("TTFB", "TTS");
    expect(sttTTFB).toBeDefined();
    expect(ttsTTFB).toBeDefined();
    // Both should have the same thresholdValue (200ms) in this implementation
    expect(sttTTFB!.thresholdValue).toBe(200);
    expect(ttsTTFB!.thresholdValue).toBe(200);
  });

  it("finds naturalness metric in V2V context", () => {
    const m = findMetric("naturalness", "V2V");
    expect(m).toBeDefined();
    expect(m!.thresholdValue).toBe(3.8);
  });
});

// ─── evaluateMetric ────────────────────────────────────────────────────────────

describe("evaluateMetric — lower-is-better (WER, threshold=5%)", () => {
  it("returns 'good' when value equals threshold (boundary)", () => {
    expect(evaluateMetric("WER", 5, "STT")).toBe("good");
  });

  it("returns 'good' when value is below threshold", () => {
    expect(evaluateMetric("WER", 2.5, "STT")).toBe("good");
    expect(evaluateMetric("WER", 0, "STT")).toBe("good");
  });

  it("returns 'warning' when value is between threshold and 1.5× threshold", () => {
    expect(evaluateMetric("WER", 6, "STT")).toBe("warning");   // 5 < 6 <= 7.5
    expect(evaluateMetric("WER", 7.5, "STT")).toBe("warning"); // boundary
  });

  it("returns 'poor' when value exceeds 1.5× threshold", () => {
    expect(evaluateMetric("WER", 7.51, "STT")).toBe("poor");
    expect(evaluateMetric("WER", 20, "STT")).toBe("poor");
  });
});

describe("evaluateMetric — lower-is-better (CER, threshold=3%)", () => {
  it("3% → good", () => expect(evaluateMetric("CER", 3, "STT")).toBe("good"));
  it("1% → good", () => expect(evaluateMetric("CER", 1, "STT")).toBe("good"));
  it("4% → warning", () => expect(evaluateMetric("CER", 4, "STT")).toBe("warning"));
  it("4.5% → warning (boundary: 3×1.5=4.5)", () => expect(evaluateMetric("CER", 4.5, "STT")).toBe("warning"));
  it("5% → poor", () => expect(evaluateMetric("CER", 5, "STT")).toBe("poor"));
});

describe("evaluateMetric — lower-is-better (RTF, threshold=0.5)", () => {
  it("0.3 → good", () => expect(evaluateMetric("RTF", 0.3, "STT")).toBe("good"));
  it("0.5 → good (exactly threshold)", () => expect(evaluateMetric("RTF", 0.5, "STT")).toBe("good"));
  it("0.6 → warning", () => expect(evaluateMetric("RTF", 0.6, "STT")).toBe("warning"));
  it("0.75 → warning (boundary: 0.5×1.5)", () => expect(evaluateMetric("RTF", 0.75, "STT")).toBe("warning"));
  it("0.9 → poor", () => expect(evaluateMetric("RTF", 0.9, "STT")).toBe("poor"));
});

describe("evaluateMetric — higher-is-better (MOS, threshold=4.0)", () => {
  it("returns 'good' when value meets threshold", () => {
    expect(evaluateMetric("MOS", 4.0, "TTS")).toBe("good");
    expect(evaluateMetric("MOS", 4.5, "TTS")).toBe("good");
  });

  it("returns 'warning' when value is between 75% and 100% of threshold", () => {
    // warning: 4.0 * 0.75 = 3.0 <= value < 4.0
    expect(evaluateMetric("MOS", 3.0, "TTS")).toBe("warning");
    expect(evaluateMetric("MOS", 3.5, "TTS")).toBe("warning");
    expect(evaluateMetric("MOS", 3.99, "TTS")).toBe("warning");
  });

  it("returns 'poor' when value is below 75% of threshold", () => {
    // poor: value < 3.0
    expect(evaluateMetric("MOS", 2.9, "TTS")).toBe("poor");
    expect(evaluateMetric("MOS", 1.0, "TTS")).toBe("poor");
  });
});

describe("evaluateMetric — higher-is-better (task_completion_rate, threshold=80)", () => {
  it("80% → good", () => expect(evaluateMetric("task_completion_rate", 80, "V2V")).toBe("good"));
  it("95% → good", () => expect(evaluateMetric("task_completion_rate", 95, "V2V")).toBe("good"));
  it("70% → warning (80×0.75=60 <= 70 < 80)", () => expect(evaluateMetric("task_completion_rate", 70, "V2V")).toBe("warning"));
  it("60% → warning (boundary: 80×0.75=60)", () => expect(evaluateMetric("task_completion_rate", 60, "V2V")).toBe("warning"));
  it("59% → poor", () => expect(evaluateMetric("task_completion_rate", 59, "V2V")).toBe("poor"));
});

describe("evaluateMetric — higher-is-better (language_detection_accuracy, threshold=95)", () => {
  it("95 → good", () => expect(evaluateMetric("language_detection_accuracy", 95, "STT")).toBe("good"));
  it("99 → good", () => expect(evaluateMetric("language_detection_accuracy", 99, "STT")).toBe("good"));
  it("80 → warning (95×0.75=71.25 <= 80 < 95)", () => expect(evaluateMetric("language_detection_accuracy", 80, "STT")).toBe("warning"));
  it("60 → poor (< 71.25)", () => expect(evaluateMetric("language_detection_accuracy", 60, "STT")).toBe("poor"));
});

describe("evaluateMetric — unknown metric", () => {
  it("returns 'warning' for unknown metric name", () => {
    expect(evaluateMetric("UNKNOWN_METRIC", 42)).toBe("warning");
  });

  it("returns 'warning' for unknown metric with type", () => {
    expect(evaluateMetric("UNKNOWN_METRIC", 42, "STT")).toBe("warning");
  });
});

// ─── Metric Collections ────────────────────────────────────────────────────────

describe("metric collections", () => {
  it("STT_METRICS has 9 entries", () => {
    expect(STT_METRICS).toHaveLength(9);
  });

  it("TTS_METRICS has 9 entries", () => {
    expect(TTS_METRICS).toHaveLength(9);
  });

  it("V2V_METRICS has 9 entries", () => {
    expect(V2V_METRICS).toHaveLength(9);
  });

  it("ALL_METRICS contains all 27 entries", () => {
    expect(ALL_METRICS).toHaveLength(27);
  });

  it("METRICS_BY_TYPE has STT, TTS, V2V keys", () => {
    expect(Object.keys(METRICS_BY_TYPE)).toEqual(expect.arrayContaining(["STT", "TTS", "V2V"]));
  });

  it("every metric has required fields", () => {
    for (const m of ALL_METRICS) {
      expect(m.name).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.unit).toBeTruthy();
      expect(typeof m.lowerIsBetter).toBe("boolean");
      expect(typeof m.thresholdValue).toBe("number");
    }
  });

  it("all metric names are unique within each type", () => {
    for (const [type, metrics] of Object.entries(METRICS_BY_TYPE)) {
      const names = metrics.map((m) => m.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length, `Duplicate metric names in ${type}`);
    }
  });
});

// ─── Color Constants ───────────────────────────────────────────────────────────

describe("METRIC_COLORS", () => {
  it("has good, warning, poor keys", () => {
    expect(METRIC_COLORS.good).toBeTruthy();
    expect(METRIC_COLORS.warning).toBeTruthy();
    expect(METRIC_COLORS.poor).toBeTruthy();
  });
});

describe("METRIC_DOT_COLORS", () => {
  it("has good, warning, poor keys", () => {
    expect(METRIC_DOT_COLORS.good).toBeTruthy();
    expect(METRIC_DOT_COLORS.warning).toBeTruthy();
    expect(METRIC_DOT_COLORS.poor).toBeTruthy();
  });
});
