"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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

const TYPE_CONFIG: Record<EvalType, { label: string; desc: string; icon: React.ReactNode; samples: string; color: string }> = {
  STT: {
    label: "Speech-to-Text",
    desc: "Evaluate transcription accuracy, latency, and robustness across audio samples.",
    icon: <Mic className="h-8 w-8" />,
    samples: "50 audio samples",
    color: "border-purple-500 bg-purple-50 text-purple-700",
  },
  TTS: {
    label: "Text-to-Speech",
    desc: "Evaluate voice quality, naturalness, latency, and intelligibility.",
    icon: <Volume2 className="h-8 w-8" />,
    samples: "30 text prompts",
    color: "border-teal-500 bg-teal-50 text-teal-700",
  },
  V2V: {
    label: "Voice-to-Voice",
    desc: "Evaluate conversational AI with task completion, latency, and naturalness.",
    icon: <MessageSquare className="h-8 w-8" />,
    samples: "10 conversation scripts",
    color: "border-orange-500 bg-orange-50 text-orange-700",
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/evaluate" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Evaluations
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Evaluation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Run a standardized evaluation against a vendor API or simulation
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => {
              if (i < step || (i === 6 && evaluationId)) setStep(i);
            }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === step
                ? "bg-blue-600 text-white"
                : i < step
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {/* Step 1: Select Type */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Evaluation Type</h2>
            <p className="text-sm text-gray-500">Choose the type of speech technology to evaluate.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["STT", "TTS", "V2V"] as const).map((type) => {
                const cfg = TYPE_CONFIG[type];
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
                    className={`rounded-lg border-2 p-5 text-left transition-all ${
                      evaluationType === type
                        ? cfg.color
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className={evaluationType === type ? "" : "text-gray-400"}>{cfg.icon}</div>
                    <div className="mt-3 text-lg font-bold">{type}</div>
                    <div className="text-sm font-medium">{cfg.label}</div>
                    <p className="mt-2 text-xs opacity-75">{cfg.desc}</p>
                    <p className="mt-2 text-xs font-medium opacity-60">{cfg.samples}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Vendor */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Vendor</h2>
            <p className="text-sm text-gray-500">Choose from registered vendors or select a model.</p>

            {loadingVendors ? (
              <div className="flex items-center gap-2 py-8 text-sm text-gray-500 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors...
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto">
                  {vendors.map((v) => {
                    const hasMatchingProducts = v.products.some(
                      (p) => p.category === evaluationType || p.category === "Conversational" || p.category === "Platform"
                    );
                    return (
                      <button
                        key={v.id}
                        onClick={() => { setVendorId(v.id); setModelName(""); }}
                        className={`rounded-lg border-2 p-3 text-left transition-all ${
                          vendorId === v.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-600">
                            {v.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{v.name}</span>
                            {hasMatchingProducts && (
                              <span className="ml-2 text-xs text-green-600">
                                Has {evaluationType} models
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedVendor && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Model Name</label>
                    {matchingProducts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {matchingProducts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setModelName(p.name)}
                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                              modelName === p.name
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Configure Connection */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Configure Connection</h2>
            <p className="text-sm text-gray-500">How should we connect to this vendor for evaluation?</p>

            <div className="grid gap-3 sm:grid-cols-3">
              {([
                { key: "simulate", label: "Simulated", desc: "AI-generated realistic metrics", icon: <FlaskConical className="h-5 w-5" /> },
                { key: "api", label: "Live API", desc: "Connect to vendor API", icon: <Key className="h-5 w-5" /> },
                { key: "container", label: "Container", desc: "Upload model container", icon: <Upload className="h-5 w-5" /> },
              ] as const).map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setConnectionMode(mode.key)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    connectionMode === mode.key
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={connectionMode === mode.key ? "text-blue-600" : "text-gray-400"}>
                    {mode.icon}
                  </div>
                  <div className="mt-2 font-medium text-gray-900">{mode.label}</div>
                  <p className="text-xs text-gray-500">{mode.desc}</p>
                </button>
              ))}
            </div>

            {connectionMode === "api" && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                    API Endpoint URL
                  </label>
                  <input
                    id="endpoint"
                    type="url"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="https://api.vendor.com/v1/speech"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="apikey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    id="apikey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {connectionMode === "container" && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-600">Upload Model Container</p>
                <p className="text-xs text-gray-400 mt-1">Docker image or ONNX model file</p>
                <p className="text-xs text-gray-400 mt-3">Container evaluation coming soon. Use simulated or API mode for now.</p>
              </div>
            )}

            {connectionMode === "simulate" && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  Simulated mode uses AI to generate realistic evaluation metrics based on known vendor performance benchmarks.
                  No API credentials needed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Select Test Dataset */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Test Dataset</h2>
            <p className="text-sm text-gray-500">
              Choose a pre-built dataset or upload custom test data.
            </p>

            <div className="space-y-3">
              {DATASETS[evaluationType].map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setDataset(ds.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    dataset === ds.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{ds.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{ds.samples} samples</span>
                    </div>
                    {dataset === ds.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{ds.desc}</p>
                </button>
              ))}
            </div>

            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-600">Upload Custom Dataset</p>
              <p className="text-xs text-gray-400 mt-1">JSON or CSV file with test samples</p>
              <p className="text-xs text-gray-400 mt-2">Custom dataset upload coming soon.</p>
            </div>
          </div>
        )}

        {/* Step 5: Configure Parameters */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Configure Parameters</h2>
            <p className="text-sm text-gray-500">Fine-tune evaluation settings.</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="mr-1 inline h-4 w-4" />
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>

              {(evaluationType === "STT" || evaluationType === "V2V") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audio Format</label>
                  <select
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {AUDIO_FORMATS.map((f) => (
                      <option key={f} value={f}>{f.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              {(evaluationType === "STT" || evaluationType === "V2V") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Rate</label>
                  <select
                    value={samplingRate}
                    onChange={(e) => setSamplingRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {SAMPLING_RATES.map((r) => (
                      <option key={r} value={r}>{(r / 1000).toFixed(1)} kHz</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {BATCH_SIZES.map((b) => (
                    <option key={b} value={b}>{b} sample{b > 1 ? "s" : ""} at a time</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Evaluation Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Type:</div>
                <div className="font-medium text-gray-900">{evaluationType} — {TYPE_CONFIG[evaluationType].label}</div>
                <div className="text-gray-500">Vendor:</div>
                <div className="font-medium text-gray-900">{selectedVendor?.name ?? "Unknown"}</div>
                <div className="text-gray-500">Model:</div>
                <div className="font-medium text-gray-900">{modelName || "Default"}</div>
                <div className="text-gray-500">Connection:</div>
                <div className="font-medium text-gray-900 capitalize">{connectionMode}</div>
                <div className="text-gray-500">Dataset:</div>
                <div className="font-medium text-gray-900">
                  {DATASETS[evaluationType].find((d) => d.id === dataset)?.name ?? dataset}
                </div>
                <div className="text-gray-500">Language:</div>
                <div className="font-medium text-gray-900">
                  {LANGUAGES.find((l) => l.code === language)?.name ?? language}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Run Evaluation */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Run Evaluation</h2>

            {!running && !evaluationId && (
              <div className="text-center py-8">
                <FlaskConical className="mx-auto h-12 w-12 text-blue-500" />
                <p className="mt-3 text-gray-600">Ready to run the evaluation.</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedVendor?.name} / {modelName || "Default"} — {evaluationType} —{" "}
                  {DATASETS[evaluationType].find((d) => d.id === dataset)?.name}
                </p>
                <button
                  onClick={handleRun}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Play className="h-4 w-4" />
                  Start Evaluation
                </button>
              </div>
            )}

            {running && (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
                <p className="mt-4 font-medium text-gray-900">{progress ?? "Running evaluation..."}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Processing samples against {selectedVendor?.name} {modelName}
                </p>
                <div className="mt-6 mx-auto max-w-xs">
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-blue-600 animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 7: View Results */}
        {step === 6 && evaluationId && (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Evaluation Complete</h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedVendor?.name} / {modelName || "Default"} — {evaluationType}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href={`/evaluate/${evaluationId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
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
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Run Another Evaluation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 5 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          <div className="text-sm text-gray-400">
            Step {step + 1} of {STEPS.length}
          </div>

          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 5 && !running && !evaluationId && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(4)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Parameters
          </button>
          <div />
        </div>
      )}
    </div>
  );
}
