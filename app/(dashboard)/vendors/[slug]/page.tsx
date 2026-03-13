"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Package,
  Cloud,
  Shield,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

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
  }>;
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <Icon className="h-4 w-4 text-gray-500" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function VendorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vendors/${slug}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error (${res.status}): ${text}`);
        }
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
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xl">
            {vendor.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {vendor.hqLocation && <span>{vendor.hqLocation}</span>}
              {vendor.foundedYear && <span>Founded {vendor.foundedYear}</span>}
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

      {/* Description */}
      {vendor.description && (
        <p className="text-gray-600">{vendor.description}</p>
      )}

      {/* NICE Compatibility */}
      {vendor.niceCompatibility && (
        <SectionCard title="NICE CXone Compatibility" icon={CheckCircle2}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Integration Status</p>
              <p className="mt-1 font-medium">{vendor.niceCompatibility.cxoneIntegrationStatus}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Build vs Buy Score</p>
              <p className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${
                  vendor.niceCompatibility.buildVsBuyScore >= 7 ? "bg-green-100 text-green-800" :
                  vendor.niceCompatibility.buildVsBuyScore >= 4 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {vendor.niceCompatibility.buildVsBuyScore}/10
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Integration Method</p>
              <p className="mt-1">{vendor.niceCompatibility.integrationMethod ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Migration Complexity</p>
              <p className="mt-1">{vendor.niceCompatibility.migrationComplexity ?? "N/A"}</p>
            </div>
            {vendor.niceCompatibility.estimatedIntegrationDays && (
              <div>
                <p className="text-xs font-medium text-gray-500">Est. Integration</p>
                <p className="mt-1">{vendor.niceCompatibility.estimatedIntegrationDays} days</p>
              </div>
            )}
          </div>
          {vendor.niceCompatibility.buildVsBuyRationale && (
            <p className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
              {vendor.niceCompatibility.buildVsBuyRationale}
            </p>
          )}
        </SectionCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Products */}
        <SectionCard title="Products & Models" icon={Package}>
          {vendor.products.length === 0 ? (
            <p className="text-sm text-gray-500">No products cataloged yet.</p>
          ) : (
            <div className="space-y-3">
              {vendor.products.map((p) => (
                <div key={p.id} className="flex items-start justify-between rounded-md border border-gray-100 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {p.version && <span className="text-xs text-gray-400">{p.version}</span>}
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{p.category}</span>
                    </div>
                    {p.description && <p className="mt-1 text-xs text-gray-500">{p.description}</p>}
                  </div>
                  <span className={`text-xs font-medium ${p.isGa ? "text-green-600" : "text-yellow-600"}`}>
                    {p.isGa ? "GA" : "Beta"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Deployment Options */}
        <SectionCard title="Deployment Options" icon={Cloud}>
          {vendor.deploymentOptions.length === 0 ? (
            <p className="text-sm text-gray-500">No deployment data yet.</p>
          ) : (
            <div className="space-y-3">
              {vendor.deploymentOptions.map((d) => (
                <div key={d.id} className="rounded-md border border-gray-100 p-3">
                  <div className="font-medium text-gray-900">{d.type}</div>
                  {d.details && <p className="mt-1 text-xs text-gray-500">{d.details}</p>}
                  {d.regions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.regions.map((r) => (
                        <span key={r} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Security Certifications */}
        <SectionCard title="Security Certifications" icon={Shield}>
          {vendor.securityCerts.length === 0 ? (
            <p className="text-sm text-gray-500">No security certifications cataloged yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vendor.securityCerts.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-800">
                  <Shield className="h-3 w-3" />
                  {c.certName}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Languages */}
        <SectionCard title="Supported Languages" icon={Globe}>
          {vendor.supportedLanguages.length === 0 ? (
            <p className="text-sm text-gray-500">No language data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(
                vendor.supportedLanguages.reduce<Record<string, typeof vendor.supportedLanguages>>((acc, lang) => {
                  (acc[lang.category] ??= []).push(lang);
                  return acc;
                }, {})
              ).map(([cat, langs]) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{cat}</p>
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
        </SectionCard>

        {/* Pricing */}
        <SectionCard title="Pricing Tiers" icon={DollarSign}>
          {vendor.pricingTiers.length === 0 ? (
            <p className="text-sm text-gray-500">No pricing data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4">Tier</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Price</th>
                    <th className="pb-2">Volume Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.pricingTiers.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-900">{t.tierName}</td>
                      <td className="py-2 pr-4 text-gray-600">{t.category}</td>
                      <td className="py-2 pr-4 text-gray-900">${t.pricePerUnit} {t.unit}</td>
                      <td className="py-2 text-gray-500">{t.volumeDiscount ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Benchmarks */}
        <SectionCard title="Benchmark Results" icon={Building2}>
          {vendor.benchmarkResults.length === 0 ? (
            <p className="text-sm text-gray-500">No benchmark data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4">Model</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Metric</th>
                    <th className="pb-2 pr-4">Value</th>
                    <th className="pb-2">Dataset</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.benchmarkResults.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50">
                      <td className="py-1.5 pr-4 font-medium text-gray-900">{b.modelName}</td>
                      <td className="py-1.5 pr-4 text-gray-600">{b.benchmarkType}</td>
                      <td className="py-1.5 pr-4 text-gray-600">{b.metricName}</td>
                      <td className="py-1.5 pr-4 text-gray-900">{b.metricValue} {b.metricUnit}</td>
                      <td className="py-1.5 text-gray-500">{b.dataset}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
