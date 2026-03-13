"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

interface ReportDetail {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string | null;
  content: string | null;
  contentHtml: string | null;
  metadata: Record<string, unknown> | null;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  MonthlyLandscape: "Monthly Landscape",
  VendorComparison: "Vendor Comparison",
  EvaluationSummary: "Evaluation Summary",
  BuildVsBuy: "Build vs Buy Analysis",
  IntegrationReadiness: "Integration Readiness",
};

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"rendered" | "markdown">("rendered");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) throw new Error(await res.text());
        setReport(await res.json());
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function downloadMarkdown() {
    if (!report?.content) return;
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error ?? "Report not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Reports
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {TYPE_LABELS[report.type] ?? report.type}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              report.status === "Completed" ? "bg-green-100 text-green-800" :
              report.status === "Generating" ? "bg-blue-100 text-blue-800" :
              "bg-red-100 text-red-800"
            }`}>
              {report.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
              {report.status === "Generating" && <Loader2 className="h-3 w-3 animate-spin" />}
              {report.status === "Failed" && <XCircle className="h-3 w-3" />}
              {report.status}
            </span>
            <span>
              {new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "rendered" ? "markdown" : "rendered")}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {viewMode === "rendered" ? "View Markdown" : "View Rendered"}
          </button>
          {report.content && (
            <button
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Executive Summary</p>
          <p className="mt-1 text-sm text-blue-800">{report.summary}</p>
        </div>
      )}

      {/* Content */}
      {report.status === "Generating" && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-3 text-gray-500">Generating report...</p>
          </div>
        </div>
      )}

      {report.status === "Failed" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          Report generation failed. Try generating again.
        </div>
      )}

      {report.content && (
        <div className="rounded-lg border border-gray-200 bg-white">
          {viewMode === "markdown" ? (
            <pre className="overflow-x-auto p-6 text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {report.content}
            </pre>
          ) : (
            <div className="prose prose-sm max-w-none p-6">
              {/* Render markdown as formatted sections */}
              {report.content.split("\n").map((line, i) => {
                if (line.startsWith("### ")) return <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-gray-900">{line.slice(4)}</h3>;
                if (line.startsWith("## ")) return <h2 key={i} className="mt-6 mb-3 text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{line.slice(3)}</h2>;
                if (line.startsWith("# ")) return <h1 key={i} className="mt-6 mb-3 text-xl font-bold text-gray-900">{line.slice(2)}</h1>;
                if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm text-gray-700">{line.slice(2)}</li>;
                if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 text-sm text-gray-700 list-decimal">{line.replace(/^\d+\. /, "")}</li>;
                if (line.startsWith("|")) return <code key={i} className="block text-xs bg-gray-50 px-3 py-1 font-mono">{line}</code>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm font-semibold text-gray-900 mt-2">{line.replace(/\*\*/g, "")}</p>;
                if (line.trim() === "") return <div key={i} className="h-2" />;
                return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
