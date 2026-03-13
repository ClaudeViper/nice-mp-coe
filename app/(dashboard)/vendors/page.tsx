"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Shield,
  Cloud,
  Globe,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface VendorSummary {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  foundedYear: number | null;
  hqLocation: string | null;
  niceCompatibility: {
    buildVsBuyScore: number;
    cxoneIntegrationStatus: string;
  } | null;
  _count: {
    products: number;
    benchmarkResults: number;
  };
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
    "Not Compatible": "bg-red-100 text-red-800",
    Unknown: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAgent, setRunningAgent] = useState(false);

  async function loadVendors() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendors");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error (${res.status}): ${text}`);
      }
      const data = await res.json();
      setVendors(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Registry</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive vendor catalog with products, deployment options, security certs, and NICE compatibility
          </p>
        </div>
        <button
          onClick={triggerAgent}
          disabled={runningAgent}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${runningAgent ? "animate-spin" : ""}`} />
          {runningAgent ? "Running Agent..." : "Run Registry Agent"}
        </button>
      </div>

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

      {/* Vendors grid */}
      {!loading && vendors.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No vendors found. Run the seed script or the Registry Agent.</p>
        </div>
      )}

      {!loading && vendors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-sm">
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
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </div>

              {vendor.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {vendor.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {vendor._count.products > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Cloud className="h-3 w-3" />
                    {vendor._count.products} products
                  </span>
                )}
                {vendor._count.benchmarkResults > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Globe className="h-3 w-3" />
                    {vendor._count.benchmarkResults} benchmarks
                  </span>
                )}
              </div>

              {vendor.niceCompatibility && (
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  <StatusBadge status={vendor.niceCompatibility.cxoneIntegrationStatus} />
                  <span className="text-xs text-gray-500">Build vs Buy:</span>
                  <ScoreBadge score={vendor.niceCompatibility.buildVsBuyScore} />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
