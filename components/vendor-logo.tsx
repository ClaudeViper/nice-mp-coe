"use client";

import { useState } from "react";

// ─── Vendor domain registry ────────────────────────────────────────────────────
// Maps slug fragments → domain + styling.
// Logo URL chain: Clearbit (128px PNG) → DuckDuckGo favicon → letter-avatar.

interface VendorEntry {
  /** Primary domain for Clearbit & DDG favicon lookup */
  domain: string;
  /** Background color for the logo container */
  bg: string;
  /** Brand accent color used in letter-avatar fallback */
  color: string;
  /** Inner padding (px) so the logo doesn't touch the container edge */
  pad: number;
}

const VENDOR_MAP: Record<string, VendorEntry> = {
  openai:        { domain: "openai.com",          bg: "#000000", color: "#10a37f", pad: 6 },
  google:        { domain: "google.com",           bg: "#ffffff", color: "#4285F4", pad: 5 },
  amazon:        { domain: "amazon.com",           bg: "#232f3e", color: "#ff9900", pad: 4 },
  aws:           { domain: "amazon.com",           bg: "#232f3e", color: "#ff9900", pad: 4 },
  microsoft:     { domain: "microsoft.com",        bg: "#ffffff", color: "#00a4ef", pad: 4 },
  azure:         { domain: "microsoft.com",        bg: "#ffffff", color: "#00a4ef", pad: 4 },
  assemblyai:    { domain: "assemblyai.com",       bg: "#1ED3B4", color: "#000000", pad: 7 },
  deepgram:      { domain: "deepgram.com",         bg: "#101014", color: "#13ef95", pad: 7 },
  rev:           { domain: "rev.com",              bg: "#0070f3", color: "#ffffff", pad: 7 },
  "rev-ai":      { domain: "rev.com",              bg: "#0070f3", color: "#ffffff", pad: 7 },
  speechmatics:  { domain: "speechmatics.com",     bg: "#1e293b", color: "#2563eb", pad: 7 },
  elevenlabs:    { domain: "elevenlabs.io",         bg: "#000000", color: "#ffffff", pad: 7 },
  resemble:      { domain: "resemble.ai",          bg: "#5046e5", color: "#ffffff", pad: 7 },
  playht:        { domain: "play.ht",              bg: "#6d28d9", color: "#ffffff", pad: 7 },
  cartesia:      { domain: "cartesia.ai",          bg: "#0a0a0a", color: "#6366f1", pad: 7 },
  hume:          { domain: "hume.ai",              bg: "#1a1a2e", color: "#4f46e5", pad: 7 },
  tavus:         { domain: "tavus.io",             bg: "#0f172a", color: "#d946ef", pad: 7 },
  runway:        { domain: "runwayml.com",         bg: "#000000", color: "#666666", pad: 7 },
  // Requested vendors
  coqui:         { domain: "coqui.ai",             bg: "#1a1a1a", color: "#FBBF24", pad: 6 },
  meta:          { domain: "meta.com",             bg: "#ffffff", color: "#0082FB", pad: 5 },
  nvidia:        { domain: "nvidia.com",           bg: "#000000", color: "#76B900", pad: 5 },
  vapi:          { domain: "vapi.ai",              bg: "#0f0f1a", color: "#7C3AED", pad: 6 },
  retell:        { domain: "retellai.com",         bg: "#0f172a", color: "#EC4899", pad: 6 },
  retellai:      { domain: "retellai.com",         bg: "#0f172a", color: "#EC4899", pad: 6 },
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

  const entry     = resolveEntry(slug);
  const brandColor = entry?.color ?? "#00d4e8";
  const bgColor    = entry?.bg    ?? "#0f172a";

  const advance = () =>
    setStage((s) => (s === "clearbit" ? "ddg" : "avatar"));

  const baseStyle: React.CSSProperties = {
    width: size, height: size, minWidth: size, minHeight: size,
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: bgColor,
  };

  // ── No entry → letter avatar straight away ───────────────────────────────
  if (!entry || stage === "avatar") {
    return (
      <div
        style={{
          ...baseStyle,
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

  const inner = size - entry.pad * 2;

  return (
    <div style={baseStyle} className={className}>
      <img
        key={src}          /* force new element when src changes */
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        width={inner}
        height={inner}
        onError={advance}
        style={{ width: inner, height: inner, objectFit: "contain" }}
      />
    </div>
  );
}
