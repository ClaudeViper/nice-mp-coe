"use client";

import { useState } from "react";
import { Info, TrendingUp } from "lucide-react";
import { BenchmarkTable } from "@/components/dashboard/benchmark-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ── Data ─────────────────────────────────────────────────────────────────────

type CellValue = number | "TBD" | "N/A";

interface ModelRow {
  name: string;
  isBaseline?: boolean;
  ccWer: CellValue;
  ccMwer: CellValue;
  ptMwer: CellValue;
  entity: CellValue;
  voicebot: CellValue;
}

const ROWS: ModelRow[] = [
  { name: "NiCE v11",                    isBaseline: true, ccWer: 20.1, ccMwer: 5.9,  ptMwer: 15.7, entity: 90.6, voicebot: 82.2 },
  { name: "Deepgram Nova3",                               ccWer: 17.3, ccMwer: 8.7,  ptMwer: "TBD", entity: 91.2, voicebot: 84.6 },
  { name: "Qwen3 ASR 0.6B",                               ccWer: 15.9, ccMwer: 6.7,  ptMwer: 19.5, entity: 85.2, voicebot: 82.0 },
  { name: "NVIDIA Parakeet TDT 0.6B v3",                  ccWer: 16.6, ccMwer: 7.5,  ptMwer: 16.4, entity: 84.3, voicebot: 65.9 },
  { name: "NVIDIA Canary 1B v2",                          ccWer: 21.9, ccMwer: 8.6,  ptMwer: "TBD", entity: 82.8, voicebot: 73.8 },
  { name: "NVIDIA Nemotron",                              ccWer: 25.8, ccMwer: 11.2, ptMwer: "N/A", entity: 82.5, voicebot: 54.9 },
];

// ── Color-coding helpers ──────────────────────────────────────────────────────

function numericValues(rows: ModelRow[], key: keyof ModelRow): number[] {
  return rows
    .map((r) => r[key])
    .filter((v): v is number => typeof v === "number");
}

function cellColor(
  value: CellValue,
  best: number,
  worst: number
): React.CSSProperties {
  if (typeof value !== "number") return {};
  if (value === best)  return { color: "#16a34a", fontWeight: 600 }; // green-700
  if (value === worst) return { color: "#dc2626", fontWeight: 600 }; // red-600
  return {};
}

function buildColors(rows: ModelRow[]) {
  const nums = (key: keyof ModelRow) => numericValues(rows, key);

  // lower-is-better: best = min, worst = max
  const lowerBest = (key: keyof ModelRow) => {
    const vs = nums(key);
    return { best: Math.min(...vs), worst: Math.max(...vs) };
  };
  // higher-is-better: best = max, worst = min
  const higherBest = (key: keyof ModelRow) => {
    const vs = nums(key);
    return { best: Math.max(...vs), worst: Math.min(...vs) };
  };

  return {
    ccWer:    lowerBest("ccWer"),
    ccMwer:   lowerBest("ccMwer"),
    ptMwer:   lowerBest("ptMwer"),
    entity:   higherBest("entity"),
    voicebot: higherBest("voicebot"),
  };
}

const COLORS = buildColors(ROWS);

// ── Column header with optional tooltip ──────────────────────────────────────

function HeaderCell({
  label,
  sub,
  tooltip,
}: {
  label: string;
  sub?: string;
  tooltip?: string;
}) {
  return (
    <th
      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
      style={{ color: "var(--muted-foreground)", whiteSpace: "nowrap" }}
    >
      <span className="inline-flex items-center gap-1 justify-end">
        <span>
          {label}
          {sub && (
            <>
              <br />
              <span className="normal-case font-normal">{sub}</span>
            </>
          )}
        </span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="cursor-help rounded-full text-[11px] leading-none flex items-center justify-center"
                style={{ color: "var(--muted-foreground)" }}
                aria-label="More info"
              >
                ⓘ
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    </th>
  );
}

// ── Single table cell ─────────────────────────────────────────────────────────

function DataCell({
  value,
  colorStyle,
  suffix = "%",
}: {
  value: CellValue;
  colorStyle: React.CSSProperties;
  suffix?: string;
}) {
  const isSpecial = value === "TBD" || value === "N/A";
  return (
    <td
      className="px-4 py-3 text-right text-sm tabular-nums"
      style={isSpecial ? { color: "var(--muted-foreground)" } : colorStyle}
    >
      {isSpecial ? value : `${value}${suffix}`}
    </td>
  );
}

// ── Our Results metric reference data ────────────────────────────────────────

const OUR_METRICS = [
  {
    label: "Word Error Rate (WER)",
    name: "WER",
    description: "Percentage of words transcribed incorrectly relative to the reference transcript.",
    howMeasured: "Computed as (substitutions + deletions + insertions) / total reference words × 100.",
    goodThreshold: "< 20%",
  },
  {
    label: "Modified WER (mWER)",
    name: "mWER",
    description: "Modified WER adjusts traditional WER to better reflect clean-read transcription quality. It normalizes formatting differences like punctuation and capitalization, and reduces penalties for readability-oriented improvements such as disfluency removal.",
    howMeasured: "Standard WER applied after normalizing punctuation, casing, and common disfluencies.",
    goodThreshold: "< 8%",
  },
  {
    label: "Entity Score",
    name: "Entity Score",
    description: "A composite metric averaging three internal tests evaluating recognition of company names, product names, industry-specific jargon, and company identification at the start of a call where little surrounding context is available.",
    howMeasured: "Average accuracy across three entity-recognition test sets using real CCaaS audio.",
    goodThreshold: "> 85%",
  },
  {
    label: "Voicebot Low-Context Score",
    name: "Voicebot Score",
    description: "A composite metric averaging three voicebot-oriented tests: yes/no responses, spoken names, and spoken numbers. Measures recognition accuracy in short utterances where little surrounding context is available.",
    howMeasured: "Average accuracy across yes/no, spoken-name, and spoken-number test sets.",
    goodThreshold: "> 75%",
  },
];

// ── Our Results banner ────────────────────────────────────────────────────────

const TEAL = {
  accent: "#2dd4bf",
  bg: "rgba(45,212,191,0.15)",
  border: "rgba(45,212,191,0.3)",
};

function OurResultsBanner({ showMetricRef, onToggleMetricRef }: { showMetricRef: boolean; onToggleMetricRef: () => void }) {
  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl p-6 mb-6"
        style={{ background: "linear-gradient(135deg,#0a2e2e 0%,#0f4c4c 60%,#0a3d3d 100%)" }}
      >
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div
          className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle,${TEAL.accent},transparent)` }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: TEAL.bg, color: TEAL.accent, border: `1px solid ${TEAL.border}` }}
              >
                Internal
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">NiCE Internal STT Evaluation</h2>
            <p className="mt-1 text-sm max-w-2xl" style={{ color: "rgba(148,163,184,0.85)" }}>
              Results from internal testing against real contact center data, including telephony audio,
              business-specific entities, and voicebot use cases. These benchmarks are a more reliable
              signal for CCaaS performance than publicly available leaderboards.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onToggleMetricRef}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Info className="h-4 w-4" />
              {showMetricRef ? "Hide" : "Metric"} Reference
            </button>
          </div>
        </div>
      </div>

      {showMetricRef && (
        <Card className="glass-card border-0 mb-6">
          <CardContent className="p-0">
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: TEAL.accent }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Internal Evaluation Metrics Reference
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Metric</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Description</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>How Measured</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Good Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {OUR_METRICS.map((m) => (
                    <tr key={m.name} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{m.label}</span>
                        <span className="ml-1 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>({m.name})</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{m.description}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{m.howMeasured}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                          {m.goodThreshold}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ── Our Results table ─────────────────────────────────────────────────────────

function OurResultsTable() {
  return (
    <div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Model
                </th>
                <HeaderCell
                  label="C.C. English WER"
                  sub="↓ lower is better"
                />
                <HeaderCell
                  label="C.C. English mWER"
                  sub="↓ lower is better"
                  tooltip="Modified WER adjusts traditional WER to better reflect clean-read transcription quality. It normalizes formatting differences like punctuation and capitalization, and reduces penalties for readability-oriented improvements such as disfluency removal."
                />
                <HeaderCell
                  label="Portuguese mWER"
                  sub="↓ lower is better"
                  tooltip="Modified WER adjusts traditional WER to better reflect clean-read transcription quality. It normalizes formatting differences like punctuation and capitalization, and reduces penalties for readability-oriented improvements such as disfluency removal."
                />
                <HeaderCell
                  label="Entity Score"
                  sub="↑ higher is better"
                  tooltip="A composite metric averaging three internal tests evaluating recognition of company names, product names, industry-specific jargon, and company identification at the start of a call where little surrounding context is available."
                />
                <HeaderCell
                  label="Voicebot Low-Context Score"
                  sub="↑ higher is better"
                  tooltip="A composite metric averaging three voicebot-oriented tests: yes/no responses, spoken names, and spoken numbers. Measures recognition accuracy in short utterances where little surrounding context is available."
                />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.name}
                  style={{
                    background: row.isBaseline
                      ? "rgba(124,58,237,0.07)"
                      : i % 2 === 0
                      ? "transparent"
                      : "var(--secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    <span className="inline-flex items-center gap-2">
                      {row.name}
                      {row.isBaseline && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: "rgba(124,58,237,0.15)",
                            color: "#7c3aed",
                            border: "1px solid rgba(124,58,237,0.3)",
                          }}
                        >
                          baseline
                        </span>
                      )}
                    </span>
                  </td>
                  <DataCell value={row.ccWer}    colorStyle={cellColor(row.ccWer,    COLORS.ccWer.best,    COLORS.ccWer.worst)} />
                  <DataCell value={row.ccMwer}   colorStyle={cellColor(row.ccMwer,   COLORS.ccMwer.best,   COLORS.ccMwer.worst)} />
                  <DataCell value={row.ptMwer}   colorStyle={cellColor(row.ptMwer,   COLORS.ptMwer.best,   COLORS.ptMwer.worst)} />
                  <DataCell value={row.entity}   colorStyle={cellColor(row.entity,   COLORS.entity.best,   COLORS.entity.worst)} />
                  <DataCell value={row.voicebot} colorStyle={cellColor(row.voicebot, COLORS.voicebot.best, COLORS.voicebot.worst)} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p
        className="mt-3 text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        Latency and throughput data are excluded from this table as results are not yet fully normalized across all models.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function STTBenchmarksPage() {
  const [showMetricRef, setShowMetricRef] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Speech-to-Text Benchmarks
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            WER, mWER, entity recognition, and voicebot performance across leading STT models
          </p>
        </div>

        <Tabs defaultValue="our-results">
          <TabsList>
            <TabsTrigger value="our-results">Our Results</TabsTrigger>
            <TabsTrigger value="industry">Industry Benchmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="our-results" className="mt-4">
            <OurResultsBanner showMetricRef={showMetricRef} onToggleMetricRef={() => setShowMetricRef(v => !v)} />
            <OurResultsTable />
          </TabsContent>

          <TabsContent value="industry" className="mt-4">
            {/* Banner */}
            <div
              className="mb-4 flex gap-3 rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "var(--foreground)",
              }}
            >
              <span className="mt-0.5 shrink-0 text-base" style={{ color: "#3b82f6" }}>ℹ</span>
              <span>
                External benchmarks reflect performance on publicly available datasets and do not fully capture contact center conditions.
                For evaluation against real CCaaS tasks, see the{" "}
                <button
                  className="underline underline-offset-2 font-medium"
                  style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => {
                    const trigger = document.querySelector<HTMLButtonElement>('[data-radix-collection-item][value="our-results"]');
                    trigger?.click();
                  }}
                >
                  Our Results
                </button>{" "}
                tab.
              </span>
            </div>

            <BenchmarkTable
              type="STT"
              title="Speech-to-Text Benchmarks"
              description="WER, CER, RTF and latency rankings across leading STT vendors"
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
