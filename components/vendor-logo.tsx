"use client";

import { useState } from "react";

// ─── Vendor registry ────────────────────────────────────────────────────────

interface VendorEntry {
  domain: string;
  color: string;
  /**
   * true  → Clearbit PNG has a dark / black baked-in background.
   *         Container stays dark; mix-blend-mode:screen dissolves the black.
   * false → Clearbit PNG is transparent or has a white background.
   *         Container gets a white card; mix-blend-mode:multiply dissolves white.
   */
  darkLogo: boolean;
}

const VENDOR_MAP: Record<string, VendorEntry> = {
  openai:        { domain: "openai.com",        color: "#10a37f", darkLogo: true  },
  google:        { domain: "google.com",        color: "#4285F4", darkLogo: false },
  amazon:        { domain: "amazon.com",        color: "#ff9900", darkLogo: false },
  aws:           { domain: "amazon.com",        color: "#ff9900", darkLogo: false },
  microsoft:     { domain: "microsoft.com",     color: "#00a4ef", darkLogo: false },
  azure:         { domain: "microsoft.com",     color: "#00a4ef", darkLogo: false },
  assemblyai:    { domain: "assemblyai.com",    color: "#1ED3B4", darkLogo: false },
  deepgram:      { domain: "deepgram.com",      color: "#13ef95", darkLogo: true  },
  rev:           { domain: "rev.com",           color: "#0070f3", darkLogo: false },
  "rev-ai":      { domain: "rev.com",           color: "#0070f3", darkLogo: false },
  speechmatics:  { domain: "speechmatics.com",  color: "#2563eb", darkLogo: false },
  elevenlabs:    { domain: "elevenlabs.io",      color: "#ffffff", darkLogo: true  },
  resemble:      { domain: "resemble.ai",       color: "#5046e5", darkLogo: false },
  playht:        { domain: "play.ht",           color: "#6d28d9", darkLogo: false },
  cartesia:      { domain: "cartesia.ai",       color: "#6366f1", darkLogo: true  },
  hume:          { domain: "hume.ai",           color: "#4f46e5", darkLogo: false },
  tavus:         { domain: "tavus.io",          color: "#d946ef", darkLogo: false },
  runway:        { domain: "runwayml.com",      color: "#666666", darkLogo: true  },
  coqui:         { domain: "coqui.ai",          color: "#FBBF24", darkLogo: false },
  meta:          { domain: "meta.com",          color: "#0082FB", darkLogo: false },
  nvidia:        { domain: "nvidia.com",        color: "#76B900", darkLogo: true  },
  vapi:          { domain: "vapi.ai",           color: "#7C3AED", darkLogo: true  },
  retell:        { domain: "retellai.com",      color: "#EC4899", darkLogo: false },
  retellai:      { domain: "retellai.com",      color: "#EC4899", darkLogo: false },
};

function resolveEntry(slug: string): VendorEntry | undefined {
  const s = slug.toLowerCase();
  if (VENDOR_MAP[s]) return VENDOR_MAP[s];
  for (const key of Object.keys(VENDOR_MAP)) {
    if (s.includes(key) || key.includes(s.split("-")[0]!)) return VENDOR_MAP[key];
  }
  return undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface VendorLogoProps {
  name: string;
  slug: string;
  size?: number;
  className?: string;
}

type Stage = "clearbit" | "ddg" | "avatar";

export function VendorLogo({ name, slug, size = 44, className = "" }: VendorLogoProps) {
  const [stage, setStage] = useState<Stage>("clearbit");

  const entry      = resolveEntry(slug);
  const brandColor = entry?.color ?? "#00d4e8";

  const advance = () => setStage((s) => (s === "clearbit" ? "ddg" : "avatar"));

  // Shared container shape
  const base: React.CSSProperties = {
    width: size, height: size, minWidth: size, minHeight: size,
    borderRadius: 10,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  // ── Letter-avatar fallback ────────────────────────────────────────────────
  if (!entry || stage === "avatar") {
    return (
      <div
        style={{
          ...base,
          background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}11 100%)`,
          border: `1.5px solid ${brandColor}44`,
          color: brandColor,
          fontWeight: 700,
          fontSize: Math.round(size * 0.4),
          letterSpacing: "-0.02em",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
        className={className}
        aria-label={`${name} logo`}
        role="img"
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  // ── Image stages (Clearbit → DuckDuckGo) ─────────────────────────────────
  const src =
    stage === "clearbit"
      ? `https://logo.clearbit.com/${entry.domain}`
      : `https://icons.duckduckgo.com/ip3/${entry.domain}.ico`;

  // Two-tier background + blend strategy:
  //
  //  darkLogo = true  → PNG has a black/dark baked-in background.
  //    Container: transparent (dark app surface shows through)
  //    Blend:     screen — black pixels vanish, logo content stays crisp.
  //
  //  darkLogo = false → PNG has a transparent or white background.
  //    Container: white card (#ffffff) with subtle shadow
  //    Blend:     multiply — white pixels dissolve into the white card,
  //               coloured/dark logo pixels render perfectly.
  //
  // Both strategies produce a clean, background-free appearance without any
  // per-vendor image editing or special-casing in CSS class names.

  const isDark = entry.darkLogo;

  const containerStyle: React.CSSProperties = {
    ...base,
    background: isDark
      ? "transparent"
      : "#ffffff",
    boxShadow: isDark
      ? "none"
      : "0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
    padding: Math.round(size * 0.1),
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    mixBlendMode: isDark ? "screen" : "multiply",
  };

  return (
    <div style={containerStyle} className={className}>
      <img
        key={src}
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        onError={advance}
        style={imgStyle}
      />
    </div>
  );
}
