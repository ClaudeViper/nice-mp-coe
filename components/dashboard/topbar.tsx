"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Sparkles } from "lucide-react";
import { HighContrastToggle } from "@/components/high-contrast-toggle";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/vendors": "Vendors",
  "/benchmarks/stt": "STT Benchmarks",
  "/benchmarks/tts": "TTS Benchmarks",
  "/benchmarks/v2v": "V2V Benchmarks",
  "/news": "News Intelligence",
  "/evaluate": "Evaluations",
  "/datasets": "Datasets",
  "/standards": "Standards",
  "/reports": "Reports",
  "/tts-audio-lab": "TTS Audio Lab",
  "/architecture": "Architecture",
};

function getLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.startsWith("/evaluate/")) return "Evaluation Results";
  if (pathname.startsWith("/vendors/"))  return "Vendor Detail";
  if (pathname.startsWith("/reports/"))  return "Report Detail";
  return "NICE MP CoE";
}

export function Topbar() {
  const pathname = usePathname();
  const label    = getLabel(pathname);

  return (
    <header
      role="banner"
      className="flex h-14 items-center justify-between px-6 flex-shrink-0"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 10,
      }}
    >
      {/* Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          {label}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2" role="toolbar" aria-label="Page toolbar">
        {/* Search hint */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
          aria-hidden="true"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 rounded border px-1.5 py-0.5 text-xs font-mono" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            ⌘K
          </kbd>
        </div>

        {/* AI badge */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "rgba(0,212,232,0.1)", color: "#00b8cc", border: "1px solid rgba(0,212,232,0.25)" }}
          aria-label="Agentic AI platform"
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Agentic AI
        </div>

        {/* High-contrast toggle */}
        <HighContrastToggle />

        {/* Notifications */}
        <button
          aria-label="View notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            style={{ background: "#00d4e8", boxShadow: "0 0 4px rgba(0,212,232,0.8)" }}
            aria-label="New notifications"
          />
        </button>

        {/* User avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}
          role="img"
          aria-label="User: AH"
        >
          AH
        </div>
      </div>
    </header>
  );
}
