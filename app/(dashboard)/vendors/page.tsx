"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";

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
  _count: {
    products: number;
    benchmarkResults: number;
    evaluations: number;
  };
}

type TabType = "all" | "STT" | "TTS" | "V2V";
type SortKey = "name" | "accuracy" | "latency" | "cost" | "score";

// ─── Helper Components ───────────────────────────────────────────────────────

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
        : { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={style}>
      {score}/10
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, React.CSSProperties> = {
    Certified: { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
    Compatible: { background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.2)" },
    "Requires Custom Integration": { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    "Custom Required": { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    "Not Compatible": { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
    Unknown: { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" },
  };
  const s = styleMap[status] ?? { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={s}>
      {status}
    </span>
  );
}

function getTopMetric(vendor: VendorSummary, tab: TabType): { label: string; value: string } | null {
  const benchmarks = vendor.benchmarkResults.filter(
    (b) => tab === "all" || b.benchmarkType === tab
  );
  if (benchmarks.length === 0) return null;

  const priority: Record<string, string[]> = {
    STT: ["WER", "CER", "avg_latency"],
    TTS: ["MOS", "naturalness", "TTFB"],
    V2V: ["task_completion_rate", "e2e_latency", "naturalness"],
  };
  const prio: string[] = tab !== "all" ? (priority[tab] ?? []) : ["WER", "MOS", "task_completion_rate"];

  for (const metricName of prio) {
    const found = benchmarks.find((b) => b.metricName === metricName);
    if (found) {
      return {
        label: found.metricName.replace(/_/g, " "),
        value: `${found.metricValue}${found.metricUnit}`,
      };
    }
  }
  const first = benchmarks[0];
  if (!first) return null;
  return { label: first.metricName.replace(/_/g, " "), value: `${first.metricValue}${first.metricUnit}` };
}

function getVendorCategories(vendor: VendorSummary): string[] {
  return [...new Set(vendor.products.map((p) => p.category))];
}

function getDeploymentTypes(vendor: VendorSummary): string[] {
  return [...new Set(vendor.deploymentOptions.map((d) => d.type))];
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAgent, setRunningAgent] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [showFilters, setShowFilters] = useState(false);
  const [deploymentFilter, setDeploymentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

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

  useEffect(() => {
    loadVendors();
  }, []);

  const stats = useMemo(() => {
    const total = vendors.length;
    const activeEvals = vendors.reduce((sum, v) => sum + (v._count.evaluations ?? 0), 0);
    const lastUpdate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return { total, activeEvals, lastUpdate };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    let list = [...vendors];

    if (activeTab !== "all") {
      list = list.filter((v) => v.products.some((p) => p.category === activeTab));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.hqLocation?.toLowerCase().includes(q)
      );
    }

    if (deploymentFilter.length > 0) {
      list = list.filter((v) =>
        v.deploymentOptions.some((d) => deploymentFilter.includes(d.type))
      );
    }

    if (statusFilter.length > 0) {
      list = list.filter(
        (v) => v.niceCompatibility && statusFilter.includes(v.niceCompatibility.cxoneIntegrationStatus)
      );
    }

    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "score": {
          const sa = a.niceCompatibility?.buildVsBuyScore ?? 0;
          const sb = b.niceCompatibility?.buildVsBuyScore ?? 0;
          return sb - sa;
        }
        case "accuracy": {
          const ma = getTopMetric(a, activeTab);
          const mb = getTopMetric(b, activeTab);
          return (parseFloat(ma?.value ?? "999") || 999) - (parseFloat(mb?.value ?? "999") || 999);
        }
        case "latency": {
          const la = a.benchmarkResults.find((r) => r.metricName.includes("latency"));
          const lb = b.benchmarkResults.find((r) => r.metricName.includes("latency"));
          return (parseFloat(la?.metricValue ?? "9999") || 9999) - (parseFloat(lb?.metricValue ?? "9999") || 9999);
        }
        case "cost":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return list;
  }, [vendors, activeTab, searchQuery, sortKey, deploymentFilter, statusFilter]);

  const allDeployments = useMemo(
    () => [...new Set(vendors.flatMap((v) => v.deploymentOptions.map((d) => d.type)))].sort(),
    [vendors]
  );
  const allStatuses = useMemo(
    () =>
      [...new Set(vendors.map((v) => v.niceCompatibility?.cxoneIntegrationStatus).filter(Boolean))] as string[],
    [vendors]
  );

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All Vendors", icon: <Building2 className="h-4 w-4" /> },
    { key: "STT", label: "STT", icon: <Mic className="h-4 w-4" /> },
    { key: "TTS", label: "TTS", icon: <Volume2 className="h-4 w-4" /> },
    { key: "V2V", label: "V2V", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const catColors: Record<string, React.CSSProperties> = {
    STT: { background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" },
    TTS: { background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" },
    V2V: { background: "rgba(0,180,120,0.12)", color: "#34d399", border: "1px solid rgba(0,180,120,0.25)" },
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div
        className="rounded-xl p-6 text-white shadow-lg relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--nice-navy-900) 0%, var(--nice-navy-700) 100%)", border: "1px solid rgba(0,212,232,0.2)" }}
      >
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Speech Technology</span>{" "}
              <span style={{ color: "#ffffff" }}>Vendor Registry</span>
            </h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(0,212,232,0.7)" }}>
              Comprehensive catalog of vendors, models, benchmarks, and NICE CXone compatibility
            </p>
          </div>
          <button
            onClick={triggerAgent}
            disabled={runningAgent}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)", color: "#00d4e8" }}
          >
            <RefreshCw className={`h-4 w-4 ${runningAgent ? "animate-spin" : ""}`} />
            {runningAgent ? "Running..." : "Refresh Registry"}
          </button>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-6">
          <AnimatedStat label="Vendors Tracked" value={stats.total} />
          <AnimatedStat label="Evaluations Run" value={stats.activeEvals} />
          <AnimatedStat label="Last Updated" value={stats.lastUpdate} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex items-center gap-1 rounded-lg p-1"
        style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.12)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
            style={
              activeTab === tab.key
                ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }
                : { color: "var(--muted-foreground)", border: "1px solid transparent" }
            }
          >
            {tab.icon}
            {tab.label}
            {tab.key !== "all" && (
              <span
                className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
                style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8" }}
              >
                {vendors.filter((v) => v.products.some((p) => p.category === tab.key)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-card w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
            style={{ color: "var(--foreground)" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
          style={
            showFilters || deploymentFilter.length > 0 || statusFilter.length > 0
              ? { background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)", color: "#00d4e8" }
              : { background: "rgba(255,255,255,0.6)", border: "1px solid var(--border)", color: "var(--foreground)" }
          }
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(deploymentFilter.length + statusFilter.length > 0) && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{ background: "#00d4e8", color: "#060f2e" }}
            >
              {deploymentFilter.length + statusFilter.length}
            </span>
          )}
        </button>

        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="glass-card appearance-none rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none"
            style={{ color: "var(--foreground)" }}
          >
            <option value="name">Sort: Name</option>
            <option value="accuracy">Sort: Accuracy</option>
            <option value="latency">Sort: Latency</option>
            <option value="score">Sort: Build vs Buy Score</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-card rounded-lg p-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#00d4e8" }}>Deployment</p>
              <div className="flex flex-wrap gap-2">
                {allDeployments.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setDeploymentFilter((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all"
                    style={
                      deploymentFilter.includes(d)
                        ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
                        : { background: "rgba(0,0,0,0.05)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                    }
                  >
                    {d === "Cloud" && <Cloud className="h-3 w-3" />}
                    {d === "OnPrem" && <Server className="h-3 w-3" />}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#00d4e8" }}>NICE CXone Status</p>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setStatusFilter((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all"
                    style={
                      statusFilter.includes(s)
                        ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
                        : { background: "rgba(0,0,0,0.05)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(deploymentFilter.length + statusFilter.length > 0) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDeploymentFilter([]);
                    setStatusFilter([]);
                  }}
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
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "#00d4e8" }} />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredVendors.length === 0 && !error && (
        <div className="glass-card rounded-xl py-12 text-center">
          <Building2 className="mx-auto h-12 w-12" style={{ color: "rgba(0,212,232,0.3)" }} />
          <p className="mt-4" style={{ color: "var(--muted-foreground)" }}>
            {vendors.length === 0
              ? "No vendors found. Run the seed script or the Registry Agent."
              : "No vendors match the current filters."}
          </p>
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredVendors.length > 0 && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Showing <span style={{ color: "#00d4e8", fontWeight: 600 }}>{filteredVendors.length}</span> of {vendors.length} vendors
        </p>
      )}

      {/* Vendor Card Grid */}
      {!loading && filteredVendors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => {
            const categories = getVendorCategories(vendor);
            const deployments = getDeploymentTypes(vendor);
            const topMetric = getTopMetric(vendor, activeTab);

            return (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.slug}`}
                className="group glass-card ai-glow rounded-xl p-5 transition-all hover:shadow-lg block"
                style={{ textDecoration: "none" }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg font-bold text-sm shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--nice-cyan-500), var(--nice-purple-500))", color: "#ffffff" }}
                    >
                      {vendor.name.charAt(0)}
                    </div>
                    <div>
                      <h3
                        className="font-semibold transition-colors"
                        style={{ color: "var(--foreground)" }}
                      >
                        {vendor.name}
                      </h3>
                      {vendor.hqLocation && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{vendor.hqLocation}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-colors" style={{ color: "var(--muted-foreground)" }} />
                </div>

                {/* Category Badges */}
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
                      {d === "Cloud" ? <Cloud className="h-2.5 w-2.5" /> : d === "OnPrem" ? <Server className="h-2.5 w-2.5" /> : null}
                      {d}
                    </span>
                  ))}
                </div>

                {/* Top Metric */}
                {topMetric && (
                  <div
                    className="mt-3 flex items-center gap-2 rounded-md px-3 py-2"
                    style={{ background: "rgba(0,212,232,0.07)", border: "1px solid rgba(0,212,232,0.12)" }}
                  >
                    <Activity className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{topMetric.label}:</span>
                    <span className="text-sm font-semibold" style={{ color: "#00d4e8" }}>{topMetric.value}</span>
                  </div>
                )}

                {/* Stats Row */}
                <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {vendor._count.products > 0 && (
                    <span>{vendor._count.products} products</span>
                  )}
                  {vendor._count.benchmarkResults > 0 && (
                    <span>{vendor._count.benchmarkResults} benchmarks</span>
                  )}
                  {vendor._count.evaluations > 0 && (
                    <span>{vendor._count.evaluations} evaluations</span>
                  )}
                </div>

                {/* NICE Compatibility Footer */}
                {vendor.niceCompatibility && (
                  <div
                    className="mt-3 flex items-center gap-2 pt-3"
                    style={{ borderTop: "1px solid rgba(0,212,232,0.1)" }}
                  >
                    <Shield className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} />
                    <StatusBadge status={vendor.niceCompatibility.cxoneIntegrationStatus} />
                    <span style={{ color: "rgba(0,212,232,0.3)" }}>|</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Score:</span>
                    <ScoreBadge score={vendor.niceCompatibility.buildVsBuyScore} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
