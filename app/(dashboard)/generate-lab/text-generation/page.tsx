"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wand2,
  Copy,
  RefreshCw,
  Download,
  ArrowRight,
  UserRound,
  HeadphonesIcon,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormParams {
  topic: string;
  vertical: string;
  numCharacters: number;
  sentiment: string;
  empathyLevel: string;
  callOutcome: string;
  language: string;
  complexity: string;
  includeHold: boolean;
  includeInterruptions: boolean;
  includeSupervisor: boolean;
}

interface ConversationTurn {
  speaker: "AGENT" | "CUSTOMER" | "SUPERVISOR" | "SYSTEM";
  text: string;
  index: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "text-generation-params";

const TOPIC_PRESETS = [
  "Billing dispute",
  "Technical support",
  "Account setup",
  "Retention",
  "Complaint",
  "Refund request",
  "Password reset",
  "Service upgrade",
];

const VERTICALS = [
  "Telecom",
  "Insurance",
  "Banking",
  "Healthcare",
  "Retail",
  "Utilities",
];

const SENTIMENTS = ["Positive", "Neutral", "Negative", "Mixed"];
const EMPATHY_LEVELS = ["Low", "Medium", "High"];
const CALL_OUTCOMES = [
  "Resolved",
  "Unresolved",
  "Escalated",
  "Transferred",
  "Abandoned",
];
const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "Spanish",
  "French",
  "Portuguese",
  "Hebrew",
];
const COMPLEXITIES = ["Simple", "Moderate", "Complex"];

const DEFAULT_PARAMS: FormParams = {
  topic: "Billing dispute",
  vertical: "Telecom",
  numCharacters: 800,
  sentiment: "Neutral",
  empathyLevel: "Medium",
  callOutcome: "Resolved",
  language: "English (US)",
  complexity: "Moderate",
  includeHold: false,
  includeInterruptions: false,
  includeSupervisor: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseConversation(raw: string): ConversationTurn[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  const turns: ConversationTurn[] = [];
  let index = 0;

  for (const line of lines) {
    const agentMatch = line.match(/^AGENT:\s*(.*)/i);
    const customerMatch = line.match(/^CUSTOMER:\s*(.*)/i);
    const supervisorMatch = line.match(/^SUPERVISOR:\s*(.*)/i);
    const systemMatch = line.match(/^\[(.+)\]$/);

    if (agentMatch) {
      turns.push({ speaker: "AGENT", text: (agentMatch[1] ?? '').trim(), index: ++index });
    } else if (customerMatch) {
      turns.push({ speaker: "CUSTOMER", text: (customerMatch[1] ?? '').trim(), index: ++index });
    } else if (supervisorMatch) {
      turns.push({ speaker: "SUPERVISOR", text: (supervisorMatch[1] ?? '').trim(), index: ++index });
    } else if (systemMatch) {
      turns.push({ speaker: "SYSTEM", text: (systemMatch[1] ?? '').trim(), index: ++index });
    } else if (line.trim() && turns.length > 0) {
      // continuation of previous turn
      const lastTurn = turns[turns.length - 1]; if (lastTurn) lastTurn.text += " " + line.trim();
    }
  }

  return turns;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d4e8]"
        style={{
          background: checked ? "#00d4e8" : "rgba(148,163,184,0.2)",
        }}
      >
        <span
          className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 mt-0.5"
          style={{ marginLeft: checked ? "18px" : "2px" }}
        />
      </button>
      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {label}
      </span>
    </label>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{ background: "rgba(148,163,184,0.1)", border: "1px solid var(--border)" }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === opt ? "text-white shadow-sm" : "hover:text-white"
          )}
          style={
            value === opt
              ? { background: "var(--primary)", color: "white" }
              : { color: "var(--muted-foreground)" }
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4e8] transition"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChatBubble({ turn }: { turn: ConversationTurn }) {
  if (turn.speaker === "SYSTEM") {
    return (
      <div className="flex justify-center">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{
            background: "rgba(148,163,184,0.1)",
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
        >
          [{turn.text}]
        </span>
      </div>
    );
  }

  const isAgent = turn.speaker === "AGENT";
  const isSupervisor = turn.speaker === "SUPERVISOR";
  const isCustomer = turn.speaker === "CUSTOMER";

  const bubbleStyle = isAgent
    ? { background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.2)" }
    : isSupervisor
    ? { background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }
    : { background: "rgba(148,163,184,0.08)", border: "1px solid var(--border)" };

  const nameColor = isAgent ? "#00d4e8" : isSupervisor ? "#f59e0b" : "var(--muted-foreground)";
  const Icon = isAgent ? HeadphonesIcon : isSupervisor ? ShieldCheck : UserRound;

  return (
    <div className={cn("flex gap-2.5 max-w-[85%]", isCustomer ? "ml-auto flex-row-reverse" : "")}>
      <div
        className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-1"
        style={bubbleStyle}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: nameColor }} />
      </div>
      <div className="space-y-1 min-w-0">
        <div
          className={cn("flex items-center gap-2", isCustomer ? "flex-row-reverse" : "")}
        >
          <span className="text-xs font-semibold" style={{ color: nameColor }}>
            {turn.speaker}
          </span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            #{turn.index}
          </span>
        </div>
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={{ ...bubbleStyle, color: "var(--foreground)" }}
        >
          {turn.text}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TextGenerationPage() {
  const router = useRouter();
  const [params, setParams] = useState<FormParams>(DEFAULT_PARAMS);
  const [rawConversation, setRawConversation] = useState<string>("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Save to dataset state
  const [saveOpen, setSaveOpen] = useState(false);
  const [datasets, setDatasets] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("__new__");
  const [newDatasetName, setNewDatasetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Load persisted params
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setParams((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist params on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch {
      // ignore
    }
  }, [params]);

  const set = useCallback(<K extends keyof FormParams>(key: K, value: FormParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const participants = ["Agent", "Customer", ...(params.includeSupervisor ? ["Supervisor"] : [])];

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-lab/text-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants,
          topic: params.topic,
          vertical: params.vertical,
          numCharacters: params.numCharacters,
          sentiment: params.sentiment,
          empathyLevel: params.empathyLevel,
          callOutcome: params.callOutcome,
          language: params.language,
          complexity: params.complexity,
          includeHold: params.includeHold,
          includeInterruptions: params.includeInterruptions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Generation failed");
      }
      setRawConversation(data.conversation);
      setTurns(parseConversation(data.conversation));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const copyText = () => {
    navigator.clipboard.writeText(rawConversation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportTxt = () => {
    const blob = new Blob([rawConversation], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const useInTtsLab = () => {
    localStorage.setItem("tts-lab-prefill", rawConversation);
    router.push("/tts-audio-lab");
  };

  const openSavePanel = async () => {
    setSaveOpen(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/datasets?type=TTS");
      if (res.ok) {
        const data = await res.json();
        setDatasets(data);
      }
    } catch {
      // ignore — user can still create new
    }
  };

  const saveToDataset = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      let datasetId: string;

      if (selectedDataset === "__new__") {
        const name = newDatasetName.trim() || `Text Gen – ${params.topic} (${new Date().toLocaleDateString()})`;
        const res = await fetch("/api/datasets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type: "TTS", language: params.language }),
        });
        if (!res.ok) throw new Error(await res.text());
        const created = await res.json();
        datasetId = created.id;
      } else {
        datasetId = selectedDataset;
      }

      const res = await fetch(`/api/datasets/${datasetId}/samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawConversation,
          source: "text-generation",
          metadata: {
            topic: params.topic,
            vertical: params.vertical,
            sentiment: params.sentiment,
            empathyLevel: params.empathyLevel,
            callOutcome: params.callOutcome,
            language: params.language,
            complexity: params.complexity,
            participants,
            numCharacters: params.numCharacters,
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setSaveResult({ ok: true, message: "Conversation saved to dataset successfully." });
    } catch (e) {
      setSaveResult({ ok: false, message: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-6 md:px-8"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(0,212,232,0.1)", border: "1px solid rgba(0,212,232,0.2)" }}
          >
            <Wand2 className="h-5 w-5" style={{ color: "#00d4e8" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Conversation Text Generator
          </h1>
        </div>
        <p style={{ color: "var(--muted-foreground)" }} className="text-sm ml-12">
          Generate realistic call center conversations for training, testing, and evaluation
        </p>
      </div>

      <div className="px-6 py-6 md:px-8 max-w-6xl mx-auto space-y-6">
        {/* ── Participants ──────────────────────────────────────────────── */}
        <section
          className="rounded-xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
            Participants
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Fixed participants */}
            {[
              { label: "Agent", icon: HeadphonesIcon, color: "#00d4e8", bg: "rgba(0,212,232,0.08)" },
              { label: "Customer", icon: UserRound, color: "#64748b", bg: "rgba(148,163,184,0.08)" },
            ].map(({ label, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                style={{ background: bg, border: `1px solid ${color}33`, color }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}

            {/* Supervisor chip */}
            {params.includeSupervisor ? (
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  color: "#f59e0b",
                }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Supervisor
                <button
                  type="button"
                  onClick={() => set("includeSupervisor", false)}
                  className="ml-0.5 rounded-full hover:bg-amber-200/20 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => set("includeSupervisor", true)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border border-dashed transition hover:border-amber-400 hover:text-amber-400"
                style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
              >
                + Add Supervisor
              </button>
            )}
          </div>
        </section>

        {/* ── Parameters ───────────────────────────────────────────────── */}
        <section
          className="rounded-xl p-5 space-y-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
            Conversation Parameters
          </h2>

          {/* Top row: topic with presets */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Topic / Scenario
            </label>
            <input
              type="text"
              value={params.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder="Describe the scenario..."
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TOPIC_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("topic", t)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs transition",
                    params.topic === t
                      ? "text-white"
                      : "hover:border-[#00d4e8] hover:text-[#00d4e8]"
                  )}
                  style={
                    params.topic === t
                      ? { background: "#00d4e8", color: "white" }
                      : { border: "1px solid var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Vertical / Industry" value={params.vertical} onChange={(v) => set("vertical", v)} options={VERTICALS} />
            <SelectField label="Sentiment" value={params.sentiment} onChange={(v) => set("sentiment", v)} options={SENTIMENTS} />
            <SelectField label="Call Outcome" value={params.callOutcome} onChange={(v) => set("callOutcome", v)} options={CALL_OUTCOMES} />
            <SelectField label="Language / Accent" value={params.language} onChange={(v) => set("language", v)} options={LANGUAGES} />

            {/* Characters slider */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex justify-between" style={{ color: "var(--foreground)" }}>
                <span>Number of Characters</span>
                <span style={{ color: "#00d4e8" }} className="font-mono">{params.numCharacters.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={200}
                max={5000}
                step={50}
                value={params.numCharacters}
                onChange={(e) => set("numCharacters", Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "#00d4e8",
                  background: `linear-gradient(to right, #00d4e8 ${((params.numCharacters - 200) / 4800) * 100}%, var(--border) 0%)`,
                }}
              />
              <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span>200</span>
                <span>5,000</span>
              </div>
            </div>

            {/* Empathy */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Empathy Level
              </label>
              <SegmentedControl options={EMPATHY_LEVELS} value={params.empathyLevel} onChange={(v) => set("empathyLevel", v)} />
            </div>

            {/* Complexity */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Complexity
              </label>
              <SegmentedControl options={COMPLEXITIES} value={params.complexity} onChange={(v) => set("complexity", v)} />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-1">
            <Toggle checked={params.includeHold} onChange={(v) => set("includeHold", v)} label="Include Hold Events" />
            <Toggle checked={params.includeInterruptions} onChange={(v) => set("includeInterruptions", v)} label="Include Interruptions" />
          </div>
        </section>

        {/* ── Generate Button ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: loading
              ? "rgba(0,212,232,0.5)"
              : "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)",
            boxShadow: loading ? "none" : "0 4px 20px rgba(0,212,232,0.3)",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating conversation…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Conversation
            </>
          )}
        </button>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#ef4444" }}>Generation failed</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(239,68,68,0.7)" }}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Output ───────────────────────────────────────────────────── */}
        {turns.length > 0 && (
          <section
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Output header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Generated Conversation
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8" }}
                >
                  {turns.filter((t) => t.speaker !== "SYSTEM").length} turns
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {rawConversation.length.toLocaleString()} chars
              </span>
            </div>

            {/* Bubbles */}
            <div
              className="p-5 space-y-4 max-h-[600px] overflow-y-auto"
              style={{ background: "var(--background)" }}
            >
              {turns.map((turn, i) => (
                <ChatBubble key={i} turn={turn} />
              ))}
            </div>

            {/* Action bar */}
            <div
              className="flex flex-wrap gap-2 px-5 py-3"
              style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={copyText}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                style={{ background: "rgba(148,163,184,0.1)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(148,163,184,0.1)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
              <button
                type="button"
                onClick={exportTxt}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                style={{ background: "rgba(148,163,184,0.1)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <Download className="h-3.5 w-3.5" />
                Export as TXT
              </button>
              <button
                type="button"
                onClick={openSavePanel}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                style={{ background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.25)", color: "#00d4e8" }}
              >
                <Save className="h-3.5 w-3.5" />
                Save to Dataset
              </button>
              <button
                type="button"
                onClick={useInTtsLab}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-80 ml-auto"
                style={{ background: "linear-gradient(135deg, #00d4e8, #7c3aed)" }}
              >
                Use in TTS Lab
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Save to dataset panel */}
            {saveOpen && (
              <div
                className="px-5 py-4 space-y-3"
                style={{ borderTop: "1px solid var(--border)", background: "rgba(0,212,232,0.02)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Save to Dataset
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSaveOpen(false); setSaveResult(null); }}
                    className="rounded hover:opacity-60 transition"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Dataset selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Target dataset
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDataset}
                      onChange={(e) => setSelectedDataset(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 pr-8"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      <option value="__new__">+ Create new dataset…</option>
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                  </div>
                </div>

                {selectedDataset === "__new__" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      New dataset name (optional)
                    </label>
                    <input
                      type="text"
                      value={newDatasetName}
                      onChange={(e) => setNewDatasetName(e.target.value)}
                      placeholder={`Text Gen – ${params.topic}`}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                )}

                {saveResult && (
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    style={
                      saveResult.ok
                        ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }
                        : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }
                    }
                  >
                    {saveResult.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                      : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                    {saveResult.message}
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveToDataset}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                  style={{ background: "#00d4e8" }}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? "Saving…" : "Confirm Save"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
