"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Shield,
  Cloud,
  Server,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Activity,
  Mic,
  Volume2,
  MessageSquare,
  X,
  ExternalLink,
  LayoutGrid,
  LayoutList,
  AlignJustify,
} from "lucide-react";
import { VendorLogo } from "@/components/vendor-logo";
import { GlossaryTerm } from "@/components/glossary-term";

// ─── AA benchmark data (loaded from static JSON) ──────────────────────────────

interface AAModel {
  vendor_slug:            string;
  model_name:             string;
  aa_quality_score:       number;
  aa_speed_score:         number;
  aa_rank:                number;
  aa_source_url:          string;
  aa_price_per_hour?:     number;
  aa_latency_ms?:         number;
  aa_price_per_1m_chars?: number;
  aa_ttfa_ms?:            number;
  aa_elo?:                number;
  vendor_name?:           string;
}

// Inline the AA data so it's available without an extra API round-trip.
// Update by running: npm run fetch-benchmarks
import sttAA  from "@/data/benchmarks/artificialanalysis_stt.json";
import ttsAA  from "@/data/benchmarks/artificialanalysis_tts.json";
import s2sAA  from "@/data/benchmarks/artificialanalysis_s2s.json";

const ALL_AA: AAModel[] = [
  ...(sttAA.models as unknown as AAModel[]),
  ...(ttsAA.models as unknown as AAModel[]),
  ...(s2sAA.models as unknown as AAModel[]),
];

const AA_LAST_UPDATED = sttAA._meta.last_updated;
const AA_SOURCE_URL   = "https://artificialanalysis.ai";

function getAA(slug: string): AAModel | undefined {
  const s = slug.toLowerCase();
  return ALL_AA.find(
    (m) => s.includes(m.vendor_slug) || m.vendor_slug.includes(s.split("-")[0]!)
  );
}

function AAScoreBadge({ score }: { score: number }) {
  const style =
    score >= 80
      ? { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
      : score >= 60
        ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
        : { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={style}
      title={`Artificial Analysis quality score (0–100). Last updated ${AA_LAST_UPDATED}.`}
    >
      AA {score}
    </span>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface VendorSummary {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  foundedYear: number | null;
  hqLocation: string | null;
  products: Array<{ category: string }>;
  deploymentOptions: Array<{ type: string }>;
  benchmarkResults: Array<{
    metricName: string;
    metricValue: string;
    metricUnit: string;
    benchmarkType: string;
  }>;
  niceCompatibility: {
    buildVsBuyScore: number;
    cxoneIntegrationStatus: string;
  } | null;
  _count: { products: number; benchmarkResults: number; evaluations: number };
}

type TabType  = "all" | "STT" | "TTS" | "V2V";
type SortKey  = "name" | "accuracy" | "latency" | "cost" | "score" | "aa_score";

// ─── Helper components ────────────────────────────────────────────────────────

function AnimatedStat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold" style={{ color: "#ffffff" }}>
        {value}
        {suffix && <span className="text-lg font-normal" style={{ color: "rgba(0,212,232,0.8)" }}>{suffix}</span>}
      </div>
      <div className="mt-1 text-sm" style={{ color: "rgba(0,212,232,0.7)" }}>{label}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 7
      ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
      : score >= 4
        ? { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" }
        : { background: "rgba(239,68,68,0.1)",   color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={style}
      title="NICE Build-vs-Buy score (0–10)"
    >
      {score}/10
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, React.CSSProperties> = {
    Certified:                    { background: "rgba(0,212,232,0.15)",  color: "#00d4e8",  border: "1px solid rgba(0,212,232,0.3)" },
    Compatible:                   { background: "rgba(0,212,232,0.1)",   color: "#00d4e8",  border: "1px solid rgba(0,212,232,0.2)" },
    "Requires Custom Integration":{ background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    "Custom Required":            { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    "Not Compatible":             { background: "rgba(239,68,68,0.1)",   color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
    Unknown:                      { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" },
  };
  const s = styleMap[status] ?? { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={s}>
      {status}
    </span>
  );
}

function getTopMetric(vendor: VendorSummary, tab: TabType): { label: string; value: string } | null {
  const benchmarks = vendor.benchmarkResults.filter((b) => tab === "all" || b.benchmarkType === tab);
  if (!benchmarks.length) return null;
  const priority: Record<string, string[]> = {
    STT: ["WER", "CER", "avg_latency"],
    TTS: ["MOS", "naturalness", "TTFB"],
    V2V: ["task_completion_rate", "e2e_latency", "naturalness"],
  };
  const prio = tab !== "all" ? (priority[tab] ?? []) : ["WER", "MOS", "task_completion_rate"];
  for (const m of prio) {
    const found = benchmarks.find((b) => b.metricName === m);
    if (found) return { label: found.metricName.replace(/_/g, " "), value: `${found.metricValue}${found.metricUnit}` };
  }
  const first = benchmarks[0]!;
  return { label: first.metricName.replace(/_/g, " "), value: `${first.metricValue}${first.metricUnit}` };
}

function getVendorCategories(v: VendorSummary) { return [...new Set(v.products.map((p) => p.category))]; }
function getDeploymentTypes(v: VendorSummary)  { return [...new Set(v.deploymentOptions.map((d) => d.type))]; }

// ─── Keyboard-navigable tab group ────────────────────────────────────────────

function TabGroup({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[];
  active: TabType;
  onChange: (k: TabType) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % tabs.length;
      onChange(tabs[next]!.key);
      (ref.current?.children[next] as HTMLElement | undefined)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + tabs.length) % tabs.length;
      onChange(tabs[prev]!.key);
      (ref.current?.children[prev] as HTMLElement | undefined)?.focus();
    }
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label="Filter vendors by category"
      className="flex items-center gap-1 rounded-lg p-1"
      style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.12)" }}
    >
      {tabs.map((tab, idx) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          aria-controls="vendor-grid"
          id={`tab-${tab.key}`}
          tabIndex={active === tab.key ? 0 : -1}
          onClick={() => onChange(tab.key)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
          style={
            active === tab.key
              ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }
              : { color: "var(--muted-foreground)", border: "1px solid transparent" }
          }
        >
          <span aria-hidden="true">{tab.icon}</span>
          {tab.label}
          {tab.count != null && (
            <span
              className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
              style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8" }}
              aria-label={`${tab.count} vendors`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const router = useRouter();
  const [vendors,      setVendors]      = useState<VendorSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [runningAgent, setRunningAgent] = useState(false);

  const [activeTab,       setActiveTab]       = useState<TabType>("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [sortKey,         setSortKey]         = useState<SortKey>("name");
  const [showFilters,     setShowFilters]     = useState(false);
  const [deploymentFilter,setDeploymentFilter]= useState<string[]>([]);
  const [statusFilter,    setStatusFilter]    = useState<string[]>([]);
  const [viewMode,        setViewMode]        = useState<"card" | "grid" | "rows">("card");

  // aria-live region for dynamic result count
  const [announcement, setAnnouncement] = useState("");

  async function loadVendors() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error(`API error (${res.status}): ${await res.text()}`);
      setVendors(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function triggerAgent() {
    setRunningAgent(true);
    try {
      const res = await fetch("/api/agents/vendor-registry", { method: "POST" });
      if (!res.ok) throw new Error(`Agent error (${res.status})`);
      await loadVendors();
    } catch (e) {
      setError(String(e));
    } finally {
      setRunningAgent(false);
    }
  }

  useEffect(() => { void loadVendors(); }, []);

  const stats = useMemo(() => ({
    total:       vendors.length,
    activeEvals: vendors.reduce((s, v) => s + (v._count.evaluations ?? 0), 0),
    lastUpdate:  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }), [vendors]);

  const filteredVendors = useMemo(() => {
    let list = [...vendors];
    if (activeTab !== "all") list = list.filter((v) => v.products.some((p) => p.category === activeTab));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.hqLocation?.toLowerCase().includes(q)
      );
    }
    if (deploymentFilter.length) list = list.filter((v) => v.deploymentOptions.some((d) => deploymentFilter.includes(d.type)));
    if (statusFilter.length)     list = list.filter((v) => v.niceCompatibility && statusFilter.includes(v.niceCompatibility.cxoneIntegrationStatus));

    list.sort((a, b) => {
      switch (sortKey) {
        case "name":     return a.name.localeCompare(b.name);
        case "aa_score": return (getAA(b.slug)?.aa_quality_score ?? 0) - (getAA(a.slug)?.aa_quality_score ?? 0);
        case "score":    return (b.niceCompatibility?.buildVsBuyScore ?? 0) - (a.niceCompatibility?.buildVsBuyScore ?? 0);
        case "accuracy": {
          const ma = getTopMetric(a, activeTab); const mb = getTopMetric(b, activeTab);
          return (parseFloat(ma?.value ?? "999") || 999) - (parseFloat(mb?.value ?? "999") || 999);
        }
        case "latency": {
          const la = a.benchmarkResults.find((r) => r.metricName.includes("latency"));
          const lb = b.benchmarkResults.find((r) => r.metricName.includes("latency"));
          return (parseFloat(la?.metricValue ?? "9999") || 9999) - (parseFloat(lb?.metricValue ?? "9999") || 9999);
        }
        default: return 0;
      }
    });
    return list;
  }, [vendors, activeTab, searchQuery, sortKey, deploymentFilter, statusFilter]);

  // Announce filter results to screen readers
  useEffect(() => {
    setAnnouncement(`${filteredVendors.length} vendor${filteredVendors.length !== 1 ? "s" : ""} shown`);
  }, [filteredVendors.length]);

  const allDeployments = useMemo(
    () => [...new Set(vendors.flatMap((v) => v.deploymentOptions.map((d) => d.type)))].sort(),
    [vendors]
  );
  const allStatuses = useMemo(
    () => [...new Set(vendors.map((v) => v.niceCompatibility?.cxoneIntegrationStatus).filter(Boolean))] as string[],
    [vendors]
  );

  const catColors: Record<string, React.CSSProperties> = {
    STT: { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    TTS: { background: "rgba(0,212,232,0.12)",  color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" },
    V2V: { background: "rgba(0,180,120,0.12)",  color: "#34d399", border: "1px solid rgba(0,180,120,0.25)" },
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "all", label: "All Vendors", icon: <Building2    className="h-4 w-4" /> },
    { key: "STT", label: "STT",         icon: <Mic          className="h-4 w-4" />, count: vendors.filter((v) => v.products.some((p) => p.category === "STT")).length },
    { key: "TTS", label: "TTS",         icon: <Volume2      className="h-4 w-4" />, count: vendors.filter((v) => v.products.some((p) => p.category === "TTS")).length },
    { key: "V2V", label: "V2V",         icon: <MessageSquare className="h-4 w-4" />, count: vendors.filter((v) => v.products.some((p) => p.category === "V2V")).length },
  ];

  return (
    <div className="space-y-6">
      {/* aria-live region — announces filter result changes to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Hero */}
      <section
        aria-labelledby="vendors-heading"
        className="rounded-xl p-6 text-white shadow-lg relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--nice-navy-900) 0%, var(--nice-navy-700) 100%)", border: "1px solid rgba(0,212,232,0.2)" }}
      >
        <div className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 id="vendors-heading" className="text-2xl font-bold">
              <span className="gradient-text">Speech Technology</span>{" "}
              <span style={{ color: "#ffffff" }}>Vendor Registry</span>
            </h2>
            <p className="mt-1 text-sm" style={{ color: "rgba(0,212,232,0.7)" }}>
              Comprehensive catalog of vendors, models, benchmarks, and{" "}
              <GlossaryTerm term="CXone">NICE CXone</GlossaryTerm> compatibility
            </p>
          </div>
          <button
            onClick={triggerAgent}
            disabled={runningAgent}
            aria-label={runningAgent ? "Refreshing registry, please wait" : "Refresh vendor registry"}
            aria-busy={runningAgent}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)", color: "#00d4e8" }}
          >
            <RefreshCw className={`h-4 w-4 ${runningAgent ? "animate-spin" : ""}`} aria-hidden="true" />
            {runningAgent ? "Running..." : "Refresh Registry"}
          </button>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-6" role="group" aria-label="Registry statistics">
          <AnimatedStat label="Vendors Tracked" value={stats.total} />
          <AnimatedStat label="Evaluations Run" value={stats.activeEvals} />
          <AnimatedStat label="Last Updated"    value={stats.lastUpdate} />
        </div>
      </section>

      {/* AA data source banner */}
      <div
        className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-xs flex-wrap"
        style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.15)", color: "#94a3b8" }}
      >
        <span>
          External benchmark data sourced from{" "}
          <a
            href={AA_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-cyan-400 transition-colors"
            style={{ color: "#00d4e8" }}
            aria-label="Artificial Analysis benchmark source (opens in new tab)"
          >
            Artificial Analysis
            <ExternalLink className="inline h-3 w-3 ml-0.5" aria-hidden="true" />
          </a>
          {" "}and our internal evaluations. Last updated: {AA_LAST_UPDATED}.
        </span>
        <button
          onClick={() => void loadVendors()}
          className="text-xs underline hover:opacity-80"
          style={{ color: "#00d4e8" }}
        >
          Refresh
        </button>
      </div>

      {/* Tab navigation */}
      <TabGroup tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Search, Filter & Sort Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <label htmlFor="vendor-search" className="sr-only">Search vendors</label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
          <input
            id="vendor-search"
            type="search"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-card w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
            style={{ color: "var(--foreground)" }}
            aria-label="Search vendors by name, description, or location"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
          style={
            showFilters || deploymentFilter.length > 0 || statusFilter.length > 0
              ? { background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)", color: "#00d4e8" }
              : { background: "rgba(255,255,255,0.6)", border: "1px solid var(--border)", color: "var(--foreground)" }
          }
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {(deploymentFilter.length + statusFilter.length > 0) && (
            <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: "#00d4e8", color: "#060f2e" }}>
              {deploymentFilter.length + statusFilter.length}
            </span>
          )}
        </button>

        <div className="relative">
          <label htmlFor="sort-select" className="sr-only">Sort vendors by</label>
          <select
            id="sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="glass-card appearance-none rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none"
            style={{ color: "var(--foreground)" }}
          >
            <option value="name">Sort: Name</option>
            <option value="aa_score">Sort: AA Quality Score</option>
            <option value="accuracy">Sort: Accuracy</option>
            <option value="latency">Sort: Latency</option>
            <option value="score">Sort: Build vs Buy Score</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
        </div>

        {/* View mode toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          role="group"
          aria-label="Switch view mode"
          style={{ border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setViewMode("card")}
            title="Card view"
            aria-pressed={viewMode === "card"}
            className="px-3 py-2 transition-all"
            style={
              viewMode === "card"
                ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8" }
                : { background: "transparent", color: "var(--muted-foreground)" }
            }
          >
            <LayoutList className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Compact grid view"
            aria-pressed={viewMode === "grid"}
            className="px-3 py-2 transition-all"
            style={
              viewMode === "grid"
                ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8" }
                : { background: "transparent", color: "var(--muted-foreground)" }
            }
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setViewMode("rows")}
            title="Detail rows view"
            aria-pressed={viewMode === "rows"}
            className="px-3 py-2 transition-all"
            style={
              viewMode === "rows"
                ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8" }
                : { background: "transparent", color: "var(--muted-foreground)" }
            }
          >
            <AlignJustify className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div id="filter-panel" className="glass-card rounded-lg p-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#00d4e8" }}>Deployment</legend>
              <div className="flex flex-wrap gap-2">
                {allDeployments.map((d) => (
                  <button
                    key={d}
                    role="checkbox"
                    aria-checked={deploymentFilter.includes(d)}
                    onClick={() => setDeploymentFilter((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d])}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all"
                    style={
                      deploymentFilter.includes(d)
                        ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8",           border: "1px solid rgba(0,212,232,0.3)" }
                        : { background: "rgba(0,0,0,0.05)",     color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                    }
                  >
                    {d === "Cloud" && <Cloud  className="h-3 w-3" aria-hidden="true" />}
                    {d === "OnPrem" && <Server className="h-3 w-3" aria-hidden="true" />}
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#00d4e8" }}>
                <GlossaryTerm term="CXone">NICE CXone</GlossaryTerm> Status
              </legend>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    role="checkbox"
                    aria-checked={statusFilter.includes(s)}
                    onClick={() => setStatusFilter((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all"
                    style={
                      statusFilter.includes(s)
                        ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8",           border: "1px solid rgba(0,212,232,0.3)" }
                        : { background: "rgba(0,0,0,0.05)",     color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            {(deploymentFilter.length + statusFilter.length > 0) && (
              <div className="flex items-end">
                <button
                  onClick={() => { setDeploymentFilter([]); setStatusFilter([]); }}
                  className="text-xs hover:underline"
                  style={{ color: "#00d4e8" }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div role="status" aria-label="Loading vendors" className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#00d4e8" }} aria-hidden="true" />
          <span className="sr-only">Loading vendors…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredVendors.length === 0 && !error && (
        <div className="glass-card rounded-xl py-12 text-center">
          <Building2 className="mx-auto h-12 w-12" style={{ color: "rgba(0,212,232,0.3)" }} aria-hidden="true" />
          <p className="mt-4" style={{ color: "var(--muted-foreground)" }}>
            {vendors.length === 0
              ? "No vendors found. Run the seed script or the Registry Agent."
              : "No vendors match the current filters."}
          </p>
        </div>
      )}

      {/* Result count */}
      {!loading && filteredVendors.length > 0 && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }} aria-live="polite">
          Showing <span style={{ color: "#00d4e8", fontWeight: 600 }}>{filteredVendors.length}</span> of {vendors.length} vendors
        </p>
      )}

      {/* Vendor grid — card view */}
      {!loading && filteredVendors.length > 0 && viewMode === "card" && (
        <div
          id="vendor-grid"
          role="region"
          aria-labelledby={`tab-${activeTab}`}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        >
          {filteredVendors.map((vendor) => {
            const categories  = getVendorCategories(vendor);
            const deployments = getDeploymentTypes(vendor);
            const topMetric   = getTopMetric(vendor, activeTab);
            const aa          = getAA(vendor.slug);

            return (
              <div
                key={vendor.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/vendors/${vendor.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/vendors/${vendor.slug}`);
                  }
                }}
                className="group glass-card ai-glow rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={`${vendor.name} vendor profile — ${categories.join(", ")}`}
              >
                {/* Card header: logo + name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <VendorLogo name={vendor.name} slug={vendor.slug} size={44} />
                    <div>
                      <h3 className="font-semibold transition-colors" style={{ color: "var(--foreground)" }}>
                        {vendor.name}
                      </h3>
                      {vendor.hqLocation && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{vendor.hqLocation}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {aa && <AAScoreBadge score={aa.aa_quality_score} />}
                    <ChevronRight className="h-4 w-4 transition-colors" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
                  </div>
                </div>

                {/* AA rank badge */}
                {aa && (
                  <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
                    <span>Ranked <strong style={{ color: "#00d4e8" }}>#{aa.aa_rank}</strong> on</span>
                    <a
                      href={aa.aa_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="underline hover:opacity-80"
                      style={{ color: "#00d4e8" }}
                      aria-label={`${vendor.name} ranked #${aa.aa_rank} on Artificial Analysis (opens in new tab)`}
                    >
                      Artificial Analysis
                    </a>
                    {aa.aa_price_per_hour != null && (
                      <span>· ${aa.aa_price_per_hour.toFixed(2)}/hr</span>
                    )}
                  </div>
                )}

                {/* Category + deployment badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={catColors[cat] ?? { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }}
                    >
                      {cat}
                    </span>
                  ))}
                  {deployments.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ background: "rgba(0,0,0,0.04)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                    >
                      {d === "Cloud"  ? <Cloud  className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                      {d === "OnPrem" ? <Server className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                      {d}
                    </span>
                  ))}
                </div>

                {/* Top internal metric */}
                {topMetric && (
                  <div
                    className="mt-3 flex items-center gap-2 rounded-md px-3 py-2"
                    style={{ background: "rgba(0,212,232,0.07)", border: "1px solid rgba(0,212,232,0.12)" }}
                  >
                    <Activity className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} aria-hidden="true" />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <GlossaryTerm term={topMetric.label.toUpperCase()} noUnderline>
                        {topMetric.label}
                      </GlossaryTerm>:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "#00d4e8" }}>{topMetric.value}</span>
                  </div>
                )}

                {/* Stats row */}
                <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {vendor._count.products        > 0 && <span>{vendor._count.products}        products</span>}
                  {vendor._count.benchmarkResults > 0 && <span>{vendor._count.benchmarkResults} benchmarks</span>}
                  {vendor._count.evaluations      > 0 && <span>{vendor._count.evaluations}      evaluations</span>}
                </div>

                {/* NICE compatibility footer */}
                {vendor.niceCompatibility && (
                  <div
                    className="mt-3 flex items-center gap-2 pt-3"
                    style={{ borderTop: "1px solid rgba(0,212,232,0.1)" }}
                  >
                    <Shield className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} aria-hidden="true" />
                    <StatusBadge status={vendor.niceCompatibility.cxoneIntegrationStatus} />
                    <span style={{ color: "rgba(0,212,232,0.3)" }} aria-hidden="true">|</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <GlossaryTerm term="Build vs Buy">Score</GlossaryTerm>:
                    </span>
                    <ScoreBadge score={vendor.niceCompatibility.buildVsBuyScore} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor list — detail rows view */}
      {!loading && filteredVendors.length > 0 && viewMode === "rows" && (
        <div
          id="vendor-grid"
          role="region"
          aria-labelledby={`tab-${activeTab}`}
          className="flex flex-col divide-y"
          style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border)" }}
        >
          {filteredVendors.map((vendor) => {
            const categories  = getVendorCategories(vendor);
            const deployments = getDeploymentTypes(vendor);
            const topMetric   = getTopMetric(vendor, activeTab);
            const aa          = getAA(vendor.slug);

            return (
              <div
                key={vendor.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/vendors/${vendor.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/vendors/${vendor.slug}`);
                  }
                }}
                className="group flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-[rgba(0,212,232,0.04)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                style={{ background: "var(--card)" }}
                aria-label={`${vendor.name} vendor profile — ${categories.join(", ")}`}
              >
                {/* Logo */}
                <div className="shrink-0">
                  <VendorLogo name={vendor.name} slug={vendor.slug} size={36} />
                </div>

                {/* Name + location */}
                <div className="w-40 shrink-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                    {vendor.name}
                  </p>
                  {vendor.hqLocation && (
                    <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{vendor.hqLocation}</p>
                  )}
                </div>

                {/* Categories + deployments */}
                <div className="hidden sm:flex flex-wrap gap-1 flex-1 min-w-0">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                      style={catColors[cat] ?? { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }}
                    >
                      {cat}
                    </span>
                  ))}
                  {deployments.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap"
                      style={{ background: "rgba(0,0,0,0.04)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                    >
                      {d === "Cloud"  ? <Cloud  className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                      {d === "OnPrem" ? <Server className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                      {d}
                    </span>
                  ))}
                </div>

                {/* AA score */}
                <div className="hidden md:flex shrink-0 items-center gap-1.5">
                  {aa ? (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }}
                    >
                      AA {aa.aa_quality_score}
                    </span>
                  ) : (
                    <span className="text-xs w-14" style={{ color: "var(--muted-foreground)" }}>—</span>
                  )}
                </div>

                {/* Top metric */}
                <div className="hidden lg:flex shrink-0 w-36 items-center gap-1.5">
                  {topMetric ? (
                    <>
                      <Activity className="h-3.5 w-3.5 shrink-0" style={{ color: "#00d4e8" }} aria-hidden="true" />
                      <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{topMetric.label}:</span>
                      <span className="text-sm font-semibold shrink-0" style={{ color: "#00d4e8" }}>{topMetric.value}</span>
                    </>
                  ) : null}
                </div>

                {/* CXone status + Build vs Buy */}
                <div className="hidden xl:flex shrink-0 items-center gap-2">
                  {vendor.niceCompatibility ? (
                    <>
                      <StatusBadge status={vendor.niceCompatibility.cxoneIntegrationStatus} />
                      <ScoreBadge score={vendor.niceCompatibility.buildVsBuyScore} />
                    </>
                  ) : null}
                </div>

                {/* Arrow */}
                <ChevronRight className="ml-auto shrink-0 h-4 w-4 transition-colors" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor grid — compact grid view */}
      {!loading && filteredVendors.length > 0 && viewMode === "grid" && (
        <div
          id="vendor-grid"
          role="region"
          aria-labelledby={`tab-${activeTab}`}
          className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10"
        >
          {filteredVendors.map((vendor) => {
            const categories = getVendorCategories(vendor);
            const aa         = getAA(vendor.slug);

            return (
              <div
                key={vendor.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/vendors/${vendor.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/vendors/${vendor.slug}`);
                  }
                }}
                className="group glass-card rounded-xl p-3 flex flex-col items-center gap-2 text-center transition-all hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                style={{ minWidth: 0 }}
                aria-label={`${vendor.name} — ${categories.join(", ")}`}
                title={vendor.name}
              >
                {/* Logo */}
                <VendorLogo name={vendor.name} slug={vendor.slug} size={40} />

                {/* Name */}
                <p
                  className="w-full truncate text-xs font-semibold leading-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  {vendor.name}
                </p>

                {/* Category badges */}
                <div className="flex flex-wrap justify-center gap-1">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
                      style={catColors[cat] ?? { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* AA quality score */}
                {aa && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
                    style={{ background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }}
                  >
                    AA {aa.aa_quality_score}
                  </span>
                )}

                {/* CXone status dot */}
                {vendor.niceCompatibility && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    title={`CXone: ${vendor.niceCompatibility.cxoneIntegrationStatus}`}
                    style={{
                      background:
                        vendor.niceCompatibility.cxoneIntegrationStatus === "Certified"  ? "#00d4e8"
                        : vendor.niceCompatibility.cxoneIntegrationStatus === "Compatible" ? "#00d4e8"
                        : vendor.niceCompatibility.cxoneIntegrationStatus === "Not Compatible" ? "#ef4444"
                        : "#a855f7",
                    }}
                    aria-label={`CXone status: ${vendor.niceCompatibility.cxoneIntegrationStatus}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
