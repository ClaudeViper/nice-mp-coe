"use client";

import { useState } from "react";
import { Ruler, Mic, Volume2, MessageSquare, CheckCircle2, ArrowDown, ArrowUp } from "lucide-react";
import { STT_METRICS, TTS_METRICS, V2V_METRICS, type MetricDefinition } from "@/lib/metrics";

type TabType = "STT" | "TTS" | "V2V";

const TABS: { key: TabType; label: string; icon: React.ReactNode; metrics: MetricDefinition[] }[] = [
  { key: "STT", label: "Speech-to-Text", icon: <Mic className="h-4 w-4" />, metrics: STT_METRICS },
  { key: "TTS", label: "Text-to-Speech", icon: <Volume2 className="h-4 w-4" />, metrics: TTS_METRICS },
  { key: "V2V", label: "Voice-to-Voice", icon: <MessageSquare className="h-4 w-4" />, metrics: V2V_METRICS },
];

export default function StandardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("STT");

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Ruler className="h-6 w-6 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">Industry-Standard Metrics</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Comprehensive reference of speech technology metrics used for benchmarking and evaluation across STT, TTS, and V2V.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700">
              {tab.metrics.length}
            </span>
          </button>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentTab.metrics.map((m) => (
          <div key={m.name} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{m.label}</h3>
                <span className="text-xs font-mono text-gray-400">{m.name}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                {m.lowerIsBetter ? (
                  <>
                    <ArrowDown className="h-3 w-3 text-green-500" />
                    Lower is better
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    Higher is better
                  </>
                )}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">{m.description}</p>

            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              <div>
                <p className="text-xs font-medium text-gray-500">How Measured</p>
                <p className="mt-0.5 text-xs text-gray-700">{m.howMeasured}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Unit</p>
                <p className="mt-0.5 text-xs text-gray-700">{m.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-700">Good: {m.goodThreshold}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Reference Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">{activeTab} Metrics Reference Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">How Measured</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Good Threshold</th>
              </tr>
            </thead>
            <tbody>
              {currentTab.metrics.map((m) => (
                <tr key={m.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{m.description}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m.howMeasured}</td>
                  <td className="px-4 py-3 text-gray-700">{m.unit}</td>
                  <td className="px-4 py-3">
                    {m.lowerIsBetter ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <ArrowDown className="h-3 w-3" /> Lower
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <ArrowUp className="h-3 w-3" /> Higher
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      {m.goodThreshold}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
