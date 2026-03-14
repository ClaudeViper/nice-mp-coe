"use client";

import { useState } from "react";

// ─── Logo registry ────────────────────────────────────────────────────────────
// Maps slug fragments → { url, bg color for the container, padding in px }
// Slugs are matched by checking if the vendor slug *contains* the key.

interface LogoEntry {
  url: string;
  bg: string;
  /** Inset padding so the img doesn't touch the container edge (px) */
  pad: number;
}

const LOGO_MAP: Record<string, LogoEntry> = {
  // OpenAI / Whisper
  openai: {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
    bg: "#ffffff",
    pad: 6,
  },
  // Google
  google: {
    url: "https://logo.clearbit.com/google.com",
    bg: "#ffffff",
    pad: 5,
  },
  // Amazon / AWS
  amazon: {
    url: "https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png",
    bg: "#232f3e",
    pad: 4,
  },
  aws: {
    url: "https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png",
    bg: "#232f3e",
    pad: 4,
  },
  // Microsoft / Azure
  microsoft: {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg",
    bg: "#ffffff",
    pad: 4,
  },
  azure: {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg",
    bg: "#ffffff",
    pad: 4,
  },
  // AssemblyAI
  assemblyai: {
    url: "https://www.assemblyai.com/favicon.ico",
    bg: "#1ED3B4",
    pad: 7,
  },
  // Deepgram
  deepgram: {
    url: "https://deepgram.com/favicon.ico",
    bg: "#101014",
    pad: 7,
  },
  // Rev AI
  "rev-ai": {
    url: "https://www.rev.com/favicon.ico",
    bg: "#0070f3",
    pad: 7,
  },
  rev: {
    url: "https://www.rev.com/favicon.ico",
    bg: "#0070f3",
    pad: 7,
  },
  // Speechmatics
  speechmatics: {
    url: "https://www.speechmatics.com/favicon.ico",
    bg: "#1e293b",
    pad: 7,
  },
  // ElevenLabs
  elevenlabs: {
    url: "https://elevenlabs.io/favicon.ico",
    bg: "#000000",
    pad: 7,
  },
  // Resemble AI
  resemble: {
    url: "https://www.resemble.ai/favicon.ico",
    bg: "#5046e5",
    pad: 7,
  },
  // PlayHT
  playht: {
    url: "https://play.ht/favicon.ico",
    bg: "#6d28d9",
    pad: 7,
  },
  // Cartesia
  cartesia: {
    url: "https://cartesia.ai/favicon.ico",
    bg: "#0a0a0a",
    pad: 7,
  },
  // Hume AI
  hume: {
    url: "https://www.hume.ai/favicon.ico",
    bg: "#1a1a2e",
    pad: 7,
  },
  // Tavus
  tavus: {
    url: "https://www.tavus.io/favicon.ico",
    bg: "#0f172a",
    pad: 7,
  },
  // Runway
  runway: {
    url: "https://runwayml.com/favicon.ico",
    bg: "#000000",
    pad: 7,
  },
  // Coqui
  coqui: {
    url: "https://logo.clearbit.com/coqui.ai",
    bg: "#1a1a1a",
    pad: 6,
  },
  // Meta
  meta: {
    url: "https://logo.clearbit.com/meta.com",
    bg: "#ffffff",
    pad: 5,
  },
  // NVIDIA
  nvidia: {
    url: "https://logo.clearbit.com/nvidia.com",
    bg: "#000000",
    pad: 5,
  },
  // VAPI
  vapi: {
    url: "https://logo.clearbit.com/vapi.ai",
    bg: "#0f0f1a",
    pad: 6,
  },
  // Retell AI
  retell: {
    url: "https://logo.clearbit.com/retellai.com",
    bg: "#0f172a",
    pad: 6,
  },
  retellai: {
    url: "https://logo.clearbit.com/retellai.com",
    bg: "#0f172a",
    pad: 6,
  },
};

/** Brand accent colors used in the fallback letter-avatar */
const BRAND_COLORS: Record<string, string> = {
  openai:       "#10a37f",
  google:       "#4285f4",
  amazon:       "#ff9900",
  aws:          "#ff9900",
  microsoft:    "#00a4ef",
  azure:        "#00a4ef",
  assemblyai:   "#1ED3B4",
  deepgram:     "#13ef95",
  rev:          "#0070f3",
  "rev-ai":     "#0070f3",
  speechmatics: "#2563eb",
  elevenlabs:   "#3b3b3b",
  resemble:     "#5046e5",
  playht:       "#6d28d9",
  cartesia:     "#6366f1",
  hume:         "#4f46e5",
  tavus:        "#0f172a",
  runway:       "#333333",
  coqui:        "#FBBF24",
  meta:         "#0082FB",
  nvidia:       "#76B900",
  vapi:         "#7C3AED",
  retell:       "#EC4899",
  retellai:     "#EC4899",
};

function resolveEntry(slug: string): LogoEntry | undefined {
  // Exact match first
  if (LOGO_MAP[slug]) return LOGO_MAP[slug];
  // Partial match: check if slug contains a known key
  for (const key of Object.keys(LOGO_MAP)) {
    if (slug.includes(key) || key.includes(slug)) return LOGO_MAP[key];
  }
  return undefined;
}

function resolveBrandColor(slug: string): string {
  if (BRAND_COLORS[slug]) return BRAND_COLORS[slug];
  for (const key of Object.keys(BRAND_COLORS)) {
    if (slug.includes(key) || key.includes(slug)) return BRAND_COLORS[key]!;
  }
  return "#00d4e8"; // NICE cyan default
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VendorLogoProps {
  /** Vendor display name, used for alt text and fallback initial */
  name: string;
  /** Vendor slug from database (e.g. "openai", "amazon-web-services") */
  slug: string;
  /** Container size in px (default 44) */
  size?: number;
  className?: string;
}

/**
 * Renders the official vendor logo inside a consistently-sized rounded container.
 * Falls back to a colored letter-avatar if the image fails to load or no URL is known.
 */
export function VendorLogo({ name, slug, size = 44, className = "" }: VendorLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const entry   = resolveEntry(slug.toLowerCase());
  const bgColor = entry?.bg ?? resolveBrandColor(slug.toLowerCase());
  const showImg = !!entry && !imgFailed;

  const baseStyle: React.CSSProperties = {
    width:     size,
    height:    size,
    minWidth:  size,
    minHeight: size,
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: bgColor,
    flexShrink: 0,
  };

  if (showImg) {
    const inner = size - (entry.pad ?? 0) * 2;
    return (
      <div style={baseStyle} className={className}>
        <img
          src={entry.url}
          alt={`${name} logo`}
          loading="lazy"
          width={inner}
          height={inner}
          onError={() => setImgFailed(true)}
          style={{ width: inner, height: inner, objectFit: "contain" }}
        />
      </div>
    );
  }

  // Fallback: letter avatar
  return (
    <div
      style={{
        ...baseStyle,
        background: `linear-gradient(135deg, ${bgColor}, #7c3aed)`,
        color: "#ffffff",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "-0.02em",
      }}
      className={className}
      aria-label={`${name} logo`}
      role="img"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
