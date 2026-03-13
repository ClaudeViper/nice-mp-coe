"use client";

import { useEffect, useState } from "react";
import { RefreshCw, BarChart3, ArrowUpDown, Info, Sparkles, TrendingUp, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  METRICS_BY_TYPE,
  findMetric,
  evaluateMetric,
  type MetricDefinition,
} from "@/lib/metrics";

interface BenchmarkResult {
  id: string;
  modelName: string;
  benchmarkType: string;
  sourceName: string;
  sourceUrl: string;
  metricName: string;
  metricValue: string;
  metricUnit: string;
  dataset: string;
  language: string;
  collectedAt: string;
  vendor: { name: string; slug: string };
}

type SortField = "vendor" | "model" | "metric" | "value" | "dataset" | "source";
type SortDir = "asc" | "desc";

const TYPE_COLOR: Record<string, { accent: string; bg: string; border: string }> = {
  STT: { accent: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
  TTS: { accent: "#00d4e8", bg: "rgba(0,212,232,0.08)", border: "rgba(0,212,232,0.2)" },
  V2V: { accent: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
};

function MetricTooltip({ metric }: { metric: MetricDefinition }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <span
        role="button"
        tabIndex={0}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onKeyDown={(e) => e.key === "Enter" && setShow(!show)}
        className="inline-flex items-center transition-colors cursor-pointer"
        style={{ color: "var(--muted-foreground)" }}
      >
        <Info className="h-3 w-3" />
      </span>
      {show && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl p-4 shadow-xl text-left"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{metric.label}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{metric.description}</p>
          <div className="mt-2 space-y-1 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-medium">How measured:</span> {metric.howMeasured}
            </p>
            <p className="text-xs">
              <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>Good threshold:</span>{" "}
              <span className="font-semibold" style={{ color: "#10b981" }}>{metric.goodThreshold}</span>
            </p>
          </div>
        </div>
      )}
    </span>
  );
}

const STATUS_STYLES = {
  good: { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.25)", label: "Meets threshold" },
  warning: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.25)", label: "Near threshold" },
  poor: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)", label: "Below threshold" },
};

export function BenchmarkTable({
  type,
  title,
  description,
}: {
  type: "STT" | "TTS" | "V2V";
  title: string;
  description: string;
}) {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeMetric, setActiveMetric] = useState("All");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showMetricRef, setShowMetricRef] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricDefs = METRICS_BY_TYPE[type] ?? [];
  const metricNames = ["All", ...metricDefs.map((m) => m.name)];
  const colors = TYPE_COLOR[type] ?? { accent: "#00d4e8", bg: "rgba(0,212,232,0.08)", border: "rgba(0,212,232,0.2)" };

  async function fetchBenchmarks(metric?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      if (metric && metric !== "All") params.set("metric", metric);
      const res = await fetch(`/api/benchmarks?${params}`);
      if (!res.ok) {
        setError(`API error (${res.status}): ${(await res.text()).slice(0, 200)}`);
        setResults([]);
        setLoading(false);
        return;
      }
      setResults(await res.json());
    } catch (err) {
      setError(String(err));
      setResults([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchBenchmarks(); }, []); // eslint-disable-line

  async function triggerCollector() {
    setRunning(true);
    try {
      await fetch("/api/agents/benchmark-collector", { method: "POST" });
      await fetchBenchmarks(activeMetric === "All" ? undefined : activeMetric);
    } finally {
      setRunning(false);
    }
  }

  function handleMetricChange(metric: string) {
    setActiveMetric(metric);
    fetchBenchmarks(metric === "All" ? undefined : metric);
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const sorted = [...results].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "vendor": return a.vendor.name.localeCompare(b.vendor.name) * dir;
      case "model": return a.modelName.localeCompare(b.modelName) * dir;
      case "metric": return a.metricName.localeCompare(b.metricName) * dir;
      case "value": return (parseFloat(a.metricValue) - parseFloat(b.metricValue)) * dir;
      case "dataset": return a.dataset.localeCompare(b.dataset) * dir;
      case "source": return a.sourceName.localeCompare(b.sourceName) * dir;
      default: return 0;
    }
  });

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const active = sortField === field;
    return (
      <th
        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors"
        style={{ color: active ? colors.accent : "var(--muted-foreground)" }}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <ArrowUpDown className="h-3 w-3" style={{ color: active ? colors.accent : "rgba(148,163,184,0.4)" }} />
        </span>
      </th>
    );
  }

  // Summary stats
  const good = results.filter(r => evaluateMetric(r.metricName, parseFloat(r.metricValue), type) === "good").length;
  const warning = results.filter(r => evaluateMetric(r.metricName, parseFloat(r.metricValue), type) === "warning").length;
  const poor = results.filter(r => evaluateMetric(r.metricName, parseFloat(r.metricValue), type) === "poor").length;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "linear-gradient(135deg,#060f2e 0%,#102356 60%,#0c1e4a 100%)" }}>
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10" style={{ background: `radial-gradient(circle,${colors.accent},transparent)` }} />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: colors.bg, color: colors.accent, border: `1px solid ${colors.border}` }}>
                {type}
              </span>
              <span className="text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>Industry Benchmarks</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(148,163,184,0.85)" }}>{description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowMetricRef(!showMetricRef)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Info className="h-4 w-4" />
              {showMetricRef ? "Hide" : "Metric"} Reference
            </button>
            <button
              onClick={triggerCollector}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg,${colors.accent},#7c3aed)` }}
            >
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? "Collecting..." : "Run AI Collector"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        {results.length > 0 && (
          <div className="relative z-10 mt-4 flex items-center gap-6">
            <span className="text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
              <span className="font-semibold text-white">{results.length}</span> results
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#10b981" }} />
              <span className="font-semibold" style={{ color: "#10b981" }}>{good}</span>
              <span style={{ color: "rgba(148,163,184,0.6)" }}>pass</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#f59e0b" }} />
              <span className="font-semibold" style={{ color: "#f59e0b" }}>{warning}</span>
              <span style={{ color: "rgba(148,163,184,0.6)" }}>warning</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ef4444" }} />
              <span className="font-semibold" style={{ color: "#ef4444" }}>{poor}</span>
              <span style={{ color: "rgba(148,163,184,0.6)" }}>below</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Metric Reference ─────────────────────────────────────────── */}
      {showMetricRef && (
        <Card className="glass-card border-0">
          <CardContent className="p-0">
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: colors.accent }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {type} Industry-Standard Metrics Reference
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
                  {metricDefs.map((m) => (
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

      {/* ── Metric Filter Pills ──────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {metricNames.map((metric) => {
          const def = findMetric(metric, type);
          const active = activeMetric === metric;
          return (
            <button
              key={metric}
              onClick={() => handleMetricChange(metric)}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150"
              style={active
                ? { background: `linear-gradient(135deg,${colors.accent},#7c3aed)`, color: "#fff" }
                : { background: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
              }
            >
              {def ? def.label : metric}
              {def && !active && <MetricTooltip metric={def} />}
            </button>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <Card className="glass-card border-0">
          <CardContent className="flex items-center justify-center py-20">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" style={{ color: colors.accent }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading benchmarks...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="glass-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-10 w-10 mb-3" style={{ color: "#ef4444", opacity: 0.5 }} />
            <p className="text-sm font-medium" style={{ color: "#ef4444" }}>Failed to load benchmarks</p>
            <p className="text-xs mt-1 max-w-md" style={{ color: "var(--muted-foreground)" }}>{error}</p>
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Database className="h-10 w-10 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No benchmark data yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Click &quot;Run AI Collector&quot; to fetch the latest benchmarks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0,212,232,0.02)" }}>
                  <SortHeader field="vendor">Vendor</SortHeader>
                  <SortHeader field="model">Model</SortHeader>
                  <SortHeader field="metric">Metric</SortHeader>
                  <SortHeader field="value">Value</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Status</th>
                  <SortHeader field="dataset">Dataset</SortHeader>
                  <SortHeader field="source">Source</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Collected</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const numVal = parseFloat(r.metricValue);
                  const rating = evaluateMetric(r.metricName, numVal, type);
                  const def = findMetric(r.metricName, type);
                  const st = STATUS_STYLES[rating];

                  return (
                    <tr
                      key={r.id}
                      className="transition-colors"
                      style={{ borderBottom: idx < sorted.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,212,232,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg,${colors.accent},#7c3aed)` }}>
                            {r.vendor.name.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{r.vendor.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{r.modelName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: colors.bg, color: colors.accent, border: `1px solid ${colors.border}` }}>
                          {def ? def.label : r.metricName}
                          {def && <MetricTooltip metric={def} />}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: "var(--foreground)" }}>
                        {parseFloat(r.metricValue).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        <span className="ml-1 text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>{r.metricUnit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{r.dataset}</td>
                      <td className="px-4 py-3 text-sm">
                        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: colors.accent }}>
                          {r.sourceName}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(r.collectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)", background: "rgba(0,212,232,0.02)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{sorted.length}</span> result{sorted.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {(["good", "warning", "poor"] as const).map(r => (
                <span key={r} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_STYLES[r].color }} />
                  {STATUS_STYLES[r].label}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
