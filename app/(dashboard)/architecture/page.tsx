"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  Newspaper,
  Cloud,
  Database,
  Globe,
  Cpu,
  ArrowRight,
  Sparkles,
  Activity,
  Mic,
  Volume2,
  AudioWaveform,
  Layers,
  Bot,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Brain,
  Network,
  Shield,
  Code2,
  Zap,
  Search,
} from "lucide-react";

/* ─── Agent definitions ──────────────────────────────────────────────────── */

const AGENTS = [
  {
    id: "benchmark-collector",
    name: "Benchmark Collector",
    icon: BarChart3,
    accentColor: "#00d4e8",
    model: "Claude Opus 4-6",
    description:
      "Autonomously harvests speech-AI performance metrics from 17+ web sources using Claude's native web_search tool. Deduplicates results and upserts structured data with full audit trails.",
    skills: ["Web Search", "JSON Extraction", "Deduplication", "Batch Upsert", "Change Detection"],
    sources: [
      "HuggingFace Open ASR Leaderboard",
      "TTS Arena (ELO scores)",
      "Papers With Code — LibriSpeech / CommonVoice",
      "Vendor pricing & API docs",
      "GitHub model cards",
    ],
    metrics: ["WER / CER", "RTF (Real-Time Factor)", "TTFB", "MOS Scores", "ELO Ratings", "Pricing tiers"],
    outputs: ["BenchmarkResult DB records", "Collector audit logs"],
  },
  {
    id: "vendor-registry",
    name: "Vendor Registry",
    icon: Building2,
    accentColor: "#a78bfa",
    model: "Claude Sonnet 4-6",
    description:
      "Runs 4 sequential deep-research passes per vendor — company overview, deployment & security, languages & pricing, and NICE CXone compatibility — to build a structured knowledge base.",
    skills: ["Profile Research", "Compatibility Scoring", "Pricing Analysis", "Security Auditing", "Structured Extraction"],
    sources: [
      "Vendor websites & API documentation",
      "Compliance & certification pages",
      "Pricing pages & volume discount tables",
      "NICE CXone integration guides",
    ],
    metrics: ["Build vs Buy Score (1–10)", "Est. integration days", "Language coverage", "Security certificates"],
    outputs: ["Vendor profiles", "NICE compatibility matrix", "Pricing tier records"],
  },
  {
    id: "evaluation-runner",
    name: "Evaluation Runner",
    icon: FlaskConical,
    accentColor: "#fbbf24",
    model: "Claude Sonnet 4-6",
    description:
      "Core evaluation engine that tests STT, TTS, and V2V vendor models against 6 NICE proprietary datasets (150 total samples). Supports simulation mode for development workflows.",
    skills: ["STT Evaluation", "TTS Evaluation", "V2V Testing", "WER/CER Calculation", "Simulation Mode"],
    sources: [
      "NICE-CX-Clean-EN — 50 contact-center clips",
      "NICE-CX-Noisy-EN — 50 noisy/accented clips",
      "NICE-TTS-IVR-EN — 30 IVR prompt scripts",
      "NICE-TTS-Agent-EN — 30 agent response scripts",
      "NICE-V2V-Support-EN — 10 multi-turn scenarios",
      "NICE-V2V-IVR-EN — 10 conversational IVR scripts",
    ],
    metrics: ["WER / CER", "RTF", "TTFB", "MOS (naturalness)", "Task completion rate"],
    outputs: ["EvaluationResult per sample", "Comparison summaries", "Status tracking"],
  },
  {
    id: "report-generator",
    name: "Report Generator",
    icon: FileText,
    accentColor: "#34d399",
    model: "Claude Sonnet 4-6",
    description:
      "Synthesises vendor, benchmark, evaluation and news data into 5 types of strategic business intelligence reports with executive summaries and full HTML rendering.",
    skills: ["Data Synthesis", "Markdown Generation", "HTML Rendering", "Executive Summarisation", "TCO Projection"],
    sources: ["Vendors DB", "Benchmarks DB", "Evaluations DB", "News DB"],
    metrics: [
      "Monthly Landscape report",
      "Vendor Comparison report",
      "Evaluation Summary report",
      "Build vs Buy (TCO) report",
      "Integration Readiness report",
    ],
    outputs: ["HTML Report content", "Executive summary (2–3 sentences)", "Report status tracking"],
  },
  {
    id: "news-scout",
    name: "News Scout",
    icon: Newspaper,
    accentColor: "#f87171",
    model: "Claude Sonnet 4-6",
    description:
      "Continuously monitors 15+ industry sources — from ArXiv to vendor blogs — extracting and relevance-scoring articles (1–10). Processes 3 parallel searches per cycle.",
    skills: ["Source Monitoring", "Relevance Scoring", "Batch Processing", "Category Tagging", "Trend Detection"],
    sources: [
      "ArXiv — cs.SD, cs.CL, eess.AS",
      "HuggingFace / OpenAI / Google blogs",
      "ElevenLabs / Deepgram / Speechmatics",
      "TechCrunch / VentureBeat",
      "Artificial Analysis Leaderboards",
    ],
    metrics: ["Score 9–10: SOTA / major releases", "Score 7–8: significant dev", "Score 5–6: interesting", "Below 5: filtered"],
    outputs: ["NewsItem records", "Relevance scores", "Category & tag labels"],
  },
  {
    id: "deployment-guidelines",
    name: "Deployment Guidelines",
    icon: Cloud,
    accentColor: "#818cf8",
    model: "Claude Opus 4-6",
    description:
      "Runs an agentic loop with web search to auto-generate production-ready NICE CXone integration guides — covering auth, quick-start code, configuration, rate limits, and troubleshooting.",
    skills: ["Agentic Loop", "Web Research", "Code Generation", "Integration Mapping", "Markdown Authoring"],
    sources: ["Vendor API docs", "Auth & SDK references", "NICE CXone documentation"],
    metrics: ["Prerequisites section", "Auth & API Keys", "Quick Start (code snippet)", "NICE CXone Integration", "Rate Limits & Troubleshooting"],
    outputs: ["Markdown deployment guide", "HTML rendering", "Generation status tracking"],
  },
];

/* ─── Architecture layers ────────────────────────────────────────────────── */

const LAYERS = [
  { label: "Browser / Client", desc: "Next.js 15 — React 19 Server & Client Components, TailwindCSS 4, Radix UI, Recharts", icon: Globe, color: "#00d4e8" },
  { label: "Next.js API Routes", desc: "30+ REST endpoints handling agent triggers, data queries, streaming responses", icon: Code2, color: "#a78bfa" },
  { label: "Agent Orchestrator", desc: "6 autonomous Claude-powered agents — each with tool access, agentic loops, and structured outputs", icon: Bot, color: "#fbbf24" },
  { label: "Anthropic Claude API", desc: "Claude Opus 4-6 (research) + Claude Sonnet 4-6 (evaluation & reporting) + native web_search_20250305 tool", icon: Brain, color: "#f87171" },
  { label: "PostgreSQL + Prisma 7", desc: "Type-safe ORM, full audit trail, structured vendor/benchmark/evaluation knowledge base", icon: Database, color: "#34d399" },
];

/* ─── Data flow ──────────────────────────────────────────────────────────── */

const FLOW_STEPS = [
  { n: "01", label: "User triggers agent via UI", icon: Zap, color: "#00d4e8" },
  { n: "02", label: "API route spawns agent", icon: Code2, color: "#a78bfa" },
  { n: "03", label: "Agent calls Claude API", icon: Brain, color: "#fbbf24" },
  { n: "04", label: "Claude uses web_search", icon: Search, color: "#f87171" },
  { n: "05", label: "Structured JSON extracted", icon: Activity, color: "#34d399" },
  { n: "06", label: "Results upserted to DB", icon: Database, color: "#818cf8" },
  { n: "07", label: "UI reflects live updates", icon: Sparkles, color: "#00d4e8" },
];

/* ─── Evaluation domains ─────────────────────────────────────────────────── */

const DOMAINS = [
  {
    icon: Mic,
    label: "Speech-to-Text (STT)",
    color: "#00d4e8",
    metrics: ["Word Error Rate (WER)", "Character Error Rate (CER)", "Real-Time Factor (RTF)", "Time to First Byte (TTFB)", "Speaker Diarisation", "Punctuation Accuracy"],
    datasets: ["NICE-CX-Clean-EN · 50 clean contact-center clips", "NICE-CX-Noisy-EN · 50 noisy / accented clips"],
  },
  {
    icon: Volume2,
    label: "Text-to-Speech (TTS)",
    color: "#a78bfa",
    metrics: ["MOS Naturalness Score", "Intelligibility Rating", "TTFB / Streaming Latency", "ELO Score (TTS Arena)", "Prosody Quality"],
    datasets: ["NICE-TTS-IVR-EN · 30 IVR prompt scripts", "NICE-TTS-Agent-EN · 30 agent response scripts"],
  },
  {
    icon: AudioWaveform,
    label: "Voice-to-Voice (V2V)",
    color: "#fbbf24",
    metrics: ["Task Completion Rate", "Turn-Taking Accuracy", "Intent Recognition %", "End-to-End Latency", "Conversation Coherence"],
    datasets: ["NICE-V2V-Support-EN · 10 multi-turn support scenarios", "NICE-V2V-IVR-EN · 10 conversational IVR scripts"],
  },
];

/* ─── Tech stack ─────────────────────────────────────────────────────────── */

const TECH = [
  {
    category: "Frontend",
    color: "#00d4e8",
    items: [
      { name: "Next.js 15", sub: "App Router + Turbopack" },
      { name: "React 19", sub: "Server & Client Components" },
      { name: "TypeScript 5", sub: "Strict mode" },
      { name: "TailwindCSS 4", sub: "Utility-first styling" },
      { name: "Radix UI", sub: "Accessible primitives" },
      { name: "Recharts", sub: "Data visualisation" },
    ],
  },
  {
    category: "AI / Agents",
    color: "#a78bfa",
    items: [
      { name: "Claude Opus 4-6", sub: "Complex research & collection" },
      { name: "Claude Sonnet 4-6", sub: "Evaluation & reporting" },
      { name: "web_search_20250305", sub: "Anthropic native search tool" },
      { name: "Agentic Loops", sub: "Iterative tool-calling" },
      { name: "@anthropic-ai/sdk", sub: "v0.78.0" },
    ],
  },
  {
    category: "Backend / Data",
    color: "#34d399",
    items: [
      { name: "Node.js", sub: "Next.js API Routes" },
      { name: "Prisma 7.5", sub: "Type-safe ORM" },
      { name: "PostgreSQL", sub: "Primary datastore" },
      { name: "REST APIs", sub: "30+ route handlers" },
    ],
  },
  {
    category: "Infrastructure",
    color: "#fbbf24",
    items: [
      { name: "Docker", sub: "Multi-stage build" },
      { name: "Standalone output", sub: "Next.js optimised" },
      { name: "Vitest", sub: "Unit testing" },
      { name: "Playwright", sub: "E2E testing" },
    ],
  },
];

/* ─── Agent card ─────────────────────────────────────────────────────────── */

function AgentCard({ agent }: { agent: (typeof AGENTS)[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = agent.icon;

  return (
    <div
      style={{
        background: "#1e2433",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Colored top bar */}
      <div style={{ height: "4px", background: agent.accentColor }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#262d3d",
                border: `1px solid ${agent.accentColor}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: "18px", height: "18px", color: agent.accentColor }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">{agent.name}</h3>
              <span
                className="text-xs font-mono"
                style={{ color: agent.accentColor }}
              >
                {agent.model}
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
            style={{
              background: open ? "#262d3d" : "transparent",
              color: "rgba(148,163,184,0.7)",
              border: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}
          >
            {open ? "Less" : "More"}
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm mb-4" style={{ color: "#94a3b8", lineHeight: "1.6" }}>
          {agent.description}
        </p>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.map((s) => (
            <span
              key={s}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "#262d3d", color: agent.accentColor, border: `1px solid ${agent.accentColor}30` }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Expanded section */}
        {open && (
          <div className="mt-4 space-y-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <DetailBlock label="Data Sources" color={agent.accentColor} items={agent.sources} bullet />
            <DetailBlock label="Key Metrics" color={agent.accentColor} items={agent.metrics} />
            <DetailBlock label="Outputs" color={agent.accentColor} items={agent.outputs} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailBlock({ label, color, items, bullet }: { label: string; color: string; items: string[]; bullet?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color }}>
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#94a3b8" }}>
            {bullet && (
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: color, marginTop: "5px", flexShrink: 0 }} />
            )}
            {!bullet && (
              <span style={{ color, flexShrink: 0, marginTop: "1px" }}>›</span>
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────────────────── */

function SectionTitle({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: "#1e2433",
          border: `1px solid ${color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: "15px", height: "15px", color }} />
      </div>
      <h2 className="text-base font-bold text-white">{label}</h2>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ArchitecturePage() {
  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div
        className="mb-10 rounded-2xl p-8"
        style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip color="#00d4e8" icon={Network} label="System Architecture" />
          <Chip color="#a78bfa" icon={Sparkles} label="6 Autonomous Agents" />
          <Chip color="#34d399" icon={Brain} label="Powered by Claude" />
        </div>

        <h1 className="text-3xl font-black text-white mb-2" style={{ letterSpacing: "-0.03em" }}>
          NICE MP CoE — Agentic Platform
        </h1>
        <p className="text-sm mb-7" style={{ color: "#94a3b8", maxWidth: "680px", lineHeight: "1.7" }}>
          A fully agentic, AI-native platform for evaluating, benchmarking, and researching Speech-to-Text,
          Text-to-Speech, and Voice-to-Voice technologies. Powered by Anthropic Claude with native web search,
          a Next.js 15 frontend, and a Prisma-managed PostgreSQL knowledge base.
        </p>

        <div className="flex flex-wrap gap-3">
          {[
            { value: "6", label: "Agents", color: "#00d4e8" },
            { value: "17+", label: "Data Sources", color: "#a78bfa" },
            { value: "150", label: "Test Samples", color: "#fbbf24" },
            { value: "30+", label: "API Routes", color: "#34d399" },
            { value: "5", label: "Report Types", color: "#f87171" },
            { value: "Next.js 15", label: "Framework", color: "#818cf8" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-baseline gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#262d3d", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-xl font-black" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs" style={{ color: "#64748b" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SYSTEM LAYERS ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionTitle icon={Layers} label="System Layers" color="#00d4e8" />

        <div className="space-y-2">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl p-4"
                style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#262d3d",
                    border: `2px solid ${layer.color}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: "16px", height: "16px", color: layer.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{layer.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{layer.desc}</p>
                </div>
                {i < LAYERS.length - 1 && (
                  <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DATA FLOW ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionTitle icon={Activity} label="Agent Request Data Flow" color="#a78bfa" />

        <div
          className="rounded-xl p-5"
          style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl"
                    style={{ background: "#262d3d", border: `1px solid ${step.color}30`, minWidth: "100px" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold" style={{ color: step.color }}>{step.n}</span>
                      <Icon style={{ width: "12px", height: "12px", color: step.color }} />
                    </div>
                    <span className="text-xs text-center font-medium text-white leading-tight">{step.label}</span>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EVALUATION DOMAINS ────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionTitle icon={Mic} label="Evaluation Domains" color="#fbbf24" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DOMAINS.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.label}
                className="rounded-xl p-5"
                style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)", borderTop: `3px solid ${d.color}` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon style={{ width: "16px", height: "16px", color: d.color }} />
                  <h3 className="font-bold text-white text-sm">{d.label}</h3>
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: d.color }}>Metrics</p>
                <ul className="space-y-1 mb-4">
                  {d.metrics.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
                      <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      {m}
                    </li>
                  ))}
                </ul>

                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: d.color }}>Datasets</p>
                {d.datasets.map((ds) => (
                  <div key={ds} className="flex items-start gap-2 text-xs mb-1" style={{ color: "#64748b" }}>
                    <Database style={{ width: "10px", height: "10px", color: d.color, flexShrink: 0, marginTop: "2px" }} />
                    {ds}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── AGENTS ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionTitle icon={Bot} label="Autonomous Agents" color="#00d4e8" />
        <p className="text-sm mb-5" style={{ color: "#64748b", marginTop: "-16px" }}>
          Click "More" on any agent to see full data sources, metrics, and outputs.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionTitle icon={Cpu} label="Technology Stack" color="#34d399" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TECH.map((cat) => (
            <div
              key={cat.category}
              className="rounded-xl p-5"
              style={{
                background: "#1e2433",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${cat.color}`,
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: cat.color }}>
                {cat.category}
              </p>
              <ul className="space-y-3">
                {cat.items.map((item) => (
                  <li key={item.name}>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{item.sub}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPLIANCE ────────────────────────────────────────────────── */}
      <section className="mb-6">
        <SectionTitle icon={Shield} label="Security & Compliance Tracking" color="#818cf8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#818cf8" }}>
              Certificates Tracked per Vendor
            </p>
            <div className="flex flex-wrap gap-2">
              {["SOC 2 Type II", "HIPAA", "GDPR", "FedRAMP", "ISO 27001", "PCI DSS", "CCPA", "C5", "StateRAMP", "CSA STAR"].map((cert) => (
                <span
                  key={cert}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: "#262d3d", color: "#a5b4fc", border: "1px solid rgba(129,140,248,0.25)" }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>
              NICE CXone Integration Matrix
            </p>
            <ul className="space-y-2">
              {[
                { label: "Build vs Buy Score", desc: "Strategic 1–10 score per vendor" },
                { label: "Integration Method", desc: "REST / SDK / WebSocket / Embedded" },
                { label: "Estimated Days", desc: "Projected integration effort" },
                { label: "Migration Complexity", desc: "Low / Medium / High / Critical" },
                { label: "Deployment Options", desc: "Cloud / On-Prem / Hybrid / Edge" },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-2 text-xs">
                  <span style={{ color: "#34d399", flexShrink: 0, marginTop: "1px" }}>›</span>
                  <span>
                    <span className="font-semibold text-white">{item.label}</span>
                    <span style={{ color: "#64748b" }}> — {item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-6 py-4 flex items-center justify-center gap-2"
        style={{ background: "#1e2433", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
        <p className="text-xs text-center" style={{ color: "#64748b" }}>
          NICE MP CoE Agentic Platform · Next.js 15 · React 19 · TypeScript · Prisma · PostgreSQL · Claude Opus 4-6 + Sonnet 4-6
        </p>
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} />
      </div>
    </div>
  );
}

/* ─── Chip helper ────────────────────────────────────────────────────────── */
function Chip({ color, icon: Icon, label }: { color: string; icon: React.ElementType; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: "#262d3d", color, border: `1px solid ${color}30` }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}
