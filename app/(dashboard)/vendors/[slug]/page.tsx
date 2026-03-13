"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Package,
  Cloud,
  Server,
  Shield,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Plug,
  FlaskConical,
  Rocket,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VendorDetail {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  pricingUrl: string | null;
  docsUrl: string | null;
  description: string | null;
  foundedYear: number | null;
  hqLocation: string | null;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    version: string | null;
    description: string | null;
    apiEndpoint: string | null;
    isGa: boolean;
  }>;
  deploymentOptions: Array<{
    id: string;
    type: string;
    details: string | null;
    regions: string[];
  }>;
  securityCerts: Array<{
    id: string;
    certName: string;
    certBody: string | null;
    verificationUrl: string | null;
  }>;
  supportedLanguages: Array<{
    id: string;
    language: string;
    langCode: string;
    accents: string[];
    category: string;
  }>;
  pricingTiers: Array<{
    id: string;
    tierName: string;
    category: string;
    pricePerUnit: string;
    unit: string;
    monthlyMinimum: string | null;
    volumeDiscount: string | null;
    commitmentTerms: string | null;
  }>;
  niceCompatibility: {
    cxoneIntegrationStatus: string;
    integrationMethod: string | null;
    certifiedVersion: string | null;
    buildVsBuyScore: number;
    buildVsBuyRationale: string | null;
    migrationComplexity: string | null;
    estimatedIntegrationDays: number | null;
    notes: string | null;
  } | null;
  benchmarkResults: Array<{
    id: string;
    modelName: string;
    benchmarkType: string;
    metricName: string;
    metricValue: string;
    metricUnit: string;
    dataset: string;
    sourceName: string | null;
    collectedAt: string;
  }>;
  evaluations: Array<{
    id: string;
    evaluationType: string;
    modelName: string;
    status: string;
    dataset: string;
    totalSamples: number;
    processedSamples: number;
    startedAt: string | null;
    completedAt: string | null;
    results: Array<{
      metricName: string;
      metricValue: string;
      metricUnit: string;
    }>;
  }>;
}

type TabKey = "overview" | "benchmarks" | "pricing" | "integration" | "evaluations" | "deployment";

// ─── Tab Definitions ─────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <Building2 className="h-4 w-4" /> },
  { key: "benchmarks", label: "Benchmarks", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "pricing", label: "Pricing", icon: <DollarSign className="h-4 w-4" /> },
  { key: "integration", label: "Integration", icon: <Plug className="h-4 w-4" /> },
  { key: "evaluations", label: "Evaluations", icon: <FlaskConical className="h-4 w-4" /> },
  { key: "deployment", label: "Deployment", icon: <Rocket className="h-4 w-4" /> },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function VendorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vendors/${slug}`);
        if (!res.ok) throw new Error(`API error (${res.status}): ${await res.text()}`);
        setVendor(await res.json());
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Vendors
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error ?? "Vendor not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Vendors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 font-bold text-xl">
            {vendor.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {vendor.hqLocation && <span>{vendor.hqLocation}</span>}
              {vendor.foundedYear && <span>Founded {vendor.foundedYear}</span>}
              {vendor.niceCompatibility && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  vendor.niceCompatibility.cxoneIntegrationStatus === "Certified" ? "bg-green-100 text-green-800" :
                  vendor.niceCompatibility.cxoneIntegrationStatus === "Compatible" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {vendor.niceCompatibility.cxoneIntegrationStatus}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {vendor.docsUrl && (
            <a href={vendor.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Docs <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {vendor.pricingUrl && (
            <a href={vendor.pricingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Pricing <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab vendor={vendor} />}
      {activeTab === "benchmarks" && <BenchmarksTab vendor={vendor} />}
      {activeTab === "pricing" && <PricingTab vendor={vendor} />}
      {activeTab === "integration" && <IntegrationTab vendor={vendor} />}
      {activeTab === "evaluations" && <EvaluationsTab vendor={vendor} />}
      {activeTab === "deployment" && <DeploymentTab vendor={vendor} />}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ vendor }: { vendor: VendorDetail }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {vendor.description && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-2 font-semibold text-gray-900">About {vendor.name}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{vendor.description}</p>
        </div>
      )}

      {/* Key Differentiators */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <Package className="mx-auto h-8 w-8 text-blue-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{vendor.products.length}</p>
          <p className="text-sm text-gray-500">Products & Models</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-green-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{vendor.benchmarkResults.length}</p>
          <p className="text-sm text-gray-500">Benchmark Data Points</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <Shield className="mx-auto h-8 w-8 text-purple-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{vendor.securityCerts.length}</p>
          <p className="text-sm text-gray-500">Security Certifications</p>
        </div>
      </div>

      {/* Products */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
          <Package className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Products & Models</h2>
        </div>
        <div className="p-5">
          {vendor.products.length === 0 ? (
            <p className="text-sm text-gray-500">No products cataloged yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {vendor.products.map((p) => (
                <div key={p.id} className="rounded-md border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {p.version && <span className="text-xs text-gray-400">{p.version}</span>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isGa ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {p.isGa ? "GA" : "Beta"}
                    </span>
                  </div>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.category === "STT" ? "bg-purple-50 text-purple-700" :
                    p.category === "TTS" ? "bg-teal-50 text-teal-700" :
                    p.category === "V2V" ? "bg-orange-50 text-orange-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {p.category}
                  </span>
                  {p.description && <p className="mt-2 text-xs text-gray-500">{p.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Certifications */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
          <Shield className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Security Certifications</h2>
        </div>
        <div className="p-5">
          {vendor.securityCerts.length === 0 ? (
            <p className="text-sm text-gray-500">No security certifications cataloged.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vendor.securityCerts.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {c.certName}
                  {c.certBody && <span className="text-green-600">({c.certBody})</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Languages */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
          <Globe className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Supported Languages</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {vendor.supportedLanguages.length}
          </span>
        </div>
        <div className="p-5">
          {vendor.supportedLanguages.length === 0 ? (
            <p className="text-sm text-gray-500">No language data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                vendor.supportedLanguages.reduce<Record<string, typeof vendor.supportedLanguages>>((acc, lang) => {
                  (acc[lang.category] ??= []).push(lang);
                  return acc;
                }, {})
              ).map(([cat, langs]) => (
                <div key={cat}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">{cat}</p>
                  <div className="flex flex-wrap gap-1">
                    {langs.map((l) => (
                      <span key={l.id} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {l.language} ({l.langCode})
                        {l.accents.length > 0 && ` — ${l.accents.join(", ")}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Benchmarks Tab ──────────────────────────────────────────────────────────

function BenchmarksTab({ vendor }: { vendor: VendorDetail }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = [...new Set(vendor.benchmarkResults.map((b) => b.benchmarkType))];
  const filtered =
    typeFilter === "all"
      ? vendor.benchmarkResults
      : vendor.benchmarkResults.filter((b) => b.benchmarkType === typeFilter);

  // Group by model
  const byModel = filtered.reduce<Record<string, typeof filtered>>((acc, b) => {
    (acc[b.modelName] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Filter by type:</span>
        <button
          onClick={() => setTypeFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${typeFilter === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${typeFilter === t ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">No benchmark data available.</p>
        </div>
      ) : (
        Object.entries(byModel).map(([model, benchmarks]) => (
          <div key={model} className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="font-semibold text-gray-900">{model}</h3>
              <span className="text-xs text-gray-500">{benchmarks.length} metrics</span>
            </div>
            <div className="p-5">
              {/* Metric Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {benchmarks.map((b) => (
                  <div key={b.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">{b.metricName}</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {b.metricValue}
                      <span className="ml-1 text-sm font-normal text-gray-500">{b.metricUnit}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {b.dataset} {b.sourceName ? `· ${b.sourceName}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Pricing Tab ─────────────────────────────────────────────────────────────

function PricingTab({ vendor }: { vendor: VendorDetail }) {
  // Group pricing by category
  const byCategory = vendor.pricingTiers.reduce<Record<string, typeof vendor.pricingTiers>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {vendor.pricingTiers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <DollarSign className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">No pricing data available.</p>
        </div>
      ) : (
        <>
          {/* Volume Projections */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900">NICE Volume Projections</h3>
            <p className="mt-1 text-xs text-blue-700">
              Based on typical CXone deployment at 1M minutes/month
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {vendor.pricingTiers.slice(0, 3).map((t) => {
                const perMin = parseFloat(t.pricePerUnit);
                const monthly = perMin * 1_000_000;
                return (
                  <div key={t.id} className="rounded-md bg-white p-3">
                    <p className="text-xs font-medium text-gray-500">{t.tierName}</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      ${monthly >= 1000 ? `${(monthly / 1000).toFixed(1)}K` : monthly.toFixed(0)}
                      <span className="text-xs font-normal text-gray-500">/mo</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      ${t.pricePerUnit}/{t.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Pricing Table */}
          {Object.entries(byCategory).map(([cat, tiers]) => (
            <div key={cat} className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="font-semibold text-gray-900">{cat}</h3>
              </div>
              <div className="overflow-x-auto p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="pb-2 pr-4">Tier</th>
                      <th className="pb-2 pr-4">Price</th>
                      <th className="pb-2 pr-4">Unit</th>
                      <th className="pb-2 pr-4">Monthly Min</th>
                      <th className="pb-2 pr-4">Volume Discount</th>
                      <th className="pb-2">Terms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50">
                        <td className="py-2 pr-4 font-medium text-gray-900">{t.tierName}</td>
                        <td className="py-2 pr-4 text-gray-900">${t.pricePerUnit}</td>
                        <td className="py-2 pr-4 text-gray-600">{t.unit}</td>
                        <td className="py-2 pr-4 text-gray-600">{t.monthlyMinimum ? `$${t.monthlyMinimum}` : "—"}</td>
                        <td className="py-2 pr-4 text-gray-600">{t.volumeDiscount ?? "—"}</td>
                        <td className="py-2 text-gray-500">{t.commitmentTerms ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Integration Tab (NICE CXone) ───────────────────────────────────────────

function IntegrationTab({ vendor }: { vendor: VendorDetail }) {
  const compat = vendor.niceCompatibility;

  return (
    <div className="space-y-4">
      {/* CXone Compatibility */}
      {compat ? (
        <>
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <CheckCircle2 className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">NICE CXone Compatibility</h2>
            </div>
            <div className="p-5">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Integration Status</p>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                      compat.cxoneIntegrationStatus === "Certified" ? "bg-green-100 text-green-800" :
                      compat.cxoneIntegrationStatus === "Compatible" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {compat.cxoneIntegrationStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Build vs Buy Score</p>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${
                      compat.buildVsBuyScore >= 7 ? "bg-green-100 text-green-800" :
                      compat.buildVsBuyScore >= 4 ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {compat.buildVsBuyScore}/10
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Integration Method</p>
                  <p className="mt-1 font-medium text-gray-900">{compat.integrationMethod ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Migration Complexity</p>
                  <p className="mt-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      compat.migrationComplexity === "Low" ? "bg-green-100 text-green-700" :
                      compat.migrationComplexity === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {compat.migrationComplexity ?? "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {compat.estimatedIntegrationDays && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Estimated Integration</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{compat.estimatedIntegrationDays} <span className="text-sm font-normal text-gray-500">days</span></p>
                  </div>
                )}
                {compat.certifiedVersion && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Certified Version</p>
                    <p className="mt-1 font-medium text-gray-900">{compat.certifiedVersion}</p>
                  </div>
                )}
              </div>

              {compat.buildVsBuyRationale && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500">Rationale</p>
                  <p className="mt-1 text-sm text-gray-600">{compat.buildVsBuyRationale}</p>
                </div>
              )}

              {compat.notes && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-600">{compat.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* API / SDK Availability */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <Plug className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">API & SDK Availability</h2>
            </div>
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {vendor.products.map((p) => (
                  <div key={p.id} className="rounded-md border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.category === "STT" ? "bg-purple-50 text-purple-700" :
                        p.category === "TTS" ? "bg-teal-50 text-teal-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {p.category}
                      </span>
                    </div>
                    {p.apiEndpoint && (
                      <p className="mt-1 text-xs text-gray-500 font-mono">{p.apiEndpoint}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <Plug className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">No integration assessment available yet.</p>
          <p className="mt-1 text-xs text-gray-400">Run the Vendor Registry Agent to collect this data.</p>
        </div>
      )}
    </div>
  );
}

// ─── Evaluations Tab ─────────────────────────────────────────────────────────

function EvaluationsTab({ vendor }: { vendor: VendorDetail }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {vendor.evaluations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <FlaskConical className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">No evaluations run yet.</p>
          <Link href="/evaluate/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Run a new evaluation
          </Link>
        </div>
      ) : (
        vendor.evaluations.map((ev) => (
          <div key={ev.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  ev.evaluationType === "STT" ? "bg-purple-50 text-purple-700" :
                  ev.evaluationType === "TTS" ? "bg-teal-50 text-teal-700" :
                  "bg-orange-50 text-orange-700"
                }`}>
                  {ev.evaluationType}
                </span>
                <span className="font-medium text-gray-900">{ev.modelName}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  ev.status === "Completed" ? "bg-green-100 text-green-800" :
                  ev.status === "Running" ? "bg-blue-100 text-blue-800" :
                  ev.status === "Failed" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {ev.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {ev.processedSamples}/{ev.totalSamples} samples
                </span>
                {expanded === ev.id ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {expanded === ev.id && (
              <div className="border-t border-gray-100 p-5">
                {ev.results.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {ev.results.map((r, idx) => (
                      <div key={idx} className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">{r.metricName}</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {r.metricValue}
                          <span className="ml-1 text-sm font-normal text-gray-500">{r.metricUnit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No aggregate metrics recorded.</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  {ev.startedAt && <span>Started: {new Date(ev.startedAt).toLocaleString()}</span>}
                  {ev.completedAt && <span>Completed: {new Date(ev.completedAt).toLocaleString()}</span>}
                </div>
                <Link
                  href={`/evaluate/${ev.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  View full evaluation <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Deployment Tab ──────────────────────────────────────────────────────────

function DeploymentTab({ vendor }: { vendor: VendorDetail }) {
  const deploymentIcons: Record<string, React.ReactNode> = {
    Cloud: <Cloud className="h-5 w-5 text-blue-500" />,
    OnPrem: <Server className="h-5 w-5 text-gray-500" />,
    Hybrid: <Building2 className="h-5 w-5 text-purple-500" />,
    Edge: <Rocket className="h-5 w-5 text-orange-500" />,
  };

  return (
    <div className="space-y-4">
      {vendor.deploymentOptions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <Rocket className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">No deployment options documented.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {vendor.deploymentOptions.map((d) => (
              <div key={d.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  {deploymentIcons[d.type] ?? <Cloud className="h-5 w-5 text-gray-400" />}
                  <h3 className="text-lg font-semibold text-gray-900">{d.type}</h3>
                </div>
                {d.details && (
                  <p className="mt-2 text-sm text-gray-600">{d.details}</p>
                )}
                {d.regions.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-medium text-gray-500">Available Regions</p>
                    <div className="flex flex-wrap gap-1">
                      {d.regions.map((r) => (
                        <span key={r} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Setup Guide */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <Rocket className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Quick Setup Guide</h2>
            </div>
            <div className="p-5">
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                  <div>
                    <p className="font-medium text-gray-900">Obtain API Credentials</p>
                    <p className="text-sm text-gray-500">
                      Sign up at {vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{vendor.name}</a> : vendor.name} and generate API keys from the dashboard.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                  <div>
                    <p className="font-medium text-gray-900">Configure CXone Integration</p>
                    <p className="text-sm text-gray-500">
                      {vendor.niceCompatibility
                        ? `Use ${vendor.niceCompatibility.integrationMethod ?? "REST API"} to connect. Estimated setup: ${vendor.niceCompatibility.estimatedIntegrationDays ?? "N/A"} days.`
                        : "Follow vendor documentation for REST API integration."}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                  <div>
                    <p className="font-medium text-gray-900">Run Validation Evaluation</p>
                    <p className="text-sm text-gray-500">
                      Use the <Link href="/evaluate/new" className="text-blue-600 hover:underline">Evaluation Runner</Link> to verify performance against benchmarks.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
