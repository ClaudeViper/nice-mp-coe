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
} from "lucide-react";

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
}: {
  name: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{name}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
        <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>
      </p>
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

    // Poll for running evaluations
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

      {/* Aggregate Metrics */}
      {aggregateResults.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Aggregate Metrics</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aggregateResults.map((r) => (
              <MetricCard key={r.id} name={r.metricName} value={r.metricValue} unit={r.metricUnit} />
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
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {sampleResults.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{r.sampleId}</td>
                    <td className="px-4 py-2 text-gray-700">{r.metricName}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {r.metricValue} {r.metricUnit}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
