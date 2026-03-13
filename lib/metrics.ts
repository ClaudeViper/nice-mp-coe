/**
 * Industry-standard speech technology metrics definitions.
 * Used across benchmarks, evaluations, and vendor comparisons.
 */

export interface MetricDefinition {
  name: string;
  label: string;
  description: string;
  howMeasured: string;
  unit: string;
  goodThreshold: string;
  /** Lower is better (e.g. WER, latency). If false, higher is better (e.g. MOS, task completion). */
  lowerIsBetter: boolean;
  /** Numeric threshold for "good" coloring. Compare with lowerIsBetter to determine pass/fail. */
  thresholdValue: number;
}

// ─── STT Metrics ─────────────────────────────────────────────────────────────

export const STT_METRICS: MetricDefinition[] = [
  {
    name: "WER",
    label: "Word Error Rate",
    description: "Primary accuracy metric. Percentage of words incorrectly transcribed.",
    howMeasured: "(Substitutions + Deletions + Insertions) / Total Words",
    unit: "%",
    goodThreshold: "<5% English, <10% other languages",
    lowerIsBetter: true,
    thresholdValue: 5,
  },
  {
    name: "CER",
    label: "Character Error Rate",
    description: "Character-level accuracy, important for languages without word boundaries.",
    howMeasured: "Same as WER but at character level",
    unit: "%",
    goodThreshold: "<3%",
    lowerIsBetter: true,
    thresholdValue: 3,
  },
  {
    name: "RTF",
    label: "Real-Time Factor",
    description: "Speed metric. RTF < 1 means faster than real-time.",
    howMeasured: "Processing Time / Audio Duration",
    unit: "ratio",
    goodThreshold: "<0.5 for production",
    lowerIsBetter: true,
    thresholdValue: 0.5,
  },
  {
    name: "TTFB",
    label: "Time to First Byte",
    description: "Latency for streaming STT to start returning text.",
    howMeasured: "Time from audio start to first transcript chunk",
    unit: "ms",
    goodThreshold: "<200ms",
    lowerIsBetter: true,
    thresholdValue: 200,
  },
  {
    name: "end_to_end_latency",
    label: "End-to-End Latency",
    description: "Total time from audio input to complete transcript.",
    howMeasured: "Measured end-to-end including network",
    unit: "ms",
    goodThreshold: "<500ms streaming, <2x audio length batch",
    lowerIsBetter: true,
    thresholdValue: 500,
  },
  {
    name: "avg_latency",
    label: "Average Latency",
    description: "Average processing latency across all samples.",
    howMeasured: "Mean of per-sample end-to-end latency",
    unit: "ms",
    goodThreshold: "<500ms",
    lowerIsBetter: true,
    thresholdValue: 500,
  },
  {
    name: "DER",
    label: "Diarization Error Rate",
    description: "Accuracy of speaker identification.",
    howMeasured: "Standard DER calculation",
    unit: "%",
    goodThreshold: "<15%",
    lowerIsBetter: true,
    thresholdValue: 15,
  },
  {
    name: "language_detection_accuracy",
    label: "Language Detection Accuracy",
    description: "Correct language identification rate.",
    howMeasured: "% correctly identified out of test set",
    unit: "%",
    goodThreshold: ">95%",
    lowerIsBetter: false,
    thresholdValue: 95,
  },
  {
    name: "noise_robustness",
    label: "Noise Robustness (WER delta)",
    description: "WER degradation under noisy conditions vs clean.",
    howMeasured: "WER(noisy) - WER(clean)",
    unit: "%",
    goodThreshold: "<3% delta",
    lowerIsBetter: true,
    thresholdValue: 3,
  },
];

// ─── TTS Metrics ─────────────────────────────────────────────────────────────

export const TTS_METRICS: MetricDefinition[] = [
  {
    name: "MOS",
    label: "Mean Opinion Score",
    description: "Subjective naturalness rating on a 1–5 scale.",
    howMeasured: "Human evaluation or UTMOS/DNSMOS automated proxy",
    unit: "score",
    goodThreshold: ">4.0 for production",
    lowerIsBetter: false,
    thresholdValue: 4.0,
  },
  {
    name: "ELO",
    label: "ELO Rating (Arena)",
    description: "Comparative quality rating from blind A/B tests.",
    howMeasured: "TTS Arena crowdsourced evaluations",
    unit: "rating",
    goodThreshold: ">1200 for competitive",
    lowerIsBetter: false,
    thresholdValue: 1200,
  },
  {
    name: "roundtrip_WER",
    label: "Word Error Rate (roundtrip)",
    description: "Intelligibility: run TTS output through STT.",
    howMeasured: "WER of STT(TTS(text)) vs original text",
    unit: "%",
    goodThreshold: "<5%",
    lowerIsBetter: true,
    thresholdValue: 5,
  },
  {
    name: "TTFB",
    label: "Time to First Byte",
    description: "How quickly first audio chunk is available.",
    howMeasured: "Measured from API call to first audio byte",
    unit: "ms",
    goodThreshold: "<200ms for real-time",
    lowerIsBetter: true,
    thresholdValue: 200,
  },
  {
    name: "synthesis_time",
    label: "Full Synthesis Latency",
    description: "Total time to generate complete audio.",
    howMeasured: "API call to last audio byte received",
    unit: "ms",
    goodThreshold: "<1s for short utterances",
    lowerIsBetter: true,
    thresholdValue: 1000,
  },
  {
    name: "naturalness",
    label: "Naturalness Score",
    description: "Overall naturalness of synthesized speech.",
    howMeasured: "Human evaluation or automated proxy",
    unit: "score",
    goodThreshold: ">80",
    lowerIsBetter: false,
    thresholdValue: 80,
  },
  {
    name: "speaker_similarity",
    label: "Speaker Similarity (cloning)",
    description: "How close cloned voice matches target.",
    howMeasured: "Cosine similarity of speaker embeddings",
    unit: "ratio",
    goodThreshold: ">0.85",
    lowerIsBetter: false,
    thresholdValue: 0.85,
  },
  {
    name: "emotional_expressiveness",
    label: "Emotional Expressiveness",
    description: "Ability to convey emotions as instructed.",
    howMeasured: "Human evaluation on emotion classification",
    unit: "%",
    goodThreshold: ">70% correct emotion identified",
    lowerIsBetter: false,
    thresholdValue: 70,
  },
  {
    name: "prosody_naturalness",
    label: "Prosody Naturalness",
    description: "Correct stress, intonation, rhythm.",
    howMeasured: "PESQ/POLQA + human evaluation",
    unit: "PESQ",
    goodThreshold: "PESQ >3.5",
    lowerIsBetter: false,
    thresholdValue: 3.5,
  },
];

// ─── V2V Metrics ─────────────────────────────────────────────────────────────

export const V2V_METRICS: MetricDefinition[] = [
  {
    name: "e2e_latency",
    label: "End-to-End Latency",
    description: "Time from user finishes speaking to agent starts responding.",
    howMeasured: "Timestamp delta, measured at audio level",
    unit: "ms",
    goodThreshold: "<500ms for conversational",
    lowerIsBetter: true,
    thresholdValue: 500,
  },
  {
    name: "turn_taking_accuracy",
    label: "Turn-Taking Accuracy",
    description: "Correct detection of when user is done speaking.",
    howMeasured: "% of correctly identified end-of-turn events",
    unit: "%",
    goodThreshold: ">90%",
    lowerIsBetter: false,
    thresholdValue: 90,
  },
  {
    name: "interruption_handling",
    label: "Interruption Handling",
    description: "Ability to gracefully handle user interruptions.",
    howMeasured: "% of correctly handled interruption scenarios",
    unit: "score",
    goodThreshold: ">85%",
    lowerIsBetter: false,
    thresholdValue: 85,
  },
  {
    name: "task_completion_rate",
    label: "Task Completion Rate",
    description: "Percentage of test scenarios successfully completed.",
    howMeasured: "Automated + human evaluation of scenario outcomes",
    unit: "%",
    goodThreshold: ">80%",
    lowerIsBetter: false,
    thresholdValue: 80,
  },
  {
    name: "instruction_following",
    label: "Instruction Following",
    description: "Adherence to persona/script instructions.",
    howMeasured: "Human evaluation against instruction set",
    unit: "score",
    goodThreshold: ">85%",
    lowerIsBetter: false,
    thresholdValue: 85,
  },
  {
    name: "voice_consistency",
    label: "Voice Consistency",
    description: "Maintaining same voice identity throughout conversation.",
    howMeasured: "Speaker embedding similarity across turns",
    unit: "ratio",
    goodThreshold: ">0.90",
    lowerIsBetter: false,
    thresholdValue: 0.9,
  },
  {
    name: "naturalness",
    label: "Naturalness (conversation)",
    description: "Overall naturalness of the conversation flow.",
    howMeasured: "Human MOS on conversation clips",
    unit: "score",
    goodThreshold: ">3.8",
    lowerIsBetter: false,
    thresholdValue: 3.8,
  },
  {
    name: "persona_consistency",
    label: "Persona Consistency",
    description: "Maintaining persona throughout conversation.",
    howMeasured: "Human evaluation of persona adherence",
    unit: "score",
    goodThreshold: ">85",
    lowerIsBetter: false,
    thresholdValue: 85,
  },
  {
    name: "knowledge_grounding",
    label: "Knowledge Grounding",
    description: "Accuracy when answering factual questions.",
    howMeasured: "% correct on factual test queries",
    unit: "%",
    goodThreshold: ">75%",
    lowerIsBetter: false,
    thresholdValue: 75,
  },
];

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

export const ALL_METRICS: MetricDefinition[] = [...STT_METRICS, ...TTS_METRICS, ...V2V_METRICS];

export const METRICS_BY_TYPE: Record<string, MetricDefinition[]> = {
  STT: STT_METRICS,
  TTS: TTS_METRICS,
  V2V: V2V_METRICS,
};

/** Build a lookup map keyed by metric name (within a type). Falls back to cross-type lookup. */
const metricsByName = new Map<string, MetricDefinition>();
for (const m of ALL_METRICS) {
  if (!metricsByName.has(m.name)) {
    metricsByName.set(m.name, m);
  }
}

/** Find a metric definition by name, optionally scoped to a type. */
export function findMetric(name: string, type?: string): MetricDefinition | undefined {
  if (type && METRICS_BY_TYPE[type]) {
    const found = METRICS_BY_TYPE[type].find((m) => m.name === name);
    if (found) return found;
  }
  return metricsByName.get(name);
}

/**
 * Evaluate whether a metric value meets the "good" threshold.
 * Returns "good" | "warning" | "poor" based on the metric definition.
 */
export function evaluateMetric(
  metricName: string,
  value: number,
  type?: string
): "good" | "warning" | "poor" {
  const def = findMetric(metricName, type);
  if (!def) return "warning";

  if (def.lowerIsBetter) {
    if (value <= def.thresholdValue) return "good";
    if (value <= def.thresholdValue * 1.5) return "warning";
    return "poor";
  } else {
    if (value >= def.thresholdValue) return "good";
    if (value >= def.thresholdValue * 0.75) return "warning";
    return "poor";
  }
}

/** CSS color classes for metric evaluation results. */
export const METRIC_COLORS = {
  good: "text-green-700 bg-green-50 border-green-200",
  warning: "text-yellow-700 bg-yellow-50 border-yellow-200",
  poor: "text-red-700 bg-red-50 border-red-200",
} as const;

export const METRIC_DOT_COLORS = {
  good: "bg-green-500",
  warning: "bg-yellow-500",
  poor: "bg-red-500",
} as const;
