"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  BarChart3,
  Newspaper,
  FlaskConical,
  ArrowRight,
  Mic,
  Volume2,
  AudioWaveform,
  Sparkles,
  TrendingUp,
  Zap,
  Activity,
  Brain,
  CheckCircle2,
  Clock,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalVendors: number;
  totalBenchmarks: number;
  totalNews: number;
  totalEvaluations: number;
  recentEvaluations: Array<{
    id: string;
    vendor: { name: string };
    evaluationType: string;
    status: string;
    modelName: string;
    completedAt: string | null;
    dataset: string;
  }>;
  topBenchmarks: Array<{
    vendor: { name: string };
    modelName: string;
    metricName: string;
    metricValue: string;
    metricUnit: string;
    benchmarkType: string;
  }>;
}

const QUICK_LINKS = [
  {
    title: "STT Benchmarks",
    desc: "Word Error Rate, latency & robustness rankings",
    href: "/benchmarks/stt",
    icon: Mic,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
    badge: "Live",
  },
  {
    title: "TTS Benchmarks",
    desc: "MOS scores, naturalness & TTFB analysis",
    href: "/benchmarks/tts",
    icon: Volume2,
    color: "#00d4e8",
    bg: "rgba(0,212,232,0.08)",
    border: "rgba(0,212,232,0.2)",
    badge: "Live",
  },
  {
    title: "V2V Benchmarks",
    desc: "Task completion, latency & persona consistency",
    href: "/benchmarks/v2v",
    icon: AudioWaveform,
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    badge: "Live",
  },
  {
    title: "Run Evaluation",
    desc: "Launch AI-powered vendor evaluation workflow",
    href: "/evaluate/new",
    icon: FlaskConical,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    badge: "Agentic",
  },
];

function StatCard({ label, value, icon: Icon, color, delta }: { label: string; value: number | string; icon: React.ElementType; color: string; delta?: string }) {
  return (
    <Card className="glass-card border-0 ai-glow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            <p className="mt-1.5 text-3xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
            {delta && (
              <p className="mt-1 text-xs font-medium" style={{ color: "#10b981" }}>
                <TrendingUp className="inline h-3 w-3 mr-0.5" />{delta}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    Completed: "#10b981",
    Running: "#00d4e8",
    Failed: "#ef4444",
    Pending: "#f59e0b",
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "linear-gradient(135deg,#060f2e 0%,#102356 50%,#0c1e4a 100%)" }}>
        {/* Neural dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        {/* Glow orbs */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#00d4e8,transparent)" }} />
        <div className="absolute -bottom-10 left-40 h-48 w-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#7c3aed,transparent)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}>
              <Sparkles className="h-3 w-3" />
              Agentic AI Platform
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
              <Activity className="h-3 w-3 animate-pulse" />
              Live
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            NICE Agentic{" "}
            <span className="gradient-text">CoE</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "rgba(148,163,184,0.9)" }}>
            AI-first Media Processing Center of Excellence. Evaluate STT, TTS & V2V vendors with autonomous AI agents, real-time benchmarking, and intelligent market intelligence.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/evaluate/new"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}
            >
              <Zap className="h-4 w-4" />
              Run AI Evaluation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/benchmarks/stt"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <BarChart3 className="h-4 w-4" />
              View Benchmarks
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 glass-card">
              <CardContent className="p-5">
                <div className="h-16 rounded-lg animate-pulse" style={{ background: "var(--muted)" }} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Vendors Tracked" value={stats.totalVendors} icon={Building2} color="#00d4e8" delta="+2 this month" />
          <StatCard label="Benchmarks" value={stats.totalBenchmarks} icon={BarChart3} color="#7c3aed" delta="+48 today" />
          <StatCard label="News Articles" value={stats.totalNews} icon={Newspaper} color="#10b981" delta="Updated 5m ago" />
          <StatCard label="Evaluations Run" value={stats.totalEvaluations} icon={FlaskConical} color="#f59e0b" />
        </div>
      ) : null}

      {/* ── Quick Access ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4" style={{ color: "#00d4e8" }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Quick Access
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full border-0 glass-card group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                style={{ borderColor: link.border }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: link.bg }}>
                      <link.icon className="h-5 w-5" style={{ color: link.color }} />
                    </div>
                    <Badge variant="outline" className="text-xs" style={{ color: link.color, borderColor: link.border }}>
                      {link.badge}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{link.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{link.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all" style={{ color: link.color }}>
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Activity + Top Benchmarks ────────────────────────────── */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent evaluations */}
          <Card className="border-0 glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="h-4 w-4" style={{ color: "#00d4e8" }} />
                Recent Evaluations
                <Badge variant="info" className="ml-auto text-xs">
                  {stats.recentEvaluations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.recentEvaluations.length === 0 ? (
                <div className="py-8 text-center">
                  <FlaskConical className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No evaluations yet</p>
                  <Link href="/evaluate/new" className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#00d4e8" }}>
                    Run first evaluation <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentEvaluations.map((e) => (
                    <Link key={e.id} href={`/evaluate/${e.id}`}>
                      <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary/50 group">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: statusColor[e.status] ?? "#94a3b8" }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                              {e.vendor.name}
                            </p>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {e.evaluationType} · {e.dataset}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.status === "Completed" && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />}
                          {e.status === "Running" && <Activity className="h-3.5 w-3.5 animate-pulse" style={{ color: "#00d4e8" }} />}
                          {e.status === "Pending" && <Clock className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />}
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{e.status}</span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#00d4e8" }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top benchmarks */}
          <Card className="border-0 glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4" style={{ color: "#7c3aed" }} />
                Market Benchmarks
                <Badge variant="info" className="ml-auto text-xs">
                  Industry
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.topBenchmarks.length === 0 ? (
                <div className="py-8 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No benchmarks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.topBenchmarks.slice(0, 6).map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg p-3" style={{ background: "rgba(124,58,237,0.04)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {b.vendor.name}
                          <span className="ml-1 text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                            {b.modelName}
                          </span>
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {b.benchmarkType} · {b.metricName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#00d4e8" }}>
                          {b.metricValue}
                          <span className="ml-0.5 text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>{b.metricUnit}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
