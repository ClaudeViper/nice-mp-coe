"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  Brain,
  FileText,
  Newspaper,
  Zap,
  Database,
  Globe,
  Cloud,
  Shield,
  Cpu,
  ArrowRight,
  Sparkles,
  Activity,
  Mic,
  Volume2,
  AudioWaveform,
  Code2,
  Layers,
  Network,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FlaskConical,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */

const AGENTS = [
  {
    id: "benchmark-collector",
    name: "Benchmark Collector",
    icon: BarChart3,
    color: "#00d4e8",
    glow: "rgba(0,212,232,0.35)",
    bgGradient: "linear-gradient(135deg,rgba(0,212,232,0.12),rgba(0,212,232,0.03))",
    border: "rgba(0,212,232,0.3)",
    model: "Claude Opus 4-6",
    description:
      "Autonomously harvests speech-AI performance metrics from 17+ web sources using Claude's native web_search tool. Deduplicates and upserts structured benchmark data into the platform database with full audit trails.",
    skills: ["Web Search", "JSON Extraction", "Deduplication", "Batch Upsert", "Change Detection"],
    sources: ["HuggingFace ASR Leaderboard", "TTS Arena (ELO)", "Papers With Code", "Vendor API Docs", "GitHub Model Cards"],
    metrics: ["WER / CER", "RTF / TTFB", "MOS Scores", "ELO Ratings", "Pricing / Tier"],
    outputs: ["BenchmarkResult records", "Collector audit logs"],
    connections: ["PostgreSQL", "Claude API", "Web Sources"],
  },
  {
    id: "vendor-registry",
    name: "Vendor Registry",
    icon: Building2,
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.35)",
    bgGradient: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.03))",
    border: "rgba(124,58,237,0.3)",
    model: "Claude Sonnet 4-6",
    description:
      "Runs 4 sequential deep-research passes per vendor — company overview, deployment & security, languages & pricing, and NICE CXone compatibility — to build and maintain a comprehensive structured vendor knowledge base.",
    skills: ["Profile Research", "Compatibility Scoring", "Pricing Analysis", "Security Auditing", "Structured Extraction"],
    sources: ["Vendor Websites", "API Documentation", "Compliance Pages", "Pricing Pages", "Integration Guides"],
    metrics: ["Build vs Buy Score (1-10)", "Integration Days", "Language Coverage", "Security Certs"],
    outputs: ["Vendor profiles", "NICE compatibility matrix", "Pricing tier records"],
    connections: ["PostgreSQL", "Claude API", "Web Sources"],
  },
  {
    id: "evaluation-runner",
    name: "Evaluation Runner",
    icon: FlaskConical,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
    bgGradient: "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.03))",
    border: "rgba(245,158,11,0.3)",
    model: "Claude Sonnet 4-6",
    description:
      "The core evaluation engine that tests STT, TTS, and V2V vendor models against 6 NICE proprietary datasets (150 total samples). Computes WER/CER, RTF, TTFB, and MOS scores with simulation mode powered by Claude for development workflows.",
    skills: ["STT Evaluation", "TTS Evaluation", "V2V Testing", "WER/CER Calculation", "Simulation Mode"],
    sources: [
      "NICE-CX-Clean-EN (50 clips)",
      "NICE-CX-Noisy-EN (50 clips)",
      "NICE-TTS-IVR-EN (30 scripts)",
      "NICE-TTS-Agent-EN (30 scripts)",
      "NICE-V2V-Support-EN (10 scenarios)",
      "NICE-V2V-IVR-EN (10 conversations)",
    ],
    metrics: ["WER / CER", "RTF (Real-Time Factor)", "TTFB", "MOS (naturalness)", "Task Completion Rate"],
    outputs: ["EvaluationResult per sample", "Comparison summaries"],
    connections: ["PostgreSQL", "Claude API", "Vendor APIs"],
  },
  {
    id: "report-generator",
    name: "Report Generator",
    icon: FileText,
    color: "#10b981",
    glow: "rgba(16,185,129,0.35)",
    bgGradient: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.03))",
    border: "rgba(16,185,129,0.3)",
    model: "Claude Sonnet 4-6",
    description:
      "Synthesises platform data into 5 types of strategic business intelligence reports — from monthly landscape analyses to build-vs-buy TCO projections — with executive summaries and HTML rendering.",
    skills: ["Data Synthesis", "Markdown Generation", "HTML Rendering", "Executive Summarisation", "TCO Projection"],
    sources: ["Vendors DB", "Benchmarks DB", "Evaluations DB", "News DB"],
    metrics: ["5 Report Types", "15K-char context window summary", "2-3 sentence exec summary"],
    outputs: ["HTML Report", "Executive summary", "Report status tracking"],
    connections: ["PostgreSQL", "Claude API"],
  },
  {
    id: "news-scout",
    name: "News Scout",
    icon: Newspaper,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.35)",
    bgGradient: "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.03))",
    border: "rgba(239,68,68,0.3)",
    model: "Claude Sonnet 4-6",
    description:
      "Continuously monitors 15+ industry sources — from ArXiv to vendor blogs — extracting and scoring news articles on relevance (1-10). Batches 3 parallel searches per cycle to maintain a live intelligence feed.",
    skills: ["Source Monitoring", "Relevance Scoring", "Batch Processing", "Category Tagging", "Trend Detection"],
    sources: [
      "ArXiv (cs.SD, cs.CL, eess.AS)",
      "HuggingFace Blog",
      "OpenAI / Google / ElevenLabs Blogs",
      "Deepgram / Speechmatics",
      "TechCrunch / VentureBeat",
      "Artificial Analysis Leaderboards",
    ],
    metrics: ["Relevance Score 1-10", "9-10: SOTA / Major Releases", "5-6: Interesting", "<5: Filtered"],
    outputs: ["NewsItem records", "Category tags", "Relevance scores"],
    connections: ["PostgreSQL", "Claude API", "Web Sources"],
  },
  {
    id: "deployment-guidelines",
    name: "Deployment Guidelines",
    icon: Cloud,
    color: "#6366f1",
    glow: "rgba(99,102,241,0.35)",
    bgGradient: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.03))",
    border: "rgba(99,102,241,0.3)",
    model: "Claude Opus 4-6",
    description:
      "Runs an agentic loop with web search to auto-generate production-ready deployment guides for integrating any vendor into NICE CXone — covering auth, quick-start code, configuration, rate limits, and troubleshooting.",
    skills: ["Agentic Loop", "Web Research", "Code Generation", "Integration Mapping", "Markdown Authoring"],
    sources: ["Vendor API Docs", "Auth Guides", "SDK References", "NICE CXone Docs"],
    metrics: ["7 document sections", "Auth + Quick Start + NICE Integration", "Rate limits & troubleshooting"],
    outputs: ["Markdown deployment guide", "HTML rendering", "Status tracking"],
    connections: ["PostgreSQL", "Claude API", "Web Sources"],
  },
];

const TECH_STACK = [
  { category: "Frontend", color: "#00d4e8", items: [
    { name: "Next.js 15", sub: "App Router + Turbopack" },
    { name: "React 19", sub: "Server & Client Components" },
    { name: "TypeScript 5", sub: "Strict mode" },
    { name: "TailwindCSS 4", sub: "Utility-first styling" },
    { name: "Radix UI", sub: "Accessible primitives" },
    { name: "Recharts", sub: "Data visualisation" },
  ]},
  { category: "AI / Agents", color: "#7c3aed", items: [
    { name: "Claude Opus 4-6", sub: "Complex research & collection" },
    { name: "Claude Sonnet 4-6", sub: "Evaluation & reporting" },
    { name: "web_search_20250305", sub: "Anthropic native search tool" },
    { name: "Agentic Loops", sub: "Iterative tool-calling" },
    { name: "@anthropic-ai/sdk", sub: "v0.78.0" },
  ]},
  { category: "Backend / Data", color: "#10b981", items: [
    { name: "Node.js", sub: "Next.js API Routes" },
    { name: "Prisma 7.5", sub: "Type-safe ORM" },
    { name: "PostgreSQL", sub: "Primary datastore" },
    { name: "REST APIs", sub: "30+ route handlers" },
  ]},
  { category: "Infrastructure", color: "#f59e0b", items: [
    { name: "Docker", sub: "Multi-stage build" },
    { name: "Standalone output", sub: "Next.js optimised" },
    { name: "Vitest", sub: "Unit testing" },
    { name: "Playwright", sub: "E2E testing" },
  ]},
];

const ARCHITECTURE_LAYERS = [
  { label: "Browser / Client", color: "#00d4e8", icon: Globe, desc: "Next.js React 19 — SSR + Client Components" },
  { label: "Next.js API Routes", color: "#7c3aed", icon: Code2, desc: "30+ REST endpoints, streaming responses" },
  { label: "Agent Orchestrator", color: "#f59e0b", icon: Bot, desc: "6 autonomous Claude-powered agents" },
  { label: "Anthropic Claude API", color: "#ef4444", icon: Brain, desc: "Opus 4-6 + Sonnet 4-6 + native web_search" },
  { label: "PostgreSQL + Prisma", color: "#10b981", icon: Database, desc: "Type-safe ORM, full audit trail" },
];

const DATA_FLOW_STEPS = [
  { step: "01", label: "User triggers agent", icon: Zap, color: "#00d4e8" },
  { step: "02", label: "API Route spawns agent", icon: Code2, color: "#7c3aed" },
  { step: "03", label: "Agent calls Claude API", icon: Brain, color: "#f59e0b" },
  { step: "04", label: "Claude uses web_search tool", icon: Globe, color: "#ef4444" },
  { step: "05", label: "Structured data extracted", icon: Activity, color: "#10b981" },
  { step: "06", label: "Results upserted to DB", icon: Database, color: "#6366f1" },
  { step: "07", label: "UI reflects live updates", icon: Sparkles, color: "#00d4e8" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function AgentCard({ agent }: { agent: (typeof AGENTS)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = agent.icon;

  return (
    <div
      style={{
        background: agent.bgGradient,
        border: `1px solid ${agent.border}`,
        borderRadius: "16px",
        padding: "24px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${agent.glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${agent.glow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${agent.color}22, ${agent.color}11)`,
              border: `1px solid ${agent.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: "20px", height: "20px", color: agent.color }} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">{agent.name}</h3>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}
            >
              {agent.model}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ color: "rgba(148,163,184,0.6)", flexShrink: 0 }}
          className="hover:text-white transition-colors mt-1"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(148,163,184,0.8)" }}>
        {agent.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.skills.map((skill) => (
          <span
            key={skill}
            className="text-xs px-2 py-1 rounded-lg font-medium"
            style={{ background: `${agent.color}10`, color: agent.color, border: `1px solid ${agent.color}20` }}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-4 pt-4" style={{ borderTop: `1px solid ${agent.border}` }}>
          {/* Sources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: agent.color }}>
              Data Sources
            </p>
            <ul className="space-y-1">
              {agent.sources.map((src) => (
                <li key={src} className="flex items-center gap-2 text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: agent.color, flexShrink: 0 }} />
                  {src}
                </li>
              ))}
            </ul>
          </div>

          {/* Metrics */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: agent.color }}>
              Key Metrics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {agent.metrics.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: agent.color }}>
              Outputs
            </p>
            <div className="flex flex-wrap gap-1.5">
              {agent.outputs.map((o) => (
                <span key={o} className="text-xs px-2 py-0.5 rounded" style={{ background: `${agent.color}08`, color: agent.color, border: `1px solid ${agent.color}20` }}>
                  {o}
                </span>
              ))}
            </div>
          </div>

          {/* Connections */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: agent.color }}>
              Connects To
            </p>
            <div className="flex flex-wrap gap-1.5">
              {agent.connections.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function ArchitecturePage() {
  return (
    <div
      style={{
        minHeight: "100%",
        padding: "32px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative mb-12 overflow-hidden rounded-2xl p-10"
        style={{
          background: "linear-gradient(135deg,rgba(0,212,232,0.08) 0%,rgba(124,58,237,0.08) 50%,rgba(0,0,0,0) 100%)",
          border: "1px solid rgba(0,212,232,0.15)",
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(0,212,232,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,232,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}
            >
              <Network className="h-3.5 w-3.5" />
              System Architecture
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              6 Autonomous Agents
            </div>
          </div>

          <h1
            className="text-4xl font-black mb-3"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #00d4e8 40%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            NICE MP CoE — Agentic Platform Architecture
          </h1>
          <p className="text-base max-w-3xl mb-8" style={{ color: "rgba(148,163,184,0.8)", lineHeight: "1.7" }}>
            A fully agentic, AI-native platform for evaluating, benchmarking, and researching Speech-to-Text, Text-to-Speech,
            and Voice-to-Voice technologies. Powered by Anthropic Claude with native web search across 6 autonomous agents,
            a Next.js 15 frontend, and a Prisma-managed PostgreSQL knowledge base.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Agents", value: "6", color: "#00d4e8" },
              { label: "Data Sources", value: "17+", color: "#7c3aed" },
              { label: "Test Samples", value: "150", color: "#f59e0b" },
              { label: "API Routes", value: "30+", color: "#10b981" },
              { label: "Report Types", value: "5", color: "#ef4444" },
              { label: "Tech Stack", value: "Next.js 15 + Claude", color: "#6366f1" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ARCHITECTURE LAYERS ───────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionHeader icon={Layers} label="System Layers" color="#00d4e8" />

        <div className="relative">
          {/* Connection line */}
          <div
            style={{
              position: "absolute",
              left: "22px",
              top: "24px",
              bottom: "24px",
              width: "2px",
              background: "linear-gradient(180deg,#00d4e8,#7c3aed,#f59e0b,#ef4444,#10b981)",
              opacity: 0.4,
            }}
          />

          <div className="space-y-3 pl-1">
            {ARCHITECTURE_LAYERS.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <div key={i} className="flex items-center gap-4 relative">
                  {/* Dot */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: `${layer.color}15`,
                      border: `2px solid ${layer.color}50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      zIndex: 1,
                      boxShadow: `0 0 12px ${layer.color}30`,
                    }}
                  >
                    <Icon style={{ width: "18px", height: "18px", color: layer.color }} />
                  </div>

                  <div
                    className="flex-1 flex items-center justify-between rounded-xl px-5 py-3"
                    style={{
                      background: `${layer.color}08`,
                      border: `1px solid ${layer.color}20`,
                    }}
                  >
                    <span className="font-semibold text-white">{layer.label}</span>
                    <span className="text-sm hidden sm:block" style={{ color: "rgba(148,163,184,0.7)" }}>{layer.desc}</span>
                    {i < ARCHITECTURE_LAYERS.length - 1 && (
                      <ArrowRight className="h-4 w-4 ml-4 sm:hidden flex-shrink-0" style={{ color: layer.color }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DATA FLOW ─────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionHeader icon={Activity} label="Agent Request Data Flow" color="#7c3aed" />

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(124,58,237,0.04)",
            border: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          <div className="flex flex-wrap gap-2 items-center justify-start">
            {DATA_FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl"
                    style={{
                      background: `${step.color}10`,
                      border: `1px solid ${step.color}25`,
                      minWidth: "110px",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold" style={{ color: step.color }}>{step.step}</span>
                      <Icon style={{ width: "14px", height: "14px", color: step.color }} />
                    </div>
                    <span className="text-xs text-center font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {step.label}
                    </span>
                  </div>
                  {i < DATA_FLOW_STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(148,163,184,0.3)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENCHMARK CATEGORIES ──────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionHeader icon={Mic} label="Evaluation Domains" color="#f59e0b" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Mic,
              label: "Speech-to-Text (STT)",
              color: "#00d4e8",
              metrics: ["WER / CER", "Real-Time Factor (RTF)", "TTFB (latency)", "Speaker Diarisation", "Punctuation Accuracy"],
              datasets: ["NICE-CX-Clean-EN · 50 clips", "NICE-CX-Noisy-EN · 50 clips"],
            },
            {
              icon: Volume2,
              label: "Text-to-Speech (TTS)",
              color: "#7c3aed",
              metrics: ["MOS (naturalness)", "Intelligibility", "TTFB", "ELO Score (TTS Arena)", "Prosody quality"],
              datasets: ["NICE-TTS-IVR-EN · 30 scripts", "NICE-TTS-Agent-EN · 30 scripts"],
            },
            {
              icon: AudioWaveform,
              label: "Voice-to-Voice (V2V)",
              color: "#f59e0b",
              metrics: ["Task Completion Rate", "Turn-Taking Accuracy", "Intent Recognition", "End-to-End Latency", "Conversation coherence"],
              datasets: ["NICE-V2V-Support-EN · 10 scenarios", "NICE-V2V-IVR-EN · 10 conversations"],
            },
          ].map((domain) => {
            const Icon = domain.icon;
            return (
              <div
                key={domain.label}
                className="rounded-2xl p-5"
                style={{
                  background: `${domain.color}08`,
                  border: `1px solid ${domain.color}25`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: `${domain.color}15`,
                      border: `1px solid ${domain.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon style={{ width: "16px", height: "16px", color: domain.color }} />
                  </div>
                  <h3 className="font-bold text-white text-sm">{domain.label}</h3>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: domain.color }}>Metrics</p>
                  <ul className="space-y-1">
                    {domain.metrics.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-xs" style={{ color: "rgba(148,163,184,0.75)" }}>
                        <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: domain.color, flexShrink: 0 }} />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: domain.color }}>Datasets</p>
                  {domain.datasets.map((d) => (
                    <div key={d} className="flex items-center gap-2 text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <Database style={{ width: "10px", height: "10px", color: domain.color, flexShrink: 0 }} />
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── AGENTS ────────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionHeader icon={Bot} label="Autonomous Agents" color="#00d4e8" subtitle="Click an agent to expand its full capability profile" />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionHeader icon={Cpu} label="Technology Stack" color="#10b981" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {TECH_STACK.map((cat) => (
            <div
              key={cat.category}
              className="rounded-2xl p-5"
              style={{
                background: `${cat.color}06`,
                border: `1px solid ${cat.color}20`,
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: cat.color,
                    boxShadow: `0 0 8px ${cat.color}`,
                  }}
                />
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: cat.color }}>
                  {cat.category}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {cat.items.map((item) => (
                  <li key={item.name}>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs" style={{ color: "rgba(148,163,184,0.55)" }}>{item.sub}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTEGRATION MATRIX ────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHeader icon={Shield} label="Integration & Compliance" color="#6366f1" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* NICE CXone Integration */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Network className="h-4 w-4" style={{ color: "#6366f1" }} />
              NICE CXone Integration Matrix
            </h3>
            <p className="text-sm mb-4" style={{ color: "rgba(148,163,184,0.7)" }}>
              Each vendor assessed on integration readiness with a scored build-vs-buy analysis.
            </p>
            <div className="space-y-2">
              {[
                { label: "Build vs Buy Score", desc: "1–10 strategic score per vendor" },
                { label: "Integration Method", desc: "REST / SDK / WebSocket / Embedded" },
                { label: "Estimated Days", desc: "Projected integration effort" },
                { label: "Migration Complexity", desc: "Low / Medium / High / Critical" },
                { label: "Auto-generated Guides", desc: "Deployment Guidelines Agent" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 text-xs">
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#6366f1", marginTop: "6px", flexShrink: 0 }} />
                  <div>
                    <span className="font-semibold text-white">{item.label}</span>
                    <span style={{ color: "rgba(148,163,184,0.6)" }}> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security certs */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: "#10b981" }} />
              Security & Compliance Tracking
            </h3>
            <p className="text-sm mb-4" style={{ color: "rgba(148,163,184,0.7)" }}>
              Vendor Registry agent automatically audits and records compliance certifications.
            </p>
            <div className="flex flex-wrap gap-2">
              {["SOC 2 Type II", "HIPAA", "GDPR", "FedRAMP", "ISO 27001", "PCI DSS", "CCPA", "C5", "StateRAMP", "CSA STAR"].map((cert) => (
                <span
                  key={cert}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  {cert}
                </span>
              ))}
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(16,185,129,0.15)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#10b981" }}>Deployment Options Tracked</p>
              <div className="flex flex-wrap gap-2">
                {["Cloud", "On-Premises", "Hybrid", "Edge", "Air-Gapped"].map((d) => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg,rgba(0,212,232,0.06),rgba(124,58,237,0.06))",
          border: "1px solid rgba(0,212,232,0.12)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-4 w-4" style={{ color: "#7c3aed" }} />
          <span className="text-sm font-semibold text-white">Powered by Anthropic Claude</span>
          <Sparkles className="h-4 w-4" style={{ color: "#00d4e8" }} />
        </div>
        <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
          NICE MP CoE Agentic Platform · Built with Next.js 15, React 19, TypeScript, Prisma, PostgreSQL & Claude Opus / Sonnet 4-6
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED HELPER
───────────────────────────────────────────────────────────────────────────── */

function SectionHeader({
  icon: Icon,
  label,
  color,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: "15px", height: "15px", color }} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{label}</h2>
        {subtitle && <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>{subtitle}</p>}
      </div>
      <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(90deg,${color}30,transparent)` }} />
    </div>
  );
}
