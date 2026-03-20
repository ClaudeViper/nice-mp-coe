"use client";

import { useState } from "react";
import {
  BarChart3, Building2, FileText, Newspaper, Cloud,
  Database, Globe, Cpu, ArrowRight, ArrowDown, Sparkles,
  Activity, Mic, Volume2, AudioWaveform, Layers, Bot,
  ChevronDown, ChevronUp, FlaskConical, Brain, Network,
  Shield, Code2, Zap, Search, Table2, GitBranch, Boxes,
  Lock, Key, Hash,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TYPOGRAPHY CONSTANTS
   Section h2s → slate-400 (#94a3b8)
   Card h3s    → slate-200 (#e2e8f0)
   Body text   → slate-400 (#94a3b8)
   Secondary   → slate-600 (#475569)
═══════════════════════════════════════════════════════════════════ */
const H2 = "#94a3b8";   // section headings
const H3 = "#e2e8f0";   // card headings
const BODY = "#94a3b8"; // body text
const DIM  = "#475569"; // secondary / dim text

/* ═══════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════ */

const AGENTS = [
  {
    id: "benchmark-collector", name: "Benchmark Collector",
    icon: BarChart3, color: "#00d4e8", model: "Claude Opus 4-6",
    description: "Autonomously harvests speech-AI performance metrics from 17+ web sources using Claude's native web_search tool. Deduplicates by natural key (vendor/model/metric/dataset) and upserts with full audit trails.",
    skills: ["Web Search", "JSON Extraction", "Deduplication", "Batch Upsert", "Change Detection"],
    reads: [], writes: ["BenchmarkResult", "CollectorLog"],
    sources: ["HuggingFace ASR Leaderboard","TTS Arena (ELO)","Papers With Code","Vendor API Docs","GitHub Model Cards"],
    outputs: ["BenchmarkResult records","Collector audit logs"],
  },
  {
    id: "vendor-registry", name: "Vendor Registry",
    icon: Building2, color: "#a78bfa", model: "Claude Sonnet 4-6",
    description: "Runs 4 sequential deep-research passes per vendor — company overview, deployment & security, languages & pricing, NICE CXone compatibility. Builds a fully structured knowledge base.",
    skills: ["Profile Research","Compatibility Scoring","Pricing Analysis","Security Auditing","Structured Extraction"],
    reads: [], writes: ["Vendor","VendorProduct","NiceCompatibility","VendorLanguage","VendorPricingTier"],
    sources: ["Vendor Websites","API Documentation","Compliance Pages","Pricing Pages"],
    outputs: ["Vendor profiles","NICE compatibility matrix","Pricing tier records"],
  },
  {
    id: "evaluation-runner", name: "Evaluation Runner",
    icon: FlaskConical, color: "#fbbf24", model: "Claude Sonnet 4-6",
    description: "Core evaluation engine testing STT/TTS/V2V models against 6 NICE proprietary datasets (150 total samples). Calls real vendor APIs when credentials are provided; falls back to Claude simulation.",
    skills: ["STT Evaluation","TTS Evaluation","V2V Testing","WER/CER Calculation","Real API Dispatch","Simulation Mode"],
    reads: ["Vendor","EvaluationDataset"], writes: ["Evaluation","EvaluationResult"],
    sources: ["NICE-CX-Clean-EN (50)","NICE-CX-Noisy-EN (50)","NICE-TTS-IVR-EN (30)","NICE-TTS-Agent-EN (30)","NICE-V2V-Support-EN (10)","NICE-V2V-IVR-EN (10)"],
    outputs: ["EvaluationResult per sample","Comparison summaries"],
  },
  {
    id: "report-generator", name: "Report Generator",
    icon: FileText, color: "#34d399", model: "Claude Sonnet 4-6",
    description: "Synthesises vendor, benchmark, evaluation and news data into 5 strategic business-intelligence report types with executive summaries and full HTML rendering.",
    skills: ["Data Synthesis","Markdown Generation","HTML Rendering","Executive Summarisation","TCO Projection"],
    reads: ["Vendor","BenchmarkResult","Evaluation","NewsItem"], writes: ["Report"],
    sources: ["Vendors DB","Benchmarks DB","Evaluations DB","News DB"],
    outputs: ["HTML Report content","Executive summary (2–3 sentences)"],
  },
  {
    id: "news-scout", name: "News Scout",
    icon: Newspaper, color: "#f87171", model: "Claude Sonnet 4-6",
    description: "Continuously monitors 15+ sources — ArXiv, vendor blogs, tech media — extracting and relevance-scoring articles (1–10). Processes 3 parallel queries per cycle.",
    skills: ["Source Monitoring","Relevance Scoring","Batch Processing","Category Tagging","Trend Detection"],
    reads: [], writes: ["NewsItem"],
    sources: ["ArXiv (cs.SD, cs.CL, eess.AS)","HuggingFace / OpenAI / Google Blogs","ElevenLabs / Deepgram","TechCrunch / VentureBeat","Artificial Analysis Leaderboards"],
    outputs: ["NewsItem records","Relevance scores","Category & tag labels"],
  },
  {
    id: "deployment-guidelines", name: "Deployment Guidelines",
    icon: Cloud, color: "#818cf8", model: "Claude Opus 4-6",
    description: "Agentic loop with web search to generate production-ready NICE CXone integration guides covering auth, quick-start code, configuration, rate limits, and troubleshooting.",
    skills: ["Agentic Loop","Web Research","Code Generation","Integration Mapping","Markdown Authoring"],
    reads: ["Vendor"], writes: ["DeploymentGuideline"],
    sources: ["Vendor API Docs","Auth & SDK References","NICE CXone Documentation"],
    outputs: ["Markdown deployment guide","HTML rendering","Status tracking"],
  },
];

const DB_ENTITIES = [
  {
    name: "Vendor",
    color: "#a78bfa",
    fields: [
      { name: "id",          type: "uuid",     pk: true },
      { name: "name",        type: "string" },
      { name: "slug",        type: "string",   unique: true },
      { name: "website",     type: "string?" },
      { name: "pricingUrl",  type: "string?" },
      { name: "docsUrl",     type: "string?" },
      { name: "isTracked",   type: "boolean" },
      { name: "createdAt",   type: "DateTime" },
    ],
    relations: ["VendorProduct[]","NiceCompatibility?","BenchmarkResult[]","VendorLanguage[]","VendorPricingTier[]"],
  },
  {
    name: "BenchmarkResult",
    color: "#00d4e8",
    fields: [
      { name: "id",           type: "uuid",   pk: true },
      { name: "vendorId",     type: "uuid",   fk: true },
      { name: "modelName",    type: "string" },
      { name: "benchmarkType",type: "enum",   note: "STT|TTS|V2V" },
      { name: "metricName",   type: "string" },
      { name: "metricValue",  type: "Decimal" },
      { name: "metricUnit",   type: "string" },
      { name: "dataset",      type: "string?" },
      { name: "language",     type: "string?" },
      { name: "sourceUrl",    type: "string?" },
      { name: "collectedAt",  type: "DateTime" },
    ],
    relations: ["Vendor"],
  },
  {
    name: "Evaluation",
    color: "#fbbf24",
    fields: [
      { name: "id",               type: "uuid",   pk: true },
      { name: "vendorId",         type: "uuid",   fk: true },
      { name: "evaluationType",   type: "enum",   note: "STT|TTS|V2V" },
      { name: "modelName",        type: "string" },
      { name: "status",           type: "enum",   note: "Running|Completed|Failed" },
      { name: "config",           type: "Json",   note: "apiKey, endpointUrl, ..." },
      { name: "dataset",          type: "string" },
      { name: "language",         type: "string" },
      { name: "totalSamples",     type: "int" },
      { name: "processedSamples", type: "int" },
      { name: "startedAt",        type: "DateTime?" },
      { name: "completedAt",      type: "DateTime?" },
    ],
    relations: ["Vendor","EvaluationResult[]"],
  },
  {
    name: "NewsItem",
    color: "#f87171",
    fields: [
      { name: "id",           type: "uuid",  pk: true },
      { name: "title",        type: "string" },
      { name: "summary",      type: "string" },
      { name: "url",          type: "string" },
      { name: "source",       type: "string" },
      { name: "category",     type: "string", note: "STT|TTS|V2V|Research" },
      { name: "relevance",    type: "int",    note: "1–10 score" },
      { name: "tags",         type: "Json",   note: "string[]" },
      { name: "publishedAt",  type: "DateTime?" },
      { name: "scoutedAt",    type: "DateTime" },
    ],
    relations: [],
  },
];

// Agent × DB table interaction matrix
const DB_TABLES = ["Vendor","VendorProduct","BenchmarkResult","Evaluation","EvaluationResult","NewsItem","Report","DeploymentGuideline","EvaluationDataset"];
const AGENT_MATRIX: Record<string, Record<string, "R" | "W" | "RW" | "">> = {
  "Benchmark Collector":    { Vendor:"R", BenchmarkResult:"W" },
  "Vendor Registry":        { Vendor:"W", VendorProduct:"W" },
  "Evaluation Runner":      { Vendor:"R", BenchmarkResult:"R", Evaluation:"W", EvaluationResult:"W", EvaluationDataset:"R" },
  "Report Generator":       { Vendor:"R", BenchmarkResult:"R", Evaluation:"R", EvaluationResult:"R", NewsItem:"R", Report:"W" },
  "News Scout":             { NewsItem:"W" },
  "Deployment Guidelines":  { Vendor:"R", DeploymentGuideline:"W" },
};

const API_ROUTES = [
  { group: "Agents",      color: "#a78bfa", routes: [
    { method: "POST", path: "/api/agents/benchmark-collector",    desc: "Trigger benchmark collection run" },
    { method: "POST", path: "/api/agents/vendor-registry",         desc: "Trigger vendor research pass" },
    { method: "POST", path: "/api/agents/evaluation-runner",       desc: "Trigger evaluation run" },
    { method: "POST", path: "/api/agents/report-generator",        desc: "Generate a report" },
    { method: "POST", path: "/api/agents/news-scout",              desc: "Trigger news scouting" },
    { method: "POST", path: "/api/agents/deployment-guidelines",   desc: "Generate deployment guide" },
    { method: "GET",  path: "/api/agents/[agentId]/status",        desc: "Poll agent run status" },
  ]},
  { group: "Vendors",     color: "#00d4e8", routes: [
    { method: "GET",  path: "/api/vendors",                   desc: "List all vendors (opt: detail=true)" },
    { method: "GET",  path: "/api/vendors/[slug]",            desc: "Vendor detail + products" },
    { method: "GET",  path: "/api/vendors/[slug]/deployment-guidelines", desc: "Vendor deployment guide" },
  ]},
  { group: "Benchmarks",  color: "#fbbf24", routes: [
    { method: "GET",  path: "/api/benchmarks",                desc: "List benchmarks (type, vendor filters)" },
    { method: "GET",  path: "/api/overview",                  desc: "Dashboard overview metrics" },
  ]},
  { group: "Evaluations", color: "#34d399", routes: [
    { method: "GET",  path: "/api/evaluations",               desc: "List evaluations (type, status, vendor)" },
    { method: "GET",  path: "/api/evaluations/[id]",          desc: "Evaluation + per-sample results" },
    { method: "GET",  path: "/api/stt/evaluate",              desc: "STT-specific evaluation endpoint" },
    { method: "POST", path: "/api/stt/batch-evaluate",        desc: "Batch STT evaluation" },
  ]},
  { group: "Data",        color: "#f87171", routes: [
    { method: "GET",  path: "/api/news",                      desc: "News items (category, relevance filters)" },
    { method: "GET",  path: "/api/reports",                   desc: "List reports" },
    { method: "GET",  path: "/api/reports/[id]",              desc: "Full report HTML content" },
    { method: "GET",  path: "/api/datasets",                  desc: "Evaluation datasets" },
    { method: "GET",  path: "/api/datasets/[id]/samples",     desc: "Dataset samples" },
  ]},
  { group: "TTS Lab",     color: "#818cf8", routes: [
    { method: "POST", path: "/api/tts/generate",              desc: "Generate TTS audio" },
    { method: "POST", path: "/api/tts/batch",                 desc: "Batch TTS generation" },
    { method: "POST", path: "/api/tts/conversation",          desc: "Multi-turn TTS conversation" },
    { method: "GET",  path: "/api/tts/library",               desc: "TTS audio library" },
    { method: "GET",  path: "/api/tts/file/[filename]",       desc: "Serve TTS audio file" },
  ]},
];

const TECH = [
  { category: "Frontend", color: "#00d4e8", items: [
    { name: "Next.js 15", sub: "App Router + Turbopack" },
    { name: "React 19",   sub: "Server & Client Components" },
    { name: "TypeScript 5", sub: "Strict mode" },
    { name: "TailwindCSS 4", sub: "Utility-first styling" },
    { name: "Radix UI",  sub: "Accessible primitives" },
    { name: "Recharts",  sub: "Data visualisation" },
  ]},
  { category: "AI / Agents", color: "#a78bfa", items: [
    { name: "Claude Opus 4-6",    sub: "Deep research & collection" },
    { name: "Claude Sonnet 4-6",  sub: "Evaluation & reporting" },
    { name: "web_search_20250305",sub: "Native Anthropic tool" },
    { name: "Agentic Loops",      sub: "Iterative tool-calling" },
    { name: "@anthropic-ai/sdk",  sub: "v0.78.0" },
  ]},
  { category: "Backend / Data", color: "#34d399", items: [
    { name: "Node.js",      sub: "Next.js API Routes" },
    { name: "Prisma 7.5",   sub: "Type-safe ORM" },
    { name: "PostgreSQL",   sub: "Primary datastore" },
    { name: "REST APIs",    sub: "30+ route handlers" },
  ]},
  { category: "Infrastructure", color: "#fbbf24", items: [
    { name: "Docker",           sub: "Multi-stage build" },
    { name: "Standalone output",sub: "Next.js optimised" },
    { name: "Vitest",           sub: "Unit testing" },
    { name: "Playwright",       sub: "E2E testing" },
  ]},
];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */

function SectionTitle({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 14, height: 14, color }} />
      </div>
      {/* uses the section accent color — visually distinct, never white */}
      <h2 className="text-base font-bold" style={{ color }}>{label}</h2>
      <div className="flex-1 h-px" style={{ background: `${color}20` }} />
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = { GET: "#34d399", POST: "#fbbf24", PUT: "#a78bfa", DELETE: "#f87171", PATCH: "#00d4e8" };
  const c = colors[method] ?? "#94a3b8";
  return (
    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${c}15`, color: c, border: `1px solid ${c}30`, minWidth: 40, display: "inline-block", textAlign: "center" }}>
      {method}
    </span>
  );
}

function AgentCard({ agent }: { agent: typeof AGENTS[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = agent.icon;
  return (
    <div style={{ background: "#161b27", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ height: 3, background: agent.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div style={{ width: 38, height: 38, borderRadius: 9, background: `${agent.color}12`, border: `1px solid ${agent.color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon style={{ width: 16, height: 16, color: agent.color }} />
            </div>
            <div>
              {/* ← card heading — slightly off-white */}
              <h3 className="font-bold text-sm leading-tight" style={{ color: H3 }}>{agent.name}</h3>
              <span className="text-xs font-mono" style={{ color: agent.color }}>{agent.model}</span>
            </div>
          </div>
          <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium" style={{ background: open ? "#1e2433" : "transparent", color: DIM, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {open ? "Less" : "More"}{open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: BODY }}>{agent.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.skills.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${agent.color}10`, color: agent.color, border: `1px solid ${agent.color}25` }}>{s}</span>
          ))}
        </div>
        {/* DB operations inline summary */}
        <div className="flex gap-2 flex-wrap">
          {agent.reads.length > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: DIM }}>
              <span style={{ color: "#34d399", fontWeight: 600 }}>R</span>
              <span>{agent.reads.join(", ")}</span>
            </div>
          )}
          {agent.writes.length > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: DIM }}>
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>W</span>
              <span>{agent.writes.slice(0, 3).join(", ")}{agent.writes.length > 3 ? "…" : ""}</span>
            </div>
          )}
        </div>
        {open && (
          <div className="mt-4 space-y-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <DetailBlock label="Sources" color={agent.color} items={agent.sources} />
            <DetailBlock label="Outputs" color={agent.color} items={agent.outputs} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailBlock({ label, color, items }: { label: string; color: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color }}>{label}</p>
      <ul className="space-y-0.5">
        {items.map(item => (
          <li key={item} className="flex items-start gap-1.5 text-xs" style={{ color: BODY }}>
            <span style={{ color, flexShrink: 0, marginTop: 1 }}>›</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REAL SVG ARCHITECTURE DIAGRAM
   Five layered boxes connected by labelled SVG arrows.
   Each agent gets its own coloured sub-node inside the orchestrator.
═══════════════════════════════════════════════════════════════════ */

function ArchDiagram() {
  const agentCols  = ["#00d4e8","#a78bfa","#fbbf24","#34d399","#f87171","#818cf8"];
  const agentNames = ["Benchmark\nCollector","Vendor\nRegistry","Eval\nRunner","Report\nGenerator","News\nScout","Deploy\nGuide"];
  const agentModels= ["Opus 4-6","Sonnet 4-6","Sonnet 4-6","Sonnet 4-6","Sonnet 4-6","Opus 4-6"];

  return (
    <div style={{ background: "#080b11", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
      <svg
        viewBox="0 0 1000 575"
        style={{ width: "100%", height: "auto", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Arrowhead markers, one per connection color */}
          {[
            ["ah-purple","#a78bfa"],
            ["ah-yellow","#fbbf24"],
            ["ah-red",   "#f87171"],
            ["ah-green", "#34d399"],
          ].map(([id, fill]) => (
            <marker key={id} id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0 7 3.5 0 7" fill={fill} opacity="0.75" />
            </marker>
          ))}
        </defs>

        {/* ── Layer 1: BROWSER / CLIENT ─────────────────────────────── */}
        <rect x="175" y="12" width="650" height="74" rx="10"
          fill="#0d1320" stroke="#00d4e840" strokeWidth="1.5" />
        <rect x="175" y="12" width="650" height="4" rx="2" fill="#00d4e8" />
        <text x="500" y="38" textAnchor="middle"
          fill="#00d4e8" fontSize="11.5" fontWeight="bold" fontFamily="monospace" letterSpacing="2">
          BROWSER / CLIENT
        </text>
        <text x="500" y="60" textAnchor="middle"
          fill="#3a4f6a" fontSize="9.5" fontFamily="monospace">
          Next.js 15 · React 19 · TailwindCSS 4 · Radix UI · Recharts · TypeScript 5
        </text>

        {/* connector 1 — HTTP/REST */}
        <line x1="500" y1="86" x2="500" y2="154" stroke="#a78bfa55" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ah-purple)" />
        <rect x="423" y="107" width="154" height="16" rx="3" fill="#080b11" />
        <text x="500" y="119" textAnchor="middle"
          fill="#a78bfa80" fontSize="8.5" fontFamily="monospace">HTTP / REST</text>

        {/* ── Layer 2: NEXT.JS API LAYER ────────────────────────────── */}
        <rect x="175" y="156" width="650" height="74" rx="10"
          fill="#0d1320" stroke="#a78bfa40" strokeWidth="1.5" />
        <rect x="175" y="156" width="650" height="4" rx="2" fill="#a78bfa" />
        <text x="500" y="183" textAnchor="middle"
          fill="#a78bfa" fontSize="11.5" fontWeight="bold" fontFamily="monospace" letterSpacing="2">
          NEXT.JS API LAYER
        </text>
        <text x="500" y="205" textAnchor="middle"
          fill="#3a4f6a" fontSize="9.5" fontFamily="monospace">
          /api/agents · /api/vendors · /api/evaluations · /api/tts · /api/reports  (30+ routes)
        </text>

        {/* connector 2 — function call */}
        <line x1="500" y1="230" x2="500" y2="298" stroke="#fbbf2455" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ah-yellow)" />
        <rect x="406" y="252" width="188" height="16" rx="3" fill="#080b11" />
        <text x="500" y="264" textAnchor="middle"
          fill="#fbbf2480" fontSize="8.5" fontFamily="monospace">Agent function call</text>

        {/* ── Layer 3: AGENT ORCHESTRATOR ──────────────────────────── */}
        <rect x="35" y="300" width="930" height="102" rx="10"
          fill="#0d1320" stroke="#fbbf2440" strokeWidth="1.5" />
        <rect x="35" y="300" width="930" height="4" rx="2" fill="#fbbf24" />
        <text x="500" y="325" textAnchor="middle"
          fill="#fbbf24" fontSize="11.5" fontWeight="bold" fontFamily="monospace" letterSpacing="2">
          AGENT ORCHESTRATOR
        </text>

        {/* 6 agent sub-nodes */}
        {agentNames.map((name, i) => {
          const boxW = 134;
          const gap  = 18;
          const totalW = 6 * boxW + 5 * gap;
          const startX = (1000 - totalW) / 2;
          const bx = startX + i * (boxW + gap);
          const lines = name.split("\n");
          return (
            <g key={name}>
              <rect x={bx} y="337" width={boxW} height="52" rx="7"
                fill={`${agentCols[i]}14`} stroke={`${agentCols[i]}50`} strokeWidth="1" />
              <text x={bx + boxW / 2} y={lines.length === 2 ? "356" : "364"}
                textAnchor="middle" fill={agentCols[i]}
                fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                {lines[0]}
              </text>
              {lines[1] && (
                <text x={bx + boxW / 2} y="368" textAnchor="middle" fill={agentCols[i]}
                  fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                  {lines[1]}
                </text>
              )}
              <text x={bx + boxW / 2} y="381" textAnchor="middle"
                fill="#3a4f6a" fontSize="7.5" fontFamily="monospace">
                {agentModels[i]}
              </text>
            </g>
          );
        })}

        {/* connector 3 — Anthropic SDK (curve left) */}
        <path d="M 370 402 C 370 435 240 435 240 452"
          stroke="#f8717160" strokeWidth="1.5" fill="none" strokeDasharray="5 3"
          markerEnd="url(#ah-red)" />
        <rect x="272" y="420" width="148" height="16" rx="3" fill="#080b11" />
        <text x="346" y="432" textAnchor="middle"
          fill="#f8717180" fontSize="8.5" fontFamily="monospace">Anthropic SDK</text>

        {/* connector 4 — Prisma ORM (curve right) */}
        <path d="M 630 402 C 630 435 760 435 760 452"
          stroke="#34d39960" strokeWidth="1.5" fill="none" strokeDasharray="5 3"
          markerEnd="url(#ah-green)" />
        <rect x="578" y="420" width="148" height="16" rx="3" fill="#080b11" />
        <text x="652" y="432" textAnchor="middle"
          fill="#34d39980" fontSize="8.5" fontFamily="monospace">Prisma ORM</text>

        {/* ── Layer 4a: ANTHROPIC CLAUDE API ───────────────────────── */}
        <rect x="18" y="454" width="444" height="90" rx="10"
          fill="#0d1320" stroke="#f8717135" strokeWidth="1.5" />
        <rect x="18" y="454" width="444" height="4" rx="2" fill="#f87171" />
        <text x="240" y="481" textAnchor="middle"
          fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="1.5">
          ANTHROPIC CLAUDE API
        </text>
        <text x="240" y="502" textAnchor="middle"
          fill="#3a4f6a" fontSize="9.5" fontFamily="monospace">
          claude-opus-4-6 · claude-sonnet-4-6
        </text>
        <text x="240" y="520" textAnchor="middle"
          fill="#3a4f6a" fontSize="9.5" fontFamily="monospace">
          web_search_20250305 · Native Tool Use
        </text>

        {/* ── Layer 4b: POSTGRESQL + PRISMA ────────────────────────── */}
        <rect x="538" y="454" width="444" height="90" rx="10"
          fill="#0d1320" stroke="#34d39935" strokeWidth="1.5" />
        <rect x="538" y="454" width="444" height="4" rx="2" fill="#34d399" />
        <text x="760" y="481" textAnchor="middle"
          fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="1.5">
          POSTGRESQL + PRISMA 7
        </text>
        <text x="760" y="502" textAnchor="middle"
          fill="#3a4f6a" fontSize="9.5" fontFamily="monospace">
          Vendors · BenchmarkResults · Evaluations
        </text>
        <text x="760" y="520" textAnchor="middle"
          fill="#3a4f6a" fontSize="9.5" fontFamily="monospace">
          NewsItems · Reports · DeploymentGuidelines
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {[
          { c: "#00d4e8", l: "Browser / Client" },
          { c: "#a78bfa", l: "API Layer" },
          { c: "#fbbf24", l: "Agent Orchestrator" },
          { c: "#f87171", l: "Claude API" },
          { c: "#34d399", l: "PostgreSQL" },
        ].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
            <span style={{ fontSize: 10, color: "#3a4f6a", fontFamily: "monospace" }}>{x.l}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="22" height="8" viewBox="0 0 22 8">
            <line x1="0" y1="4" x2="18" y2="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 2" />
            <polygon points="16 1 22 4 16 7" fill="rgba(255,255,255,0.25)" />
          </svg>
          <span style={{ fontSize: 10, color: "#3a4f6a", fontFamily: "monospace" }}>Data flow</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */

export default function ArchitecturePage() {
  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="mb-10 rounded-2xl p-8" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap gap-2 mb-5">
          <Chip color="#00d4e8" icon={Network}   label="System Architecture" />
          <Chip color="#a78bfa" icon={Sparkles}  label="6 Autonomous Agents" />
          <Chip color="#34d399" icon={Brain}     label="Claude Opus/Sonnet 4-6" />
          <Chip color="#fbbf24" icon={Database}  label="PostgreSQL + Prisma" />
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: "#f1f5f9", letterSpacing: "-0.03em" }}>
          NICE MP CoE — Agentic Platform Architecture
        </h1>
        <p className="text-sm mb-7 max-w-2xl leading-relaxed" style={{ color: BODY }}>
          AI-native platform for evaluating, benchmarking and researching Speech-to-Text, Text-to-Speech, and Voice-to-Voice technologies.
          6 autonomous Claude agents, 30+ REST endpoints, a Prisma-managed PostgreSQL knowledge base, and real vendor API integration.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { v: "6",        l: "Agents",       c: "#00d4e8" },
            { v: "17+",      l: "Data Sources",  c: "#a78bfa" },
            { v: "150",      l: "Test Samples",  c: "#fbbf24" },
            { v: "30+",      l: "API Routes",    c: "#34d399" },
            { v: "5",        l: "Report Types",  c: "#f87171" },
            { v: "15",       l: "Vendors",       c: "#818cf8" },
          ].map(s => (
            <div key={s.l} className="flex items-baseline gap-2 px-4 py-2 rounded-xl" style={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xl font-black" style={{ color: s.c }}>{s.v}</span>
              <span className="text-xs" style={{ color: DIM }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SYSTEM ARCHITECTURE DIAGRAM ──────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Layers} label="System Architecture" color="#00d4e8" />
        <ArchDiagram />
      </section>

      {/* ── REQUEST LIFECYCLE ─────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={GitBranch} label="Agent Request Lifecycle" color="#a78bfa" />
        <div className="rounded-xl p-5" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <div className="flex items-stretch gap-0 min-w-max">
              {[
                { n:"01", label:"User triggers\nagent in UI",       icon: Zap,       color:"#00d4e8", code:`POST /api/agents\n/evaluation-runner` },
                { n:"02", label:"API Route\nspawns agent",          icon: Code2,     color:"#a78bfa", code:`runEvaluation(\n  request\n)` },
                { n:"03", label:"Agent calls\nClaude API",           icon: Brain,     color:"#fbbf24", code:`client.messages\n.create({...})` },
                { n:"04", label:"Claude invokes\nweb_search tool",   icon: Search,    color:"#f87171", code:`tool: web_search\n_20250305` },
                { n:"05", label:"Structured JSON\nextracted",         icon: Activity,  color:"#34d399", code:`JSON.parse(\nmatch[0])` },
                { n:"06", label:"Prisma upsert\nto PostgreSQL",       icon: Database,  color:"#818cf8", code:`prisma.eval\n.create({...})` },
                { n:"07", label:"UI polls and\nshows results",        icon: Sparkles,  color:"#00d4e8", code:`GET /api/eval\n/[id]` },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-mono font-bold" style={{ color: step.color }}>{step.n}</span>
                        <Icon style={{ width: 12, height: 12, color: step.color }} />
                      </div>
                      <div className="rounded-lg px-3 py-2.5 text-center" style={{ background: "#0f1219", border: `1px solid ${step.color}25`, width: "100%" }}>
                        <p className="text-xs font-medium leading-tight mb-2 whitespace-pre-line" style={{ color: H3 }}>{step.label}</p>
                        <code className="text-xs block text-left whitespace-pre font-mono" style={{ color: step.color, opacity: 0.75 }}>{step.code}</code>
                      </div>
                    </div>
                    {i < 6 && <ArrowRight style={{ width: 14, height: 14, flexShrink: 0, margin: "0 4px", marginTop: "20px", color: "rgba(255,255,255,0.15)" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── DATABASE SCHEMA ────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Table2} label="Database Schema — Key Entities" color="#34d399" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DB_ENTITIES.map(entity => (
            <div key={entity.name} className="rounded-xl overflow-hidden" style={{ background: "#0f1219", border: `1px solid ${entity.color}25` }}>
              {/* Entity header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ background: `${entity.color}0f`, borderBottom: `1px solid ${entity.color}20` }}>
                <div className="flex items-center gap-2">
                  <Boxes style={{ width: 14, height: 14, color: entity.color }} />
                  <span className="text-sm font-bold font-mono" style={{ color: entity.color }}>{entity.name}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: DIM }}>model</span>
              </div>
              {/* Fields */}
              <div className="p-0">
                <table className="w-full text-xs font-mono">
                  <tbody>
                    {entity.fields.map(f => (
                      <tr key={f.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td className="px-4 py-1.5 flex items-center gap-1.5">
                          {f.pk && <Key style={{ width: 9, height: 9, color: "#fbbf24", flexShrink: 0 }} />}
{'fk' in f && 'fk' in f && f.fk && <Hash style={{ width: 9, height: 9, color: "#818cf8", flexShrink: 0 }} />}
{!f.pk && !('fk' in f && f.fk) && <span style={{ width: 9 }} />}
                          <span style={{ color: H3 }}>{f.name}</span>
                        </td>
                        <td className="px-4 py-1.5" style={{ color: entity.color }}>{f.type}</td>
                        <td className="px-4 py-1.5" style={{ color: DIM }}>{('note' in f ? f.note : '') ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Relations */}
                {entity.relations.length > 0 && (
                  <div className="px-4 py-2 flex flex-wrap gap-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {entity.relations.map(r => (
                      <span key={r} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: DIM }}>→ {r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Schema legend */}
        <div className="flex items-center gap-5 mt-3 px-2">
          {[
            { icon: Key,  color: "#fbbf24", label: "Primary key" },
            { icon: Hash, color: "#818cf8", label: "Foreign key" },
          ].map(({ icon: Icon, color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: DIM }}>
              <Icon style={{ width: 10, height: 10, color }} />{label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: DIM }}>
            <span style={{ fontFamily: "monospace", color: "#818cf8" }}>→</span> Relation / join
          </div>
        </div>
      </section>

      {/* ── AGENT × DATABASE MATRIX ───────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Lock} label="Agent ↔ Database Interaction Matrix" color="#fbbf24" />
        <div className="rounded-xl overflow-hidden" style={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "#161b27", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: H2, minWidth: 180 }}>Agent</th>
                  {DB_TABLES.map(t => (
                    <th key={t} className="px-3 py-3 font-mono font-medium text-center" style={{ color: DIM, whiteSpace: "nowrap" }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENTS.map((agent, i) => {
                  const row = AGENT_MATRIX[agent.name] ?? {};
                  return (
                    <tr key={agent.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: agent.color, flexShrink: 0 }} />
                          <span className="font-medium" style={{ color: H3 }}>{agent.name}</span>
                        </div>
                      </td>
                      {DB_TABLES.map(t => {
                        const op = row[t];
                        return (
                          <td key={t} className="px-3 py-2.5 text-center">
                            {op === "R"  && <span className="font-bold font-mono" style={{ color: "#34d399" }}>R</span>}
                            {op === "W"  && <span className="font-bold font-mono" style={{ color: "#fbbf24" }}>W</span>}
                            {op === "RW" && <span className="font-bold font-mono" style={{ color: "#00d4e8" }}>RW</span>}
                            {!op && <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-5 px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#161b27" }}>
            {[{ c:"#34d399", l:"R — Read"}, { c:"#fbbf24", l:"W — Write"}, { c:"#00d4e8", l:"RW — Read + Write"}].map(x => (
              <div key={x.l} className="flex items-center gap-1.5">
                <span className="font-bold font-mono text-xs" style={{ color: x.c }}>{x.l.split(" — ")[0]}</span>
                <span className="text-xs" style={{ color: DIM }}>— {x.l.split(" — ")[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTS ────────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Bot} label="Autonomous Agents" color="#00d4e8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      </section>

      {/* ── EVALUATION DOMAINS ────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Mic} label="Evaluation Domains & Datasets" color="#fbbf24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Mic,          label: "Speech-to-Text (STT)", color: "#00d4e8",
              metrics: ["Word Error Rate (WER)","Character Error Rate (CER)","Real-Time Factor (RTF)","Time to First Byte (TTFB)","Speaker Diarisation","Punctuation Accuracy"],
              datasets: [{ id: "NICE-CX-Clean-EN", n: 50, desc: "Clean contact-center clips" }, { id: "NICE-CX-Noisy-EN", n: 50, desc: "Noisy / accented clips" }] },
            { icon: Volume2,      label: "Text-to-Speech (TTS)", color: "#a78bfa",
              metrics: ["MOS Naturalness Score","Intelligibility Rating","TTFB / Streaming Latency","ELO Score (TTS Arena)","Prosody Quality"],
              datasets: [{ id: "NICE-TTS-IVR-EN", n: 30, desc: "IVR prompt scripts" }, { id: "NICE-TTS-Agent-EN", n: 30, desc: "Agent response scripts" }] },
            { icon: AudioWaveform,label: "Voice-to-Voice (V2V)", color: "#fbbf24",
              metrics: ["Task Completion Rate","Turn-Taking Accuracy","Intent Recognition %","End-to-End Latency","Conversation Coherence"],
              datasets: [{ id: "NICE-V2V-Support-EN", n: 10, desc: "Multi-turn support scenarios" }, { id: "NICE-V2V-IVR-EN", n: 10, desc: "Conversational IVR scripts" }] },
          ].map(d => {
            const Icon = d.icon;
            return (
              <div key={d.label} className="rounded-xl overflow-hidden" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderTop: `3px solid ${d.color}` }}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon style={{ width: 15, height: 15, color: d.color }} />
                    <h3 className="font-bold text-sm" style={{ color: H3 }}>{d.label}</h3>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: d.color }}>Metrics</p>
                  <ul className="space-y-1 mb-4">
                    {d.metrics.map(m => (
                      <li key={m} className="flex items-center gap-1.5 text-xs" style={{ color: BODY }}>
                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: d.color, flexShrink: 0 }} />{m}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: d.color }}>Datasets</p>
                  {d.datasets.map(ds => (
                    <div key={ds.id} className="flex items-start justify-between gap-2 mb-1.5 rounded px-2 py-1.5" style={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <span className="font-mono font-medium text-xs" style={{ color: H3 }}>{ds.id}</span>
                        <p className="text-xs" style={{ color: DIM }}>{ds.desc}</p>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: d.color }}>{ds.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── API ROUTES ────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Code2} label="API Route Map" color="#818cf8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {API_ROUTES.map(group => (
            <div key={group.group} className="rounded-xl overflow-hidden" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#0f1219", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: group.color }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: group.color }}>{group.group}</span>
              </div>
              <div className="p-3 space-y-1">
                {group.routes.map(r => (
                  <div key={r.path} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <MethodBadge method={r.method} />
                    <code className="text-xs font-mono flex-shrink-0" style={{ color: H3 }}>{r.path}</code>
                    <span className="text-xs ml-auto flex-shrink-0 hidden lg:block" style={{ color: DIM }}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle icon={Cpu} label="Technology Stack" color="#34d399" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TECH.map(cat => (
            <div key={cat.category} className="rounded-xl p-5" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${cat.color}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: cat.color }}>{cat.category}</p>
              <ul className="space-y-2.5">
                {cat.items.map(item => (
                  <li key={item.name}>
                    {/* ← tech names: slightly off-white */}
                    <p className="text-sm font-semibold" style={{ color: H3 }}>{item.name}</p>
                    <p className="text-xs" style={{ color: DIM }}>{item.sub}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPLIANCE ────────────────────────────────────────────────────── */}
      <section className="mb-6">
        <SectionTitle icon={Shield} label="Security & Compliance Tracking" color="#818cf8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#818cf8" }}>Certificates Tracked per Vendor</p>
            <div className="flex flex-wrap gap-2">
              {["SOC 2 Type II","HIPAA","GDPR","FedRAMP","ISO 27001","PCI DSS","CCPA","C5","StateRAMP","CSA STAR"].map(cert => (
                <span key={cert} className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium" style={{ background: "#0f1219", color: "#a5b4fc", border: "1px solid rgba(129,140,248,0.2)" }}>{cert}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>NICE CXone Integration Matrix — Fields</p>
            <table className="w-full text-xs font-mono">
              <tbody>
                {[
                  { field: "buildVsBuyScore",     type: "int",    note: "1–10 strategic rating" },
                  { field: "integrationMethod",   type: "string", note: "REST | SDK | WebSocket | Embedded" },
                  { field: "estimatedDays",        type: "int",    note: "Projected effort" },
                  { field: "migrationComplexity",  type: "enum",   note: "Low | Medium | High | Critical" },
                  { field: "deploymentOptions",    type: "string[]",note:"Cloud | OnPrem | Hybrid | Edge" },
                ].map(row => (
                  <tr key={row.field} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td className="py-1.5 pr-3" style={{ color: H3 }}>{row.field}</td>
                    <td className="py-1.5 pr-3" style={{ color: "#34d399" }}>{row.type}</td>
                    <td className="py-1.5" style={{ color: DIM }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl px-6 py-4 flex items-center justify-center gap-2" style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
        <p className="text-xs text-center font-mono" style={{ color: DIM }}>
          NICE MP CoE Agentic Platform · Next.js 15 · React 19 · TypeScript · Prisma 7 · PostgreSQL · Claude Opus/Sonnet 4-6
        </p>
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} />
      </div>
    </div>
  );
}

function Chip({ color, icon: Icon, label }: { color: string; icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
      <Icon className="h-3 w-3" />{label}
    </div>
  );
}
