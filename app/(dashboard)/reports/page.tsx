"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Calendar,
  Building2,
  FlaskConical,
  TrendingUp,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportSummary {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string | null;
  generatedBy: string | null;
  createdAt: string;
}

const REPORT_TYPES = [
  { type: "MonthlyLandscape", label: "Monthly Landscape", icon: Calendar, description: "Comprehensive monthly speech technology overview" },
  { type: "VendorComparison", label: "Vendor Comparison", icon: Building2, description: "Side-by-side vendor analysis" },
  { type: "EvaluationSummary", label: "Evaluation Summary", icon: FlaskConical, description: "Post-evaluation analysis report" },
  { type: "BuildVsBuy", label: "Build vs Buy", icon: TrendingUp, description: "Quarterly build vs buy analysis" },
  { type: "IntegrationReadiness", label: "Integration Readiness", icon: Shield, description: "NICE CXone integration assessment" },
];

const TYPE_COLORS: Record<string, React.CSSProperties> = {
  MonthlyLandscape: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
  VendorComparison: { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
  EvaluationSummary: { background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" },
  BuildVsBuy: { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
  IntegrationReadiness: { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { style: React.CSSProperties; Icon: typeof CheckCircle2; spin?: boolean }> = {
    Completed: { style: { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }, Icon: CheckCircle2 },
    Generating: { style: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }, Icon: Loader2, spin: true },
    Failed: { style: { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }, Icon: XCircle },
  };
  const { style, Icon, spin } = config[status] ?? {
    style: { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" },
    Icon: FileText,
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={style}
    >
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const rt = REPORT_TYPES.find((r) => r.type === type);
  const style = TYPE_COLORS[type] ?? { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" };
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold" style={style}>
      {rt?.label ?? type}
    </span>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error(await res.text());
      setReports(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function generateReport(type: string) {
    setShowMenu(false);
    setGenerating(type);
    setError(null);
    try {
      const res = await fetch("/api/agents/report-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      if (result.reportId) {
        router.push(`/reports/${result.reportId}`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(null);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

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
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}
            >
              <FileText className="h-6 w-6" style={{ color: "#a855f7" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reports</h1>
              <p className="mt-0.5 text-sm" style={{ color: "#94a3b8" }}>
                Generate comparison reports, executive summaries, and integration assessments
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={!!generating}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)",
                boxShadow: "0 0 16px rgba(0,212,232,0.3)",
              }}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full z-10 mt-2 w-80 rounded-xl overflow-hidden"
                style={{
                  background: "rgba(12,30,74,0.95)",
                  border: "1px solid rgba(0,212,232,0.2)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,232,0.1)",
                }}
              >
                {REPORT_TYPES.map((rt, idx) => (
                  <button
                    key={rt.type}
                    onClick={() => generateReport(rt.type)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      borderBottom: idx < REPORT_TYPES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,232,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <rt.icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#00d4e8" }} />
                    <div>
                      <p className="text-sm font-medium text-white">{rt.label}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{rt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
          <span className="break-all">{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#00d4e8" }} />
        </div>
      )}

      {!loading && reports.length === 0 && !error && (
        <Card className="glass-card border-0 ai-glow">
          <CardContent className="py-16 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <FileText className="h-8 w-8" style={{ color: "#a855f7" }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              No reports generated yet
            </p>
            <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
              Click &ldquo;Generate Report&rdquo; to create your first AI-powered report
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block rounded-xl p-5 transition-all"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,212,232,0.12)",
                boxShadow: "0 0 0 1px rgba(0,212,232,0.25), 0 0 24px rgba(0,212,232,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,212,232,0.3)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 0 1px rgba(0,212,232,0.35), 0 0 32px rgba(0,212,232,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,212,232,0.12)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 0 1px rgba(0,212,232,0.25), 0 0 24px rgba(0,212,232,0.08)";
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                      {report.title}
                    </h3>
                  </div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <TypeBadge type={report.type} />
                    <StatusBadge status={report.status} />
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {report.summary && (
                    <p className="mt-2 text-sm line-clamp-2" style={{ color: "#64748b" }}>
                      {report.summary}
                    </p>
                  )}
                </div>
                <ChevronRight className="ml-4 h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#00d4e8" }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
