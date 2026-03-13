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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
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

  return (
    <div className={`rounded-lg border p-4 ${METRIC_COLORS[rating]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase">{def ? def.label : name}</p>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${METRIC_DOT_COLORS[rating]}`} />
          {def && (
            <span
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="h-3 w-3 cursor-help opacity-60" />
              {showTooltip && (
                <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-left">
                  <p className="text-xs text-gray-600">{def.description}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-medium">Threshold:</span>{" "}
                    <span className="text-green-700">{def.goodThreshold}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-medium">Measured:</span> {def.howMeasured}
                  </p>
                </div>
              )}
            </span>
          )}
        </div>
      </div>
      <p className="mt-1 text-2xl font-bold">
        {value}
        <span className="ml-1 text-sm font-normal opacity-70">{unit}</span>
      </p>
      {def && (
        <p className="mt-1 text-xs opacity-70">Threshold: {def.goodThreshold}</p>
      )}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} / {total} samples</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function MetricsRadarChart({
  metrics,
  evalType,
}: {
  metrics: SampleResult[];
  evalType: string;
}) {
  // Normalize all metrics to 0-100 scale for radar
  const radarData = metrics.map((m) => {
    const v = parseFloat(m.metricValue);
    const def = findMetric(m.metricName, evalType);
    const label = def?.label ?? m.metricName;

    // Normalize: lower-is-better metrics get inverted
    let normalized = v;
    const lowerIsBetter = ["WER", "CER", "avg_latency", "RTF", "TTFB", "roundtrip_WER", "e2e_latency"].includes(m.metricName);
    if (lowerIsBetter) {
      // Map to 0-100 where 100 = excellent
      if (m.metricUnit === "%") normalized = Math.max(0, 100 - v * 2);
      else if (m.metricUnit === "ms") normalized = Math.max(0, 100 - v / 30);
      else normalized = Math.max(0, 100 - v * 50);
    } else if (m.metricName === "MOS") {
      normalized = (v / 5) * 100;
    }

    return { metric: label, value: Math.min(100, Math.max(0, Math.round(normalized))) };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value) => [`${value}`, "Normalized Score"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Time-Series Chart ────────────────────────────────────────────────────────

function PerSampleTimeSeriesChart({
  sampleResults,
  evalType,
}: {
  sampleResults: SampleResult[];
  evalType: string;
}) {
  // Group by sampleId, use primary metric per type
  const primaryMetric =
    evalType === "STT" ? "sample_wer" :
    evalType === "TTS" ? "sample_mos" :
    "sample_task_completion";

  const filtered = sampleResults
    .filter((r) => r.metricName === primaryMetric)
    .map((r, i) => ({
      sample: r.sampleId ?? `S${i + 1}`,
      value: parseFloat(r.metricValue),
      label: r.sampleId?.replace(/^(clean|noisy|ivr|agent|support|ivr-s)-/, "") ?? `${i + 1}`,
    }));

  if (filtered.length === 0) return null;

  const metricLabel =
    evalType === "STT" ? "WER (%)" :
    evalType === "TTS" ? "MOS Score" :
    "Task Completion (%)";

  const color = evalType === "STT" ? "#8b5cf6" : evalType === "TTS" ? "#14b8a6" : "#f97316";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={filtered} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: "#9ca3af" }}
          interval={Math.floor(filtered.length / 10)}
        />
        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          formatter={(value) => [typeof value === "number" ? value.toFixed(2) : value, metricLabel]}
          labelFormatter={(label) => `Sample: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name={metricLabel}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2, fill: color }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
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
    good: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    poor: "bg-red-100 text-red-800",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-2 pr-4 text-left text-xs font-medium uppercase text-gray-500 w-32">Source</th>
            {rows[0]?.cells.map((c) => (
              <th key={c.label} className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500 min-w-24">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-gray-50">
              <td className="py-2 pr-4 text-xs font-medium text-gray-700">{row.name}</td>
              {row.cells.map((cell) => (
                <td key={cell.label} className="px-3 py-2 text-center">
                  <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${bgMap[cell.rating]}`}>
                    {cell.value.toFixed(2)} {cell.unit}
                  </span>
                </td>
              ))}
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Monthly Volume ({evalType} {perUnitLabel.replace("per ", "")})
          </label>
          <input
            type="range"
            min={1000}
            max={1000000}
            step={1000}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1K</span>
            <span className="font-medium text-gray-700">{volume.toLocaleString()}</span>
            <span>1M</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Unit Cost</p>
          <p className="text-lg font-bold text-gray-900">${perUnitCost.toFixed(4)}</p>
          <p className="text-xs text-gray-400">{perUnitLabel}</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center">
          <p className="text-xs text-blue-600">Monthly Est.</p>
          <p className="text-lg font-bold text-blue-700">
            ${monthlyCost < 1000 ? monthlyCost.toFixed(2) : (monthlyCost / 1000).toFixed(1) + "K"}
          </p>
          <p className="text-xs text-blue-400">{volume.toLocaleString()} units</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Annual Est.</p>
          <p className="text-lg font-bold text-gray-900">
            ${(monthlyCost * 12) < 1000
              ? (monthlyCost * 12).toFixed(2)
              : ((monthlyCost * 12) / 1000).toFixed(1) + "K"}
          </p>
          <p className="text-xs text-gray-400">no volume discount</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
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
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-gray-600">{result.sampleId}</td>
        <td className="px-4 py-2 text-gray-700">
          {findMetric(result.metricName, evalType)?.label ?? result.metricName}
        </td>
        <td className="px-4 py-2 font-medium text-gray-900">
          {result.metricValue} {result.metricUnit}
        </td>
        <td className="px-4 py-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${METRIC_COLORS[rating]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${METRIC_DOT_COLORS[rating]}`} />
            {rating}
          </span>
        </td>
        <td className="px-4 py-2">
          {/* Simulated audio playback indicator */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-0.5 h-4">
              {[2, 4, 3, 5, 4, 2, 3].map((h, i) => (
                <div key={i} className={`w-1 rounded-sm ${rating === "good" ? "bg-green-400" : rating === "warning" ? "bg-yellow-400" : "bg-red-400"}`} style={{ height: `${h * 3}px` }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">Audio</span>
          </div>
        </td>
      </tr>
      {expanded && result.details && (
        <tr className="border-b border-gray-50 bg-gray-50">
          <td colSpan={6} className="px-8 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(result.details).map(([k, v]) => (
                <div key={k} className="rounded border border-gray-200 bg-white px-3 py-2">
                  <p className="text-gray-500 uppercase text-xs font-medium">{k.replace(/_/g, " ")}</p>
                  <p className="font-mono font-medium text-gray-900 mt-0.5">
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
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-4">
        <Link href="/evaluate" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Evaluations
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error ?? "Evaluation not found"}
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
      <Link href="/evaluate" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline print:hidden">
        <ArrowLeft className="h-4 w-4" /> Back to Evaluations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {evaluation.vendor.name} — {evaluation.modelName}
            </h1>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700">
              {evaluation.evaluationType}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              {evaluation.status === "Completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {evaluation.status === "Running" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {evaluation.status === "Failed" && <XCircle className="h-4 w-4 text-red-500" />}
              {evaluation.status === "Pending" && <Clock className="h-4 w-4 text-yellow-500" />}
              {evaluation.status}
            </span>
            <span className="font-medium text-gray-700">{evaluation.dataset}</span>
            <span>Lang: {evaluation.language.toUpperCase()}</span>
            {evaluation.completedAt && (
              <span>{new Date(evaluation.completedAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
          <button
            onClick={() => exportCSV(evaluation, aggregateResults, sampleResults)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={() => exportJSON(evaluation, aggregateResults, sampleResults)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* Progress bar (running) */}
      {evaluation.status === "Running" && (
        <ProgressBar current={evaluation.processedSamples} total={evaluation.totalSamples} />
      )}

      {/* Error message */}
      {evaluation.errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {evaluation.errorMessage}
        </div>
      )}

      {/* Threshold summary bar */}
      {aggregateResults.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <span className="text-sm font-medium text-gray-700">Threshold Summary:</span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="font-medium text-green-700">{summary.good}</span>
            <span className="text-gray-500">pass</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="font-medium text-yellow-700">{summary.warning}</span>
            <span className="text-gray-500">warning</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="font-medium text-red-700">{summary.poor}</span>
            <span className="text-gray-500">below threshold</span>
          </span>
          <span className="ml-auto text-xs text-gray-400">
            {evaluation.totalSamples} samples · {evaluation.dataset}
          </span>
        </div>
      )}

      {/* Tab navigation */}
      {evaluation.status === "Completed" && (
        <>
          <div className="flex gap-1 border-b border-gray-200 print:hidden">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
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
                    <BarChart3 className="h-5 w-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-900">Aggregate Metrics</h2>
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
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">Performance Radar</h3>
                      <span className="text-xs text-gray-400">(normalized 0–100)</span>
                    </div>
                    <MetricsRadarChart metrics={aggregateResults} evalType={evaluation.evaluationType} />
                  </div>

                  {/* Time-series */}
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-gray-900">Per-Sample Trend</h3>
                      <span className="text-xs text-gray-400">primary metric over samples</span>
                    </div>
                    {sampleResults.length > 0 ? (
                      <PerSampleTimeSeriesChart
                        sampleResults={sampleResults}
                        evalType={evaluation.evaluationType}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
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
              <p className="mb-3 text-sm text-gray-500">
                Click the expand arrow to view full sample details including transcript, confidence, and all metrics.
              </p>
              {sampleResults.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
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
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                  No per-sample results recorded for this evaluation.
                </div>
              )}
            </div>
          )}

          {/* ── Heatmap Tab ── */}
          {activeTab === "heatmap" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Comparison matrix showing this evaluation&apos;s metrics against industry averages.
                Color indicates threshold status.
              </p>
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Metric Comparison Matrix</h3>
                {aggregateResults.length > 0 ? (
                  <ComparisonHeatmap metrics={aggregateResults} evalType={evaluation.evaluationType} />
                ) : (
                  <p className="text-sm text-gray-400">No aggregate metrics available.</p>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="font-medium">Legend:</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-8 h-4 rounded bg-green-100 border border-green-200" />
                  Meets threshold
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-8 h-4 rounded bg-yellow-100 border border-yellow-200" />
                  Near threshold
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-8 h-4 rounded bg-red-100 border border-red-200" />
                  Below threshold
                </span>
              </div>
            </div>
          )}

          {/* ── Cost Calculator Tab ── */}
          {activeTab === "cost" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Estimate monthly and annual costs based on this evaluation&apos;s performance metrics and your expected usage volume.
              </p>
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-gray-900">Cost Projection</h3>
                  <span className="text-xs text-gray-400">— {evaluation.evaluationType} / {evaluation.dataset}</span>
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
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Metrics So Far</h2>
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
