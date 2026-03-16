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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const TYPE_COLORS: Record<string, React.CSSProperties> = {
  MonthlyLandscape: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
  VendorComparison: { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
  EvaluationSummary: { background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" },
  BuildVsBuy: { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
  IntegrationReadiness: { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
};

// ── Markdown block renderer ──────────────────────────────────────────────────

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "ordered"; text: string }
  | { kind: "table"; rows: string[][] }
  | { kind: "bold"; text: string }
  | { kind: "blank" }
  | { kind: "paragraph"; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table: collect consecutive pipe lines
    if (line.trimStart().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse each row into cells
      const rows = tableLines
        .filter((l) => !l.replace(/\|/g, "").replace(/-/g, "").replace(/:/g, "").trim() === false || !/^[\s|:\-]+$/.test(l))
        .map((l) =>
          l
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim())
        );
      // Remove separator rows (cells are all dashes/colons)
      const dataRows = rows.filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
      if (dataRows.length > 0) blocks.push({ kind: "table", rows: dataRows });
      continue;
    }

    if (line.startsWith("### ")) { blocks.push({ kind: "heading", level: 3, text: line.slice(4) }); i++; continue; }
    if (line.startsWith("## ")) { blocks.push({ kind: "heading", level: 2, text: line.slice(3) }); i++; continue; }
    if (line.startsWith("# ")) { blocks.push({ kind: "heading", level: 1, text: line.slice(2) }); i++; continue; }
    if (line.startsWith("- ")) { blocks.push({ kind: "bullet", text: line.slice(2) }); i++; continue; }
    if (line.match(/^\d+\. /)) { blocks.push({ kind: "ordered", text: line.replace(/^\d+\. /, "") }); i++; continue; }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) { blocks.push({ kind: "bold", text: line.slice(2, -2) }); i++; continue; }
    if (line.trim() === "") { blocks.push({ kind: "blank" }); i++; continue; }
    blocks.push({ kind: "paragraph", text: line });
    i++;
  }
  return blocks;
}

function RenderedContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-1">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            if (block.level === 1) return (
              <h1 key={i} className="mt-6 mb-3 text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {block.text}
              </h1>
            );
            if (block.level === 2) return (
              <h2 key={i} className="mt-7 mb-3 text-lg font-bold pb-2" style={{ color: "var(--foreground)", borderBottom: "1px solid rgba(0,212,232,0.2)" }}>
                {block.text}
              </h2>
            );
            return (
              <h3 key={i} className="mt-5 mb-2 text-base font-semibold" style={{ color: "#00d4e8" }}>
                {block.text}
              </h3>
            );
          case "bullet":
            return <li key={i} className="ml-5 text-sm leading-relaxed list-disc" style={{ color: "#334155" }}>{block.text}</li>;
          case "ordered":
            return <li key={i} className="ml-5 text-sm leading-relaxed list-decimal" style={{ color: "#334155" }}>{block.text}</li>;
          case "bold":
            return <p key={i} className="text-sm font-semibold mt-3" style={{ color: "var(--foreground)" }}>{block.text}</p>;
          case "blank":
            return <div key={i} className="h-2" />;
          case "table":
            return (
              <div key={i} className="my-4 overflow-x-auto rounded-lg border" style={{ borderColor: "rgba(0,212,232,0.2)" }}>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: "rgba(0,212,232,0.08)", borderBottom: "1px solid rgba(0,212,232,0.2)" }}>
                      {block.rows[0].map((cell, ci) => (
                        <th
                          key={ci}
                          className="px-4 py-2.5 text-left font-semibold whitespace-nowrap"
                          style={{ color: "#0f172a" }}
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.slice(1).map((row, ri) => (
                      <tr
                        key={ri}
                        style={{
                          borderBottom: ri < block.rows.length - 2 ? "1px solid rgba(0,0,0,0.06)" : undefined,
                          background: ri % 2 === 0 ? "rgba(255,255,255,0.85)" : "rgba(248,250,252,0.9)",
                        }}
                      >
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2 align-top" style={{ color: "#334155" }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return <p key={i} className="text-sm leading-relaxed" style={{ color: "#475569" }}>{block.text}</p>;
        }
      })}
    </div>
  );
}

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
        <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#00d4e8" }} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "#00d4e8" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          <AlertCircle className="h-4 w-4" />
          {error ?? "Report not found"}
        </div>
      </div>
    );
  }

  const typeStyle = TYPE_COLORS[report.type] ?? {
    background: "rgba(100,116,139,0.15)",
    color: "#94a3b8",
    border: "1px solid rgba(100,116,139,0.3)",
  };

  const statusConfig: Record<string, { style: React.CSSProperties; icon: React.ReactNode }> = {
    Completed: {
      style: { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    Generating: {
      style: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    Failed: {
      style: { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
  };
  const statusCfg = statusConfig[report.status] ?? {
    style: { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" },
    icon: <FileText className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ color: "#00d4e8" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Reports
      </Link>

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
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 rounded-lg p-2.5 flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}
            >
              <FileText className="h-5 w-5" style={{ color: "#a855f7" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{report.title}</h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold" style={typeStyle}>
                  {TYPE_LABELS[report.type] ?? report.type}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={statusCfg.style}
                >
                  {statusCfg.icon}
                  {report.status}
                </span>
                <span className="text-xs" style={{ color: "#64748b" }}>
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
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setViewMode(viewMode === "rendered" ? "markdown" : "rendered")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e2e8f0",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              {viewMode === "rendered" ? "View Markdown" : "View Rendered"}
            </button>
            {report.content && (
              <button
                onClick={downloadMarkdown}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "rgba(0,212,232,0.15)",
                  border: "1px solid rgba(0,212,232,0.3)",
                  color: "#00d4e8",
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {report.summary && (
        <Card className="glass-card border-0 ai-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#00d4e8" }}>
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              {report.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generating state */}
      {report.status === "Generating" && (
        <Card className="glass-card border-0 ai-glow">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "rgba(0,212,232,0.1)", border: "1px solid rgba(0,212,232,0.2)" }}
              >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00d4e8" }} />
              </div>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                Generating report...
              </p>
              <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                This may take a moment. The page will update when complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {report.status === "Failed" && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Report generation failed. Try generating again.
        </div>
      )}

      {/* Content */}
      {report.content && (
        <Card className="glass-card border-0 ai-glow overflow-hidden">
          {viewMode === "markdown" ? (
            <CardContent className="p-0">
              <pre
                className="overflow-x-auto p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed"
                style={{ color: "var(--foreground)", background: "rgba(6,15,46,0.3)" }}
              >
                {report.content}
              </pre>
            </CardContent>
          ) : (
            <CardContent className="p-6">
              <RenderedContent content={report.content} />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
