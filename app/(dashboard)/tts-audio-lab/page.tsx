"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AudioWaveform,
  Play,
  Pause,
  Download,
  Trash2,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Archive,
  ChevronRight,
  Mic,
  Settings2,
  ListMusic,
  X,
  FlaskConical,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Users,
  Database,
} from "lucide-react";

// Alias so the rest of the file uses Waveform
const Waveform = AudioWaveform;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Constants ────────────────────────────────────────────────────────────────

const VOICES = [
  { value: "default",   label: "Default (af_heart)" },
  { value: "female-1",  label: "Female · Bella" },
  { value: "female-2",  label: "Female · Nova" },
  { value: "male-1",    label: "Male · Adam" },
  { value: "male-2",    label: "Male · Michael" },
  { value: "british-f", label: "British · Emma" },
  { value: "british-m", label: "British · George" },
];

const FORMATS = ["wav", "mp3"] as const;

// ─── TTS engine metadata ───────────────────────────────────────────────────────
const TTS_ENGINE = { name: "Kokoro TTS", version: "v1.0", vendor: "Kokoro", accent: "#a855f7" };

// ─── Conversation voice presets ────────────────────────────────────────────────
const AGENT_VOICE    = "male-1";    // Adam
const CUSTOMER_VOICE = "female-1";  // Bella

// ─── Sample conversation transcripts ──────────────────────────────────────────
interface Utterance { speaker: "agent" | "customer"; text: string }
interface SampleTranscript { id: string; title: string; category: string; utterances: Utterance[] }

const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    id: "account-inquiry",
    title: "Account Inquiry",
    category: "Banking",
    utterances: [
      { speaker: "agent",    text: "Thank you for calling support. My name is Sarah. How can I help you today?" },
      { speaker: "customer", text: "Hi Sarah, I need to check my account balance and recent transactions." },
      { speaker: "agent",    text: "I'd be happy to help. Can you verify your account number and date of birth?" },
      { speaker: "customer", text: "Sure, account number 4872, born March 12, 1985." },
      { speaker: "agent",    text: "Thank you. Your balance is $1,243.50. Shall I read recent transactions?" },
    ],
  },
  {
    id: "tech-support",
    title: "Technical Support",
    category: "ISP",
    utterances: [
      { speaker: "agent",    text: "Hello, technical support, this is Mike speaking." },
      { speaker: "customer", text: "Hi Mike, my internet has been down since this morning. I work from home." },
      { speaker: "agent",    text: "I'm sorry to hear that. Let me run a diagnostic. Can you check if the router lights are on?" },
      { speaker: "customer", text: "Yes, the power light is on but the internet light is blinking red." },
      { speaker: "agent",    text: "Got it. Please unplug the router, wait 30 seconds, then plug it back in." },
    ],
  },
  {
    id: "billing-dispute",
    title: "Billing Dispute",
    category: "Subscription",
    utterances: [
      { speaker: "agent",    text: "Billing department, this is James. How may I assist you?" },
      { speaker: "customer", text: "I was charged twice for my subscription this month. It's very frustrating." },
      { speaker: "agent",    text: "I completely understand your concern. I apologize for the inconvenience." },
      { speaker: "customer", text: "The charge is $49.99 and it appeared twice on November 3rd." },
      { speaker: "agent",    text: "I can confirm the duplicate charge. I'll process a full refund within 3 to 5 business days." },
    ],
  },
  {
    id: "mixed-benchmark",
    title: "Numbers & Proper Nouns",
    category: "STT Benchmark",
    utterances: [
      { speaker: "agent",    text: "Hi, this is Rachel from Apex Solutions. How can I help?" },
      { speaker: "customer", text: "I need to reschedule my appointment on January 15th at 2:30 PM." },
      { speaker: "agent",    text: "Of course. I see your booking under David Kowalski, reference number A-7749-B." },
      { speaker: "customer", text: "That's correct. Can we move it to January 22nd, preferably morning?" },
      { speaker: "agent",    text: "Absolutely. I've rescheduled you for January 22nd at 10:00 AM. You'll get a confirmation email." },
    ],
  },
  {
    id: "cancellation-flow",
    title: "Cancellation Flow",
    category: "Retention",
    utterances: [
      { speaker: "agent",    text: "Retention team, this is Lisa. How can I help you today?" },
      { speaker: "customer", text: "I'd like to cancel my account. I've been a customer for three years but prices went up." },
      { speaker: "agent",    text: "I'm sorry to hear that. Before we proceed, may I ask what's driving this decision?" },
      { speaker: "customer", text: "The new price is $89 per month. It's just too expensive for me now." },
      { speaker: "agent",    text: "I understand. I can offer you a reduced rate of $59 per month for the next 6 months." },
    ],
  },
];

function transcriptToText(utterances: Utterance[]): string {
  return utterances.map((u) => `${u.speaker === "agent" ? "Agent" : "Customer"}: ${u.text}`).join("\n");
}

function parseTranscriptText(raw: string): Utterance[] {
  return raw.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line): Utterance[] => {
      const agentMatch    = /^agent\s*:\s*/i.exec(line);
      const customerMatch = /^customer\s*:\s*/i.exec(line);
      if (agentMatch)    return [{ speaker: "agent",    text: line.slice(agentMatch[0].length).trim() }];
      if (customerMatch) return [{ speaker: "customer", text: line.slice(customerMatch[0].length).trim() }];
      return [];
    });
}

const STT_MODELS = [
  { key: "whisper",    label: "Whisper large-v3",        vendor: "OpenAI",     accent: "#22c55e" },
  { key: "google",     label: "Google Cloud STT v2",     vendor: "Google",     accent: "#3b82f6" },
  { key: "aws",        label: "AWS Transcribe",          vendor: "Amazon",     accent: "#f59e0b" },
  { key: "azure",      label: "Azure Speech Services",   vendor: "Microsoft",  accent: "#8b5cf6" },
  { key: "assemblyai", label: "AssemblyAI Universal-2",  vendor: "AssemblyAI", accent: "#00d4e8" },
];

interface SttModelResult {
  model: string;
  model_label: string;
  transcript: string;
  wer: number;
  cer: number;
  latency_ms: number;
  cost_estimate: number;
  duration_secs: number;
  evaluation_id: string | null;
  error?: string;
}

interface BatchFileResult {
  sentence_id: string;
  audio_file: string;
  reference_text: string;
  results: SttModelResult[];
  error?: string;
}

interface BatchAggregate {
  model: string;
  model_label: string;
  files_processed: number;
  avg_wer: number;
  avg_cer: number;
  avg_latency: number;
  total_cost: number;
  wer_min: number;
  wer_max: number;
}

// LibraryEntry is defined later; TS allows forward-referencing interfaces
type SttModalTarget =
  | { mode: "single"; entry: LibraryEntry }
  | { mode: "batch";  entries: LibraryEntry[] };

// ─── Shared helpers ───────────────────────────────────────────────────────────

function range(start: number, stop: number, step: number): number[] {
  const out: number[] = [];
  for (let v = start; v <= stop + 1e-9; v = Math.round((v + step) * 1e6) / 1e6) {
    out.push(Math.round(v * 1e6) / 1e6);
  }
  return out;
}

function fmtDuration(s: number | string) {
  const sec = parseFloat(String(s));
  if (isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const ss = (sec % 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }

function werStyle(wer: number): React.CSSProperties {
  if (wer < 0.05) return { color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" };
  if (wer < 0.10) return { color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" };
  return { color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" };
}

function cerStyle(cer: number): React.CSSProperties {
  if (cer < 0.03) return { color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" };
  if (cer < 0.06) return { color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" };
  return { color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" };
}

function latStyle(ms: number): React.CSSProperties {
  if (ms < 500) return { color: "#22c55e" };
  if (ms < 1000) return { color: "#f59e0b" };
  return { color: "#ef4444" };
}

function downloadCsv(rows: Array<Record<string, string | number | null>>, filename: string) {
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h] ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Waveform canvas ──────────────────────────────────────────────────────────

function WaveformCanvas({ audioUrl }: { audioUrl: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(audioUrl);
        const buf = await res.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(buf);
        if (cancelled) return;

        const data = decoded.getChannelData(0);
        const { width, height } = canvas;
        const barCount = 160;
        const samplesPerBar = Math.floor(data.length / barCount);

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < barCount; i++) {
          let max = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            max = Math.max(max, Math.abs(data[i * samplesPerBar + j] ?? 0));
          }
          const barH = Math.max(2, max * height * 0.88);
          const x = (i / barCount) * width;
          const bw = Math.max(1, width / barCount - 1.2);
          const y = (height - barH) / 2;

          const grad = ctx.createLinearGradient(0, y, 0, y + barH);
          grad.addColorStop(0, "rgba(0,212,232,0.9)");
          grad.addColorStop(0.5, "rgba(0,212,232,0.6)");
          grad.addColorStop(1, "rgba(124,58,237,0.7)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, bw, barH, 1);
          ctx.fill();
        }

        await audioCtx.close();
      } catch {
        // If decoding fails, draw an idle line
        if (!cancelled && canvasRef.current) {
          const ctx2 = canvasRef.current.getContext("2d");
          ctx2?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [audioUrl]);

  if (!audioUrl) {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-lg"
        style={{ background: "rgba(6,15,46,0.6)", border: "1px dashed rgba(0,212,232,0.2)" }}
      >
        <div className="text-center">
          <Waveform className="mx-auto h-8 w-8 mb-2" style={{ color: "rgba(0,212,232,0.3)" }} />
          <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
            Waveform will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className="block w-full rounded-lg"
      style={{ background: "rgba(6,15,46,0.6)", border: "1px solid rgba(0,212,232,0.15)", height: "120px" }}
    />
  );
}

// ─── Slider component ─────────────────────────────────────────────────────────

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue = (v) => String(v),
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
          {label}
        </label>
        <span
          className="rounded px-1.5 py-0.5 text-xs font-mono font-semibold"
          style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8" }}
        >
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #00d4e8 0%, #00d4e8 ${((value - min) / (max - min)) * 100}%, rgba(0,212,232,0.15) ${((value - min) / (max - min)) * 100}%, rgba(0,212,232,0.15) 100%)`,
          accentColor: "#00d4e8",
        }}
      />
      <div className="flex justify-between text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Section 1: Audio Generator ───────────────────────────────────────────────

function AudioGeneratorSection() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("default");
  const [speed, setSpeed] = useState(1.0);
  const [emotion, setEmotion] = useState(0.5);
  const [pitch, setPitch] = useState(0.0);
  const [format, setFormat] = useState<"wav" | "mp3">("wav");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    filename: string;
    duration_seconds: number;
    sample_rate: number;
    file_path: string;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = result ? `/api/tts/file/${encodeURIComponent(result.filename)}` : null;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    setPlaying(false);
    if (audioRef.current) audioRef.current.pause();

    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed, emotion, pitch, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Controls */}
      <Card className="glass-card border-0 ai-glow">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Settings2 className="h-4 w-4" style={{ color: "#00d4e8" }} />
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {/* Text area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Text</label>
              <span className="text-xs" style={{ color: text.length > 450 ? "#f59e0b" : "rgba(148,163,184,0.4)" }}>
                {text.length}/500
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="Enter text to synthesize…"
              rows={4}
              className="lab-input w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.2)")}
            />
          </div>

          {/* Voice */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="lab-input w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
              }}
            >
              {VOICES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <SliderRow label="Speed" min={0.5} max={2.0} step={0.05} value={speed} onChange={setSpeed} formatValue={(v) => `${v.toFixed(2)}×`} />
          <SliderRow label="Emotion" min={0.0} max={1.0} step={0.05} value={emotion} onChange={setEmotion} formatValue={(v) => v.toFixed(2)} />
          <SliderRow label="Pitch" min={-5} max={5} step={0.5} value={pitch} onChange={setPitch} formatValue={(v) => (v >= 0 ? `+${v}` : String(v))} />

          {/* Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Output Format</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className="flex-1 rounded-lg py-1.5 text-sm font-semibold uppercase tracking-wide transition-all"
                  style={
                    format === f
                      ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.4)" }
                      : { background: "rgba(6,15,46,0.6)", color: "#64748b", border: "1px solid rgba(0,212,232,0.1)" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating || !text.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)",
              boxShadow: generating ? "none" : "0 0 16px rgba(0,212,232,0.3)",
            }}
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Waveform className="h-4 w-4" /> Generate Audio</>
            )}
          </button>

          {error && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Waveform + playback */}
      <Card className="glass-card border-0 ai-glow">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Waveform className="h-4 w-4" style={{ color: "#00d4e8" }} />
            Output
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {/* Waveform */}
          <div style={{ height: 120, overflow: "hidden" }}>
            <WaveformCanvas audioUrl={audioUrl} />
          </div>

          {/* Hidden audio element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              preload="auto"
            />
          )}

          {/* Play controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!result}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-30"
              style={{
                background: result ? "rgba(0,212,232,0.15)" : "rgba(0,212,232,0.05)",
                border: "1px solid rgba(0,212,232,0.3)",
                color: "#00d4e8",
              }}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <div className="flex-1 space-y-0.5">
              {result ? (
                <>
                  <p className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {result.filename}
                  </p>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    {fmtDuration(result.duration_seconds)} · {result.sample_rate} Hz
                  </p>
                </>
              ) : (
                <p className="text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
                  No audio generated yet
                </p>
              )}
            </div>

            {result && (
              <a
                href={`/api/tts/file/${encodeURIComponent(result.filename)}?download=1`}
                download={result.filename}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(0,212,232,0.1)", border: "1px solid rgba(0,212,232,0.2)", color: "#00d4e8" }}
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Metadata chips */}
          {result && (
            <div className="flex flex-wrap gap-2 pt-1">
              {/* TTS engine badge */}
              <span
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#94a3b8" }}
              >
                <span style={{ color: "#64748b" }}>Engine: </span>
                <span style={{ color: TTS_ENGINE.accent }}>{TTS_ENGINE.name}</span>
              </span>
              {[
                ["Voice", VOICES.find((v) => v.value === voice)?.label.split(" · ")[1] ?? voice],
                ["Speed", `${speed.toFixed(2)}×`],
                ["Emotion", emotion.toFixed(2)],
                ["Pitch", pitch >= 0 ? `+${pitch}` : String(pitch)],
                ["Format", format.toUpperCase()],
              ].map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full px-2.5 py-0.5 text-xs"
                  style={{ background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.15)", color: "#94a3b8" }}
                >
                  <span style={{ color: "#64748b" }}>{k}: </span>
                  <span style={{ color: "#00d4e8" }}>{v}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section 2: Batch Generator ───────────────────────────────────────────────

interface RangeConfig {
  min: number;
  max: number;
  step: number;
}

function BatchGeneratorSection() {
  const [rawInput, setRawInput] = useState(
    "The quick brown fox jumps over the lazy dog\nShe sells seashells by the seashore\nHow much wood would a woodchuck chuck"
  );
  const [voice, setVoice] = useState("default");
  const [speedRange, setSpeedRange] = useState<RangeConfig>({ min: 0.8, max: 1.2, step: 0.2 });
  const [emotionRange, setEmotionRange] = useState<RangeConfig>({ min: 0.3, max: 0.7, step: 0.4 });
  const [outputDir, setOutputDir] = useState("~/audio_samples/batch_001");
  const [format, setFormat] = useState<"wav" | "mp3">("wav");
  const [sampleRate, setSampleRate] = useState(22050);

  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [manifestPath, setManifestPath] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const parseSentences = () => {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed) as Array<{ id: string; text: string }>;
      } catch {}
    }
    return rawInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `s${String(i + 1).padStart(2, "0")}`, text }));
  };

  const speeds = range(speedRange.min, speedRange.max, speedRange.step);
  const emotions = range(emotionRange.min, emotionRange.max, emotionRange.step);
  const sentences = parseSentences();
  const expectedTotal = sentences.length * speeds.length * emotions.length;

  const handleBatch = async () => {
    setStatus("running");
    setProgress(0);
    setTotal(expectedTotal);
    setManifestPath(null);
    setErrorMsg(null);

    const config = {
      sentences,
      voices: [voice],
      speeds,
      emotions,
      output_dir: outputDir,
      format,
      sample_rate: sampleRate,
    };

    try {
      const res = await fetch("/api/tts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok || !res.body) throw new Error("Batch request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const evt = JSON.parse(dataLine.slice(6));
            if (evt.type === "start") setTotal(evt.total);
            if (evt.type === "progress") setProgress(evt.completed);
            if (evt.type === "done") {
              setProgress(evt.completed ?? evt.total);
              setManifestPath(evt.manifest_path);
              if (!evt.success) {
                setErrorMsg(evt.error ?? "Batch generation failed — no audio files were created.");
              }
              setStatus(evt.success ? "done" : "error");
            }
            if (evt.type === "error") {
              setErrorMsg(evt.message);
              setStatus("error");
            }
          } catch {}
        }
      }
    } catch (e) {
      setErrorMsg(String(e instanceof Error ? e.message : e));
      setStatus("error");
    }
  };

  const downloadZip = async () => {
    if (!manifestPath) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/tts/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest_path: manifestPath }),
      });
      if (!res.ok) throw new Error("ZIP failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tts_batch_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrorMsg(String(e instanceof Error ? e.message : e));
    } finally {
      setDownloading(false);
    }
  };

  const RangeInput = ({
    label, value, onChange, min, max, maxStep,
  }: {
    label: string;
    value: RangeConfig;
    onChange: (v: RangeConfig) => void;
    min: number;
    max: number;
    maxStep: number;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {(["min", "max", "step"] as const).map((k) => (
          <div key={k}>
            <p className="mb-1 text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>{k}</p>
            <input
              type="number"
              value={value[k]}
              step={k === "step" ? 0.05 : 0.1}
              min={k === "step" ? 0.05 : min}
              max={k === "step" ? maxStep : max}
              onChange={(e) => onChange({ ...value, [k]: parseFloat(e.target.value) || 0 })}
              className="lab-input w-full rounded-lg px-2 py-1.5 text-xs font-mono outline-none"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
              }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
        → {range(value.min, value.max, value.step).join(", ")}
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input */}
      <Card className="glass-card border-0 ai-glow">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <ListMusic className="h-4 w-4" style={{ color: "#00d4e8" }} />
            Sentences
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
              One sentence per line, or paste JSON array
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={8}
              className="lab-input w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                lineHeight: "1.6",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.2)")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Output Directory</label>
            <input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              className="lab-input w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
              }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Voice</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="lab-input w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
                style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.2)" }}
              >
                {VOICES.map((v) => <option key={v.value} value={v.value}>{v.label.split(" · ")[0]} – {v.label.split(" · ")[1] ?? v.value}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Format</label>
              <div className="flex gap-1.5">
                {FORMATS.map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase"
                    style={format === f
                      ? { background: "rgba(0,212,232,0.15)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.4)" }
                      : { background: "rgba(6,15,46,0.6)", color: "#64748b", border: "1px solid rgba(0,212,232,0.1)" }
                    }
                  >{f}</button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Config + Progress */}
      <Card className="glass-card border-0 ai-glow">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Settings2 className="h-4 w-4" style={{ color: "#00d4e8" }} />
            Ranges & Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <RangeInput label="Speed range" value={speedRange} onChange={setSpeedRange} min={0.5} max={2.0} maxStep={1.0} />
          <RangeInput label="Emotion range" value={emotionRange} onChange={setEmotionRange} min={0.0} max={1.0} maxStep={0.5} />

          {/* Combination preview */}
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2.5"
            style={{ background: "rgba(0,212,232,0.06)", border: "1px solid rgba(0,212,232,0.15)" }}
          >
            <span className="text-xs" style={{ color: "#94a3b8" }}>
              {sentences.length} sentences × {speeds.length} speeds × {emotions.length} emotions
            </span>
            <span className="text-sm font-bold" style={{ color: "#00d4e8" }}>
              = {expectedTotal} files
            </span>
          </div>

          {/* Generate button */}
          <button
            onClick={handleBatch}
            disabled={status === "running" || sentences.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)",
              boxShadow: status === "running" ? "none" : "0 0 16px rgba(0,212,232,0.3)",
            }}
          >
            {status === "running" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Waveform className="h-4 w-4" /> Generate Batch</>
            )}
          </button>

          {/* Progress */}
          {status === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs" style={{ color: "#94a3b8" }}>
                <span>Progress</span>
                <span style={{ color: "#00d4e8" }}>{progress} / {total}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,212,232,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${total > 0 ? (progress / total) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #00d4e8, #7c3aed)",
                    boxShadow: "0 0 8px rgba(0,212,232,0.5)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Done state */}
          {status === "done" && manifestPath && (
            <div className="space-y-2">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                Generated {total} files successfully
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/api/tts/file/manifest.csv?download=1`}
                  download="manifest.csv"
                  className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  manifest.csv
                </a>
                <button
                  onClick={downloadZip}
                  disabled={downloading}
                  className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" }}
                >
                  {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                  Download ZIP
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {(status === "error" || errorMsg) && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              {errorMsg ?? "Batch generation failed"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── STT Eval Modal ───────────────────────────────────────────────────────────

function SttEvalModal({ target, onClose }: { target: SttModalTarget; onClose: () => void }) {
  const isBatch = target.mode === "batch";
  const fileCount = isBatch ? target.entries.length : 1;

  const [selectedModels, setSelectedModels] = useState<string[]>(["whisper", "assemblyai"]);
  const [referenceText, setReferenceText] = useState(
    !isBatch ? (target.entry.text ?? "") : ""
  );
  const [step, setStep]         = useState<"config" | "running" | "results">("config");
  const [results, setResults]   = useState<SttModelResult[] | null>(null);
  const [batchFiles, setBatchFiles]         = useState<BatchFileResult[] | null>(null);
  const [batchAggregates, setBatchAggregates] = useState<BatchAggregate[] | null>(null);
  const [batchProgress, setBatchProgress]   = useState({ done: 0, total: 0, currentId: "" });
  const [error, setError]       = useState<string | null>(null);
  const [expandedRows, setExpandedRows]     = useState<Set<string>>(new Set());

  const toggleModel = (key: string) => {
    setSelectedModels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRun = async () => {
    if (selectedModels.length === 0) return;
    setStep("running");
    setError(null);

    if (isBatch) {
      const files = target.entries.map((e) => ({
        audio_file:     e.file_path,
        reference_text: e.text,
        sentence_id:    e.sentence_id,
        voice:          e.voice,
        speed:          e.speed,
        emotion:        e.emotion,
      }));
      setBatchProgress({ done: 0, total: files.length, currentId: "" });

      try {
        const res = await fetch("/api/stt/batch-evaluate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ files, models: selectedModels }),
        });
        if (!res.ok || !res.body) throw new Error("Batch request failed");

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "start")    setBatchProgress({ done: 0, total: evt.total, currentId: "" });
              if (evt.type === "progress") setBatchProgress({ done: evt.done, total: evt.total, currentId: evt.current_id ?? "" });
              if (evt.type === "done") {
                setBatchFiles(evt.files);
                setBatchAggregates(evt.aggregates);
                setStep("results");
              }
            } catch {}
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Batch failed");
        setStep("config");
      }
    } else {
      try {
        const res = await fetch("/api/stt/evaluate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            audio_file:    target.entry.file_path,
            models:        selectedModels,
            reference_text: referenceText,
            metadata: {
              sentence_id: target.entry.sentence_id,
              voice:       target.entry.voice,
              speed:       target.entry.speed,
              emotion:     target.entry.emotion,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Evaluation failed");
        setResults(data.results);
        setStep("results");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Evaluation failed");
        setStep("config");
      }
    }
  };

  const handleDownloadCsv = () => {
    if (results) {
      const rows = results.map((r) => ({
        model:        r.model_label,
        transcript:   r.transcript,
        wer_pct:      (r.wer * 100).toFixed(2),
        cer_pct:      (r.cer * 100).toFixed(2),
        latency_ms:   r.latency_ms,
        cost_usd:     r.cost_estimate,
        evaluation_id: r.evaluation_id ?? "",
      }));
      downloadCsv(rows, `stt_results_${Date.now()}.csv`);
    } else if (batchFiles) {
      const rows = batchFiles.flatMap((f) =>
        f.results.map((r) => ({
          sentence_id:    f.sentence_id,
          reference_text: f.reference_text,
          model:          r.model_label,
          transcript:     r.transcript,
          wer_pct:        (r.wer * 100).toFixed(2),
          cer_pct:        (r.cer * 100).toFixed(2),
          latency_ms:     r.latency_ms,
          cost_usd:       r.cost_estimate,
          evaluation_id:  r.evaluation_id ?? "",
        }))
      );
      downloadCsv(rows, `stt_batch_results_${Date.now()}.csv`);
    }
  };

  const title = isBatch
    ? `Batch STT Evaluation — ${fileCount} files`
    : `STT Evaluation — ${target.entry.sentence_id || target.entry.filename}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,9,26,0.85)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== "running") onClose(); }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0c1e4a 0%, #060f2e 100%)",
          border:     "1px solid rgba(0,212,232,0.25)",
          boxShadow:  "0 0 60px rgba(0,212,232,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,212,232,0.12)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg p-2"
              style={{ background: "rgba(0,212,232,0.12)", border: "1px solid rgba(0,212,232,0.25)" }}
            >
              <FlaskConical className="h-4 w-4" style={{ color: "#00d4e8" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {step === "config"  && "Select models and configure evaluation"}
                {step === "running" && (isBatch ? `Processing ${batchProgress.done} / ${batchProgress.total}…` : "Running evaluation…")}
                {step === "results" && "Comparison results — saved to evaluations database"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step === "running"}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80 disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Config step ───────────────────────────────────────────────── */}
          {step === "config" && (
            <>
              {/* Reference text (single mode) */}
              {!isBatch && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                    Reference text (ground truth)
                  </label>
                  <textarea
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    rows={2}
                    className="lab-input w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.2)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.2)")}
                  />
                </div>
              )}

              {/* Batch info */}
              {isBatch && (
                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
                  style={{ background: "rgba(0,212,232,0.06)", border: "1px solid rgba(0,212,232,0.15)" }}
                >
                  <BarChart2 className="h-4 w-4 flex-shrink-0" style={{ color: "#00d4e8" }} />
                  <span style={{ color: "#94a3b8" }}>
                    Will evaluate <span style={{ color: "#00d4e8", fontWeight: 600 }}>{fileCount} audio files</span> against
                    each selected model. Reference text comes from manifest.csv.
                  </span>
                </div>
              )}

              {/* TTS engine info banner */}
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}
              >
                <Mic className="h-4 w-4 flex-shrink-0" style={{ color: TTS_ENGINE.accent }} />
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  Audio generated with{" "}
                  <span style={{ color: TTS_ENGINE.accent, fontWeight: 600 }}>{TTS_ENGINE.name}</span>
                  {" "}· {TTS_ENGINE.vendor}
                </span>
              </div>

              {/* Model selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                  STT models to evaluate
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STT_MODELS.map((m) => {
                    const checked = selectedModels.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        onClick={() => toggleModel(m.key)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all"
                        style={checked
                          ? { background: `rgba(${m.accent === "#22c55e" ? "34,197,94" : m.accent === "#3b82f6" ? "59,130,246" : m.accent === "#f59e0b" ? "245,158,11" : m.accent === "#8b5cf6" ? "139,92,246" : "0,212,232"},0.12)`, border: `1px solid ${m.accent}40` }
                          : { background: "rgba(6,15,46,0.6)", border: "1px solid rgba(0,212,232,0.08)" }
                        }
                      >
                        <div
                          className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                          style={checked
                            ? { background: m.accent, boxShadow: `0 0 6px ${m.accent}60` }
                            : { border: "1px solid rgba(148,163,184,0.3)" }
                          }
                        >
                          {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: checked ? "white" : "#94a3b8" }}>
                            {m.label}
                          </p>
                          <p className="text-xs" style={{ color: "#64748b" }}>{m.vendor}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {/* ── Running step ──────────────────────────────────────────────── */}
          {step === "running" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-5">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(0,212,232,0.1)", border: "1px solid rgba(0,212,232,0.3)" }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00d4e8" }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">
                  {isBatch ? `Processing files…` : `Running ${selectedModels.length} model${selectedModels.length > 1 ? "s" : ""}…`}
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {isBatch
                    ? batchProgress.currentId ? `Current: ${batchProgress.currentId}` : "Starting…"
                    : `WER & CER calculated with jiwer`
                  }
                </p>
              </div>
              {isBatch && batchProgress.total > 0 && (
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between text-xs" style={{ color: "#64748b" }}>
                    <span>Files processed</span>
                    <span style={{ color: "#00d4e8" }}>{batchProgress.done} / {batchProgress.total}</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,212,232,0.1)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${batchProgress.total > 0 ? (batchProgress.done / batchProgress.total) * 100 : 0}%`,
                        background: "linear-gradient(90deg, #00d4e8, #7c3aed)",
                        boxShadow: "0 0 8px rgba(0,212,232,0.4)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Results step ──────────────────────────────────────────────── */}
          {step === "results" && (
            <>
              {/* ─ Single results ─ */}
              {results && (
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    Evaluated with {results.length} STT model{results.length > 1 ? "s" : ""} · Audio: <span style={{ color: TTS_ENGINE.accent, fontWeight: 600 }}>&nbsp;{TTS_ENGINE.name}</span>&nbsp;· WER/CER via jiwer · Saved to benchmark database
                  </div>

                  <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(0,212,232,0.12)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "rgba(6,15,46,0.8)", borderBottom: "1px solid rgba(0,212,232,0.1)", color: "#64748b" }}>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Model</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Transcript</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">WER</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">CER</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Latency</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Cost</th>
                          <th className="px-4 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => {
                          const expanded = expandedRows.has(r.model);
                          const modelDef = STT_MODELS.find((m) => m.key === r.model);
                          return (
                            <>
                              <tr
                                key={r.model}
                                style={{ borderBottom: i < results.length - 1 ? "1px solid rgba(0,212,232,0.06)" : undefined }}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: modelDef?.accent ?? "#00d4e8", boxShadow: `0 0 4px ${modelDef?.accent ?? "#00d4e8"}` }} />
                                    <div>
                                      <p className="text-xs font-semibold text-white">{r.model_label}</p>
                                      <p className="text-xs" style={{ color: "#64748b" }}>{modelDef?.vendor}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 max-w-[180px]">
                                  <p className="truncate text-xs" style={{ color: "#94a3b8" }} title={r.transcript}>
                                    {r.transcript || <span style={{ color: "#64748b", fontStyle: "italic" }}>empty</span>}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full px-2 py-0.5 text-xs font-mono font-semibold" style={werStyle(r.wer)}>
                                    {pct(r.wer)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full px-2 py-0.5 text-xs font-mono font-semibold" style={cerStyle(r.cer)}>
                                    {pct(r.cer)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-mono" style={latStyle(r.latency_ms)}>
                                    {r.latency_ms} ms
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-mono" style={{ color: r.cost_estimate === 0 ? "#22c55e" : "#94a3b8" }}>
                                    {r.cost_estimate === 0 ? "Free" : `$${r.cost_estimate.toFixed(5)}`}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <button onClick={() => toggleRow(r.model)} style={{ color: "#64748b" }}>
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  </button>
                                </td>
                              </tr>
                              {expanded && (
                                <tr key={`${r.model}-expand`} style={{ background: "rgba(6,15,46,0.6)" }}>
                                  <td colSpan={7} className="px-5 pb-4 pt-2">
                                    <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>Full transcript</p>
                                    <p className="text-sm rounded-lg p-3" style={{ background: "rgba(0,212,232,0.04)", border: "1px solid rgba(0,212,232,0.1)", color: "#94a3b8", lineHeight: 1.6 }}>
                                      {r.transcript || <em>No transcript</em>}
                                    </p>
                                    {r.evaluation_id && (
                                      <a
                                        href={`/evaluate/${r.evaluation_id}`}
                                        className="mt-2 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
                                        style={{ color: "#00d4e8" }}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View in Evaluations
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─ Batch results ─ */}
              {batchAggregates && batchFiles && (
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    {batchFiles.length} files × {batchAggregates.length} models · WER/CER via jiwer · Results saved to benchmark database
                  </div>

                  {/* Aggregate table */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>
                      Model Comparison — Aggregate
                    </p>
                    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(0,212,232,0.12)" }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: "rgba(6,15,46,0.8)", borderBottom: "1px solid rgba(0,212,232,0.1)", color: "#64748b" }}>
                            {["Model", "Files", "Avg WER", "WER Range", "Avg CER", "Avg Latency", "Total Cost"].map((h) => (
                              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {batchAggregates.map((a, i) => {
                            const modelDef = STT_MODELS.find((m) => m.key === a.model);
                            return (
                              <tr key={a.model} style={{ borderBottom: i < batchAggregates.length - 1 ? "1px solid rgba(0,212,232,0.06)" : undefined }}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ background: modelDef?.accent ?? "#00d4e8" }} />
                                    <p className="text-xs font-semibold text-white">{a.model_label}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-mono" style={{ color: "#94a3b8" }}>{a.files_processed}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full px-2 py-0.5 text-xs font-mono font-semibold" style={werStyle(a.avg_wer)}>{pct(a.avg_wer)}</span>
                                </td>
                                <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748b" }}>
                                  {pct(a.wer_min)}–{pct(a.wer_max)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full px-2 py-0.5 text-xs font-mono font-semibold" style={cerStyle(a.avg_cer)}>{pct(a.avg_cer)}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-mono" style={latStyle(a.avg_latency)}>{a.avg_latency} ms</span>
                                </td>
                                <td className="px-4 py-3 text-xs font-mono" style={{ color: a.total_cost === 0 ? "#22c55e" : "#94a3b8" }}>
                                  {a.total_cost === 0 ? "Free" : `$${a.total_cost.toFixed(4)}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Per-file breakdown (collapsible) */}
                  <div>
                    <button
                      onClick={() => toggleRow("__batch_files__")}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#64748b" }}
                    >
                      {expandedRows.has("__batch_files__") ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Per-file breakdown ({batchFiles.length} files)
                    </button>
                    {expandedRows.has("__batch_files__") && (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {batchFiles.map((f) => (
                          <div key={f.sentence_id} className="rounded-lg p-3" style={{ background: "rgba(6,15,46,0.6)", border: "1px solid rgba(0,212,232,0.08)" }}>
                            <p className="text-xs font-medium mb-2">
                              <span className="font-mono" style={{ color: "#00d4e8" }}>{f.sentence_id}</span>
                              <span className="ml-2" style={{ color: "#64748b" }}>{f.reference_text}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {f.results.map((r) => {
                                const m = STT_MODELS.find((x) => x.key === r.model);
                                return (
                                  <div key={r.model} className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.1)" }}>
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: m?.accent ?? "#00d4e8" }} />
                                    <span className="text-xs" style={{ color: "#94a3b8" }}>{r.model_label.split(" ")[0]}</span>
                                    <span className="text-xs font-mono font-semibold" style={werStyle(r.wer)}>{pct(r.wer)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(0,212,232,0.1)" }}
        >
          <div className="flex items-center gap-2">
            {step === "results" && (
              <>
                <button
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(0,212,232,0.08)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.2)" }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </button>
                <a
                  href="/evaluate?type=STT"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(124,58,237,0.08)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Evaluations
                </a>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === "config" && (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: "#64748b" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRun}
                  disabled={selectedModels.length === 0}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #00d4e8 0%, #7c3aed 100%)", boxShadow: "0 0 12px rgba(0,212,232,0.25)" }}
                >
                  <FlaskConical className="h-4 w-4" />
                  Run Evaluation ({selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""})
                </button>
              </>
            )}
            {step === "results" && (
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)" }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Audio Library ─────────────────────────────────────────────────

interface LibraryEntry {
  file_path: string;
  filename: string;
  sentence_id: string;
  text: string;
  voice: string;
  speed: string;
  emotion: string;
  duration_seconds: string;
  sample_rate: string;
  format: string;
}

function AudioLibrarySection() {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterVoice, setFilterVoice] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sttModalTarget, setSttModalTarget] = useState<SttModalTarget | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tts/library");
      if (!res.ok) throw new Error("Failed to load library");
      const data: LibraryEntry[] = await res.json();
      setEntries(data);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.text?.toLowerCase().includes(q) || e.sentence_id?.toLowerCase().includes(q);
    const matchVoice = filterVoice === "all" || e.voice === filterVoice;
    const matchFormat = filterFormat === "all" || e.format === filterFormat;
    return matchSearch && matchVoice && matchFormat;
  });

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.filename));

  const toggleSelect = (filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(filename) ? next.delete(filename) : next.add(filename);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((e) => next.delete(e.filename));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((e) => next.add(e.filename));
        return next;
      });
    }
  };

  const playFile = (filename: string) => {
    if (playingFile === filename) {
      audioRef.current?.pause();
      setPlayingFile(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/api/tts/file/${encodeURIComponent(filename)}`);
    audioRef.current = audio;
    audio.play();
    setPlayingFile(filename);
    audio.onended = () => setPlayingFile(null);
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await fetch("/api/tts/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filenames: Array.from(selected) }),
      });
      setSelected(new Set());
      await load();
    } catch {}
    setDeleting(false);
  };

  const uniqueVoices = Array.from(new Set(entries.map((e) => e.voice).filter(Boolean)));
  const uniqueFormats = Array.from(new Set(entries.map((e) => e.format).filter(Boolean)));

  return (
    <Card className="glass-card border-0 ai-glow overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid rgba(0,212,232,0.08)", background: "rgba(6,15,46,0.3)" }}
      >
        {/* Search */}
        <div
          className="flex flex-1 min-w-48 items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.15)" }}
        >
          <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search text or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lab-input flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {/* Voice filter */}
        <select
          value={filterVoice}
          onChange={(e) => setFilterVoice(e.target.value)}
          className="lab-input rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.15)" }}
        >
          <option value="all">All voices</option>
          {uniqueVoices.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* Format filter */}
        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          className="lab-input rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.15)" }}
        >
          <option value="all">All formats</option>
          {uniqueFormats.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete ({selected.size})
            </button>
          )}

          {/* Batch STT Eval */}
          {filtered.length > 0 && (
            <button
              onClick={() => setSttModalTarget({ mode: "batch", entries: filtered })}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.12)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Batch STT Eval ({filtered.length})
            </button>
          )}

          <button
            onClick={load}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:opacity-80"
            style={{ background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.15)", color: "#00d4e8" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: "#00d4e8" }} />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm" style={{ color: "#f87171" }}>
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "rgba(0,212,232,0.08)", border: "1px solid rgba(0,212,232,0.2)" }}
          >
            <ListMusic className="h-5 w-5" style={{ color: "rgba(0,212,232,0.5)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>
            {entries.length === 0 ? "No audio files yet — generate some above" : "No results match your search"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wider"
                style={{ borderBottom: "1px solid rgba(0,212,232,0.1)", background: "rgba(6,15,46,0.4)", color: "#64748b" }}
              >
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll}>
                    {allSelected
                      ? <CheckSquare className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} />
                      : <Square className="h-3.5 w-3.5" />}
                  </button>
                </th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Text</th>
                <th className="px-4 py-3">Voice</th>
                <th className="px-4 py-3">Speed</th>
                <th className="px-4 py-3">Emotion</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => {
                const isPlaying = playingFile === entry.filename;
                const isSelected = selected.has(entry.filename);

                return (
                  <tr
                    key={`${entry.filename}-${idx}`}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid rgba(0,212,232,0.05)" : undefined,
                      background: isSelected ? "rgba(0,212,232,0.04)" : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(0,212,232,0.03)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ""; }}
                  >
                    <td className="px-4 py-2.5">
                      <button onClick={() => toggleSelect(entry.filename)}>
                        {isSelected
                          ? <CheckSquare className="h-3.5 w-3.5" style={{ color: "#00d4e8" }} />
                          : <Square className="h-3.5 w-3.5" style={{ color: "#64748b" }} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>
                        {entry.sentence_id || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <span
                        className="block truncate text-xs"
                        style={{ color: "var(--foreground)" }}
                        title={entry.text}
                      >
                        {entry.text || entry.filename}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{entry.voice || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs" style={{ color: "#00d4e8" }}>{entry.speed || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs" style={{ color: "#a855f7" }}>{entry.emotion || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs" style={{ color: "#64748b" }}>{fmtDuration(entry.duration_seconds)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-semibold uppercase"
                        style={entry.format === "mp3"
                          ? { background: "rgba(249,115,22,0.15)", color: "#fb923c" }
                          : { background: "rgba(0,212,232,0.1)", color: "#00d4e8" }
                        }
                      >
                        {entry.format || "wav"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {/* Play */}
                        <button
                          onClick={() => playFile(entry.filename)}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-all"
                          style={isPlaying
                            ? { background: "rgba(0,212,232,0.2)", color: "#00d4e8" }
                            : { background: "rgba(0,212,232,0.06)", color: "#64748b" }
                          }
                          title="Play"
                        >
                          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                        {/* Download */}
                        <a
                          href={`/api/tts/file/${encodeURIComponent(entry.filename)}?download=1`}
                          download={entry.filename}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-all"
                          style={{ background: "rgba(0,212,232,0.06)", color: "#64748b" }}
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                        {/* Send to STT Eval */}
                        <button
                          onClick={() => setSttModalTarget({ mode: "single", entry })}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-all hover:opacity-80"
                          style={{ background: "rgba(124,58,237,0.12)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.2)" }}
                          title="Send to STT Evaluation"
                        >
                          <FlaskConical className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!loading && !error && (
        <div
          className="flex items-center justify-between px-5 py-2.5 text-xs"
          style={{ borderTop: "1px solid rgba(0,212,232,0.06)", color: "#64748b" }}
        >
          <span>{filtered.length} of {entries.length} files</span>
          {selected.size > 0 && (
            <span style={{ color: "#00d4e8" }}>{selected.size} selected</span>
          )}
        </div>
      )}

      {/* STT Eval Modal */}
      {sttModalTarget && (
        <SttEvalModal
          target={sttModalTarget}
          onClose={() => setSttModalTarget(null)}
        />
      )}
    </Card>
  );
}

// ─── Custom Tab bar (avoids @radix-ui/react-tabs Turbopack resolution issue) ──

// ─── Section 4: Conversation Generator ────────────────────────────────────────

function ConversationGeneratorSection() {
  const [transcript, setTranscript]   = useState(transcriptToText(SAMPLE_TRANSCRIPTS[0]!.utterances));
  const [agentVoice, setAgentVoice]   = useState(AGENT_VOICE);
  const [customerVoice, setCustomerVoice] = useState(CUSTOMER_VOICE);
  const [speed, setSpeed]             = useState(1.0);
  const [emotion, setEmotion]         = useState(0.5);
  const [outputDir, setOutputDir]     = useState("~/audio_samples/conversations");
  const [title, setTitle]             = useState(SAMPLE_TRANSCRIPTS[0]!.id);

  // Auto-prefill from Text Generation page ("Use in TTS Lab" button)
  useEffect(() => {
    try {
      const prefill = localStorage.getItem("tts-lab-prefill");
      if (prefill) {
        setTranscript(prefill);
        setTitle("generated-conversation");
        localStorage.removeItem("tts-lab-prefill");
      }
    } catch { /* localStorage not available */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [status, setStatus]   = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal]       = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState("");
  const [result, setResult]   = useState<{
    filename: string; duration_seconds: number; utterance_count: number;
    sample_rate: number; channels: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const audioUrl = result ? `/api/tts/file/${encodeURIComponent(result.filename)}` : null;

  function loadSample(s: SampleTranscript) {
    setTranscript(transcriptToText(s.utterances));
    setTitle(s.id);
  }

  async function handleGenerate() {
    const utterances = parseTranscriptText(transcript);
    if (utterances.length === 0) return;
    setStatus("running");
    setResult(null);
    setProgress(0);
    setTotal(utterances.length);
    setErrorMsg("");
    setPlaying(false);
    if (audioRef.current) audioRef.current.pause();

    const res = await fetch("/api/tts/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: utterances, title, agentVoice, customerVoice, speed, emotion, outputDir }),
    });

    if (!res.ok || !res.body) {
      setStatus("error");
      setErrorMsg("Request failed");
      return;
    }

    const reader = res.body.getReader();
    const dec    = new TextDecoder();
    let   buf    = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop() ?? "";
      for (const evt of events) {
        const dataLine = evt.split("\n").find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        try {
          const obj = JSON.parse(dataLine.slice(6)) as Record<string, unknown>;
          if (obj.error) { setStatus("error"); setErrorMsg(String(obj.error)); return; }
          if (typeof obj.progress === "number") {
            setProgress(obj.progress + 1);
            setCurrentSpeaker(String(obj.speaker ?? ""));
          }
          if (obj.filename) {
            setResult({
              filename:         String(obj.filename),
              duration_seconds: Number(obj.duration_seconds),
              utterance_count:  Number(obj.utterance_count),
              sample_rate:      Number(obj.sample_rate),
              channels:         Number(obj.channels),
            });
            setStatus("done");
          }
        } catch { /* skip malformed SSE */ }
      }
    }
    if (status === "running") setStatus("done");
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { void audioRef.current.play(); setPlaying(true); }
  };

  const utterances = parseTranscriptText(transcript);
  const agentLines    = utterances.filter((u) => u.speaker === "agent").length;
  const customerLines = utterances.filter((u) => u.speaker === "customer").length;

  return (
    <div className="space-y-5">
      {/* Sample picker */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(148,163,184,0.6)" }}>
          Sample Transcripts — click to load
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_TRANSCRIPTS.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSample(s)}
              className="text-left rounded-xl px-4 py-3 transition-all hover:scale-[1.02]"
              style={title === s.id
                ? { background: "rgba(0,212,232,0.12)", border: "1px solid rgba(0,212,232,0.4)" }
                : { background: "rgba(6,15,46,0.5)", border: "1px solid rgba(0,212,232,0.12)" }
              }
            >
              <p className="text-xs font-semibold" style={{ color: title === s.id ? "#00d4e8" : "#f1f5f9" }}>
                {s.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.6)" }}>
                {s.category} · {s.utterances.length} turns
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: transcript + settings */}
        <Card className="glass-card border-0 ai-glow">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <MessageSquare className="h-4 w-4" style={{ color: "#00d4e8" }} />
              Transcript
              {utterances.length > 0 && (
                <span className="ml-auto text-xs font-normal flex items-center gap-2">
                  <span style={{ color: "#7c3aed" }}>Agent ×{agentLines}</span>
                  <span style={{ color: "#00d4e8" }}>Customer ×{customerLines}</span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                Format: <code style={{ color: "#00d4e8" }}>Agent: text</code> or <code style={{ color: "#00d4e8" }}>Customer: text</code>, one per line
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={10}
                className="lab-input w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.2)", lineHeight: "1.65" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.5)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(0,212,232,0.2)")}
              />
            </div>

            {/* Voice assignment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
                  <span className="h-2 w-2 rounded-full inline-block" style={{ background: "#7c3aed" }} />
                  Agent voice (left ch.)
                </label>
                <select
                  value={agentVoice}
                  onChange={(e) => setAgentVoice(e.target.value)}
                  className="lab-input w-full rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(124,58,237,0.3)" }}
                >
                  {VOICES.filter((v) => v.value !== "default").map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
                  <span className="h-2 w-2 rounded-full inline-block" style={{ background: "#00d4e8" }} />
                  Customer voice (right ch.)
                </label>
                <select
                  value={customerVoice}
                  onChange={(e) => setCustomerVoice(e.target.value)}
                  className="lab-input w-full rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.3)" }}
                >
                  {VOICES.filter((v) => v.value !== "default").map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <SliderRow label="Speed" min={0.5} max={2.0} step={0.05} value={speed} onChange={setSpeed} formatValue={(v) => `${v.toFixed(2)}×`} />
            <SliderRow label="Emotion" min={0.0} max={1.0} step={0.05} value={emotion} onChange={setEmotion} formatValue={(v) => v.toFixed(2)} />

            {/* Output directory */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Output Directory</label>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                className="lab-input w-full rounded-lg px-3 py-2 text-xs font-mono outline-none"
                style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.2)" }}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={status === "running" || utterances.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #00d4e8 100%)",
                boxShadow: status === "running" ? "none" : "0 0 16px rgba(124,58,237,0.3)",
              }}
            >
              {status === "running"
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating {progress}/{total}…</>
                : <><Users className="h-4 w-4" /> Generate Conversation</>
              }
            </button>
          </CardContent>
        </Card>

        {/* Right: output */}
        <Card className="glass-card border-0 ai-glow">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Waveform className="h-4 w-4" style={{ color: "#00d4e8" }} />
              Output
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {/* Stereo channel legend */}
            <div className="flex items-center gap-4 rounded-lg px-4 py-2.5" style={{ background: "rgba(6,15,46,0.6)", border: "1px solid rgba(0,212,232,0.15)" }}>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                <span className="h-2.5 w-4 rounded-sm inline-block" style={{ background: "#7c3aed" }} />
                Left ch. = Agent
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                <span className="h-2.5 w-4 rounded-sm inline-block" style={{ background: "#00d4e8" }} />
                Right ch. = Customer
              </span>
            </div>

            {/* Progress */}
            {status === "running" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs" style={{ color: "#94a3b8" }}>
                  <span>Synthesizing utterance {progress} of {total}…</span>
                  <span style={{ color: currentSpeaker === "agent" ? "#7c3aed" : "#00d4e8", textTransform: "capitalize" }}>
                    {currentSpeaker}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,212,232,0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: total > 0 ? `${(progress / total) * 100}%` : "0%",
                      background: "linear-gradient(to right, #7c3aed, #00d4e8)",
                    }}
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg p-3 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span className="font-mono">{errorMsg}</span>
              </div>
            )}

            {/* Waveform */}
            <div style={{ height: 120, overflow: "hidden" }}>
              <WaveformCanvas audioUrl={audioUrl} />
            </div>

            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} preload="auto" />
            )}

            {/* Play controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={!result}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-30"
                style={{ background: result ? "rgba(0,212,232,0.15)" : "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.3)", color: "#00d4e8" }}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="flex-1 space-y-0.5">
                {result ? (
                  <>
                    <p className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{result.filename}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {fmtDuration(result.duration_seconds)} · {result.utterance_count} turns · stereo {result.sample_rate} Hz
                    </p>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>No conversation generated yet</p>
                )}
              </div>
              {result && (
                <a
                  href={`/api/tts/file/${encodeURIComponent(result.filename)}?download=1`}
                  download={result.filename}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:opacity-80"
                  style={{ background: "rgba(0,212,232,0.1)", border: "1px solid rgba(0,212,232,0.2)", color: "#00d4e8" }}
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>

            {status === "done" && result && (
              <div className="flex items-center gap-2 rounded-lg p-3 text-xs" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                Saved to Audio Library and Datasets page automatically.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Lab Tabs ─────────────────────────────────────────────────────────────────

const LAB_TABS = [
  { id: "generator",     label: "Audio Generator",       Icon: AudioWaveform },
  { id: "conversation",  label: "Conversation",          Icon: MessageSquare },
  { id: "batch",         label: "Batch Generator",       Icon: ListMusic },
  { id: "library",       label: "Audio Library",         Icon: FileText },
] as const;

type LabTabId = typeof LAB_TABS[number]["id"];

function LabTabs() {
  const [active, setActive] = useState<LabTabId>("generator");
  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="overflow-x-auto -mx-1 px-1 pb-0.5">
        <div
          role="tablist"
          aria-label="Audio Lab sections"
          className="flex gap-1 rounded-xl p-1 min-w-max"
          style={{ background: "rgba(6,15,46,0.7)", border: "1px solid rgba(0,212,232,0.2)" }}
        >
          {LAB_TABS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(id)}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                style={isActive
                  ? {
                      background: "rgba(0,212,232,0.18)",
                      color: "#00d4e8",
                      border: "1px solid rgba(0,212,232,0.4)",
                      boxShadow: "0 0 12px rgba(0,212,232,0.15)",
                    }
                  : {
                      color: "rgba(148,163,184,0.7)",
                      border: "1px solid transparent",
                    }
                }
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-cyan-400" : ""}`} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {active === "generator"    && <AudioGeneratorSection />}
      {active === "conversation" && <ConversationGeneratorSection />}
      {active === "batch"        && <BatchGeneratorSection />}
      {active === "library"      && <AudioLibrarySection />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TtsAudioLabPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #060f2e 0%, #0c1e4a 50%, #102356 100%)",
          border: "1px solid rgba(0,212,232,0.2)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,212,232,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg p-2.5"
                style={{ background: "rgba(0,212,232,0.15)", border: "1px solid rgba(0,212,232,0.3)" }}
              >
                <Waveform className="h-6 w-6" style={{ color: "#00d4e8" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TTS Audio Lab</h1>
                <p className="mt-0.5 text-sm" style={{ color: "#94a3b8" }}>
                  Generate, batch-produce, and manage TTS audio for Speech CoE evaluation pipelines
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/datasets"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }}
              >
                <Database className="h-3.5 w-3.5" />
                Datasets
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link
                href="/evaluate/new?type=STT"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }}
              >
                <Mic className="h-3.5 w-3.5" />
                STT Evaluation
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Feature capability pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { Icon: Waveform,      label: "Single Audio Generator",   desc: "Single utterance, full voice control" },
              { Icon: MessageSquare, label: "Conversation (2-channel)", desc: "Agent (L) + Customer (R) stereo WAV" },
              { Icon: ListMusic,     label: "Batch Generator",          desc: "Matrix of speed × emotion × sentences" },
              { Icon: FileText,      label: "Audio Library",            desc: "Browse & evaluate all generated files" },
            ].map(({ Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#00d4e8" }} />
                <div>
                  <p className="text-xs font-semibold text-white leading-none">{label}</p>
                  <p className="text-xs leading-none mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs — custom implementation (no @radix-ui/react-tabs needed) */}
      <LabTabs />
    </div>
  );
}
