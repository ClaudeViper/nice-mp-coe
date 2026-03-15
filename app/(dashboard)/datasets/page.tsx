"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Database, RefreshCw, Plus, Pencil, Trash2, Check, X,
  ChevronDown, ChevronRight, Search, Download, Upload,
  Mic, Volume2, AudioWaveform, FlaskConical, AlertCircle,
  Tag, Clock, Hash, Layers,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type EvalType = "STT" | "TTS" | "V2V";

interface STTSample {
  id: string;
  audioDescription: string;
  groundTruth: string;
  duration: number;
  difficulty: string;
  useCase: string;
}

interface TTSSample {
  id: string;
  text: string;
  expectedDuration: number;
  category: string;
  useCase: string;
}

interface V2VSample {
  id: string;
  scenario: string;
  expectedBehavior: string;
  turns: number;
  category: string;
  useCase: string;
}

type AnySample = STTSample | TTSSample | V2VSample;

interface Dataset {
  id: string;
  name: string;
  slug: string;
  type: EvalType;
  description: string | null;
  sampleCount: number;
  language: string;
  samples: AnySample[];
  createdAt: string;
  updatedAt: string;
  _evalCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<EvalType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  STT: { label: "STT",  color: "#7c3aed", bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.3)",  icon: <Mic className="h-4 w-4" /> },
  TTS: { label: "TTS",  color: "#00d4e8", bg: "rgba(0,212,232,0.12)",   border: "rgba(0,212,232,0.3)",   icon: <Volume2 className="h-4 w-4" /> },
  V2V: { label: "V2V",  color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  icon: <AudioWaveform className="h-4 w-4" /> },
};

const DIFF_COLOR: Record<string, string> = {
  easy: "#10b981", medium: "#f59e0b", hard: "#ef4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blankSample(type: EvalType): Record<string, unknown> {
  if (type === "STT") return { audioDescription: "", groundTruth: "", duration: 3.5, difficulty: "medium", useCase: "agent_assist" };
  if (type === "TTS") return { text: "", expectedDuration: 4.0, category: "general", useCase: "ivr" };
  return { scenario: "", expectedBehavior: "", turns: 5, category: "general", useCase: "customer_support" };
}

// ─── Sample Field Editors ─────────────────────────────────────────────────────

function SampleForm({
  type, initial, onSave, onCancel, saving,
}: {
  type: EvalType;
  initial: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors";
  const inputStyle = { background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" };
  const labelCls = "block text-xs font-medium mb-1";
  const labelStyle = { color: "var(--muted-foreground)" };

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(0,212,232,0.04)", border: "1px solid rgba(0,212,232,0.15)" }}>
      {type === "STT" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} style={labelStyle}>Audio Description</label>
              <input className={inputCls} style={inputStyle} value={String(form.audioDescription ?? "")} onChange={(e) => set("audioDescription", e.target.value)} placeholder="e.g. Clear male voice, office environment" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Ground Truth (transcript)</label>
              <input className={inputCls} style={inputStyle} value={String(form.groundTruth ?? "")} onChange={(e) => set("groundTruth", e.target.value)} placeholder="Exact transcript text" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} style={labelStyle}>Duration (s)</label>
              <input type="number" step="0.1" className={inputCls} style={inputStyle} value={String(form.duration ?? 3.5)} onChange={(e) => set("duration", parseFloat(e.target.value))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Difficulty</label>
              <select className={inputCls} style={inputStyle} value={String(form.difficulty ?? "medium")} onChange={(e) => set("difficulty", e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Use Case</label>
              <input className={inputCls} style={inputStyle} value={String(form.useCase ?? "")} onChange={(e) => set("useCase", e.target.value)} placeholder="agent_assist / ivr" />
            </div>
          </div>
        </>
      )}

      {type === "TTS" && (
        <>
          <div>
            <label className={labelCls} style={labelStyle}>Text to Synthesize</label>
            <textarea rows={3} className={`${inputCls} resize-none`} style={inputStyle} value={String(form.text ?? "")} onChange={(e) => set("text", e.target.value)} placeholder="The text that the TTS system should speak..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} style={labelStyle}>Expected Duration (s)</label>
              <input type="number" step="0.1" className={inputCls} style={inputStyle} value={String(form.expectedDuration ?? 4.0)} onChange={(e) => set("expectedDuration", parseFloat(e.target.value))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Category</label>
              <input className={inputCls} style={inputStyle} value={String(form.category ?? "")} onChange={(e) => set("category", e.target.value)} placeholder="e.g. main_menu, greeting" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Use Case</label>
              <input className={inputCls} style={inputStyle} value={String(form.useCase ?? "")} onChange={(e) => set("useCase", e.target.value)} placeholder="ivr / agent_response" />
            </div>
          </div>
        </>
      )}

      {type === "V2V" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} style={labelStyle}>Scenario</label>
              <textarea rows={3} className={`${inputCls} resize-none`} style={inputStyle} value={String(form.scenario ?? "")} onChange={(e) => set("scenario", e.target.value)} placeholder="Describe the conversation scenario..." />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Expected Behavior</label>
              <textarea rows={3} className={`${inputCls} resize-none`} style={inputStyle} value={String(form.expectedBehavior ?? "")} onChange={(e) => set("expectedBehavior", e.target.value)} placeholder="What the AI should do in this scenario..." />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} style={labelStyle}>Turns</label>
              <input type="number" min="1" className={inputCls} style={inputStyle} value={String(form.turns ?? 5)} onChange={(e) => set("turns", parseInt(e.target.value))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Category</label>
              <input className={inputCls} style={inputStyle} value={String(form.category ?? "")} onChange={(e) => set("category", e.target.value)} placeholder="e.g. billing_dispute" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Use Case</label>
              <input className={inputCls} style={inputStyle} value={String(form.useCase ?? "")} onChange={(e) => set("useCase", e.target.value)} placeholder="customer_support / conversational_ivr" />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onSave(form)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.2),rgba(124,58,237,0.2))", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}>
          {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {saving ? "Saving…" : "Save Sample"}
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Sample Row ───────────────────────────────────────────────────────────────

function SampleRow({
  sample, type, idx, onEdit, onDelete, deleting,
}: {
  sample: AnySample;
  type: EvalType;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const s = sample as Record<string, unknown>;
  const rowStyle = idx % 2 === 0
    ? { background: "rgba(255,255,255,0.45)" }
    : { background: "rgba(255,255,255,0.25)" };

  return (
    <tr style={rowStyle}>
      <td className="px-3 py-2 text-xs font-mono" style={{ color: "#00d4e8", whiteSpace: "nowrap" }}>{s.id as string}</td>

      {type === "STT" && (
        <>
          <td className="px-3 py-2 text-xs max-w-xs" style={{ color: "var(--muted-foreground)" }}>
            <div className="truncate" title={s.audioDescription as string}>{s.audioDescription as string}</div>
          </td>
          <td className="px-3 py-2 text-xs max-w-sm" style={{ color: "var(--foreground)" }}>
            <div className="line-clamp-2" title={s.groundTruth as string}>{s.groundTruth as string}</div>
          </td>
          <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{(s.duration as number).toFixed(1)}s</td>
          <td className="px-3 py-2">
            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${DIFF_COLOR[s.difficulty as string] ?? "#94a3b8"}18`, color: DIFF_COLOR[s.difficulty as string] ?? "#94a3b8", border: `1px solid ${DIFF_COLOR[s.difficulty as string] ?? "#94a3b8"}30` }}>
              {s.difficulty as string}
            </span>
          </td>
          <td className="px-3 py-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{s.useCase as string}</td>
        </>
      )}

      {type === "TTS" && (
        <>
          <td className="px-3 py-2 text-xs max-w-md" style={{ color: "var(--foreground)" }}>
            <div className="line-clamp-2" title={s.text as string}>{s.text as string}</div>
          </td>
          <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{s.expectedDuration != null ? `${(s.expectedDuration as number).toFixed(1)}s` : "—"}</td>
          <td className="px-3 py-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span className="rounded-full px-2 py-0.5" style={{ background: "rgba(0,212,232,0.08)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.2)" }}>{s.category as string}</span>
          </td>
          <td className="px-3 py-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{s.useCase as string}</td>
        </>
      )}

      {type === "V2V" && (
        <>
          <td className="px-3 py-2 text-xs max-w-xs" style={{ color: "var(--foreground)" }}>
            <div className="line-clamp-2" title={s.scenario as string}>{s.scenario as string}</div>
          </td>
          <td className="px-3 py-2 text-xs max-w-xs" style={{ color: "var(--muted-foreground)" }}>
            <div className="line-clamp-2" title={s.expectedBehavior as string}>{s.expectedBehavior as string}</div>
          </td>
          <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{s.turns as number} turns</td>
          <td className="px-3 py-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span className="rounded-full px-2 py-0.5" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>{s.category as string}</span>
          </td>
          <td className="px-3 py-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{s.useCase as string}</td>
        </>
      )}

      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="rounded-lg p-1.5 transition-colors hover:bg-black/5" title="Edit sample" style={{ color: "var(--muted-foreground)" }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} disabled={deleting} className="rounded-lg p-1.5 transition-colors hover:bg-red-50 disabled:opacity-40" title="Delete sample" style={{ color: "#ef4444" }}>
            {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Samples Panel ────────────────────────────────────────────────────────────

function SamplesPanel({ dataset, onUpdated }: { dataset: Dataset; onUpdated: (d: Dataset) => void }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const base = `/api/datasets/${dataset.id}`;
  const samples = dataset.samples ?? [];

  const filtered = search
    ? samples.filter((s) => JSON.stringify(s).toLowerCase().includes(search.toLowerCase()))
    : samples;

  async function handleUpdate(sampleId: string, data: Record<string, unknown>) {
    setSavingId(sampleId);
    const res = await fetch(`${base}/samples/${sampleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { onUpdated(await res.json()); setEditingId(null); }
    setSavingId(null);
  }

  async function handleAdd(data: Record<string, unknown>) {
    setSavingId("new");
    const res = await fetch(`${base}/samples`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { onUpdated(await res.json()); setAddingNew(false); }
    setSavingId(null);
  }

  async function handleDelete(sampleId: string) {
    setDeletingId(sampleId);
    const res = await fetch(`${base}/samples/${sampleId}`, { method: "DELETE" });
    if (res.ok) { onUpdated(await res.json()); }
    setDeletingId(null);
  }

  const thStyle = { color: "var(--muted-foreground)", background: "rgba(0,212,232,0.06)", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "8px 12px", whiteSpace: "nowrap" as const };

  const headers = {
    STT: ["ID", "Audio Description", "Ground Truth", "Duration", "Difficulty", "Use Case", ""],
    TTS: ["ID", "Text", "Duration", "Category", "Use Case", ""],
    V2V: ["ID", "Scenario", "Expected Behavior", "Turns", "Category", "Use Case", ""],
  };

  return (
    <div className="border-t" style={{ borderColor: "var(--border)" }}>
      {/* Panel toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap" style={{ background: "rgba(0,212,232,0.03)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
            {filtered.length} of {samples.length} samples
          </span>
          {dataset._evalCount > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
              Used in {dataset._evalCount} evaluation{dataset._evalCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search samples…" className="rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none" style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", width: "180px" }} />
          </div>
          <button onClick={() => { setAddingNew(true); setEditingId(null); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.15),rgba(124,58,237,0.15))", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}>
            <Plus className="h-3.5 w-3.5" /> Add Sample
          </button>
        </div>
      </div>

      {/* Add new sample form */}
      {addingNew && (
        <div className="px-4 py-3">
          <SampleForm type={dataset.type} initial={blankSample(dataset.type)} onSave={handleAdd} onCancel={() => setAddingNew(false)} saving={savingId === "new"} />
        </div>
      )}

      {/* Samples table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers[dataset.type].map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={headers[dataset.type].length} className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {search ? "No samples match your search." : "No samples yet. Click Add Sample to begin."}
                </td>
              </tr>
            ) : (
              filtered.map((sample, idx) => (
                <Fragment key={(sample as Record<string, unknown>).id as string}>
                  {editingId === (sample as Record<string, unknown>).id as string ? (
                    <tr>
                      <td colSpan={headers[dataset.type].length} className="px-4 py-3">
                        <SampleForm
                          type={dataset.type}
                          initial={sample as Record<string, unknown>}
                          onSave={(data) => handleUpdate((sample as Record<string, unknown>).id as string, data)}
                          onCancel={() => setEditingId(null)}
                          saving={savingId === (sample as Record<string, unknown>).id as string}
                        />
                      </td>
                    </tr>
                  ) : (
                    <SampleRow
                      sample={sample}
                      type={dataset.type}
                      idx={idx}
                      onEdit={() => { setEditingId((sample as Record<string, unknown>).id as string); setAddingNew(false); }}
                      onDelete={() => handleDelete((sample as Record<string, unknown>).id as string)}
                      deleting={deletingId === (sample as Record<string, unknown>).id as string}
                    />
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Dataset Card ─────────────────────────────────────────────────────────────

function DatasetCard({
  dataset,
  expanded,
  onToggle,
  onUpdated,
  onDeleted,
}: {
  dataset: Dataset;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (d: Dataset) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(dataset.name);
  const [editDesc, setEditDesc] = useState(dataset.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = TYPE_META[dataset.type];

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/datasets/${dataset.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc }),
    });
    if (res.ok) { onUpdated(await res.json()); setEditing(false); }
    setSaving(false);
  }

  async function deleteDataset() {
    if (!confirm(`Delete dataset "${dataset.name}" and all its samples?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/datasets/${dataset.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(dataset.id);
    setDeleting(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Type icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
              {meta.icon}
            </div>

            {/* Name + description */}
            {editing ? (
              <div className="flex-1 space-y-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-xs" style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }} placeholder="Description…" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                    {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                  </button>
                  <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{dataset.name}</h3>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                    {dataset.type}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                    {dataset.language.toUpperCase()}
                  </span>
                </div>
                {dataset.description && (
                  <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{dataset.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Stats + actions */}
          {!editing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 justify-end" style={{ color: meta.color }}>
                  <Layers className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold">{dataset.sampleCount}</span>
                </div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>samples</div>
              </div>
              {dataset._evalCount > 0 && (
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 justify-end" style={{ color: "#f59e0b" }}>
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">{dataset._evalCount}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>eval runs</div>
                </div>
              )}
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 transition-colors hover:bg-black/5" style={{ color: "var(--muted-foreground)" }} title="Edit metadata">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={deleteDataset} disabled={deleting} className="rounded-lg p-1.5 transition-colors hover:bg-red-50 disabled:opacity-40" style={{ color: "#ef4444" }} title="Delete dataset">
                  {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
                <button onClick={onToggle} className="ml-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style={{ background: expanded ? meta.bg : "var(--secondary)", color: expanded ? meta.color : "var(--muted-foreground)", border: `1px solid ${expanded ? meta.border : "var(--border)"}` }}>
                  {expanded ? (
                    <span className="flex items-center gap-1"><ChevronDown className="h-3.5 w-3.5" /> Collapse</span>
                  ) : (
                    <span className="flex items-center gap-1"><ChevronRight className="h-3.5 w-3.5" /> View Samples</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile stats */}
        <div className="flex items-center gap-3 mt-3 sm:hidden">
          <span className="flex items-center gap-1 text-xs" style={{ color: meta.color }}><Layers className="h-3.5 w-3.5" /> {dataset.sampleCount} samples</span>
          {dataset._evalCount > 0 && <span className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}><FlaskConical className="h-3.5 w-3.5" /> {dataset._evalCount} eval runs</span>}
        </div>
      </div>

      {/* Samples panel (expanded) */}
      {expanded && (
        <SamplesPanel dataset={dataset} onUpdated={onUpdated} />
      )}
    </div>
  );
}

// ─── New Dataset Modal ────────────────────────────────────────────────────────

function NewDatasetModal({ onCreated, onClose }: { onCreated: (d: Dataset) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<EvalType>("STT");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return setError("Name is required");
    setSaving(true); setError(null);
    const res = await fetch("/api/datasets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type, description, language }),
    });
    if (res.ok) { onCreated(await res.json()); }
    else { const d = await res.json(); setError(d.error ?? "Failed to create"); }
    setSaving(false);
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";
  const inputStyle = { background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>New Dataset</h2>
          <button onClick={onClose} className="rounded-lg p-1.5" style={{ color: "var(--muted-foreground)" }}><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Name *</label>
            <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NICE-CX-Custom-EN" />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Type *</label>
              <select className={inputCls} style={inputStyle} value={type} onChange={(e) => setType(e.target.value as EvalType)}>
                <option value="STT">STT – Speech to Text</option>
                <option value="TTS">TTS – Text to Speech</option>
                <option value="V2V">V2V – Voice to Voice</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Language</label>
              <input className={inputCls} style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Description</label>
            <textarea rows={2} className={`${inputCls} resize-none`} style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the dataset…" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg p-3 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={create} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.2),rgba(124,58,237,0.2))", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Creating…" : "Create Dataset"}
          </button>
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"All" | EvalType>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/datasets");
      if (res.ok) setDatasets(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDatasets(); }, [loadDatasets]);

  async function syncBuiltIn() {
    setSyncing(true); setSyncMsg(null);
    const res = await fetch("/api/datasets/sync", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSyncMsg(`Synced ${(data.synced as string[]).length} datasets`);
      await loadDatasets();
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 4000);
  }

  function handleUpdated(updated: Dataset) {
    setDatasets((prev) => prev.map((d) => d.id === updated.id ? { ...updated, _evalCount: d._evalCount } : d));
  }

  function handleDeleted(id: string) {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function handleCreated(d: Dataset) {
    setDatasets((prev) => [...prev, { ...d, _evalCount: 0 }]);
    setExpandedId(d.id);
    setShowNewModal(false);
  }

  const filtered = typeFilter === "All" ? datasets : datasets.filter((d) => d.type === typeFilter);
  const totalSamples = datasets.reduce((s, d) => s + d.sampleCount, 0);
  const typeCounts = { STT: 0, TTS: 0, V2V: 0 } as Record<EvalType, number>;
  datasets.forEach((d) => { typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1; });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#060f2e 0%,#0c1e4a 50%,#102356 100%)", border: "1px solid rgba(0,212,232,0.2)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,rgba(0,212,232,0.07) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-5 w-5" style={{ color: "#00d4e8" }} />
              <h1 className="text-xl font-bold text-white">Evaluation Datasets</h1>
            </div>
            <p className="text-sm" style={{ color: "rgba(148,163,184,0.8)" }}>
              Manage synthetic samples used across evaluation runs.&nbsp;
              <span style={{ color: "#00d4e8" }}>{datasets.length} datasets</span>
              &nbsp;·&nbsp;
              <span style={{ color: "#00d4e8" }}>{totalSamples} samples</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {syncMsg && (
              <span className="text-xs rounded-full px-3 py-1.5" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                <Check className="h-3 w-3 inline mr-1" />{syncMsg}
              </span>
            )}
            <button onClick={syncBuiltIn} disabled={syncing} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60" style={{ background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }}>
              {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {syncing ? "Syncing…" : "Sync Built-in"}
            </button>
            <button onClick={() => setShowNewModal(true)} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.2),rgba(124,58,237,0.2))", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.35)" }}>
              <Plus className="h-4 w-4" /> New Dataset
            </button>
          </div>
        </div>
      </div>

      {/* ── Type filter tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {(["All", "STT", "TTS", "V2V"] as const).map((t) => {
          const active = typeFilter === t;
          const meta = t !== "All" ? TYPE_META[t] : null;
          const count = t === "All" ? datasets.length : typeCounts[t];
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all" style={active ? { background: meta?.bg ?? "rgba(0,212,232,0.12)", color: meta?.color ?? "#00d4e8", border: `1px solid ${meta?.border ?? "rgba(0,212,232,0.3)"}` } : { color: "var(--muted-foreground)", background: "transparent", border: "1px solid transparent" }}>
              {meta && <span>{meta.icon}</span>}
              {t}
              <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: active ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Dataset list ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: "#00d4e8" }} />
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading datasets…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Database className="h-12 w-12" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No datasets yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Click <strong>Sync Built-in</strong> to import the 6 standard datasets, or create your own.
            </p>
          </div>
          <button onClick={syncBuiltIn} disabled={syncing} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium" style={{ background: "linear-gradient(135deg,rgba(0,212,232,0.15),rgba(124,58,237,0.15))", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }}>
            <Download className="h-4 w-4" /> Sync Built-in Datasets
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              expanded={expandedId === dataset.id}
              onToggle={() => setExpandedId(expandedId === dataset.id ? null : dataset.id)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* ── Connection note ─────────────────────────────────────────── */}
      {datasets.length > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <FlaskConical className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            <strong style={{ color: "#f59e0b" }}>Connected to evaluations:</strong> When you run an evaluation, the runner checks this dataset library first. Any edits you make here take effect on the next evaluation run. Use{" "}
            <Link href="/evaluate/new" style={{ color: "#00d4e8" }}>New Evaluation</Link> to run against your updated samples.
          </p>
        </div>
      )}

      {showNewModal && <NewDatasetModal onCreated={handleCreated} onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
