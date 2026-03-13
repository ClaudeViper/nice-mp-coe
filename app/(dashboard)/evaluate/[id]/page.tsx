"use client";

import { useEffect, useState } from "react";
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
  Share2,
} from "lucide-react";
import {
  findMetric,
  evaluateMetric,
  METRIC_COLORS,
  METRIC_DOT_COLORS,
} from "@/lib/metrics";

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
  results: Array<{
    id: string;
    metricName: string;
    metricValue: string;
    metricUnit: string;
    sampleId: string | null;
    details: Record<string, unknown> | null;
  }>;
}

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
        <p className="mt-1 text-xs opacity-70">
          Threshold: {def.goodThreshold}
        </p>
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

export default function EvaluationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/evaluations/${id}`);
        if (!res.ok) throw new Error(await res.text());
        setEvaluation(await res.json());
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();

    const interval = setInterval(() => {
      if (evaluation?.status === "Running") load();
    }, 3000);
    return () => clearInterval(interval);
  }, [id, evaluation?.status]);

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

  return (
    <div className="space-y-6">
      <Link href="/evaluate" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Evaluations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {evaluation.vendor.name} — {evaluation.modelName}
            </h1>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700">
              {evaluation.evaluationType}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              {evaluation.status === "Completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {evaluation.status === "Running" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {evaluation.status === "Failed" && <XCircle className="h-4 w-4 text-red-500" />}
              {evaluation.status === "Pending" && <Clock className="h-4 w-4 text-yellow-500" />}
              {evaluation.status}
            </span>
            <span>Dataset: {evaluation.dataset}</span>
            <span>Language: {evaluation.language}</span>
            {evaluation.completedAt && (
              <span>Completed: {new Date(evaluation.completedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const data = {
                vendor: evaluation.vendor.name,
                model: evaluation.modelName,
                type: evaluation.evaluationType,
                status: evaluation.status,
                dataset: evaluation.dataset,
                language: evaluation.language,
                metrics: aggregateResults.map((r) => ({
                  name: r.metricName,
                  value: r.metricValue,
                  unit: r.metricUnit,
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
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
          <button
            onClick={() => {
              const lines = ["Metric,Value,Unit"];
              for (const r of aggregateResults) {
                lines.push(`${r.metricName},${r.metricValue},${r.metricUnit}`);
              }
              const blob = new Blob([lines.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `eval-${evaluation.vendor.name}-${evaluation.modelName}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Progress (for running) */}
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

      {/* Threshold Summary */}
      {aggregateResults.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
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
            <span className="text-gray-500">below</span>
          </span>
        </div>
      )}

      {/* Aggregate Metrics */}
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

      {/* Per-Sample Results */}
      {sampleResults.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Per-Sample Results</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Sample</th>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {sampleResults.map((r) => {
                  const numVal = parseFloat(r.metricValue);
                  const rating = evaluateMetric(r.metricName, numVal, evaluation.evaluationType);

                  return (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{r.sampleId}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {findMetric(r.metricName, evaluation.evaluationType)?.label ?? r.metricName}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {r.metricValue} {r.metricUnit}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${METRIC_COLORS[rating]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${METRIC_DOT_COLORS[rating]}`} />
                          {rating}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
                        {r.details ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:underline">
                              View details
                            </summary>
                            <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">
                              {JSON.stringify(r.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
