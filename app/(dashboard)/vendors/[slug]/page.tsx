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
  Activity,
  Zap,
  MapPin,
  Calendar,
  BookOpen,
  Sparkles,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface DeploymentGuideline {
  id: string;
  productSlug: string | null;
  content: string;
  status: string;
  generatedAt: string;
  errorMsg: string | null;
  updatedAt: string;
}

type TabKey = "overview" | "benchmarks" | "pricing" | "integration" | "evaluations" | "deployment";

// ─── Tab Definitions ─────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "overview", label: "Overview", icon: <Building2 className="h-4 w-4" />, color: "#00d4e8" },
  { key: "benchmarks", label: "Benchmarks", icon: <BarChart3 className="h-4 w-4" />, color: "#7c3aed" },
  { key: "pricing", label: "Pricing", icon: <DollarSign className="h-4 w-4" />, color: "#10b981" },
  { key: "integration", label: "Integration", icon: <Plug className="h-4 w-4" />, color: "#00d4e8" },
  { key: "evaluations", label: "Evaluations", icon: <FlaskConical className="h-4 w-4" />, color: "#f59e0b" },
  { key: "deployment", label: "Deployment", icon: <Rocket className="h-4 w-4" />, color: "#7c3aed" },
];

const categoryColor: Record<string, { color: string; bg: string; border: string }> = {
  STT: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.25)" },
  TTS: { color: "#00d4e8", bg: "rgba(0,212,232,0.1)", border: "rgba(0,212,232,0.25)" },
  V2V: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
};

const statusBadge = (status: string) => {
  if (status === "Certified") return { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" };
  if (status === "Compatible") return { color: "#00d4e8", bg: "rgba(0,212,232,0.12)", border: "rgba(0,212,232,0.3)" };
  return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" };
};

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
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: "#00d4e8" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading vendor data…</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4 max-w-7xl">
        <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "#00d4e8" }}>
          <ArrowLeft className="h-4 w-4" /> Back to Vendors
        </Link>
        <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#ef4444" }}>{error ?? "Vendor not found"}</p>
        </div>
      </div>
    );
  }

  const compat = vendor.niceCompatibility;
  const compatStyle = compat ? statusBadge(compat.cxoneIntegrationStatus) : null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back link */}
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#00d4e8" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Vendors
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-7" style={{ background: "linear-gradient(135deg,#060f2e 0%,#102356 60%,#0c1e4a 100%)" }}>
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#00d4e8,transparent)" }} />
        <div className="absolute -bottom-8 left-32 h-40 w-40 rounded-full opacity-8" style={{ background: "radial-gradient(circle,#7c3aed,transparent)" }} />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}>
              {vendor.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {vendor.hqLocation && (
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(148,163,184,0.9)" }}>
                    <MapPin className="h-3 w-3" />{vendor.hqLocation}
                  </span>
                )}
                {vendor.foundedYear && (
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(148,163,184,0.9)" }}>
                    <Calendar className="h-3 w-3" />Founded {vendor.foundedYear}
                  </span>
                )}
                {compat && compatStyle && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: compatStyle.bg, color: compatStyle.color, border: `1px solid ${compatStyle.border}` }}>
                    <CheckCircle2 className="h-3 w-3" />
                    {compat.cxoneIntegrationStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* External links */}
          <div className="flex flex-wrap gap-2">
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-80" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}>
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {vendor.docsUrl && (
              <a href={vendor.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-80" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}>
                Docs <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {vendor.pricingUrl && (
              <a href={vendor.pricingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-80" style={{ background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}>
                Pricing <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Link href="/evaluate/new" className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}>
              <Zap className="h-3 w-3" />Run Evaluation
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl p-1" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
            style={activeTab === tab.key
              ? { background: "linear-gradient(135deg,rgba(0,212,232,0.15),rgba(124,58,237,0.15))", color: tab.color, border: `1px solid ${tab.color}40` }
              : { color: "var(--muted-foreground)", background: "transparent", border: "1px solid transparent" }
            }
          >
            <span style={{ color: activeTab === tab.key ? tab.color : undefined }}>{tab.icon}</span>
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
    <div className="space-y-5">
      {/* Description */}
      {vendor.description && (
        <Card className="glass-card border-0 ai-glow">
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold" style={{ color: "#00d4e8" }}>About {vendor.name}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{vendor.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Key stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Package, label: "Products & Models", value: vendor.products.length, color: "#00d4e8" },
          { icon: BarChart3, label: "Benchmark Data Points", value: vendor.benchmarkResults.length, color: "#7c3aed" },
          { icon: Shield, label: "Security Certifications", value: vendor.securityCerts.length, color: "#10b981" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="glass-card border-0">
            <CardContent className="p-5 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4" style={{ color: "#00d4e8" }} />
            Products & Models
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {vendor.products.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--muted-foreground)" }}>No products cataloged yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {vendor.products.map((p) => {
                const catStyle = categoryColor[p.category];
                return (
                  <div key={p.id} className="rounded-xl p-3 transition-colors" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{p.name}</span>
                        {p.version && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.version}</span>}
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: p.isGa ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: p.isGa ? "#10b981" : "#f59e0b" }}>
                        {p.isGa ? "GA" : "Beta"}
                      </span>
                    </div>
                    {catStyle && (
                      <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                        {p.category}
                      </span>
                    )}
                    {p.description && <p className="mt-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Certifications */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4" style={{ color: "#10b981" }} />
            Security Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {vendor.securityCerts.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--muted-foreground)" }}>No security certifications cataloged.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vendor.securityCerts.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {c.certName}
                  {c.certBody && <span style={{ opacity: 0.7 }}>({c.certBody})</span>}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4" style={{ color: "#7c3aed" }} />
            Supported Languages
            <Badge variant="info" className="ml-auto text-xs">{vendor.supportedLanguages.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {vendor.supportedLanguages.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--muted-foreground)" }}>No language data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                vendor.supportedLanguages.reduce<Record<string, typeof vendor.supportedLanguages>>((acc, lang) => {
                  (acc[lang.category] ??= []).push(lang);
                  return acc;
                }, {})
              ).map(([cat, langs]) => (
                <div key={cat}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {langs.map((l) => (
                      <span key={l.id} className="rounded-lg px-2 py-0.5 text-xs" style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                        {l.language} ({l.langCode})
                        {l.accents.length > 0 && ` — ${l.accents.join(", ")}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Benchmarks Tab ──────────────────────────────────────────────────────────

function BenchmarksTab({ vendor }: { vendor: VendorDetail }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = [...new Set(vendor.benchmarkResults.map((b) => b.benchmarkType))];
  const filtered = typeFilter === "all" ? vendor.benchmarkResults : vendor.benchmarkResults.filter((b) => b.benchmarkType === typeFilter);

  const byModel = filtered.reduce<Record<string, typeof filtered>>((acc, b) => {
    (acc[b.modelName] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Type filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Filter:</span>
        {["all", ...types].map((t) => {
          const active = typeFilter === t;
          const catStyle = t !== "all" ? categoryColor[t] : null;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={active
                ? { background: catStyle ? catStyle.bg : "rgba(0,212,232,0.12)", color: catStyle ? catStyle.color : "#00d4e8", border: `1px solid ${catStyle ? catStyle.border : "rgba(0,212,232,0.3)"}` }
                : { background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
              }
            >
              {t === "all" ? "All Types" : t}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No benchmark data available.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(byModel).map(([model, benchmarks]) => {
          const type = benchmarks[0]?.benchmarkType;
          const catStyle = type ? categoryColor[type] : null;
          return (
            <Card key={model} className="glass-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <span style={{ color: catStyle?.color ?? "#00d4e8" }}>{model}</span>
                  {catStyle && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                      {type}
                    </span>
                  )}
                  <Badge variant="info" className="ml-auto text-xs">{benchmarks.length} metrics</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {benchmarks.map((b) => (
                    <div key={b.id} className="rounded-xl p-3" style={{ background: catStyle ? `${catStyle.color}08` : "var(--secondary)", border: `1px solid ${catStyle ? catStyle.border : "var(--border)"}` }}>
                      <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{b.metricName}</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: catStyle?.color ?? "#00d4e8" }}>
                        {b.metricValue}
                        <span className="ml-1 text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>{b.metricUnit}</span>
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                        {b.dataset}{b.sourceName ? ` · ${b.sourceName}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─── Pricing Tab ─────────────────────────────────────────────────────────────

function PricingTab({ vendor }: { vendor: VendorDetail }) {
  const byCategory = vendor.pricingTiers.reduce<Record<string, typeof vendor.pricingTiers>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {vendor.pricingTiers.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No pricing data available.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* NICE Volume Projections */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.08),rgba(124,58,237,0.08))", border: "1px solid rgba(0,212,232,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4" style={{ color: "#00d4e8" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>NICE Volume Projections</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Based on typical CXone deployment at 1M minutes/month</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {vendor.pricingTiers.slice(0, 3).map((t) => {
                const perMin = parseFloat(t.pricePerUnit);
                const monthly = perMin * 1_000_000;
                return (
                  <div key={t.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,232,0.15)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{t.tierName}</p>
                    <p className="mt-1 text-xl font-bold" style={{ color: "#00d4e8" }}>
                      ${monthly >= 1000 ? `${(monthly / 1000).toFixed(1)}K` : monthly.toFixed(0)}
                      <span className="text-xs font-normal ml-1" style={{ color: "var(--muted-foreground)" }}>/mo</span>
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>${t.pricePerUnit}/{t.unit}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Pricing Tables */}
          {Object.entries(byCategory).map(([cat, tiers]) => {
            const catStyle = categoryColor[cat];
            return (
              <Card key={cat} className="glass-card border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    {catStyle && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                        {cat}
                      </span>
                    )}
                    <span style={{ color: "var(--foreground)" }}>Pricing Tiers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs" style={{ borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                        <th className="pb-2 pr-4 font-semibold">Tier</th>
                        <th className="pb-2 pr-4 font-semibold">Price</th>
                        <th className="pb-2 pr-4 font-semibold">Unit</th>
                        <th className="pb-2 pr-4 font-semibold">Monthly Min</th>
                        <th className="pb-2 pr-4 font-semibold">Volume Discount</th>
                        <th className="pb-2 font-semibold">Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((t) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="py-2.5 pr-4 font-medium" style={{ color: "var(--foreground)" }}>{t.tierName}</td>
                          <td className="py-2.5 pr-4 font-semibold" style={{ color: "#00d4e8" }}>${t.pricePerUnit}</td>
                          <td className="py-2.5 pr-4" style={{ color: "var(--muted-foreground)" }}>{t.unit}</td>
                          <td className="py-2.5 pr-4" style={{ color: "var(--muted-foreground)" }}>{t.monthlyMinimum ? `$${t.monthlyMinimum}` : "—"}</td>
                          <td className="py-2.5 pr-4" style={{ color: "var(--muted-foreground)" }}>{t.volumeDiscount ?? "—"}</td>
                          <td className="py-2.5" style={{ color: "var(--muted-foreground)" }}>{t.commitmentTerms ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Integration Tab (NICE CXone) ─────────────────────────────────────────────

function IntegrationTab({ vendor }: { vendor: VendorDetail }) {
  const compat = vendor.niceCompatibility;

  if (!compat) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="py-12 text-center">
          <Plug className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No integration assessment available yet.</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>Run the Vendor Registry Agent to collect this data.</p>
        </CardContent>
      </Card>
    );
  }

  const compatStyle = statusBadge(compat.cxoneIntegrationStatus);
  const scoreColor = compat.buildVsBuyScore >= 7 ? "#10b981" : compat.buildVsBuyScore >= 4 ? "#f59e0b" : "#ef4444";
  const complexityColor = compat.migrationComplexity === "Low" ? "#10b981" : compat.migrationComplexity === "Medium" ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-5">
      {/* CXone Compatibility */}
      <Card className="glass-card border-0 ai-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" style={{ color: "#00d4e8" }} />
            NICE CXone Compatibility
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Integration Status</p>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: compatStyle.bg, color: compatStyle.color, border: `1px solid ${compatStyle.border}` }}>
                <CheckCircle2 className="h-3 w-3" />{compat.cxoneIntegrationStatus}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Build vs Buy Score</p>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold" style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}30` }}>
                {compat.buildVsBuyScore}/10
              </span>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Integration Method</p>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{compat.integrationMethod ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Migration Complexity</p>
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${complexityColor}18`, color: complexityColor, border: `1px solid ${complexityColor}30` }}>
                {compat.migrationComplexity ?? "N/A"}
              </span>
            </div>
          </div>

          {(compat.estimatedIntegrationDays || compat.certifiedVersion) && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
              {compat.estimatedIntegrationDays && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Estimated Integration</p>
                  <p className="text-xl font-bold" style={{ color: "#00d4e8" }}>
                    {compat.estimatedIntegrationDays}
                    <span className="text-sm font-normal ml-1" style={{ color: "var(--muted-foreground)" }}>days</span>
                  </p>
                </div>
              )}
              {compat.certifiedVersion && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Certified Version</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{compat.certifiedVersion}</p>
                </div>
              )}
            </div>
          )}

          {compat.buildVsBuyRationale && (
            <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.15)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#00d4e8" }}>Rationale</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{compat.buildVsBuyRationale}</p>
            </div>
          )}

          {compat.notes && (
            <div className="mt-3 rounded-xl p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>Notes</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{compat.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API & SDK Availability */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Plug className="h-4 w-4" style={{ color: "#7c3aed" }} />
            API & SDK Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {vendor.products.map((p) => {
              const catStyle = categoryColor[p.category];
              return (
                <div key={p.id} className="rounded-xl p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{p.name}</span>
                    {catStyle && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                        {p.category}
                      </span>
                    )}
                  </div>
                  {p.apiEndpoint && (
                    <p className="mt-1.5 font-mono text-xs rounded px-2 py-1 truncate" style={{ background: "rgba(0,212,232,0.06)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.15)" }}>
                      {p.apiEndpoint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Evaluations Tab ──────────────────────────────────────────────────────────

function EvaluationsTab({ vendor }: { vendor: VendorDetail }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const evalStatusStyle: Record<string, { color: string; bg: string }> = {
    Completed: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    Running: { color: "#00d4e8", bg: "rgba(0,212,232,0.12)" },
    Failed: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    Pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  };

  return (
    <div className="space-y-4">
      {vendor.evaluations.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="py-12 text-center">
            <FlaskConical className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>No evaluations run yet.</p>
            <Link href="/evaluate/new" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#00d4e8" }}>
              <Zap className="h-3 w-3" />Run a new evaluation
            </Link>
          </CardContent>
        </Card>
      ) : (
        vendor.evaluations.map((ev) => {
          const catStyle = categoryColor[ev.evaluationType];
          const statusStyle = evalStatusStyle[ev.status] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
          const isOpen = expanded === ev.id;
          return (
            <Card key={ev.id} className="glass-card border-0 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : ev.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {catStyle && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                      {ev.evaluationType}
                    </span>
                  )}
                  <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{ev.modelName}</span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                    {ev.status === "Running" && <Activity className="mr-1 h-2.5 w-2.5 animate-pulse" />}
                    {ev.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {ev.processedSamples}/{ev.totalSamples} samples
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                  ) : (
                    <ChevronRight className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="pt-4">
                    {ev.results.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {ev.results.map((r, idx) => (
                          <div key={idx} className="rounded-xl p-3" style={{ background: catStyle ? `${catStyle.color}08` : "var(--secondary)", border: `1px solid ${catStyle ? catStyle.border : "var(--border)"}` }}>
                            <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{r.metricName}</p>
                            <p className="mt-1 text-xl font-bold" style={{ color: catStyle?.color ?? "#00d4e8" }}>
                              {r.metricValue}
                              <span className="ml-1 text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>{r.metricUnit}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No aggregate metrics recorded.</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {ev.startedAt && <span>Started: {new Date(ev.startedAt).toLocaleString()}</span>}
                      {ev.completedAt && <span>Completed: {new Date(ev.completedAt).toLocaleString()}</span>}
                    </div>
                    <Link
                      href={`/evaluate/${ev.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: "#00d4e8" }}
                    >
                      View full evaluation <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─── Markdown renderer (lightweight, no external deps) ───────────────────────

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-lg font-bold mt-4 mb-2" style={{ color: "var(--foreground)" }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-sm font-bold mt-4 mb-1.5 pt-3" style={{ color: "#00d4e8", borderTop: "1px solid var(--border)" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-sm font-semibold mt-3 mb-1" style={{ color: "var(--foreground)" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-2 rounded-lg p-3 text-xs overflow-x-auto" style={{ background: "rgba(6,15,46,0.6)", color: "#80eef8", border: "1px solid rgba(0,212,232,0.15)" }}>
          {lang && <span className="text-xs opacity-50 block mb-1">{lang}</span>}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("| ")) {
      // Table
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[-| ]+\|$/)) tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.map((r) => r.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim()));
      if (rows.length > 0) {
        elements.push(
          <div key={i} className="my-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  {rows[0].map((h, hi) => (
                    <th key={hi} className="text-left px-3 py-1.5 font-semibold" style={{ background: "rgba(0,212,232,0.08)", color: "#00d4e8", borderBottom: "1px solid rgba(0,212,232,0.2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: "1px solid var(--border)" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-1.5" style={{ color: "var(--foreground)" }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm list-disc" style={{ color: "var(--foreground)" }}>
          {line.slice(2)}
        </li>
      );
    } else if (/^\d+\. /.test(line)) {
      elements.push(
        <li key={i} className="ml-4 text-sm list-decimal" style={{ color: "var(--foreground)" }}>
          {line.replace(/^\d+\. /, "")}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
          {line}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Guideline Card ───────────────────────────────────────────────────────────

function GuidelineCard({
  vendorSlug,
  productSlug,
  productName,
  guideline,
  onRefreshed,
}: {
  vendorSlug: string;
  productSlug: string | null;
  productName: string;
  guideline: DeploymentGuideline | null;
  onRefreshed: (updated: DeploymentGuideline) => void;
}) {
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setRunning(true);
    setErr(null);
    try {
      const res = await fetch("/api/agents/deployment-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_slug: vendorSlug, product_slug: productSlug }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "Failed") {
        setErr(data.error ?? "Agent failed");
      } else {
        // Reload guidelines
        const glRes = await fetch(`/api/vendors/${vendorSlug}/deployment-guidelines`);
        const allGuidelines: DeploymentGuideline[] = await glRes.json();
        const updated = allGuidelines.find(
          (g) => g.productSlug === productSlug
        );
        if (updated) {
          onRefreshed(updated);
          setExpanded(true);
        }
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setRunning(false);
    }
  }

  const statusColor = !guideline
    ? "#94a3b8"
    : guideline.status === "Completed"
      ? "#10b981"
      : guideline.status === "Generating"
        ? "#00d4e8"
        : "#ef4444";

  return (
    <Card className="glass-card border-0">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ background: "rgba(0,212,232,0.1)" }}>
              <BookOpen className="h-4 w-4" style={{ color: "#00d4e8" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {productName}
              </p>
              {guideline?.updatedAt && (
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <Clock className="h-3 w-3" />
                  Updated {new Date(guideline.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status badge */}
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
            >
              {!guideline ? "Not generated" : guideline.status}
            </span>

            {/* Expand / collapse (only when content exists) */}
            {guideline?.status === "Completed" && guideline.content && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
              >
                {expanded ? "Collapse" : "View"}
              </button>
            )}

            {/* Generate / Refresh */}
            <button
              onClick={generate}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-60"
              style={{
                background: running ? "rgba(0,212,232,0.1)" : "linear-gradient(135deg,rgba(0,212,232,0.2),rgba(124,58,237,0.2))",
                color: "#00d4e8",
                border: "1px solid rgba(0,212,232,0.3)",
              }}
            >
              {running ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  {guideline ? "Refresh" : "Generate"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mt-3 flex items-start gap-2 rounded-lg p-3 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            {err}
          </div>
        )}

        {/* Expanded guideline content */}
        {expanded && guideline?.status === "Completed" && guideline.content && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--border)" }}
          >
            <MarkdownContent content={guideline.content} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Deployment Tab ───────────────────────────────────────────────────────────

function DeploymentTab({ vendor }: { vendor: VendorDetail }) {
  const [guidelines, setGuidelines] = useState<DeploymentGuideline[]>([]);
  const [glLoading, setGlLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendors/${vendor.slug}/deployment-guidelines`)
      .then((r) => r.ok ? r.json() : [])
      .then(setGuidelines)
      .catch(() => setGuidelines([]))
      .finally(() => setGlLoading(false));
  }, [vendor.slug]);

  function handleRefreshed(updated: DeploymentGuideline) {
    setGuidelines((prev) => {
      const idx = prev.findIndex((g) => g.productSlug === updated.productSlug);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }

  const deploymentStyles: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    Cloud: { icon: <Cloud className="h-5 w-5" />, color: "#00d4e8", bg: "rgba(0,212,232,0.1)" },
    OnPrem: { icon: <Server className="h-5 w-5" />, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    Hybrid: { icon: <Building2 className="h-5 w-5" />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
    Edge: { icon: <Rocket className="h-5 w-5" />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  };

  return (
    <div className="space-y-6">
      {/* ── Deployment Options grid ───────────────────────────────────── */}
      {vendor.deploymentOptions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {vendor.deploymentOptions.map((d) => {
            const style = deploymentStyles[d.type] ?? { icon: <Cloud className="h-5 w-5" />, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
            return (
              <Card key={d.id} className="glass-card border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: style.bg, color: style.color }}>
                      {style.icon}
                    </div>
                    <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{d.type}</h3>
                  </div>
                  {d.details && (
                    <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>{d.details}</p>
                  )}
                  {d.regions.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Available Regions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.regions.map((r) => (
                          <span key={r} className="rounded-lg px-2 py-0.5 text-xs font-medium" style={{ background: `${style.color}10`, color: style.color, border: `1px solid ${style.color}25` }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Deployment Guidelines per model ──────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" style={{ color: "#7c3aed" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            AI-Generated Deployment Guidelines
          </h3>
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}>
            per model
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
          Click <strong>Generate</strong> on any model to have the AI agent research and produce step-by-step deployment guidelines, NICE CXone integration steps, and troubleshooting tips.
        </p>

        {glLoading ? (
          <div className="flex items-center gap-2 py-6">
            <RefreshCw className="h-4 w-4 animate-spin" style={{ color: "#00d4e8" }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading guidelines…</span>
          </div>
        ) : vendor.products.length === 0 ? (
          <Card className="glass-card border-0">
            <CardContent className="py-10 text-center">
              <Package className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No products registered for this vendor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Vendor-level guideline */}
            <GuidelineCard
              vendorSlug={vendor.slug}
              productSlug={null}
              productName={`${vendor.name} — Vendor Overview`}
              guideline={guidelines.find((g) => g.productSlug === null) ?? null}
              onRefreshed={handleRefreshed}
            />

            {/* Per-product guidelines */}
            {vendor.products.map((product) => (
              <GuidelineCard
                key={product.id}
                vendorSlug={vendor.slug}
                productSlug={product.slug}
                productName={`${product.name}${product.version ? ` (${product.version})` : ""} · ${product.category}`}
                guideline={guidelines.find((g) => g.productSlug === product.slug) ?? null}
                onRefreshed={handleRefreshed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
