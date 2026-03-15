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
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EvalConfig {
  source?: string;
  audioFile?: string;
  referenceText?: string;
  sentence_id?: string;
  voice?: string;
  speed?: string | number;
  emotion?: string | number;
  [key: string]: unknown;
}

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
  config: EvalConfig | null;
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
      return <CheckCircle2 className="h-4 w-4" style={{ color: "#22c55e" }} />;
    case "Running":
      return <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#00d4e8" }} />;
    case "Failed":
      return <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />;
    case "Cancelled":
      return <XCircle className="h-4 w-4" style={{ color: "#64748b" }} />;
    default:
      return <Clock className="h-4 w-4" style={{ color: "#f59e0b" }} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Completed: { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
    Running: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
    Failed: { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
    Pending: { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
    Cancelled: { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" },
  };
  const style = styles[status] ?? styles.Cancelled;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={style}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, React.CSSProperties> = {
    STT: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
    TTS: { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    V2V: { background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" },
  };
  const style = styles[type] ?? { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" };
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold"
      style={style}
    >
      {type}
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

  const completed = evaluations.filter((e) => e.status === "Completed").length;
  const running = evaluations.filter((e) => e.status === "Running").length;
  const failed = evaluations.filter((e) => e.status === "Failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #060f2e 0%, #0c1e4a 50%, #102356 100%)",
          border: "1px solid rgba(0,212,232,0.2)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,212,232,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg p-2.5"
              style={{ background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)" }}
            >
              <FlaskConical className="h-6 w-6" style={{ color: "#00d4e8" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Evaluations</h1>
              <p className="mt-0.5 text-sm" style={{ color: "#94a3b8" }}>
                Run standardized evaluations against vendor APIs and compare results
              </p>
            </div>
          </div>
          <Link
            href="/evaluate/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)",
              boxShadow: "0 0 16px rgba(0,212,232,0.3)",
            }}
          >
            <Plus className="h-4 w-4" />
            New Evaluation
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {!loading && evaluations.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: evaluations.length, color: "#00d4e8" },
            { label: "Completed", value: completed, color: "#22c55e" },
            { label: "Running", value: running, color: "#00d4e8" },
            { label: "Failed", value: failed, color: "#ef4444" },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card border-0 ai-glow">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                  {stat.label}
                </p>
                <p className="mt-1 text-3xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#00d4e8" }} />
        </div>
      )}

      {!loading && evaluations.length === 0 && !error && (
        <Card className="glass-card border-0 ai-glow">
          <CardContent className="py-16 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(0,212,232,0.1)", border: "1px solid rgba(0,212,232,0.2)" }}
            >
              <Zap className="h-8 w-8" style={{ color: "#00d4e8" }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              No evaluations yet
            </p>
            <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
              Run your first evaluation to start benchmarking vendor performance
            </p>
            <Link
              href="/evaluate/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)",
                boxShadow: "0 0 16px rgba(0,212,232,0.3)",
              }}
            >
              <Plus className="h-4 w-4" />
              Run Your First Evaluation
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && evaluations.length > 0 && (
        <Card className="glass-card border-0 ai-glow overflow-hidden">
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
              All Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs font-semibold uppercase tracking-wider"
                    style={{
                      borderBottom: "1px solid rgba(0,212,232,0.1)",
                      background: "rgba(6,15,46,0.4)",
                      color: "#64748b",
                    }}
                  >
                    <th className="px-4 py-3">Vendor / Model</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dataset</th>
                    <th className="px-4 py-3">Transcript</th>
                    <th className="px-4 py-3">Voice / File</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Key Metrics</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev, idx) => (
                    <tr
                      key={ev.id}
                      className="transition-colors"
                      style={{
                        borderBottom: idx < evaluations.length - 1 ? "1px solid rgba(0,212,232,0.06)" : undefined,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,232,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                            {ev.vendor.name}
                          </span>
                          <span className="ml-2 text-xs" style={{ color: "#64748b" }}>
                            {ev.modelName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={ev.evaluationType} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>
                        {ev.dataset}
                      </td>

                      {/* Transcript */}
                      <td className="px-4 py-3 max-w-xs">
                        {ev.config?.referenceText ? (
                          <span
                            className="block truncate text-xs"
                            style={{ color: "var(--foreground)" }}
                            title={ev.config.referenceText}
                          >
                            {ev.config.referenceText}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>—</span>
                        )}
                      </td>

                      {/* Voice / File */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {ev.config?.voice && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit"
                              style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}
                            >
                              🎙 {ev.config.voice}
                            </span>
                          )}
                          {ev.config?.audioFile && (
                            <span
                              className="block truncate text-xs font-mono"
                              style={{ color: "#64748b", maxWidth: 160 }}
                              title={ev.config.audioFile}
                            >
                              {ev.config.audioFile.split("/").pop()}
                            </span>
                          )}
                          {ev.config?.speed != null && (
                            <span className="text-xs" style={{ color: "rgba(100,116,139,0.7)" }}>
                              speed {ev.config.speed}×{ev.config?.emotion != null ? ` · emo ${ev.config.emotion}` : ""}
                            </span>
                          )}
                          {!ev.config?.voice && !ev.config?.audioFile && (
                            <span className="text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          {ev.results.slice(0, 3).map((r) => (
                            <span key={r.metricName} className="text-xs" style={{ color: "#64748b" }}>
                              {r.metricName}:{" "}
                              <span className="font-semibold" style={{ color: "#00d4e8" }}>
                                {r.metricValue}
                                {r.metricUnit === "%" ? "%" : ` ${r.metricUnit}`}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>
                        {new Date(ev.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/evaluate/${ev.id}`}
                          className="text-xs font-medium transition-colors hover:opacity-80"
                          style={{ color: "#00d4e8" }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
