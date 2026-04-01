"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles, BarChart3, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VendorLogo } from "@/components/vendor-logo";
import { evaluateMetric, findMetric } from "@/lib/metrics";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type ViewMode = "summary" | "detailed";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = "#7c3aed";

const PRIORITY_VENDORS: Array<{ display: string; slugMatches: string[] }> = [
  { display: "Deepgram",   slugMatches: ["deepgram"]             },
  { display: "Google",     slugMatches: ["google"]               },
  { display: "Microsoft",  slugMatches: ["azure", "microsoft"]   },
  { display: "AWS",        slugMatches: ["aws"]                  },
  { display: "AssemblyAI", slugMatches: ["assemblyai"]           },
  { display: "ElevenLabs", slugMatches: ["elevenlabs"]           },
  { display: "NVIDIA",     slugMatches: ["nvidia"]               },
];

const SECTIONS = [
  { id: "accuracy", label: "Accuracy", metrics: ["WER", "CER", "noise_robustness"]                        },
  { id: "speed",    label: "Speed",    metrics: ["RTF", "TTFB", "end_to_end_latency", "avg_latency"]       },
  { id: "cost",     label: "Cost",     metrics: ["price_per_minute"]                                       },
  { id: "other",    label: "Other",    metrics: ["DER", "language_detection_accuracy"]                     },
] as const;

const STATUS_STYLES = {
  good:    { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.25)", label: "Meets threshold" },
  warning: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.25)", label: "Near threshold"  },
  poor:    { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", border: "rgba(239,68,68,0.25)",  label: "Below threshold" },
};

// ── Data helpers ──────────────────────────────────────────────────────────────

function bestOf(rows: BenchmarkResult[], lowerBetter: boolean): BenchmarkResult | null {
  if (!rows.length) return null;
  return rows.reduce((best, r) => {
    const bv = parseFloat(best.metricValue);
    const rv = parseFloat(r.metricValue);
    if (isNaN(rv)) return best;
    if (isNaN(bv)) return r;
    return lowerBetter ? (rv < bv ? r : best) : (rv > bv ? r : best);
  });
}

function matchesPriority(slug: string, pv: (typeof PRIORITY_VENDORS)[number]): boolean {
  return pv.slugMatches.some((m) => slug.toLowerCase().includes(m));
}

interface SummaryRow {
  vendorSlug: string;
  vendorName: string;
  modelName: string;
  wer:     BenchmarkResult | null;
  rtf:     BenchmarkResult | null;
  latency: BenchmarkResult | null;
  price:   BenchmarkResult | null;
  lastUpdated: string | null;
}

function buildSummaryRows(results: BenchmarkResult[]): SummaryRow[] {
  const byVendor = new Map<string, BenchmarkResult[]>();
  for (const r of results) {
    const s = r.vendor.slug;
    if (!byVendor.has(s)) byVendor.set(s, []);
    byVendor.get(s)!.push(r);
  }

  return Array.from(byVendor.entries()).map(([slug, rows]) => {
    // WER — prefer CommonVoice dataset
    const werRows = rows.filter((r) => r.metricName === "WER");
    const cvRows  = werRows.filter((r) => r.dataset.toLowerCase().includes("common"));
    const wer     = bestOf(cvRows.length > 0 ? cvRows : werRows, true);

    // RTF
    const rtf = bestOf(rows.filter((r) => r.metricName === "RTF"), true);

    // Latency — prefer end_to_end, fall back to avg_latency
    const e2eRows = rows.filter((r) => r.metricName === "end_to_end_latency");
    const avgRows = rows.filter((r) => r.metricName === "avg_latency");
    const latency = bestOf(e2eRows.length > 0 ? e2eRows : avgRows, true);

    // Price
    const price = bestOf(rows.filter((r) => r.metricName === "price_per_minute"), true);

    // Most recent collectedAt across all results for this vendor
    const dates = rows.map((r) => r.collectedAt).filter(Boolean);
    const lastUpdated = dates.length
      ? dates.reduce((a, b) => (a > b ? a : b))
      : null;

    return {
      vendorSlug: slug,
      vendorName: rows[0]!.vendor.name,
      modelName:  wer?.modelName ?? rtf?.modelName ?? latency?.modelName ?? rows[0]!.modelName,
      wer,
      rtf,
      latency,
      price,
      lastUpdated,
    };
  });
}

function fmtVal(r: BenchmarkResult | null): string {
  if (!r) return "—";
  const n = parseFloat(r.metricValue);
  if (isNaN(n)) return "—";
  const u = r.metricUnit;
  if (u === "%")          return `${n.toFixed(1)} %`;
  if (u === "ratio")      return n.toFixed(3);
  if (u === "ms")         return `${Math.round(n).toLocaleString()} ms`;
  if (u.includes("min"))  return `$${n.toFixed(4)} / min`;
  return String(n);
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Summary sub-components ────────────────────────────────────────────────────

function SummaryDataCell({ r }: { r: BenchmarkResult | null }) {
  const display = fmtVal(r);
  return (
    <td
      className="px-4 py-3 text-sm tabular-nums"
      style={{ color: display === "—" ? "var(--muted-foreground)" : "var(--foreground)" }}
    >
      {display}
    </td>
  );
}

const SUMMARY_HEADERS = [
  "Vendor",
  "Model",
  "WER (Common Voice preferred)",
  "RTF",
  "End-to-End Latency",
  "Price / min",
  "Last Updated",
];

function SummaryVendorRow({
  slug,
  name,
  row,
}: {
  slug: string;
  name: string;
  row: SummaryRow | null;
}) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <VendorLogo name={name} slug={slug} size={28} />
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {name}
          </span>
        </div>
      </td>
      <td
        className="px-4 py-3 text-xs"
        style={{ color: "var(--muted-foreground)", maxWidth: 200 }}
        title={row?.modelName}
      >
        <span className="line-clamp-2">{row?.modelName ?? "—"}</span>
      </td>
      <SummaryDataCell r={row?.wer     ?? null} />
      <SummaryDataCell r={row?.rtf     ?? null} />
      <SummaryDataCell r={row?.latency ?? null} />
      <SummaryDataCell r={row?.price   ?? null} />
      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
        {row ? fmtDate(row.lastUpdated) : "—"}
      </td>
    </tr>
  );
}

// ── Summary view ──────────────────────────────────────────────────────────────

function SummaryView({ results }: { results: BenchmarkResult[] }) {
  const rows = buildSummaryRows(results);

  const priorityRows = PRIORITY_VENDORS.map((pv) => ({
    config: pv,
    row: rows.find((r) => matchesPriority(r.vendorSlug, pv)) ?? null,
  }));

  const matchedSlugs = new Set(
    rows
      .filter((r) => PRIORITY_VENDORS.some((pv) => matchesPriority(r.vendorSlug, pv)))
      .map((r) => r.vendorSlug),
  );
  const otherRows = rows.filter((r) => !matchedSlugs.has(r.vendorSlug));

  if (results.length === 0) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Database className="h-10 w-10 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No benchmark data yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Click &quot;Run AI Collector&quot; to fetch the latest benchmarks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[740px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: `rgba(124,58,237,0.03)` }}>
              {SUMMARY_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Priority vendors — always rendered, "—" if no data */}
            {priorityRows.map(({ config, row }) => (
              <SummaryVendorRow
                key={config.display}
                slug={row?.vendorSlug ?? config.slugMatches[0]!}
                name={row?.vendorName ?? config.display}
                row={row}
              />
            ))}

            {/* Other vendors */}
            {otherRows.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={SUMMARY_HEADERS.length}
                    className="px-4 py-2"
                    style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Other Vendors
                    </span>
                  </td>
                </tr>
                {otherRows.map((row) => (
                  <SummaryVendorRow
                    key={row.vendorSlug}
                    slug={row.vendorSlug}
                    name={row.vendorName}
                    row={row}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--border)", background: `rgba(124,58,237,0.02)` }}
      >
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          WER uses CommonVoice dataset where available; falls back to next available dataset. All values
          reflect the best-performing model per vendor per metric.
        </p>
      </div>
    </Card>
  );
}

// ── Detailed sub-components ───────────────────────────────────────────────────

function DetailSectionTable({
  sectionMetrics,
  results,
}: {
  sectionMetrics: readonly string[];
  results: BenchmarkResult[];
}) {
  const rows = results
    .filter((r) => sectionMetrics.includes(r.metricName))
    .sort((a, b) => parseFloat(a.metricValue) - parseFloat(b.metricValue));

  if (!rows.length) {
    return (
      <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        No data collected for this category yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", background: `rgba(124,58,237,0.02)` }}>
            {["Vendor", "Model", "Metric", "Value", "Status", "Dataset", "Source", "Collected"].map(
              (col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const numVal = parseFloat(r.metricValue);
            const rating = evaluateMetric(r.metricName, numVal, "STT");
            const def    = findMetric(r.metricName, "STT");
            const st     = STATUS_STYLES[rating];

            return (
              <tr
                key={r.id}
                style={{
                  borderBottom: idx < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <VendorLogo name={r.vendor.name} slug={r.vendor.slug} size={24} />
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {r.vendor.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {r.modelName}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: `rgba(124,58,237,0.08)`,
                      color: ACCENT,
                      border: `1px solid rgba(124,58,237,0.2)`,
                    }}
                  >
                    {def ? def.label : r.metricName}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: "var(--foreground)" }}>
                  {numVal.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  <span className="ml-1 text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                    {r.metricUnit}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                    {st.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {r.dataset}
                </td>
                <td className="px-4 py-3 text-sm">
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                    style={{ color: ACCENT }}
                    aria-label={`${r.sourceName} (opens in new tab)`}
                  >
                    {r.sourceName}
                  </a>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(r.collectedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Detailed view ─────────────────────────────────────────────────────────────

function DetailedView({ results }: { results: BenchmarkResult[] }) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      {/* Section jump links */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const count = results.filter((r) => (s.metrics as ReadonlyArray<string>).includes(r.metricName)).length;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: `rgba(124,58,237,0.08)`,
                color: ACCENT,
                border: `1px solid rgba(124,58,237,0.2)`,
              }}
            >
              {s.label}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: `rgba(124,58,237,0.15)`, color: ACCENT }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* One card per section */}
      {SECTIONS.map((section) => {
        const sectionCount = results.filter((r) => (section.metrics as ReadonlyArray<string>).includes(r.metricName)).length;
        return (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                {section.label}
              </h3>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {sectionCount} result{sectionCount !== 1 ? "s" : ""}
              </span>
            </div>
            <Card className="glass-card border-0 overflow-hidden">
              <DetailSectionTable sectionMetrics={section.metrics} results={results} />
            </Card>
          </div>
        );
      })}

      {/* Status legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
        {(["good", "warning", "poor"] as const).map((r) => (
          <span key={r} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_STYLES[r].color }} />
            {STATUS_STYLES[r].label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function STTIndustryBenchmarks() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [view, setView]       = useState<ViewMode>("summary");

  async function fetchBenchmarks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/benchmarks?type=STT");
      if (!res.ok) {
        setError(`API error (${res.status}): ${(await res.text()).slice(0, 200)}`);
        setResults([]);
      } else {
        setResults(await res.json());
      }
    } catch (err) {
      setError(String(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  async function triggerCollector() {
    setRunning(true);
    try {
      await fetch("/api/agents/benchmark-collector", { method: "POST" });
      await fetchBenchmarks();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Disclaimer banner + Run AI Collector ─────────────────────────── */}
      <div className="flex items-start gap-3 flex-wrap">
        <div
          className="flex-1 flex gap-3 rounded-lg px-4 py-3 text-sm min-w-0"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.25)",
            color: "var(--foreground)",
          }}
        >
          <span className="mt-0.5 shrink-0 text-base" style={{ color: "#3b82f6" }}>ℹ</span>
          <span>
            External benchmarks reflect performance on publicly available datasets and do not fully capture
            contact center conditions. For evaluation against real CCaaS tasks, see the{" "}
            <button
              className="underline underline-offset-2 font-medium"
              style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => {
                const trigger = document.querySelector<HTMLButtonElement>(
                  '[data-radix-collection-item][value="our-results"]',
                );
                trigger?.click();
              }}
            >
              Our Results
            </button>{" "}
            tab.
          </span>
        </div>
        <button
          onClick={triggerCollector}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 shrink-0"
          style={{ background: `linear-gradient(135deg,${ACCENT},#6d28d9)` }}
        >
          {running ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Collecting…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run AI Collector
            </>
          )}
        </button>
      </div>

      {/* ── Summary | Detailed toggle ─────────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {(["summary", "detailed"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              view === v
                ? { background: `linear-gradient(135deg,${ACCENT},#6d28d9)`, color: "#fff" }
                : { color: "var(--muted-foreground)" }
            }
          >
            {v === "summary" ? "Summary" : "Detailed"}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <Card className="glass-card border-0">
          <CardContent
            role="status"
            aria-label="Loading benchmarks"
            className="flex items-center justify-center py-20"
          >
            <RefreshCw
              className="h-5 w-5 animate-spin mr-2"
              style={{ color: ACCENT }}
              aria-hidden="true"
            />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Loading benchmarks…
            </span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="glass-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-10 w-10 mb-3" style={{ color: "#ef4444", opacity: 0.5 }} />
            <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
              Failed to load benchmarks
            </p>
            <p className="text-xs mt-1 max-w-md" style={{ color: "var(--muted-foreground)" }}>
              {error}
            </p>
          </CardContent>
        </Card>
      ) : view === "summary" ? (
        <SummaryView results={results} />
      ) : (
        <DetailedView results={results} />
      )}
    </div>
  );
}
