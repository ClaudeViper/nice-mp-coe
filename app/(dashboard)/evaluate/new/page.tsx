"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mic,
  Volume2,
  MessageSquare,
  Building2,
  Plug,
  Database,
  Settings,
  Play,
  BarChart3,
  Upload,
  Key,
  Globe,
  Zap,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

type EvalType = "STT" | "TTS" | "V2V";

interface VendorOption {
  id: string;
  name: string;
  slug: string;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
  }>;
}

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { key: "type", label: "Select Type", icon: <FlaskConical className="h-4 w-4" /> },
  { key: "vendor", label: "Select Vendor", icon: <Building2 className="h-4 w-4" /> },
  { key: "connection", label: "Configure Connection", icon: <Plug className="h-4 w-4" /> },
  { key: "dataset", label: "Test Dataset", icon: <Database className="h-4 w-4" /> },
  { key: "parameters", label: "Parameters", icon: <Settings className="h-4 w-4" /> },
  { key: "run", label: "Run Evaluation", icon: <Play className="h-4 w-4" /> },
  { key: "results", label: "View Results", icon: <BarChart3 className="h-4 w-4" /> },
] as const;

const TYPE_CONFIG: Record<EvalType, { label: string; desc: string; icon: React.ReactNode; samples: string; color: string; bg: string; border: string }> = {
  STT: {
    label: "Speech-to-Text",
    desc: "Evaluate transcription accuracy, latency, and robustness across audio samples.",
    icon: <Mic className="h-7 w-7" />,
    samples: "50 audio samples",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.1)",
    border: "rgba(124,58,237,0.35)",
  },
  TTS: {
    label: "Text-to-Speech",
    desc: "Evaluate voice quality, naturalness, latency, and intelligibility.",
    icon: <Volume2 className="h-7 w-7" />,
    samples: "30 text prompts",
    color: "#00d4e8",
    bg: "rgba(0,212,232,0.1)",
    border: "rgba(0,212,232,0.35)",
  },
  V2V: {
    label: "Voice-to-Voice",
    desc: "Evaluate conversational AI with task completion, latency, and naturalness.",
    icon: <MessageSquare className="h-7 w-7" />,
    samples: "10 conversation scripts",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.35)",
  },
};

const DATASETS: Record<EvalType, Array<{ id: string; name: string; desc: string; samples: number }>> = {
  STT: [
    { id: "NICE-CX-Clean-EN", name: "NICE-CX-Clean-EN", desc: "50 clean contact-center clips: account inquiries, billing, technical support, and agent-assist interactions.", samples: 50 },
    { id: "NICE-CX-Noisy-EN", name: "NICE-CX-Noisy-EN", desc: "50 challenging clips: background noise, mobile/VoIP artifacts, accented speech, and IVR interactions.", samples: 50 },
  ],
  TTS: [
    { id: "NICE-TTS-IVR-EN", name: "NICE-TTS-IVR-EN", desc: "30 IVR prompt scripts: main menus, confirmations, payments, scheduling, and system messages.", samples: 30 },
    { id: "NICE-TTS-Agent-EN", name: "NICE-TTS-Agent-EN", desc: "30 agent response scripts: greetings, empathy, resolutions, escalations, and farewells.", samples: 30 },
  ],
  V2V: [
    { id: "NICE-V2V-Support-EN", name: "NICE-V2V-Support-EN", desc: "10 customer support scripts: billing disputes, technical issues, fraud, retention, and escalation.", samples: 10 },
    { id: "NICE-V2V-IVR-EN", name: "NICE-V2V-IVR-EN", desc: "10 conversational IVR scripts: intent recognition, interruption handling, authentication, and fallbacks.", samples: 10 },
  ],
};

const LANGUAGES = [
  { code: "en", name: "English (US)" },
  { code: "en-gb", name: "English (UK)" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const AUDIO_FORMATS = ["wav", "mp3", "flac", "ogg", "webm"];
const SAMPLING_RATES = [8000, 16000, 22050, 44100, 48000];
const BATCH_SIZES = [1, 2, 4, 8];

const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors";
const inputStyle = {
  background: "var(--secondary)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NewEvaluationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  // Form state
  const [evaluationType, setEvaluationType] = useState<EvalType>("STT");
  const [vendorId, setVendorId] = useState("");
  const [modelName, setModelName] = useState("");
  const [connectionMode, setConnectionMode] = useState<"simulate" | "api" | "container">("simulate");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [dataset, setDataset] = useState("NICE-CX-Clean-EN");
  const [language, setLanguage] = useState("en");
  const [audioFormat, setAudioFormat] = useState("wav");
  const [samplingRate, setSamplingRate] = useState(16000);
  const [batchSize, setBatchSize] = useState(4);

  useEffect(() => {
    fetch("/api/vendors?detail=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setVendors(data);
        if (data.length > 0) setVendorId(data[0].id);
      })
      .catch(() => null)
      .finally(() => setLoadingVendors(false));
  }, []);

  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const matchingProducts = selectedVendor?.products?.filter(
    (p) => p.category === evaluationType || p.category === "Conversational" || p.category === "Platform"
  ) ?? [];

  const canNext = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return !!vendorId;
      case 2: return connectionMode === "simulate" || (!!endpointUrl && !!apiKey);
      case 3: return !!dataset;
      case 4: return true;
      case 5: return !!evaluationId;
      default: return true;
    }
  };

  async function handleRun() {
    setError(null);
    setRunning(true);
    setProgress("Initializing evaluation...");

    try {
      const res = await fetch("/api/agents/evaluation-runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          evaluationType,
          modelName: modelName || `${selectedVendor?.name ?? "Unknown"} Default`,
          config: {
            endpointUrl: connectionMode === "api" ? endpointUrl : undefined,
            apiKey: connectionMode === "api" ? apiKey : undefined,
            audioFormat,
            samplingRate,
            batchSize,
          },
          dataset,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed (${res.status}): ${await res.text()}`);
      }

      const result = await res.json();
      if (result.evaluationId) {
        setEvaluationId(result.evaluationId);
        setStep(6);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  const currentType = TYPE_CONFIG[evaluationType];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/evaluate" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#00d4e8" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Evaluations
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          New <span className="gradient-text">Evaluation</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Run a standardized AI-powered evaluation against a vendor API or simulation
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => {
              if (i < step || (i === 6 && evaluationId)) setStep(i);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all flex-shrink-0"
            style={
              i === step
                ? { background: "linear-gradient(135deg,rgba(0,212,232,0.2),rgba(124,58,237,0.2))", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
                : i < step
                  ? { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }
                  : { color: "var(--muted-foreground)", background: "transparent", border: "1px solid transparent" }
            }
            title={s.label}
          >
            {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
            {i === step && <span className="whitespace-nowrap">{s.label}</span>}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          <span className="break-all" style={{ color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">

          {/* Step 1: Select Type */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Select Evaluation Type</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Choose the type of speech technology to evaluate.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["STT", "TTS", "V2V"] as const).map((type) => {
                  const cfg = TYPE_CONFIG[type];
                  const active = evaluationType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setEvaluationType(type);
                        setDataset(
                          type === "STT" ? "NICE-CX-Clean-EN" :
                          type === "TTS" ? "NICE-TTS-IVR-EN" :
                          "NICE-V2V-Support-EN"
                        );
                      }}
                      className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: active ? cfg.bg : "var(--secondary)",
                        border: `2px solid ${active ? cfg.border : "var(--border)"}`,
                      }}
                    >
                      <div style={{ color: active ? cfg.color : "var(--muted-foreground)" }}>{cfg.icon}</div>
                      <div className="mt-3 text-lg font-bold" style={{ color: active ? cfg.color : "var(--foreground)" }}>{type}</div>
                      <div className="text-sm font-medium" style={{ color: active ? cfg.color : "var(--foreground)" }}>{cfg.label}</div>
                      <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{cfg.desc}</p>
                      <p className="mt-2 text-xs font-medium" style={{ color: active ? cfg.color : "var(--muted-foreground)", opacity: 0.8 }}>{cfg.samples}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Vendor */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Select Vendor</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Choose from registered vendors or select a model.</p>
              </div>

              {loadingVendors ? (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--muted-foreground)" }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#00d4e8" }} />
                  <span className="text-sm">Loading vendors...</span>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto">
                    {vendors.map((v) => {
                      const hasMatchingProducts = v.products.some(
                        (p) => p.category === evaluationType || p.category === "Conversational" || p.category === "Platform"
                      );
                      const active = vendorId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => { setVendorId(v.id); setModelName(""); }}
                          className="rounded-xl p-3 text-left transition-all"
                          style={{
                            background: active ? "rgba(0,212,232,0.08)" : "var(--secondary)",
                            border: `2px solid ${active ? "rgba(0,212,232,0.4)" : "var(--border)"}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}>
                              {v.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{v.name}</span>
                              {hasMatchingProducts && (
                                <span className="ml-2 text-xs" style={{ color: "#10b981" }}>Has {evaluationType} models</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedVendor && (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>Model Name</label>
                      {matchingProducts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {matchingProducts.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setModelName(p.name)}
                              className="rounded-full px-3 py-1 text-sm transition-all"
                              style={modelName === p.name
                                ? { background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
                                : { background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                              }
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="Or type a custom model name..."
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Configure Connection */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Configure Connection</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>How should we connect to this vendor for evaluation?</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  { key: "simulate", label: "Simulated", desc: "AI-generated realistic metrics", icon: <FlaskConical className="h-5 w-5" />, color: "#00d4e8" },
                  { key: "api", label: "Live API", desc: "Connect to vendor API", icon: <Key className="h-5 w-5" />, color: "#7c3aed" },
                  { key: "container", label: "Container", desc: "Upload model container", icon: <Upload className="h-5 w-5" />, color: "#10b981" },
                ] as const).map((mode) => {
                  const active = connectionMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      onClick={() => setConnectionMode(mode.key)}
                      className="rounded-xl p-4 text-left transition-all"
                      style={{
                        background: active ? `${mode.color}10` : "var(--secondary)",
                        border: `2px solid ${active ? `${mode.color}40` : "var(--border)"}`,
                      }}
                    >
                      <div style={{ color: active ? mode.color : "var(--muted-foreground)" }}>{mode.icon}</div>
                      <div className="mt-2 font-semibold text-sm" style={{ color: active ? mode.color : "var(--foreground)" }}>{mode.label}</div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{mode.desc}</p>
                    </button>
                  );
                })}
              </div>

              {connectionMode === "api" && (
                <div className="space-y-3 rounded-xl p-4" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <div>
                    <label htmlFor="endpoint" className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                      API Endpoint URL
                    </label>
                    <input
                      id="endpoint"
                      type="url"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://api.vendor.com/v1/speech"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="apikey" className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                      API Key
                    </label>
                    <input
                      id="apikey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {connectionMode === "container" && (
                <div className="rounded-xl p-8 text-center" style={{ border: "2px dashed var(--border)", background: "var(--secondary)" }}>
                  <Upload className="mx-auto h-10 w-10 mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Upload Model Container</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Docker image or ONNX model file</p>
                  <p className="text-xs mt-3" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>Container evaluation coming soon. Use simulated or API mode for now.</p>
                </div>
              )}

              {connectionMode === "simulate" && (
                <div className="rounded-xl p-4" style={{ background: "rgba(0,212,232,0.06)", border: "1px solid rgba(0,212,232,0.2)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4" style={{ color: "#00d4e8" }} />
                    <span className="text-sm font-semibold" style={{ color: "#00d4e8" }}>AI Simulation Mode</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Uses AI to generate realistic evaluation metrics based on known vendor performance benchmarks. No API credentials needed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Test Dataset */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Select Test Dataset</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Choose a pre-built dataset or upload custom test data.</p>
              </div>

              <div className="space-y-3">
                {DATASETS[evaluationType].map((ds) => {
                  const active = dataset === ds.id;
                  return (
                    <button
                      key={ds.id}
                      onClick={() => setDataset(ds.id)}
                      className="w-full rounded-xl p-4 text-left transition-all"
                      style={{
                        background: active ? "rgba(0,212,232,0.08)" : "var(--secondary)",
                        border: `2px solid ${active ? "rgba(0,212,232,0.35)" : "var(--border)"}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{ds.name}</span>
                          <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{ds.samples} samples</span>
                        </div>
                        {active && <CheckCircle2 className="h-5 w-5" style={{ color: "#00d4e8" }} />}
                      </div>
                      <p className="mt-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{ds.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl p-6 text-center" style={{ border: "2px dashed var(--border)", background: "var(--secondary)" }}>
                <Upload className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Upload Custom Dataset</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>JSON or CSV file with test samples</p>
                <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>Custom dataset upload coming soon.</p>
              </div>
            </div>
          )}

          {/* Step 5: Configure Parameters */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Configure Parameters</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Fine-tune evaluation settings.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                    <Globe className="mr-1 inline h-4 w-4" />
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {(evaluationType === "STT" || evaluationType === "V2V") && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Audio Format</label>
                    <select value={audioFormat} onChange={(e) => setAudioFormat(e.target.value)} className={inputClass} style={inputStyle}>
                      {AUDIO_FORMATS.map((f) => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(evaluationType === "STT" || evaluationType === "V2V") && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Sampling Rate</label>
                    <select value={samplingRate} onChange={(e) => setSamplingRate(Number(e.target.value))} className={inputClass} style={inputStyle}>
                      {SAMPLING_RATES.map((r) => (
                        <option key={r} value={r}>{(r / 1000).toFixed(1)} kHz</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Batch Size</label>
                  <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className={inputClass} style={inputStyle}>
                    {BATCH_SIZES.map((b) => (
                      <option key={b} value={b}>{b} sample{b > 1 ? "s" : ""} at a time</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Evaluation Summary */}
              <div className="rounded-xl p-4" style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.15)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#00d4e8" }}>Evaluation Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Type", `${evaluationType} — ${TYPE_CONFIG[evaluationType].label}`],
                    ["Vendor", selectedVendor?.name ?? "Unknown"],
                    ["Model", modelName || "Default"],
                    ["Connection", connectionMode.charAt(0).toUpperCase() + connectionMode.slice(1)],
                    ["Dataset", DATASETS[evaluationType].find((d) => d.id === dataset)?.name ?? dataset],
                    ["Language", LANGUAGES.find((l) => l.code === language)?.name ?? language],
                  ].map(([label, value]) => (
                    <Fragment key={label}>
                      <div style={{ color: "var(--muted-foreground)" }}>{label}:</div>
                      <div className="font-medium" style={{ color: "var(--foreground)" }}>{value}</div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Run Evaluation */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Run Evaluation</h2>

              {!running && !evaluationId && (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl mb-4" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.15),rgba(124,58,237,0.15))", border: "1px solid rgba(0,212,232,0.2)" }}>
                    <FlaskConical className="h-8 w-8" style={{ color: "#00d4e8" }} />
                  </div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>Ready to run the evaluation.</p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                    {selectedVendor?.name} / {modelName || "Default"} — {evaluationType} —{" "}
                    {DATASETS[evaluationType].find((d) => d.id === dataset)?.name}
                  </p>
                  <button
                    onClick={handleRun}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}
                  >
                    <Zap className="h-4 w-4" />
                    Start AI Evaluation
                  </button>
                </div>
              )}

              {running && (
                <div className="text-center py-10">
                  <div className="relative mx-auto h-16 w-16 mb-5">
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#00d4e8" }} />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(0,212,232,0.12)", border: "1px solid rgba(0,212,232,0.3)" }}>
                      <Activity className="h-7 w-7 animate-pulse" style={{ color: "#00d4e8" }} />
                    </div>
                  </div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{progress ?? "Running evaluation..."}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Processing samples against {selectedVendor?.name} {modelName}
                  </p>
                  <div className="mt-6 mx-auto max-w-xs">
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                      <div className="h-1.5 rounded-full animate-pulse" style={{ width: "60%", background: "linear-gradient(90deg,#00d4e8,#7c3aed)" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 7: View Results */}
          {step === 6 && evaluationId && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl mb-4" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <CheckCircle2 className="h-8 w-8" style={{ color: "#10b981" }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Evaluation Complete</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                {selectedVendor?.name} / {modelName || "Default"} — {evaluationType}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/evaluate/${evaluationId}`}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Results Dashboard
                </Link>
                <button
                  onClick={() => {
                    setStep(0);
                    setEvaluationId(null);
                    setError(null);
                    setModelName("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  Run Another Evaluation
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {step < 5 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Step {step + 1} of {STEPS.length}
          </div>

          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 5 && !running && !evaluationId && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(4)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Parameters
          </button>
          <div />
        </div>
      )}
    </div>
  );
}
