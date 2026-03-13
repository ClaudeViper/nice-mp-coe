"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Loader2,
  AlertCircle,
} from "lucide-react";

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

export default function NewEvaluationPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // Form state
  const [evaluationType, setEvaluationType] = useState<"STT" | "TTS" | "V2V">("STT");
  const [vendorId, setVendorId] = useState("");
  const [modelName, setModelName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

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

  // Filter products based on evaluation type
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const matchingProducts = selectedVendor?.products?.filter(
    (p) => p.category === evaluationType || p.category === "Conversational" || p.category === "Platform"
  ) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRunning(true);
    setProgress("Starting evaluation...");

    try {
      const res = await fetch("/api/agents/evaluation-runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          evaluationType,
          modelName: modelName || `${selectedVendor?.name ?? "Unknown"} Default`,
          config: {
            endpointUrl: endpointUrl || undefined,
            apiKey: apiKey || undefined,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Evaluation failed (${res.status}): ${text}`);
      }

      const result = await res.json();
      if (result.evaluationId) {
        router.push(`/evaluate/${result.evaluationId}`);
      } else {
        setError("Evaluation completed but no ID returned");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/evaluate"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Evaluations
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Evaluation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a vendor, model, and evaluation type to run a standardized evaluation
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        {/* Step 1: Evaluation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. Evaluation Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["STT", "TTS", "V2V"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEvaluationType(type)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  evaluationType === type
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">{type}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {type === "STT" && "Speech-to-Text"}
                  {type === "TTS" && "Text-to-Speech"}
                  {type === "V2V" && "Voice-to-Voice"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Vendor Selection */}
        <div>
          <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
            2. Select Vendor
          </label>
          {loadingVendors ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors...
            </div>
          ) : (
            <select
              id="vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 3: Model Name */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
            3. Model Name
          </label>
          {matchingProducts.length > 0 ? (
            <select
              id="model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a model or type custom...</option>
              {matchingProducts.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null}
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. whisper-large-v3, nova-2, evi-2"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Step 4: Engine Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            4. Engine Connection (optional for simulation)
          </label>
          <div className="space-y-3">
            <div>
              <label htmlFor="endpoint" className="block text-xs text-gray-500 mb-1">
                API Endpoint URL
              </label>
              <input
                id="endpoint"
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://api.vendor.com/v1/speech"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="apikey" className="block text-xs text-gray-500 mb-1">
                API Key
              </label>
              <input
                id="apikey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              Leave blank to run a simulated evaluation using AI-generated metrics.
              Provide real credentials to evaluate an actual vendor API.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-500">
            {evaluationType === "STT" && "10 audio samples will be evaluated"}
            {evaluationType === "TTS" && "8 text prompts will be synthesized"}
            {evaluationType === "V2V" && "6 conversation scenarios will be tested"}
          </div>
          <button
            type="submit"
            disabled={running || !vendorId}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress ?? "Running..."}
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Run Evaluation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
