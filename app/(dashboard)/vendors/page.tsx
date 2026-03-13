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
      <div className="text-3xl font-bold text-white">
        {value}
        {suffix && <span className="text-lg font-normal text-blue-200">{suffix}</span>}
      </div>
      <div className="mt-1 text-sm text-blue-200">{label}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7
      ? "bg-green-100 text-green-800"
      : score >= 4
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {score}/10
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Certified: "bg-green-100 text-green-800",
    Compatible: "bg-blue-100 text-blue-800",
    "Requires Custom Integration": "bg-yellow-100 text-yellow-800",
    "Custom Required": "bg-yellow-100 text-yellow-800",
    "Not Compatible": "bg-red-100 text-red-800",
    Unknown: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function getTopMetric(vendor: VendorSummary, tab: TabType): { label: string; value: string } | null {
  const benchmarks = vendor.benchmarkResults.filter(
    (b) => tab === "all" || b.benchmarkType === tab
  );
  if (benchmarks.length === 0) return null;

  // Priority metrics per type
  const priority: Record<string, string[]> = {
    STT: ["WER", "CER", "avg_latency"],
    TTS: ["MOS", "naturalness", "TTFB"],
    V2V: ["task_completion_rate", "e2e_latency", "naturalness"],
  };
  const prio = tab !== "all" ? priority[tab] : ["WER", "MOS", "task_completion_rate"];

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

  // Compute stats
  const stats = useMemo(() => {
    const total = vendors.length;
    const activeEvals = vendors.reduce((sum, v) => sum + (v._count.evaluations ?? 0), 0);
    const lastUpdate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return { total, activeEvals, lastUpdate };
  }, [vendors]);

  // Filtered & sorted vendors
  const filteredVendors = useMemo(() => {
    let list = [...vendors];

    // Tab filter
    if (activeTab !== "all") {
      list = list.filter((v) => v.products.some((p) => p.category === activeTab));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.hqLocation?.toLowerCase().includes(q)
      );
    }

    // Deployment filter
    if (deploymentFilter.length > 0) {
      list = list.filter((v) =>
        v.deploymentOptions.some((d) => deploymentFilter.includes(d.type))
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      list = list.filter(
        (v) => v.niceCompatibility && statusFilter.includes(v.niceCompatibility.cxoneIntegrationStatus)
      );
    }

    // Sort
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
          return a.name.localeCompare(b.name); // fallback
        default:
          return 0;
      }
    });

    return list;
  }, [vendors, activeTab, searchQuery, sortKey, deploymentFilter, statusFilter]);

  // All unique deployment types & statuses across vendors
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

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Speech Technology Vendor Registry</h1>
            <p className="mt-1 text-sm text-blue-200">
              Comprehensive catalog of vendors, models, benchmarks, and NICE CXone compatibility
            </p>
          </div>
          <button
            onClick={triggerAgent}
            disabled={runningAgent}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${runningAgent ? "animate-spin" : ""}`} />
            {runningAgent ? "Running..." : "Refresh Registry"}
          </button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-6">
          <AnimatedStat label="Vendors Tracked" value={stats.total} />
          <AnimatedStat label="Evaluations Run" value={stats.activeEvals} />
          <AnimatedStat label="Last Updated" value={stats.lastUpdate} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700">
                {vendors.filter((v) => v.products.some((p) => p.category === tab.key)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            showFilters || deploymentFilter.length > 0 || statusFilter.length > 0
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(deploymentFilter.length + statusFilter.length > 0) && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
              {deploymentFilter.length + statusFilter.length}
            </span>
          )}
        </button>

        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            <option value="name">Sort: Name</option>
            <option value="accuracy">Sort: Accuracy</option>
            <option value="latency">Sort: Latency</option>
            <option value="score">Sort: Build vs Buy Score</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Filter Sidebar (Inline) */}
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Deployment Type */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Deployment</p>
              <div className="flex flex-wrap gap-2">
                {allDeployments.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setDeploymentFilter((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      deploymentFilter.includes(d)
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {d === "Cloud" && <Cloud className="h-3 w-3" />}
                    {d === "OnPrem" && <Server className="h-3 w-3" />}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* CXone Integration Status */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">NICE CXone Status</p>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setStatusFilter((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter.includes(s)
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(deploymentFilter.length + statusFilter.length > 0) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDeploymentFilter([]);
                    setStatusFilter([]);
                  }}
                  className="text-xs text-blue-600 hover:underline"
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
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredVendors.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            {vendors.length === 0
              ? "No vendors found. Run the seed script or the Registry Agent."
              : "No vendors match the current filters."}
          </p>
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredVendors.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {filteredVendors.length} of {vendors.length} vendors
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
                className="group rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 font-bold text-sm">
                      {vendor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {vendor.name}
                      </h3>
                      {vendor.hqLocation && (
                        <p className="text-xs text-gray-500">{vendor.hqLocation}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Category Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        cat === "STT"
                          ? "bg-purple-50 text-purple-700"
                          : cat === "TTS"
                            ? "bg-teal-50 text-teal-700"
                            : cat === "V2V"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                  {deployments.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                      {d === "Cloud" ? <Cloud className="h-2.5 w-2.5" /> : d === "OnPrem" ? <Server className="h-2.5 w-2.5" /> : null}
                      {d}
                    </span>
                  ))}
                </div>

                {/* Top Metric */}
                {topMetric && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
                    <Activity className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{topMetric.label}:</span>
                    <span className="text-sm font-semibold text-gray-900">{topMetric.value}</span>
                  </div>
                )}

                {/* Stats Row */}
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
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
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                    <StatusBadge status={vendor.niceCompatibility.cxoneIntegrationStatus} />
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">Score:</span>
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
