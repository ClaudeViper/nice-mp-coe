"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Newspaper,
  FlaskConical,
  BookCheck,
  FileText,
  Mic,
  Volume2,
  AudioWaveform,
  Sparkles,
  ChevronRight,
  Zap,
  Database,
  AudioWaveform as Waveform,
  Wand2,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Vendors", href: "/vendors", icon: Building2 },
  { name: "News Intelligence", href: "/news", icon: Newspaper },
  {
    name: "Benchmarks",
    icon: BarChart3,
    children: [
      { name: "STT", href: "/benchmarks/stt", icon: Mic },
      { name: "TTS", href: "/benchmarks/tts", icon: Volume2 },
      { name: "V2V", href: "/benchmarks/v2v", icon: AudioWaveform },
      { name: "Standards", href: "/standards", icon: BookCheck },
    ],
  },
  {
    name: "Generate Lab",
    icon: Wand2,
    children: [
      { name: "Text Generation", href: "/generate-lab/text-generation", icon: MessageSquareText },
      { name: "TTS Audio Lab", href: "/tts-audio-lab", icon: Waveform },
      { name: "Evaluate", href: "/evaluate", icon: FlaskConical },
      { name: "Datasets", href: "/datasets", icon: Database },
    ],
  },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [runningCount, setRunningCount] = useState<number | null>(null);

  useEffect(() => {
    function fetchRunning() {
      fetch("/api/evaluations?status=Running&limit=100")
        .then((r) => r.json())
        .then((data: unknown[]) => setRunningCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setRunningCount(0));
    }
    fetchRunning();
    const interval = setInterval(fetchRunning, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-col flex-shrink-0" style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}>
      {/* ── NICE Logo ─────────────────────────────────────────────────── */}
      <div className="flex h-16 items-center px-5" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div>
          {/* NiCE wordmark — blue dot replaces the natural dot of "i" */}
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 900,
              fontSize: "24px",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "white",
              display: "inline-flex",
              alignItems: "flex-end",
            }}
          >
            <span>N</span>
            <span style={{ position: "relative", display: "inline-block" }}>
              <span>i</span>
              {/* Cover the natural i-dot */}
              <span
                style={{
                  position: "absolute",
                  top: "0px",
                  left: "-1px",
                  right: "-1px",
                  height: "6px",
                  background: "var(--sidebar)",
                }}
              />
              {/* NiCE brand blue dot */}
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#4A90D9",
                  boxShadow: "0 0 6px rgba(74,144,217,0.7)",
                }}
              />
            </span>
            <span>CE</span>
          </div>
          <p
            style={{
              color: "rgba(148,163,184,0.6)",
              fontSize: "9.5px",
              marginTop: "3px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Media Processing Group
          </p>
        </div>
      </div>

      {/* ── AI Status Banner ─────────────────────────────────────────── */}
      <div className="mx-3 mt-4 rounded-lg px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.2)" }}>
        <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#00d4e8" }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">AI Agents Active</p>
          <p className="text-xs" style={{ color: "rgba(0,212,232,0.7)" }}>
            {runningCount === null
              ? "Loading…"
              : runningCount === 0
              ? "No evaluations running"
              : `${runningCount} evaluation${runningCount !== 1 ? "s" : ""} running`}
          </p>
        </div>
        <div className={cn(
          "h-1.5 w-1.5 rounded-full flex-shrink-0",
          runningCount ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
        )} />
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          if (item.children) {
            const isGroupActive = item.children.some((child) =>
              pathname.startsWith(child.href)
            );
            return (
              <div key={item.name} className="mb-1">
                <div
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: isGroupActive ? "#00d4e8" : "rgba(148,163,184,0.6)" }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
                <div className="ml-3 mt-0.5 space-y-0.5 pl-4" style={{ borderLeft: "1px solid rgba(0,212,232,0.15)" }}>
                  {item.children.map((child) => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-all duration-150 group",
                          active
                            ? "font-semibold text-white"
                            : "hover:text-white"
                        )}
                        style={active
                          ? { background: "rgba(0,212,232,0.12)", color: "#00d4e8" }
                          : { color: "var(--sidebar-foreground)" }
                        }
                      >
                        <span className="flex items-center gap-2">
                          <child.icon className="h-3.5 w-3.5" />
                          {child.name}
                        </span>
                        {active && <ChevronRight className="h-3 w-3" style={{ color: "#00d4e8" }} />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 group"
              )}
              style={active
                ? { background: "rgba(0,212,232,0.12)", color: "#00d4e8" }
                : { color: "var(--sidebar-foreground)" }
              }
            >
              <span className="flex items-center gap-3 font-medium">
                <item.icon className={cn("h-4 w-4 transition-colors", active ? "" : "group-hover:text-white")} />
                <span className={active ? "text-white font-semibold" : "group-hover:text-white"}>
                  {item.name}
                </span>
              </span>
              {active && <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#00d4e8", boxShadow: "0 0 6px rgba(0,212,232,0.8)" }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="p-4" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
          <div>
            <p className="text-xs font-medium text-white">Powered by Claude</p>
            <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>Agentic AI Platform</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
