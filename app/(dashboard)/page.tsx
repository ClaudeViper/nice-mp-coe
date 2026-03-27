"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Bot,
  Play,
  Search,
  DollarSign,
  BookOpen,
  Headphones,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalVendors: number;
  vendorsThisMonth: number;
  totalBenchmarks: number;
  benchmarksToday: number;
  totalNews: number;
  newsLastUpdatedAt: string | null;
  totalEvaluations: number;
  agentLastRuns: Record<string, string | null>;
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

/** Returns a short relative time string, e.g. "3h ago", "2d ago", "just now" */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Formats an ISO timestamp as "Mar 15, 2026 · 14:32" */
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
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

// ─── AI Agents ────────────────────────────────────────────────────────────────

interface AgentDef {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "vendor-scout",
    name: "Vendor Scout",
    description: "Crawls the web for new STT/TTS/V2V vendors, enriches profiles, and updates the registry.",
    category: "Discovery",
    categoryColor: "#00d4e8",
    icon: Search,
    iconColor: "#00d4e8",
    iconBg: "rgba(0,212,232,0.1)",
  },
  {
    id: "benchmark-runner",
    name: "Benchmark Runner",
    description: "Runs standardized accuracy, latency, and cost benchmarks across all registered vendors.",
    category: "Evaluation",
    categoryColor: "#7c3aed",
    icon: BarChart3,
    iconColor: "#a855f7",
    iconBg: "rgba(124,58,237,0.1)",
  },
  {
    id: "news-digest",
    name: "News Digest",
    description: "Scans Artificial Analysis, HuggingFace, vendor blogs, and research feeds for benchmark updates and model releases.",
    category: "Intelligence",
    categoryColor: "#10b981",
    icon: Newspaper,
    iconColor: "#10b981",
    iconBg: "rgba(16,185,129,0.1)",
  },
  {
    id: "audio-lab",
    name: "Audio Lab",
    description: "Synthesises test utterances, runs listening tests, and computes MOS/MUSHRA scores.",
    category: "Quality",
    categoryColor: "#f59e0b",
    icon: Headphones,
    iconColor: "#f59e0b",
    iconBg: "rgba(245,158,11,0.1)",
  },
  {
    id: "standards-publisher",
    name: "Standards Publisher",
    description: "Generates compliance reports aligned with NICE CXone integration standards.",
    category: "Compliance",
    categoryColor: "#ec4899",
    icon: BookOpen,
    iconColor: "#ec4899",
    iconBg: "rgba(236,72,153,0.1)",
  },
  {
    id: "cost-optimizer",
    name: "Cost Optimizer",
    description: "Analyses pricing tiers, volume discounts, and recommends the lowest-cost vendor mix.",
    category: "Finance",
    categoryColor: "#06b6d4",
    icon: DollarSign,
    iconColor: "#06b6d4",
    iconBg: "rgba(6,182,212,0.1)",
  },
];

type AgentStatus = "idle" | "running" | "completed" | "failed";

interface AgentState {
  status: AgentStatus;
  jobId?: string;
  lastRun?: string;
  toastMsg?: string;
}

function AgentCard({ agent, initialLastRun }: { agent: AgentDef; initialLastRun: string | null }) {
  const [state, setState] = useState<AgentState>(
    initialLastRun
      ? { status: "idle", lastRun: initialLastRun }
      : { status: "idle" },
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function runAgent() {
    if (state.status === "running") return;
    setState({ status: "running" });

    try {
      const res = await fetch(`/api/agents/${agent.id}/run`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { jobId } = await res.json() as { jobId: string };

      pollRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`/api/agents/${agent.id}/status?jobId=${encodeURIComponent(jobId)}`);
          if (!sr.ok) return;
          const data = await sr.json() as { status: string; completedAt?: string };
          if (data.status === "completed") {
            stopPolling();
            setState({ status: "completed", jobId, lastRun: data.completedAt ?? new Date().toISOString(), toastMsg: "Completed successfully" });
          } else if (data.status === "failed") {
            stopPolling();
            setState({ status: "failed", jobId, lastRun: new Date().toISOString(), toastMsg: "Agent failed" });
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (e) {
      setState({ status: "failed", toastMsg: String(e) });
    }
  }

  const statusStyle: Record<AgentStatus, React.CSSProperties> = {
    idle:      { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" },
    running:   { background: "rgba(0,212,232,0.12)",  color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" },
    completed: { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
    failed:    { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" },
  };

  return (
    <Card className="border-0 glass-card ai-glow flex flex-col">
      <CardContent className="p-5 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: agent.iconBg }}>
            <agent.icon className="h-5 w-5" style={{ color: agent.iconColor }} aria-hidden="true" />
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: `${agent.categoryColor}18`, color: agent.categoryColor, border: `1px solid ${agent.categoryColor}30` }}
          >
            {agent.category}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{agent.name}</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{agent.description}</p>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={statusStyle[state.status]}
            role="status"
            aria-label={`Agent status: ${state.status}`}
          >
            {state.status === "running" && <Activity className="h-3 w-3 animate-pulse" aria-hidden="true" />}
            {state.status === "completed" && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
            {state.status.charAt(0).toUpperCase() + state.status.slice(1)}
          </span>
          {state.lastRun && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              {fmtDateTime(state.lastRun)}
            </span>
          )}
        </div>

        {/* Toast message */}
        {state.toastMsg && state.status !== "running" && (
          <p className="text-xs" style={{ color: state.status === "completed" ? "#10b981" : "#ef4444" }}>
            {state.toastMsg}
          </p>
        )}

        {/* Run button */}
        <button
          onClick={runAgent}
          disabled={state.status === "running"}
          aria-label={state.status === "running" ? `${agent.name} is running` : `Run ${agent.name}`}
          aria-busy={state.status === "running"}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: state.status === "running" ? "rgba(0,212,232,0.08)" : "linear-gradient(135deg,rgba(0,212,232,0.15),rgba(124,58,237,0.15))",
            border: "1px solid rgba(0,212,232,0.25)",
            color: "#00d4e8",
          }}
        >
          {state.status === "running" ? (
            <>
              <Activity className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              Running…
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Run Now
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}

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
            NiCE Media Processing{" "}
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
          <StatCard
            label="Vendors Tracked"
            value={stats.totalVendors}
            icon={Building2}
            color="#00d4e8"
            {...(stats.vendorsThisMonth > 0 && { delta: `+${stats.vendorsThisMonth} this month` })}
          />
          <StatCard
            label="Benchmarks"
            value={stats.totalBenchmarks}
            icon={BarChart3}
            color="#7c3aed"
            {...(stats.benchmarksToday > 0 && { delta: `+${stats.benchmarksToday} today` })}
          />
          <StatCard
            label="News Articles"
            value={stats.totalNews}
            icon={Newspaper}
            color="#10b981"
            {...(stats.newsLastUpdatedAt && { delta: `Updated ${timeAgo(stats.newsLastUpdatedAt)}` })}
          />
          <StatCard
            label="Evaluations Run"
            value={stats.totalEvaluations}
            icon={FlaskConical}
            color="#f59e0b"
          />
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

      {/* ── AI Agents ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4" style={{ color: "#00d4e8" }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            AI Agents
          </h2>
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.2)" }}
          >
            {AGENTS.length} available
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              initialLastRun={stats?.agentLastRuns?.[agent.id] ?? null}
            />
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
