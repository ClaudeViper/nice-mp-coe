"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

interface EvaluationSummary {
  id: string;
  evaluationType: string;
  modelName: string;
  status: string;
  dataset: string;
  language: string;
  totalSamples: number;
  processedSamples: number;
  createdAt: string;
  completedAt: string | null;
  vendor: { name: string; slug: string };
  results: Array<{
    metricName: string;
    metricValue: string;
    metricUnit: string;
  }>;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "Running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case "Failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "Cancelled":
      return <XCircle className="h-4 w-4 text-gray-400" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Completed: "bg-green-100 text-green-800",
    Running: "bg-blue-100 text-blue-800",
    Failed: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      <StatusIcon status={status} />
      {status}
    </span>
  );
}

export default function EvaluatePage() {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/evaluations")
      .then((res) => {
        if (!res.ok) return res.text().then((t) => { throw new Error(t); });
        return res.json();
      })
      .then(setEvaluations)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Run standardized evaluations against vendor APIs and compare results
          </p>
        </div>
        <Link
          href="/evaluate/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Evaluation
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && evaluations.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <FlaskConical className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No evaluations yet.</p>
          <Link
            href="/evaluate/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Run Your First Evaluation
          </Link>
        </div>
      )}

      {!loading && evaluations.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Vendor / Model</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Key Metrics</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-900">{ev.vendor.name}</span>
                      <span className="ml-2 text-gray-500">{ev.modelName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {ev.evaluationType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ev.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {ev.results.slice(0, 3).map((r) => (
                        <span key={r.metricName} className="text-xs text-gray-600">
                          {r.metricName}: <span className="font-medium">{r.metricValue}{r.metricUnit === "%" ? "%" : ` ${r.metricUnit}`}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(ev.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/evaluate/${ev.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
