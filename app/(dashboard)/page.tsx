"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  BarChart3,
  Newspaper,
  Package,
  RefreshCw,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface OverviewData {
  vendorsTracked: number;
  benchmarksRun: number;
  newsItems: number;
  vendorsWithProducts: number;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Vendors Tracked",
      value: data?.vendorsTracked ?? "—",
      icon: Building2,
      href: "/vendors",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Benchmark Results",
      value: data?.benchmarksRun ?? "—",
      icon: BarChart3,
      href: "/benchmarks/stt",
      color: "text-green-600 bg-green-50",
    },
    {
      label: "News Items",
      value: data?.newsItems ?? "—",
      icon: Newspaper,
      href: "/news",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Vendors with Products",
      value: data?.vendorsWithProducts ?? "—",
      icon: Package,
      href: "/vendors",
      color: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          NICE Media Processing Center of Excellence
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              {loading && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-300" />
              )}
            </div>
            <p className="mt-4 text-3xl font-semibold text-gray-900">
              {loading ? "—" : stat.value}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/benchmarks/stt"
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
            >
              <span>View STT Benchmarks</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/benchmarks/tts"
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
            >
              <span>View TTS Benchmarks</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/benchmarks/v2v"
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
            >
              <span>View V2V Benchmarks</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/vendors"
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm hover:bg-gray-50"
            >
              <span>Browse Vendor Registry</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Platform Status</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${data ? "bg-green-100 text-green-800" : loading ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${data ? "bg-green-500" : loading ? "bg-yellow-500" : "bg-red-500"}`}
                />
                {data ? "Connected" : loading ? "Checking..." : "Error"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Agents</span>
              <span className="text-gray-500">3 configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Benchmark Types</span>
              <span className="text-gray-500">STT, TTS, V2V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
