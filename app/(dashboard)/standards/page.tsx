"use client";

import { useState } from "react";
import { Ruler, Mic, Volume2, MessageSquare, CheckCircle2, ArrowDown, ArrowUp } from "lucide-react";
import { STT_METRICS, TTS_METRICS, V2V_METRICS, type MetricDefinition } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TabType = "STT" | "TTS" | "V2V";

const TABS: { key: TabType; label: string; icon: React.ReactNode; metrics: MetricDefinition[]; color: string }[] = [
  { key: "STT", label: "Speech-to-Text", icon: <Mic className="h-4 w-4" />, metrics: STT_METRICS, color: "#7c3aed" },
  { key: "TTS", label: "Text-to-Speech", icon: <Volume2 className="h-4 w-4" />, metrics: TTS_METRICS, color: "#00d4e8" },
  { key: "V2V", label: "Voice-to-Voice", icon: <MessageSquare className="h-4 w-4" />, metrics: V2V_METRICS, color: "#10b981" },
];

export default function StandardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("STT");

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-7" style={{ background: "linear-gradient(135deg,#060f2e 0%,#102356 60%,#0c1e4a 100%)" }}>
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#7c3aed,transparent)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(124,58,237,0.2)" }}>
              <Ruler className="h-5 w-5" style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Industry-Standard <span className="gradient-text">Metrics</span></h1>
            </div>
          </div>
          <p className="text-sm max-w-xl" style={{ color: "rgba(148,163,184,0.9)" }}>
            Comprehensive reference of speech technology metrics used for benchmarking and evaluation across STT, TTS, and V2V.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
            style={activeTab === tab.key
              ? { background: `${tab.color}18`, color: tab.color, border: `1px solid ${tab.color}35` }
              : { color: "var(--muted-foreground)", background: "transparent", border: "1px solid transparent" }
            }
          >
            <span style={{ color: activeTab === tab.key ? tab.color : undefined }}>{tab.icon}</span>
            {tab.label}
            <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium" style={{ background: activeTab === tab.key ? `${tab.color}18` : "var(--border)", color: activeTab === tab.key ? tab.color : "var(--muted-foreground)" }}>
              {tab.metrics.length}
            </span>
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentTab.metrics.map((m) => (
          <Card key={m.name} className="glass-card border-0">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{m.label}</h3>
                  <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{m.name}</span>
                </div>
                <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium" style={{ color: "#10b981" }}>
                  {m.lowerIsBetter ? (
                    <><ArrowDown className="h-3 w-3" />Lower</>
                  ) : (
                    <><ArrowUp className="h-3 w-3" />Higher</>
                  )}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{m.description}</p>

              <div className="mt-3 space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>How Measured</p>
                  <p className="text-xs" style={{ color: "var(--foreground)" }}>{m.howMeasured}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>Unit</p>
                  <p className="text-xs" style={{ color: "var(--foreground)" }}>{m.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
                  <span className="text-xs font-medium" style={{ color: "#10b981" }}>Good: {m.goodThreshold}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Reference Table */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Ruler className="h-4 w-4" style={{ color: currentTab.color }} />
            {activeTab} Metrics Reference Table
            <Badge variant="info" className="ml-auto text-xs">{currentTab.metrics.length} metrics</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">How Measured</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Good Threshold</th>
              </tr>
            </thead>
            <tbody>
              {currentTab.metrics.map((m) => (
                <tr key={m.name} className="transition-colors hover:bg-secondary/50" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--foreground)" }}>{m.label}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: currentTab.color }}>{m.name}</td>
                  <td className="px-4 py-3 text-xs max-w-xs" style={{ color: "var(--muted-foreground)" }}>{m.description}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{m.howMeasured}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{m.unit}</td>
                  <td className="px-4 py-3">
                    {m.lowerIsBetter ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#10b981" }}>
                        <ArrowDown className="h-3 w-3" /> Lower
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#10b981" }}>
                        <ArrowUp className="h-3 w-3" /> Higher
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                      {m.goodThreshold}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
