"use client";

import { useEffect, useState } from "react";
import { RefreshCw, BarChart3, ArrowUpDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  METRICS_BY_TYPE,
  findMetric,
  evaluateMetric,
  METRIC_COLORS,
  METRIC_DOT_COLORS,
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

function MetricTooltip({ metric }: { metric: MetricDefinition }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center text-gray-400 hover:text-gray-600"
      >
        <Info className="h-3 w-3" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-left">
          <p className="text-xs font-semibold text-gray-900">{metric.label}</p>
          <p className="mt-1 text-xs text-gray-600">{metric.description}</p>
          <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium">How measured:</span> {metric.howMeasured}
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Good threshold:</span>{" "}
              <span className="font-medium text-green-700">{metric.goodThreshold}</span>
            </p>
          </div>
        </div>
      )}
    </span>
  );
}

function ThresholdIndicator({ metricName, value, type }: { metricName: string; value: number; type: string }) {
  const rating = evaluateMetric(metricName, value, type);
  return <span className={`inline-block h-2 w-2 rounded-full ${METRIC_DOT_COLORS[rating]}`} />;
}

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

  const metricDefs = METRICS_BY_TYPE[type] ?? [];
  const metricNames = ["All", ...metricDefs.map((m) => m.name)];

  const [error, setError] = useState<string | null>(null);

  async function fetchBenchmarks(metric?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      if (metric && metric !== "All") params.set("metric", metric);
      const res = await fetch(`/api/benchmarks?${params}`);
      if (!res.ok) {
        const text = await res.text();
        setError(`API error (${res.status}): ${text.slice(0, 200)}`);
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

  useEffect(() => {
    fetchBenchmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...results].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "vendor":
        return a.vendor.name.localeCompare(b.vendor.name) * dir;
      case "model":
        return a.modelName.localeCompare(b.modelName) * dir;
      case "metric":
        return a.metricName.localeCompare(b.metricName) * dir;
      case "value":
        return (parseFloat(a.metricValue) - parseFloat(b.metricValue)) * dir;
      case "dataset":
        return a.dataset.localeCompare(b.dataset) * dir;
      case "source":
        return a.sourceName.localeCompare(b.sourceName) * dir;
      default:
        return 0;
    }
  });

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-blue-600" : "text-gray-300"}`} />
        </span>
      </th>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMetricRef(!showMetricRef)}>
            <Info className="h-4 w-4 mr-2" />
            {showMetricRef ? "Hide" : "Show"} Metric Reference
          </Button>
          <Button onClick={triggerCollector} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
            {running ? "Collecting..." : "Run Collector"}
          </Button>
        </div>
      </div>

      {/* Metric Reference Table */}
      {showMetricRef && (
        <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/50">
          <div className="px-5 py-3 border-b border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900">
              {type} Industry-Standard Metrics Reference
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 text-left text-xs font-medium text-blue-700">
                  <th className="px-4 py-2">Metric</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">How Measured</th>
                  <th className="px-4 py-2">Good Threshold</th>
                </tr>
              </thead>
              <tbody>
                {metricDefs.map((m) => (
                  <tr key={m.name} className="border-b border-blue-50">
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-900">{m.label}</span>
                      <span className="ml-1 text-xs text-gray-500">({m.name})</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{m.description}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{m.howMeasured}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {m.goodThreshold}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metric Filter */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {metricNames.map((metric) => {
          const def = findMetric(metric, type);
          return (
            <button
              key={metric}
              onClick={() => handleMetricChange(metric)}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeMetric === metric
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {def ? def.label : metric}
              {def && activeMetric !== metric && <MetricTooltip metric={def} />}
            </button>
          );
        })}
      </div>

      {/* Results Table */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <BarChart3 className="h-10 w-10 mb-3" />
            <p className="text-sm font-medium">Failed to load benchmarks</p>
            <p className="text-xs mt-1 max-w-md text-center">{error}</p>
            <p className="text-xs mt-3 text-gray-400">
              Run <code className="bg-gray-100 px-1 rounded">npx prisma generate</code> then restart the dev server.
            </p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BarChart3 className="h-10 w-10 mb-3" />
            <p className="text-sm">No benchmark data yet.</p>
            <p className="text-xs mt-1">
              Click &quot;Run Collector&quot; to fetch the latest benchmarks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="vendor">Vendor</SortHeader>
                  <SortHeader field="model">Model</SortHeader>
                  <SortHeader field="metric">Metric</SortHeader>
                  <SortHeader field="value">Value</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <SortHeader field="dataset">Dataset</SortHeader>
                  <SortHeader field="source">Source</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collected
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((r) => {
                  const numVal = parseFloat(r.metricValue);
                  const rating = evaluateMetric(r.metricName, numVal, type);
                  const def = findMetric(r.metricName, type);

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.vendor.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.modelName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {def ? def.label : r.metricName}
                          {def && <MetricTooltip metric={def} />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                        {parseFloat(r.metricValue).toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                        <span className="text-gray-400 text-xs">{r.metricUnit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${METRIC_COLORS[rating]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${METRIC_DOT_COLORS[rating]}`} />
                          {rating === "good" ? "Meets threshold" : rating === "warning" ? "Near threshold" : "Below threshold"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.dataset}</td>
                      <td className="px-4 py-3 text-sm">
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {r.sourceName}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(r.collectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {sorted.length} result{sorted.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Meets threshold</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Near threshold</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Below threshold</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
