"use client";

import { useEffect, useState } from "react";
import { Sun } from "lucide-react";

const STORAGE_KEY = "nice-high-contrast";

/**
 * High-contrast mode toggle.  Preference is persisted in localStorage and
 * applied via a `data-high-contrast` attribute on `<html>`.  CSS in
 * globals.css can target `[data-high-contrast="true"]` to override colors.
 */
export function HighContrastToggle() {
  const [enabled, setEnabled] = useState(false);

  // Read persisted preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const active = stored === "true";
    setEnabled(active);
    document.documentElement.setAttribute("data-high-contrast", String(active));
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.setAttribute("data-high-contrast", String(next));
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Disable high-contrast mode" : "Enable high-contrast mode"}
      aria-pressed={enabled}
      title={enabled ? "Disable high contrast" : "Enable high contrast"}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      style={{
        color: enabled ? "#00d4e8" : "var(--muted-foreground)",
        border: enabled ? "1px solid rgba(0,212,232,0.35)" : "1px solid transparent",
      }}
    >
      <Sun className="h-4 w-4" />
    </button>
  );
}
