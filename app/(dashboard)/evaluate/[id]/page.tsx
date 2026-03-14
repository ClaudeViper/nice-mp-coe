"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  BarChart3,
  Info,
  Download,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Grid3X3,
  Activity,
  FileText,
  TableProperties,
} from "lucide-react";
import {
  findMetric,
  evaluateMetric,
  METRIC_COLORS,
  METRIC_DOT_COLORS,
} from "@/lib/metrics";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SampleResult {
  id: string;
  metricName: string;
  metricValue: string;
  metricUnit: string;
  sampleId: string | null;
  details: Record<string, unknown> | null;
}

interface EvaluationDetail {
  id: string;
  evaluationType: string;
  modelName: string;
  status: string;
  config: Record<string, unknown>;
  dataset: string;
  language: string;
  totalSamples: number;
  processedSamples: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  vendor: { name: string; slug: string };
  results: SampleResult[];
}

// ─── Cost Calculator Rates ────────────────────────────────────────────────────

const COST_RATES: Record<string, { perMinute?: number; perChar?: number; perRequest: number }> = {
  STT: { perMinute: 0.006, perRequest: 0.001 },
  TTS: { perChar: 0.000016, perRequest: 0.001 },
  V2V: { perMinute: 0.025, perRequest: 0.005 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const RATING_STYLES = {
  good: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", dot: "#10b981" },
  warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", dot: "#f59e0b" },
  poor: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", dot: "#ef4444" },
};

function MetricCard({
  name,
  value,
  unit,
  evalType,
}: {
  name: string;
  value: string;
  unit: string;
  evalType: string;
}) {
  const numVal = parseFloat(value);
  const rating = evaluateMetric(name, numVal, evalType);
  const def = findMetric(name, evalType);
  const [showTooltip, setShowTooltip] = useState(false);
  const rs = RATING_STYLES[rating];

  return (
    <div className="rounded-xl p-4" style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: rs.color }}>{def ? def.label : name}</p>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: rs.dot }} />
          {def && (
            <span
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="h-3 w-3 cursor-help" style={{ color: rs.color, opacity: 0.6 }} />
              {showTooltip && (
                <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl p-3 shadow-xl text-left" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{def.description}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span className="font-semibold">Threshold:</span>{" "}
                    <span style={{ color: "#10b981" }}>{def.goodThreshold}</span>
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span className="font-semibold">Measured:</span> {def.howMeasured}
                  </p>
                </div>
              )}
            </span>
          )}
        </div>
      </div>
      <p className="mt-1 text-2xl font-bold" style={{ color: rs.color }}>
        {value}
        <span className="ml-1 text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>{unit}</span>
      </p>
      {def && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Threshold: {def.goodThreshold}</p>
      )}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
        <span>{current} / {total} samples</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00d4e8,#7c3aed)" }}
        />
      </div>
    </div>
  );
}

// ─── Radar Chart (pure SVG, no external deps) ────────────────────────────────

function MetricsRadarChart({
  metrics,
  evalType,
}: {
  metrics: SampleResult[];
  evalType: string;
}) {
  const radarData = metrics.map((m) => {
    const v = parseFloat(m.metricValue);
    const def = findMetric(m.metricName, evalType);
    const label = def?.label ?? m.metricName;
    let normalized = v;
    const lowerIsBetter = ["WER", "CER", "avg_latency", "RTF", "TTFB", "roundtrip_WER", "e2e_latency"].includes(m.metricName);
    if (lowerIsBetter) {
      if (m.metricUnit === "%") normalized = Math.max(0, 100 - v * 2);
      else if (m.metricUnit === "ms") normalized = Math.max(0, 100 - v / 30);
      else normalized = Math.max(0, 100 - v * 50);
    } else if (m.metricName === "MOS") {
      normalized = (v / 5) * 100;
    }
    return { label, value: Math.min(100, Math.max(0, Math.round(normalized))), raw: v, unit: m.metricUnit };
  });

  if (radarData.length === 0) return null;

  const cx = 160;
  const cy = 140;
  const r = 100;
  const n = radarData.length;
  const [hovered, setHovered] = useState<number | null>(null);

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const ptOf = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angleOf(i)),
    y: cy + radius * Math.sin(angleOf(i)),
  });

  // Grid rings at 25, 50, 75, 100
  const rings = [25, 50, 75, 100];
  const gridPoints = (frac: number) =>
    Array.from({ length: n }, (_, i) => ptOf(i, r * frac / 100))
      .map((p) => `${p.x},${p.y}`)
      .join(" ");

  // Data polygon
  const dataPoly = radarData
    .map((d, i) => ptOf(i, r * d.value / 100))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="relative" style={{ width: "100%", height: 280 }}>
      <svg viewBox="0 0 320 280" style={{ width: "100%", height: "100%" }}>
        {/* Grid rings */}
        {rings.map((frac) => (
          <polygon
            key={frac}
            points={gridPoints(frac)}
            fill="none"
            stroke="rgba(0,212,232,0.12)"
            strokeWidth="1"
          />
        ))}
        {/* Spokes */}
        {radarData.map((_, i) => {
          const outer = ptOf(i, r);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(0,212,232,0.1)" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        <polygon points={dataPoly} fill="rgba(0,212,232,0.15)" stroke="#00d4e8" strokeWidth="2" />
        {/* Data points */}
        {radarData.map((d, i) => {
          const pt = ptOf(i, r * d.value / 100);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hovered === i ? 5 : 3.5}
              fill="#00d4e8"
              stroke="#0c1e4a"
              strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Labels */}
        {radarData.map((d, i) => {
          const labelR = r + 22;
          const pt = ptOf(i, labelR);
          const angle = (angleOf(i) * 180) / Math.PI;
          const anchor = angle > 10 && angle < 170 ? "middle" : angle >= 170 || angle <= -170 ? "end" : angle < 10 && angle > -10 ? "middle" : "start";
          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y}
              textAnchor={
                Math.abs(Math.cos(angleOf(i))) < 0.2 ? "middle"
                  : Math.cos(angleOf(i)) < 0 ? "end" : "start"
              }
              dominantBaseline="middle"
              fontSize="9"
              fill={hovered === i ? "#00d4e8" : "#94a3b8"}
              fontWeight={hovered === i ? "600" : "400"}
            >
              {d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label}
            </text>
          );
        })}
        {/* Tooltip */}
        {hovered !== null && radarData[hovered] && (() => {
          const d = radarData[hovered]!;
          const pt = ptOf(hovered, r * d.value / 100);
          const tx = pt.x > 200 ? pt.x - 90 : pt.x + 8;
          const ty = pt.y > 200 ? pt.y - 36 : pt.y - 10;
          return (
            <g>
              <rect x={tx} y={ty} width={86} height={30} rx="5" fill="#0c1e4a" stroke="rgba(0,212,232,0.3)" strokeWidth="1" />
              <text x={tx + 43} y={ty + 11} textAnchor="middle" fontSize="9" fill="#94a3b8">{d.label}</text>
              <text x={tx + 43} y={ty + 22} textAnchor="middle" fontSize="10" fill="#00d4e8" fontWeight="600">{d.value}/100</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Time-Series Chart (pure SVG, no external deps) ──────────────────────────

function PerSampleTimeSeriesChart({
  sampleResults,
  evalType,
}: {
  sampleResults: SampleResult[];
  evalType: string;
}) {
  const primaryMetric =
    evalType === "STT" ? "sample_wer" :
    evalType === "TTS" ? "sample_mos" :
    "sample_task_completion";

  const filtered = sampleResults
    .filter((r) => r.metricName === primaryMetric)
    .map((r, i) => ({
      value: parseFloat(r.metricValue),
      label: r.sampleId?.replace(/^(clean|noisy|ivr|agent|support|ivr-s)-/, "") ?? `${i + 1}`,
    }));

  if (filtered.length === 0) return null;

  const metricLabel =
    evalType === "STT" ? "WER (%)" :
    evalType === "TTS" ? "MOS Score" :
    "Task Completion (%)";

  const color = evalType === "STT" ? "#8b5cf6" : evalType === "TTS" ? "#14b8a6" : "#f97316";

  const [hovered, setHovered] = useState<number | null>(null);

  const W = 480;
  const H = 180;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const values = filtered.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const xOf = (i: number) => padL + (i / Math.max(filtered.length - 1, 1)) * plotW;
  const yOf = (v: number) => padT + plotH - ((v - minV) / range) * plotH;

  const pathD = filtered
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(d.value).toFixed(1)}`)
    .join(" ");

  // Y-axis tick labels (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({
    v: minV + f * range,
    y: padT + plotH - f * plotH,
  }));

  // X-axis tick labels — show at most 8
  const step = Math.max(1, Math.floor(filtered.length / 8));
  const xTicks = filtered
    .map((d, i) => ({ label: d.label, x: xOf(i), i }))
    .filter((_, i) => i % step === 0 || i === filtered.length - 1);

  return (
    <div style={{ position: "relative", width: "100%", height: 220 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
        {/* Grid lines */}
        {yTicks.map((t) => (
          <line key={t.v} x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="rgba(0,212,232,0.08)" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        {/* Y-axis labels */}
        {yTicks.map((t) => (
          <text key={t.v} x={padL - 4} y={t.y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#64748b">
            {t.v.toFixed(1)}
          </text>
        ))}
        {/* X-axis labels */}
        {xTicks.map((t) => (
          <text key={t.i} x={t.x} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748b">
            {t.label.length > 6 ? t.label.slice(0, 5) + "…" : t.label}
          </text>
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Area fill */}
        <path
          d={`${pathD} L ${xOf(filtered.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${xOf(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`}
          fill={color}
          fillOpacity="0.08"
        />
        {/* Dots */}
        {filtered.map((d, i) => (
          <circle
            key={i}
            cx={xOf(i)}
            cy={yOf(d.value)}
            r={hovered === i ? 5 : 2.5}
            fill={color}
            stroke="#0c1e4a"
            strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {/* Tooltip */}
        {hovered !== null && filtered[hovered] && (() => {
          const d = filtered[hovered]!;
          const tx = Math.min(xOf(hovered) + 6, W - 90);
          const ty = Math.max(yOf(d.value) - 36, padT);
          return (
            <g>
              <rect x={tx} y={ty} width={84} height={30} rx="5" fill="#0c1e4a" stroke={`${color}66`} strokeWidth="1" />
              <text x={tx + 42} y={ty + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">{d.label}</text>
              <text x={tx + 42} y={ty + 22} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">{d.value.toFixed(2)}</text>
            </g>
          );
        })()}
      </svg>
      <div style={{ position: "absolute", bottom: 2, right: 8, fontSize: 10, color: "#64748b" }}>{metricLabel}</div>
    </div>
  );
}

// ─── Comparison Heatmap ───────────────────────────────────────────────────────

interface HeatmapCell {
  label: string;
  value: number;
  unit: string;
  rating: "good" | "warning" | "poor";
}

function ComparisonHeatmap({
  metrics,
  evalType,
}: {
  metrics: SampleResult[];
  evalType: string;
}) {
  // Industry reference benchmarks for comparison matrix
  const INDUSTRY_REFS: Record<string, Record<string, number>> = {
    STT: {
      WER: 5, CER: 2, avg_latency: 400, RTF: 0.1,
    },
    TTS: {
      MOS: 4.2, naturalness: 85, TTFB: 250, roundtrip_WER: 5,
    },
    V2V: {
      task_completion_rate: 90, e2e_latency: 1200, naturalness: 80,
      persona_consistency: 85, interruption_handling: 80,
    },
  };

  const refs = INDUSTRY_REFS[evalType] ?? {};

  const rows: { name: string; cells: HeatmapCell[] }[] = [
    {
      name: "This Evaluation",
      cells: metrics.map((m) => ({
        label: findMetric(m.metricName, evalType)?.label ?? m.metricName,
        value: parseFloat(m.metricValue),
        unit: m.metricUnit,
        rating: evaluateMetric(m.metricName, parseFloat(m.metricValue), evalType),
      })),
    },
    {
      name: "Industry Avg",
      cells: metrics.map((m) => {
        const refVal = refs[m.metricName] ?? parseFloat(m.metricValue);
        return {
          label: findMetric(m.metricName, evalType)?.label ?? m.metricName,
          value: refVal,
          unit: m.metricUnit,
          rating: evaluateMetric(m.metricName, refVal, evalType),
        };
      }),
    },
  ];

  const bgMap = {
    good: { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.25)" },
    warning: { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
    poor: { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide w-32" style={{ color: "var(--muted-foreground)" }}>Source</th>
            {rows[0]?.cells.map((c) => (
              <th key={c.label} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide min-w-24" style={{ color: "var(--muted-foreground)" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ borderBottom: "1px solid var(--border)" }}>
              <td className="py-2.5 pr-4 text-xs font-semibold" style={{ color: "var(--foreground)" }}>{row.name}</td>
              {row.cells.map((cell) => {
                const s = bgMap[cell.rating];
                return (
                  <td key={cell.label} className="px-3 py-2.5 text-center">
                    <span className="inline-block rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: s.background, color: s.color, border: `1px solid ${s.border}` }}>
                      {cell.value.toFixed(2)} {cell.unit}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cost Calculator ──────────────────────────────────────────────────────────

function CostCalculator({
  evalType,
  totalSamples,
  metrics,
}: {
  evalType: string;
  totalSamples: number;
  metrics: SampleResult[];
}) {
  const [volume, setVolume] = useState(10000);
  const rates = COST_RATES[evalType] ?? { perMinute: 0.01, perRequest: 0.001 };

  // Estimate avg duration/chars from metrics
  const avgLatencyResult = metrics.find((m) => m.metricName === "avg_latency" || m.metricName === "TTFB");
  const avgDurationMin = avgLatencyResult ? parseFloat(avgLatencyResult.metricValue) / 1000 / 60 : 0.067; // ~4s default

  let monthlyCost = 0;
  let perUnitLabel = "";
  let perUnitCost = 0;

  if (evalType === "STT") {
    perUnitCost = (rates.perMinute ?? 0.006) * avgDurationMin + rates.perRequest;
    perUnitLabel = "per audio clip";
    monthlyCost = perUnitCost * volume;
  } else if (evalType === "TTS") {
    const avgChars = 120; // average chars per TTS prompt
    perUnitCost = (rates.perChar ?? 0.000016) * avgChars + rates.perRequest;
    perUnitLabel = "per synthesis";
    monthlyCost = perUnitCost * volume;
  } else {
    perUnitCost = (rates.perMinute ?? 0.025) * 3 + rates.perRequest; // ~3 min per V2V call
    perUnitLabel = "per conversation";
    monthlyCost = perUnitCost * volume;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            Monthly Volume ({evalType} {perUnitLabel.replace("per ", "")})
          </label>
          <input
            type="range"
            min={1000}
            max={1000000}
            step={1000}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            <span>1K</span>
            <span className="font-semibold" style={{ color: "#00d4e8" }}>{volume.toLocaleString()}</span>
            <span>1M</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Unit Cost</p>
          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>${perUnitCost.toFixed(4)}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{perUnitLabel}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.25)" }}>
          <p className="text-xs" style={{ color: "#00d4e8" }}>Monthly Est.</p>
          <p className="text-lg font-bold" style={{ color: "#00d4e8" }}>
            ${monthlyCost < 1000 ? monthlyCost.toFixed(2) : (monthlyCost / 1000).toFixed(1) + "K"}
          </p>
          <p className="text-xs" style={{ color: "rgba(0,212,232,0.7)" }}>{volume.toLocaleString()} units</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Annual Est.</p>
          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            ${(monthlyCost * 12) < 1000
              ? (monthlyCost * 12).toFixed(2)
              : ((monthlyCost * 12) / 1000).toFixed(1) + "K"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>no volume discount</p>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
        * Estimates based on simulated evaluation metrics. Actual vendor pricing varies.
        Evaluated dataset: {totalSamples} samples processed.
      </p>
    </div>
  );
}

// ─── Per-Sample Expandable Table ──────────────────────────────────────────────

function SampleRow({ result, evalType }: { result: SampleResult; evalType: string }) {
  const [expanded, setExpanded] = useState(false);
  const numVal = parseFloat(result.metricValue);
  const rating = evaluateMetric(result.metricName, numVal, evalType);

  return (
    <>
      <tr className="transition-colors hover:bg-secondary/30" style={{ borderBottom: "1px solid var(--border)" }}>
        <td className="px-4 py-2">
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ color: "var(--muted-foreground)" }}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-2 font-mono text-xs" style={{ color: "#00d4e8" }}>{result.sampleId}</td>
        <td className="px-4 py-2 text-sm" style={{ color: "var(--foreground)" }}>
          {findMetric(result.metricName, evalType)?.label ?? result.metricName}
        </td>
        <td className="px-4 py-2 font-semibold text-sm" style={{ color: "var(--foreground)" }}>
          {result.metricValue} {result.metricUnit}
        </td>
        <td className="px-4 py-2">
          {(() => {
            const rs = RATING_STYLES[rating];
            return (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: rs.dot }} />
                {rating}
              </span>
            );
          })()}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-0.5 h-4">
              {[2, 4, 3, 5, 4, 2, 3].map((h, i) => (
                <div key={i} className="w-1 rounded-sm" style={{ height: `${h * 3}px`, background: rating === "good" ? "#10b981" : rating === "warning" ? "#f59e0b" : "#ef4444" }} />
              ))}
            </div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Audio</span>
          </div>
        </td>
      </tr>
      {expanded && result.details && (
        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--secondary)" }}>
          <td colSpan={6} className="px-8 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(result.details).map(([k, v]) => (
                <div key={k} className="rounded-xl px-3 py-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <p className="uppercase text-xs font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k.replace(/_/g, " ")}</p>
                  <p className="font-mono font-semibold" style={{ color: "var(--foreground)" }}>
                    {typeof v === "number" ? v.toFixed(3) : String(v)}
                  </p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

function exportCSV(evaluation: EvaluationDetail, aggregateResults: SampleResult[], sampleResults: SampleResult[]) {
  const lines = ["Metric,Value,Unit,Rating"];
  for (const r of aggregateResults) {
    const rating = evaluateMetric(r.metricName, parseFloat(r.metricValue), evaluation.evaluationType);
    lines.push(`${r.metricName},${r.metricValue},${r.metricUnit},${rating}`);
  }
  lines.push("");
  lines.push("SampleId,Metric,Value,Unit,Rating");
  for (const r of sampleResults) {
    const rating = evaluateMetric(r.metricName, parseFloat(r.metricValue), evaluation.evaluationType);
    lines.push(`${r.sampleId},${r.metricName},${r.metricValue},${r.metricUnit},${rating}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eval-${evaluation.vendor.name}-${evaluation.modelName}-${evaluation.evaluationType}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(evaluation: EvaluationDetail, aggregateResults: SampleResult[], sampleResults: SampleResult[]) {
  const data = {
    id: evaluation.id,
    vendor: evaluation.vendor.name,
    model: evaluation.modelName,
    type: evaluation.evaluationType,
    dataset: evaluation.dataset,
    language: evaluation.language,
    status: evaluation.status,
    startedAt: evaluation.startedAt,
    completedAt: evaluation.completedAt,
    metrics: aggregateResults.map((r) => ({
      name: r.metricName,
      value: r.metricValue,
      unit: r.metricUnit,
      rating: evaluateMetric(r.metricName, parseFloat(r.metricValue), evaluation.evaluationType),
    })),
    samples: sampleResults.map((r) => ({
      sampleId: r.sampleId,
      metric: r.metricName,
      value: r.metricValue,
      unit: r.metricUnit,
      details: r.details,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eval-${evaluation.vendor.name}-${evaluation.modelName}-${evaluation.evaluationType}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Simple print-to-PDF using window.print
function exportPDF() {
  window.print();
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = "overview" | "per-sample" | "heatmap" | "cost";

export default function EvaluationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations/${id}`);
      if (!res.ok) throw new Error(await res.text());
      setEvaluation(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (evaluation?.status !== "Running") return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [evaluation?.status, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#00d4e8" }} />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-4">
        <Link href="/evaluate" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00d4e8" }}>
          <ArrowLeft className="h-4 w-4" /> Back to Evaluations
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          <span style={{ color: "#ef4444" }}>{error ?? "Evaluation not found"}</span>
        </div>
      </div>
    );
  }

  const aggregateResults = evaluation.results.filter((r) => !r.sampleId);
  const sampleResults = evaluation.results.filter((r) => r.sampleId);

  // Count pass/warning/fail
  const summary = aggregateResults.reduce(
    (acc, r) => {
      const rating = evaluateMetric(r.metricName, parseFloat(r.metricValue), evaluation.evaluationType);
      acc[rating]++;
      return acc;
    },
    { good: 0, warning: 0, poor: 0 }
  );

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Activity className="h-4 w-4" /> },
    { key: "per-sample", label: `Per-Sample (${sampleResults.length})`, icon: <TableProperties className="h-4 w-4" /> },
    { key: "heatmap", label: "Comparison", icon: <Grid3X3 className="h-4 w-4" /> },
    { key: "cost", label: "Cost Calculator", icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5 print:space-y-4">
      {/* Back nav */}
      <Link href="/evaluate" className="inline-flex items-center gap-1.5 text-sm font-medium print:hidden" style={{ color: "#00d4e8" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Evaluations
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "linear-gradient(135deg,#060f2e 0%,#102356 60%,#0c1e4a 100%)" }}>
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">
                {evaluation.vendor.name} — {evaluation.modelName}
              </h1>
              {(() => {
                const typeColors: Record<string, { color: string; bg: string; border: string }> = {
                  STT: { color: "#7c3aed", bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.3)" },
                  TTS: { color: "#00d4e8", bg: "rgba(0,212,232,0.15)", border: "rgba(0,212,232,0.3)" },
                  V2V: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
                };
                const ts = typeColors[evaluation.evaluationType] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.3)" };
                return (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                    {evaluation.evaluationType}
                  </span>
                );
              })()}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm" style={{ color: "rgba(148,163,184,0.9)" }}>
              <span className="flex items-center gap-1">
                {evaluation.status === "Completed" && <CheckCircle2 className="h-4 w-4" style={{ color: "#10b981" }} />}
                {evaluation.status === "Running" && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#00d4e8" }} />}
                {evaluation.status === "Failed" && <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />}
                {evaluation.status === "Pending" && <Clock className="h-4 w-4" style={{ color: "#f59e0b" }} />}
                <span style={{ color: evaluation.status === "Completed" ? "#10b981" : evaluation.status === "Running" ? "#00d4e8" : evaluation.status === "Failed" ? "#ef4444" : "#f59e0b" }}>
                  {evaluation.status}
                </span>
              </span>
              <span>{evaluation.dataset}</span>
              <span>Lang: {evaluation.language.toUpperCase()}</span>
              {evaluation.completedAt && (
                <span>{new Date(evaluation.completedAt).toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 print:hidden">
            {[
              { label: "PDF", icon: <FileText className="h-3.5 w-3.5" />, onClick: exportPDF },
              { label: "CSV", icon: <Download className="h-3.5 w-3.5" />, onClick: () => exportCSV(evaluation, aggregateResults, sampleResults) },
              { label: "JSON", icon: <Download className="h-3.5 w-3.5" />, onClick: () => exportJSON(evaluation, aggregateResults, sampleResults) },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar (running) */}
      {evaluation.status === "Running" && (
        <ProgressBar current={evaluation.processedSamples} total={evaluation.totalSamples} />
      )}

      {/* Error message */}
      {evaluation.errorMessage && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          <span style={{ color: "#ef4444" }}>{evaluation.errorMessage}</span>
        </div>
      )}

      {/* Threshold summary bar */}
      {aggregateResults.length > 0 && (
        <div className="glass-card flex flex-wrap items-center gap-4 rounded-xl p-4">
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Threshold Summary:</span>
          {[
            { count: summary.good, color: "#10b981", label: "pass" },
            { count: summary.warning, color: "#f59e0b", label: "warning" },
            { count: summary.poor, color: "#ef4444", label: "below threshold" },
          ].map(({ count, color, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <span className="font-semibold" style={{ color }}>{count}</span>
              <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
            </span>
          ))}
          <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>
            {evaluation.totalSamples} samples · {evaluation.dataset}
          </span>
        </div>
      )}

      {/* Tab navigation */}
      {evaluation.status === "Completed" && (
        <>
          <div className="flex gap-1 overflow-x-auto rounded-xl p-1 print:hidden" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                style={activeTab === t.key
                  ? { background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
                  : { color: "var(--muted-foreground)", background: "transparent", border: "1px solid transparent" }
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Metric cards */}
              {aggregateResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-5 w-5" style={{ color: "#00d4e8" }} />
                    <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Aggregate Metrics</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {aggregateResults.map((r) => (
                      <MetricCard
                        key={r.id}
                        name={r.metricName}
                        value={r.metricValue}
                        unit={r.metricUnit}
                        evalType={evaluation.evaluationType}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Radar + Time-series row */}
              {aggregateResults.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Radar chart */}
                  <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4" style={{ color: "#00d4e8" }} />
                      <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Performance Radar</h3>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>(normalized 0–100)</span>
                    </div>
                    <MetricsRadarChart metrics={aggregateResults} evalType={evaluation.evaluationType} />
                  </div>

                  {/* Time-series */}
                  <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4" style={{ color: "#7c3aed" }} />
                      <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Per-Sample Trend</h3>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>primary metric over samples</span>
                    </div>
                    {sampleResults.length > 0 ? (
                      <PerSampleTimeSeriesChart
                        sampleResults={sampleResults}
                        evalType={evaluation.evaluationType}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        No per-sample data available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Per-Sample Tab ── */}
          {activeTab === "per-sample" && (
            <div>
              <p className="mb-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                Click the expand arrow to view full sample details including transcript, confidence, and all metrics.
              </p>
              {sampleResults.length > 0 ? (
                <div className="glass-card overflow-hidden rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                        <th className="w-10 px-4 py-3" />
                        <th className="px-4 py-3">Sample ID</th>
                        <th className="px-4 py-3">Metric</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Audio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleResults.map((r) => (
                        <SampleRow key={r.id} result={r} evalType={evaluation.evaluationType} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No per-sample results recorded for this evaluation.
                </div>
              )}
            </div>
          )}

          {/* ── Heatmap Tab ── */}
          {activeTab === "heatmap" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Comparison matrix showing this evaluation&apos;s metrics against industry averages.
                Color indicates threshold status.
              </p>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Metric Comparison Matrix</h3>
                {aggregateResults.length > 0 ? (
                  <ComparisonHeatmap metrics={aggregateResults} evalType={evaluation.evaluationType} />
                ) : (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No aggregate metrics available.</p>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="font-semibold">Legend:</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-8 h-4 rounded" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }} />
                  Meets threshold
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-8 h-4 rounded" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }} />
                  Near threshold
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-8 h-4 rounded" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }} />
                  Below threshold
                </span>
              </div>
            </div>
          )}

          {/* ── Cost Calculator Tab ── */}
          {activeTab === "cost" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Estimate monthly and annual costs based on this evaluation&apos;s performance metrics and your expected usage volume.
              </p>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4" style={{ color: "#10b981" }} />
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Cost Projection</h3>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>— {evaluation.evaluationType} / {evaluation.dataset}</span>
                </div>
                <CostCalculator
                  evalType={evaluation.evaluationType}
                  totalSamples={evaluation.totalSamples}
                  metrics={aggregateResults}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Fallback for non-completed (still show metrics if any) */}
      {evaluation.status !== "Completed" && aggregateResults.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5" style={{ color: "#00d4e8" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Metrics So Far</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aggregateResults.map((r) => (
              <MetricCard
                key={r.id}
                name={r.metricName}
                value={r.metricValue}
                unit={r.metricUnit}
                evalType={evaluation.evaluationType}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
