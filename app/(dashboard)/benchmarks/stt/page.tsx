"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, TrendingUp } from "lucide-react";
import { STTIndustryBenchmarks } from "@/components/dashboard/stt-industry-benchmarks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ═══════════════════════════════════════════════════════════════════════════════
// OUR RESULTS — original data & components (restored exactly)
// ═══════════════════════════════════════════════════════════════════════════════

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
  { name: "Cohere Transcribe",                            ccWer: 17.7, ccMwer: 6.1,  ptMwer: "TBD", entity: "TBD", voicebot: "TBD" },
];

function numericValues(rows: ModelRow[], key: keyof ModelRow): number[] {
  return rows
    .map((r) => r[key])
    .filter((v): v is number => typeof v === "number");
}

function cellColor(value: CellValue, best: number, worst: number): React.CSSProperties {
  if (typeof value !== "number") return {};
  if (value === best)  return { color: "#16a34a", fontWeight: 600 };
  if (value === worst) return { color: "#dc2626", fontWeight: 600 };
  return {};
}

function buildColors(rows: ModelRow[]) {
  const nums = (key: keyof ModelRow) => numericValues(rows, key);
  const lowerBest = (key: keyof ModelRow) => { const vs = nums(key); return { best: Math.min(...vs), worst: Math.max(...vs) }; };
  const higherBest = (key: keyof ModelRow) => { const vs = nums(key); return { best: Math.max(...vs), worst: Math.min(...vs) }; };
  return {
    ccWer:    lowerBest("ccWer"),
    ccMwer:   lowerBest("ccMwer"),
    ptMwer:   lowerBest("ptMwer"),
    entity:   higherBest("entity"),
    voicebot: higherBest("voicebot"),
  };
}

const COLORS = buildColors(ROWS);

function HeaderCell({ label, sub, tooltip }: { label: string; sub?: string; tooltip?: string }) {
  return (
    <th
      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
      style={{ color: "var(--muted-foreground)", whiteSpace: "nowrap" }}
    >
      <span className="inline-flex items-center gap-1 justify-end">
        <span>
          {label}
          {sub && (<><br /><span className="normal-case font-normal">{sub}</span></>)}
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
            <TooltipContent className="max-w-xs text-xs leading-relaxed">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </th>
  );
}

function DataCell({ value, colorStyle, suffix = "%" }: { value: CellValue; colorStyle: React.CSSProperties; suffix?: string }) {
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

function OurResultsTable() {
  return (
    <div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  Model
                </th>
                <HeaderCell label="C.C. English WER"            sub="↓ lower is better" />
                <HeaderCell label="C.C. English mWER"           sub="↓ lower is better" tooltip="Modified WER adjusts traditional WER to better reflect clean-read transcription quality. It normalizes formatting differences like punctuation and capitalization, and reduces penalties for readability-oriented improvements such as disfluency removal." />
                <HeaderCell label="Portuguese mWER"             sub="↓ lower is better" tooltip="Modified WER adjusts traditional WER to better reflect clean-read transcription quality. It normalizes formatting differences like punctuation and capitalization, and reduces penalties for readability-oriented improvements such as disfluency removal." />
                <HeaderCell label="Entity Score"                sub="↑ higher is better" tooltip="A composite metric averaging three internal tests evaluating recognition of company names, product names, industry-specific jargon, and company identification at the start of a call where little surrounding context is available." />
                <HeaderCell label="Voicebot Low-Context Score"  sub="↑ higher is better" tooltip="A composite metric averaging three voicebot-oriented tests: yes/no responses, spoken names, and spoken numbers. Measures recognition accuracy in short utterances where little surrounding context is available." />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.name}
                  style={{
                    background: row.isBaseline ? "rgba(124,58,237,0.07)" : i % 2 === 0 ? "transparent" : "var(--secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    <span className="inline-flex items-center gap-2">
                      {row.name}
                      {row.isBaseline && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(124,58,237,0.15)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.3)" }}
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
      <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
        Latency and throughput data are excluded from this table as results are not yet fully normalized across all models.
      </p>
    </div>
  );
}

function OurResultsTab() {
  const [showMetricRef, setShowMetricRef] = useState(false);
  return (
    <>
      <OurResultsBanner showMetricRef={showMetricRef} onToggleMetricRef={() => setShowMetricRef(v => !v)} />
      <OurResultsTable />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// V11 DEEP DIVE — new tab
// ═══════════════════════════════════════════════════════════════════════════════

type ModeKey = "intermediate" | "efficient" | "low-latency";

interface AccuracyRow {
  tier: string;
  language: string;
  cvWER: string;
  ccMWER: string;
  ner: string;
  readability: string;
}

const ACCURACY_DATA: Record<ModeKey, AccuracyRow[]> = {
  intermediate: [
    { tier: "1", language: "NA-English",    cvWER: "13.9%", ccMWER: "5.9%",  ner: "93%", readability: "85%" },
    { tier: "2", language: "LA-Spanish",    cvWER: "6.4%",  ccMWER: "17.9%", ner: "86%", readability: "—"  },
    { tier: "2", language: "BR-Portuguese", cvWER: "9.3%",  ccMWER: "12.4%", ner: "91%", readability: "—"  },
    { tier: "2", language: "German",        cvWER: "9.0%",  ccMWER: "9.6%",  ner: "89%", readability: "—"  },
    { tier: "2", language: "Intl-English",  cvWER: "N/A",   ccMWER: "10.8%", ner: "90%", readability: "—"  },
    { tier: "3", language: "EU-French",     cvWER: "14.4%", ccMWER: "20.3%", ner: "—",   readability: "—"  },
    { tier: "3", language: "CA-French",     cvWER: "N/A",   ccMWER: "17.4%", ner: "—",   readability: "—"  },
    { tier: "3", language: "Italian",       cvWER: "9.3%",  ccMWER: "15.0%", ner: "—",   readability: "—"  },
    { tier: "3", language: "Japanese",      cvWER: "25.5%", ccMWER: "16.1%", ner: "—",   readability: "—"  },
    { tier: "4", language: "Korean",        cvWER: "8.3%",  ccMWER: "—",     ner: "—",   readability: "—"  },
    { tier: "4", language: "Mandarin (CN)", cvWER: "18.8%", ccMWER: "—",     ner: "—",   readability: "—"  },
    { tier: "4", language: "Dutch",         cvWER: "6.6%",  ccMWER: "—",     ner: "—",   readability: "—"  },
  ],
  efficient: [
    { tier: "1", language: "NA-English",    cvWER: "14.2%", ccMWER: "6.0%",  ner: "93%", readability: "86%" },
    { tier: "2", language: "LA-Spanish",    cvWER: "6.9%",  ccMWER: "16.4%", ner: "87%", readability: "—"  },
    { tier: "2", language: "BR-Portuguese", cvWER: "9.5%",  ccMWER: "11.4%", ner: "91%", readability: "—"  },
    { tier: "2", language: "German",        cvWER: "9.1%",  ccMWER: "9.3%",  ner: "90%", readability: "—"  },
    { tier: "2", language: "Intl-English",  cvWER: "N/A",   ccMWER: "9.8%",  ner: "91%", readability: "—"  },
    { tier: "3", language: "EU-French",     cvWER: "14.9%", ccMWER: "18.2%", ner: "—",   readability: "—"  },
    { tier: "3", language: "CA-French",     cvWER: "N/A",   ccMWER: "16.9%", ner: "—",   readability: "—"  },
    { tier: "3", language: "Italian",       cvWER: "9.9%",  ccMWER: "13.8%", ner: "—",   readability: "—"  },
    { tier: "3", language: "Japanese",      cvWER: "29.4%", ccMWER: "15.6%", ner: "—",   readability: "—"  },
    { tier: "4", language: "Korean",        cvWER: "10.3%", ccMWER: "—",     ner: "—",   readability: "—"  },
    { tier: "4", language: "Mandarin (CN)", cvWER: "18.9%", ccMWER: "—",     ner: "—",   readability: "—"  },
    { tier: "4", language: "Dutch",         cvWER: "7.1%",  ccMWER: "—",     ner: "—",   readability: "—"  },
  ],
  "low-latency": [
    { tier: "1", language: "NA-English",    cvWER: "14.7%", ccMWER: "6.2%",  ner: "93%", readability: "85%" },
    { tier: "2", language: "LA-Spanish",    cvWER: "6.8%",  ccMWER: "18.0%", ner: "86%", readability: "—"  },
    { tier: "2", language: "BR-Portuguese", cvWER: "9.9%",  ccMWER: "12.6%", ner: "92%", readability: "—"  },
    { tier: "2", language: "German",        cvWER: "9.5%",  ccMWER: "9.8%",  ner: "89%", readability: "—"  },
    { tier: "2", language: "Intl-English",  cvWER: "N/A",   ccMWER: "11.0%", ner: "90%", readability: "—"  },
    { tier: "3", language: "EU-French",     cvWER: "15.1%", ccMWER: "21.3%", ner: "—",   readability: "—"  },
    { tier: "3", language: "CA-French",     cvWER: "N/A",   ccMWER: "17.5%", ner: "—",   readability: "—"  },
    { tier: "3", language: "Italian",       cvWER: "9.7%",  ccMWER: "15.0%", ner: "—",   readability: "—"  },
    { tier: "3", language: "Japanese",      cvWER: "25.8%", ccMWER: "15.6%", ner: "—",   readability: "—"  },
    { tier: "4", language: "Korean",        cvWER: "8.3%",  ccMWER: "—",     ner: "—",   readability: "—"  },
    { tier: "4", language: "Mandarin (CN)", cvWER: "18.8%", ccMWER: "—",     ner: "—",   readability: "—"  },
    { tier: "4", language: "Dutch",         cvWER: "6.6%",  ccMWER: "—",     ner: "—",   readability: "—"  },
  ],
};

const IMPROVEMENT_DATA = [
  { language: "NA-English",    ccImprovement: "13%", cvImprovement: "—"   },
  { language: "LA-Spanish",    ccImprovement: "33%", cvImprovement: "30%" },
  { language: "BR-Portuguese", ccImprovement: "60%", cvImprovement: "29%" },
  { language: "German",        ccImprovement: "28%", cvImprovement: "26%" },
  { language: "French",        ccImprovement: "15%", cvImprovement: "10%" },
  { language: "Japanese",      ccImprovement: "TBD", cvImprovement: "TBD" },
  { language: "Italian",       ccImprovement: "TBD", cvImprovement: "20%" },
];

const LANGUAGE_TIERS = [
  { tier: "1", color: "#f59e0b", languages: [{ name: "NA-English", since: "v11.0" }] },
  {
    tier: "2", color: "#0d9488",
    languages: [
      { name: "LA-Spanish",    since: "v11.1" },
      { name: "BR-Portuguese", since: "v11.1" },
      { name: "German",        since: "v11.1" },
      { name: "Intl-English",  since: "v11.1" },
    ],
  },
  {
    tier: "3", color: "#7c3aed",
    languages: [
      { name: "EU-French", since: "v11.2.2" },
      { name: "CA-French", since: "v11.2.2" },
      { name: "Italian",   since: "v11.2.2" },
      { name: "Japanese",  since: "v11.2.2" },
    ],
  },
  {
    tier: "4", color: "#64748b",
    languages: [
      { name: "Korean",      since: "v11.3" },
      { name: "Mandarin CN", since: "v11.3" },
      { name: "Dutch",       since: "v11.3" },
    ],
  },
];

function improvementColor(val: string): string {
  if (val === "TBD" || val === "—") return "var(--muted-foreground)";
  return "#10b981";
}

function tierBgRgb(tier: string): string {
  if (tier === "1") return "245,158,11";
  if (tier === "2") return "13,148,136";
  if (tier === "3") return "124,58,237";
  return "100,116,139";
}

function tierFgColor(tier: string): string {
  if (tier === "1") return "#f59e0b";
  if (tier === "2") return "#0d9488";
  if (tier === "3") return "#7c3aed";
  return "#64748b";
}

function V11DeepDiveTab() {
  const [activeMode, setActiveMode] = useState<ModeKey>("intermediate");

  const modeLabels: Record<ModeKey, string> = {
    "low-latency": "Low-Latency",
    intermediate:  "Intermediate",
    efficient:     "Most Efficient",
  };

  const rows = ACCURACY_DATA[activeMode];

  return (
    <div className="space-y-8">

      {/* Section 1 — Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg,#060f2e 0%,#0d3d4a 60%,#0a2e3a 100%)" }}
      >
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#0d9488,transparent)" }} />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: "rgba(13,148,136,0.15)", color: "#2dd4bf", border: "1px solid rgba(13,148,136,0.3)" }}
              >
                NiCE Internal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">NiCE Transcription v11</h1>
            <p className="mt-1 text-sm max-w-xl" style={{ color: "rgba(148,163,184,0.85)" }}>
              Enterprise-grade ASR built on Whisper Turbo with deep NiCE customization, optimized for contact center and voicebot workloads
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/standards"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Info className="h-4 w-4" />
              Metric Reference
            </Link>
          </div>
        </div>
      </div>

      {/* Section 2 — Headline Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { value: "5.9%",   label: "NA-English Contact Center mWER" },
          { value: "60%",    label: "Error Reduction vs Whisper Turbo (BR-Portuguese)" },
          { value: "<300ms", label: "Latency in Low-Latency Mode" },
          { value: "13",     label: "Languages Supported Today" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card border-0">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-3xl font-bold tracking-tight" style={{ color: "#2dd4bf" }}>{stat.value}</span>
              <span className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 3 — Operating Modes */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>Operating Modes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Low-Latency Mode",    description: "Tuned for real-time voicebot interactions where response speed is critical",                                                                       latency: "Lowest",  latencyColor: "#10b981", cost: "Highest", costColor: "#ef4444", bestFor: "Voice-bot",                 costPerHour: "$0.01239/call-hr", note: "Assumes processing of customer channel only, excluding the bot channel." },
            { title: "Intermediate Mode",   description: "Standard real-time ASR for live agent-facing use cases where text must appear as the conversation happens",                                        latency: "Medium",  latencyColor: "#f59e0b", cost: "Medium",  costColor: "#f59e0b", bestFor: "Agent Copilot",             costPerHour: "$0.01062/call-hr", note: null },
            { title: "Most Efficient Mode", description: "Optimized for minimum compute with no real-time constraint. Ideal where cost efficiency matters more than speed",                                  latency: "Highest", latencyColor: "#ef4444", cost: "Lowest",  costColor: "#10b981", bestFor: "Post-Call QA & Analytics", costPerHour: "$0.00249/call-hr", note: null },
          ].map((mode) => (
            <Card key={mode.title} className="glass-card border-0">
              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{mode.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{mode.description}</p>
                </div>
                <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  {[
                    { label: "Latency",              value: mode.latency,     color: mode.latencyColor,   tooltip: undefined },
                    { label: "Cost",                 value: mode.cost,        color: mode.costColor,      tooltip: undefined },
                    { label: "Est. Cost / Audio Hr", value: mode.costPerHour, color: "var(--foreground)", tooltip: "Compute cost per call-hour. Based on AWS instance cost divided by an efficiency factor (accounting for idle time), spread across stream capacity. Excludes fixed infrastructure costs." },
                    { label: "Best For",             value: mode.bestFor,     color: "var(--foreground)", tooltip: undefined },
                  ].map((attr) => (
                    <div key={attr.label} className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        {attr.label}
                        {attr.tooltip && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help" style={{ color: "var(--muted-foreground)" }} aria-label="More info">ⓘ</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed">{attr.tooltip}</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                      <span className="font-semibold" style={{ color: attr.color }}>{attr.value}</span>
                    </div>
                  ))}
                </div>
                {mode.note && (
                  <p className="text-xs italic pt-1" style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)" }}>
                    {mode.note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Cost caveat */}
        <p className="mt-3 text-xs italic" style={{ color: "var(--muted-foreground)" }}>
          * Estimated costs represent compute cost only and do not include fixed infrastructure costs.
        </p>
      </div>

      {/* Section 4 — Accuracy Results by Mode */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Accuracy Results by Mode</h2>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {(["low-latency", "intermediate", "efficient"] as ModeKey[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeMode === mode
                  ? { background: "linear-gradient(135deg,#0d9488,#0891b2)", color: "#fff" }
                  : { color: "var(--muted-foreground)" }
                }
              >
                {modeLabels[mode]}
              </button>
            ))}
          </div>
        </div>
        <Card className="glass-card border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(13,148,136,0.03)" }}>
                  {["Tier", "Language", "Common Voice WER", "Contact Center mWER", "NER Score", "Readability"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.language} style={{ borderBottom: idx < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center justify-center rounded-full h-6 w-6 text-xs font-bold"
                        style={{ background: `rgba(${tierBgRgb(row.tier)},0.15)`, color: tierFgColor(row.tier) }}
                      >
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.language}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: row.cvWER === "—" || row.cvWER === "N/A" ? "var(--muted-foreground)" : "var(--foreground)" }}>{row.cvWER}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: row.ccMWER === "—" || row.ccMWER === "N/A" ? "var(--muted-foreground)" : "var(--foreground)" }}>{row.ccMWER}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: row.ner === "—" || row.ner === "N/A" ? "var(--muted-foreground)" : "var(--foreground)" }}>{row.ner}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: row.readability === "—" || row.readability === "N/A" ? "var(--muted-foreground)" : "var(--foreground)" }}>{row.readability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)", background: "rgba(13,148,136,0.02)" }}>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} />
                Lower is better (WER/mWER) · Higher is better (NER/Readability)
              </span>
            </div>
            <Link href="/standards" className="text-xs font-medium hover:underline" style={{ color: "#2dd4bf" }}>
              How we measure →
            </Link>
          </div>
        </Card>
      </div>

      {/* Section 5 — Improvement vs Whisper Turbo */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>What NiCE Engineering Added</h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>Percentage error reduction of v11 over base Whisper Turbo model</p>
        </div>
        <Card className="glass-card border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(13,148,136,0.03)" }}>
                  {["Language", "CC Data Improvement", "Common Voice Improvement"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IMPROVEMENT_DATA.map((row, idx) => (
                  <tr key={row.language} style={{ borderBottom: idx < IMPROVEMENT_DATA.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.language}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: improvementColor(row.ccImprovement) }}>{row.ccImprovement}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: improvementColor(row.cvImprovement) }}>{row.cvImprovement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Section 6 — Language Coverage */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>Language Coverage</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="glass-card border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Currently Supported</h3>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(13,148,136,0.15)", color: "#2dd4bf", border: "1px solid rgba(13,148,136,0.25)" }}>
                  13 languages
                </span>
              </div>
              <div className="space-y-4">
                {LANGUAGE_TIERS.map((tier) => (
                  <div key={tier.tier}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{ background: `rgba(${tierBgRgb(tier.tier)},0.15)`, color: tier.color, border: `1px solid ${tier.color}40` }}
                      >
                        Tier {tier.tier}
                      </span>
                    </div>
                    <div className="space-y-1 pl-1">
                      {tier.languages.map((lang) => (
                        <div key={lang.name} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "var(--foreground)" }}>{lang.name}</span>
                          <span className="font-mono text-xs rounded px-1.5 py-0.5" style={{ background: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                            {lang.since}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                  <span className="font-medium" style={{ color: "#64748b" }}>Cantonese (CN)</span>{" "}
                  — Tier 4, Not Approved, not currently supported
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Roadmap</h3>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {[
                  { version: "v11.4", count: 11 },
                  { version: "v11.5", count: 19 },
                  { version: "v11.6", count: 16 },
                  { version: "v11.7", count: 7  },
                ].map((row, idx, arr) => (
                  <div
                    key={row.version}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                    style={{ borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <span className="font-mono text-xs font-semibold" style={{ color: "#2dd4bf" }}>{row.version}</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span className="font-semibold" style={{ color: "var(--foreground)" }}>{row.count}</span> languages planned
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Language counts reflect current planning and may shift based on testing outcomes and delivery priorities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function STTBenchmarksPage() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Speech-to-Text Benchmarks
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            WER, mWER, entity recognition, and voicebot performance across leading STT models
          </p>
        </div>

        <Tabs defaultValue="v11">
          <TabsList>
            <TabsTrigger value="v11">V11 Deep Dive</TabsTrigger>
            <TabsTrigger value="our-results">Our Results</TabsTrigger>
            <TabsTrigger value="industry">Industry Benchmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="v11" className="mt-4">
            <V11DeepDiveTab />
          </TabsContent>

          <TabsContent value="our-results" className="mt-4">
            <OurResultsTab />
          </TabsContent>

          <TabsContent value="industry" className="mt-4">
            <STTIndustryBenchmarks />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
