"use client";

import { useState } from "react";

// ─── Vendor domain registry ────────────────────────────────────────────────────
// Maps slug fragments → domain + styling.
// Logo URL chain: Clearbit (128px PNG) → DuckDuckGo favicon → letter-avatar.

interface VendorEntry {
  /** Primary domain for Clearbit & DDG favicon lookup */
  domain: string;
  /** Brand accent color used in letter-avatar fallback */
  color: string;
}

const VENDOR_MAP: Record<string, VendorEntry> = {
  openai:        { domain: "openai.com",        color: "#10a37f" },
  google:        { domain: "google.com",        color: "#4285F4" },
  amazon:        { domain: "amazon.com",        color: "#ff9900" },
  aws:           { domain: "amazon.com",        color: "#ff9900" },
  microsoft:     { domain: "microsoft.com",     color: "#00a4ef" },
  azure:         { domain: "microsoft.com",     color: "#00a4ef" },
  assemblyai:    { domain: "assemblyai.com",    color: "#1ED3B4" },
  deepgram:      { domain: "deepgram.com",      color: "#13ef95" },
  rev:           { domain: "rev.com",           color: "#0070f3" },
  "rev-ai":      { domain: "rev.com",           color: "#0070f3" },
  speechmatics:  { domain: "speechmatics.com",  color: "#2563eb" },
  elevenlabs:    { domain: "elevenlabs.io",      color: "#ffffff" },
  resemble:      { domain: "resemble.ai",       color: "#5046e5" },
  playht:        { domain: "play.ht",           color: "#6d28d9" },
  cartesia:      { domain: "cartesia.ai",       color: "#6366f1" },
  hume:          { domain: "hume.ai",           color: "#4f46e5" },
  tavus:         { domain: "tavus.io",          color: "#d946ef" },
  runway:        { domain: "runwayml.com",      color: "#666666" },
  coqui:         { domain: "coqui.ai",          color: "#FBBF24" },
  meta:          { domain: "meta.com",          color: "#0082FB" },
  nvidia:        { domain: "nvidia.com",        color: "#76B900" },
  vapi:          { domain: "vapi.ai",           color: "#7C3AED" },
  retell:        { domain: "retellai.com",      color: "#EC4899" },
  retellai:      { domain: "retellai.com",      color: "#EC4899" },
};

function resolveEntry(slug: string): VendorEntry | undefined {
  const s = slug.toLowerCase();
  // Exact match
  if (VENDOR_MAP[s]) return VENDOR_MAP[s];
  // Prefix/substring match
  for (const key of Object.keys(VENDOR_MAP)) {
    if (s.includes(key) || key.includes(s.split("-")[0]!)) return VENDOR_MAP[key];
  }
  return undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VendorLogoProps {
  name: string;
  slug: string;
  size?: number;
  className?: string;
}

type Stage = "clearbit" | "ddg" | "avatar";

/**
 * Vendor logo with 3-stage fallback:
 *   1. Clearbit (https://logo.clearbit.com/{domain}) — 128px PNG
 *   2. DuckDuckGo favicon (https://icons.duckduckgo.com/ip3/{domain}.ico)
 *   3. Branded letter-avatar with exact vendor color
 */
export function VendorLogo({ name, slug, size = 44, className = "" }: VendorLogoProps) {
  const [stage, setStage] = useState<Stage>("clearbit");

  const entry      = resolveEntry(slug);
  const brandColor = entry?.color ?? "#00d4e8";

  const advance = () =>
    setStage((s) => (s === "clearbit" ? "ddg" : "avatar"));

  const containerStyle: React.CSSProperties = {
    width: size, height: size, minWidth: size, minHeight: size,
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "transparent",   // no app / brand background — pure logo
  };

  // ── No entry or image failed → letter avatar ─────────────────────────────
  if (!entry || stage === "avatar") {
    return (
      <div
        style={{
          ...containerStyle,
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

  // ── Image stages (Clearbit or DDG) ───────────────────────────────────────
  const src =
    stage === "clearbit"
      ? `https://logo.clearbit.com/${entry.domain}`
      : `https://icons.duckduckgo.com/ip3/${entry.domain}.ico`;

  return (
    <div style={containerStyle} className={className}>
      <img
        key={src}
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        width={size}
        height={size}
        onError={advance}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    </div>
  );
}
