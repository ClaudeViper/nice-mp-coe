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
} from "lucide-react";

// Alias so the rest of the file uses Waveform
const Waveform = AudioWaveform;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
      className="w-full rounded-lg"
      style={{ background: "rgba(6,15,46,0.6)", border: "1px solid rgba(0,212,232,0.15)" }}
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
              className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                color: "var(--foreground)",
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
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                color: "var(--foreground)",
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
          <div style={{ height: 120 }}>
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
              setProgress(evt.total);
              setManifestPath(evt.manifest_path);
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
              className="w-full rounded-lg px-2 py-1.5 text-xs font-mono outline-none"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                color: "var(--foreground)",
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
              className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                color: "var(--foreground)",
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
              className="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
              style={{
                background: "rgba(6,15,46,0.8)",
                border: "1px solid rgba(0,212,232,0.2)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Voice</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
                style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.2)", color: "var(--foreground)" }}
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
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>

        {/* Voice filter */}
        <select
          value={filterVoice}
          onChange={(e) => setFilterVoice(e.target.value)}
          className="rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.15)", color: "var(--foreground)" }}
        >
          <option value="all">All voices</option>
          {uniqueVoices.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* Format filter */}
        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          className="rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={{ background: "rgba(6,15,46,0.8)", border: "1px solid rgba(0,212,232,0.15)", color: "var(--foreground)" }}
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
                        <Link
                          href={`/evaluate/new?type=STT&audioFile=${encodeURIComponent(entry.filename)}`}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-all"
                          style={{ background: "rgba(124,58,237,0.08)", color: "#a855f7" }}
                          title="Send to STT Evaluation"
                        >
                          <Mic className="h-3 w-3" />
                        </Link>
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
    </Card>
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
        <div className="relative flex items-center justify-between">
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
          <div className="hidden md:flex items-center gap-2">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="generator">
        <TabsList
          className="h-auto p-1 gap-0.5"
          style={{ background: "rgba(6,15,46,0.6)", border: "1px solid rgba(0,212,232,0.15)" }}
        >
          {[
            { value: "generator", label: "Audio Generator", icon: Waveform },
            { value: "batch",     label: "Batch Generator", icon: ListMusic },
            { value: "library",   label: "Audio Library",   icon: FileText },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-none"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="generator" className="mt-5">
          <AudioGeneratorSection />
        </TabsContent>

        <TabsContent value="batch" className="mt-5">
          <BatchGeneratorSection />
        </TabsContent>

        <TabsContent value="library" className="mt-5">
          <AudioLibrarySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
