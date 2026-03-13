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
} from "lucide-react";

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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; Icon: typeof CheckCircle2 }> = {
    Completed: { color: "bg-green-100 text-green-800", Icon: CheckCircle2 },
    Generating: { color: "bg-blue-100 text-blue-800", Icon: Loader2 },
    Failed: { color: "bg-red-100 text-red-800", Icon: XCircle },
  };
  const { color, Icon } = config[status] ?? { color: "bg-gray-100 text-gray-600", Icon: FileText };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <Icon className={`h-3 w-3 ${status === "Generating" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const rt = REPORT_TYPES.find((r) => r.type === type);
  return (
    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate comparison reports, executive summaries, and integration assessments
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={!!generating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
            <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.type}
                  onClick={() => generateReport(rt.type)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <rt.icon className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rt.label}</p>
                    <p className="text-xs text-gray-500">{rt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && reports.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No reports generated yet.</p>
          <p className="mt-1 text-sm text-gray-400">Click "Generate Report" to create your first report.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <TypeBadge type={report.type} />
                    <StatusBadge status={report.status} />
                    <span className="text-xs text-gray-500">
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
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{report.summary}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
