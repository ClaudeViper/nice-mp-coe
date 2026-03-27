"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Save,
  X,
  Settings2,
  ExternalLink,
  Tag,
  Clock,
  Rss,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsSource {
  id: string;
  name: string;
  method: string;
  url: string;
  frequency: string;
  keywords: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

type FormData = {
  name: string;
  method: string;
  url: string;
  frequency: string;
  keywords: string;
  enabled: boolean;
};

const METHODS = [
  { value: "web_scrape", label: "Web Scrape" },
  { value: "rss_feed", label: "RSS Feed" },
  { value: "arxiv_api", label: "ArXiv API" },
  { value: "reddit_api", label: "Reddit API" },
  { value: "api", label: "Generic API" },
];

const FREQUENCIES = [
  { value: "six_hours", label: "Every 6 hours" },
  { value: "daily", label: "Daily" },
];

const inputStyle = {
  background: "var(--secondary)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewsSourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    method: "web_scrape",
    url: "",
    frequency: "six_hours",
    keywords: "",
    enabled: true,
  });

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/news/sources");
      if (res.ok) setSources(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  async function seedDefaults() {
    setSeeding(true);
    try {
      await fetch("/api/news/sources/seed", { method: "POST" });
      await fetchSources();
    } catch { /* ignore */ }
    setSeeding(false);
  }

  function resetForm() {
    setForm({ name: "", method: "web_scrape", url: "", frequency: "six_hours", keywords: "", enabled: true });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(source: NewsSource) {
    setForm({
      name: source.name,
      method: source.method,
      url: source.url,
      frequency: source.frequency,
      keywords: source.keywords.join(", "),
      enabled: source.enabled,
    });
    setEditingId(source.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const keywords = form.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = { ...form, keywords };

    try {
      if (editingId) {
        const res = await fetch("/api/news/sources", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (res.ok) {
          resetForm();
          fetchSources();
        }
      } else {
        const res = await fetch("/api/news/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          resetForm();
          fetchSources();
        }
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/news/sources?id=${id}`, { method: "DELETE" });
      fetchSources();
    } catch { /* ignore */ }
    setDeletingId(null);
  }

  async function handleToggle(source: NewsSource) {
    setTogglingId(source.id);
    try {
      await fetch("/api/news/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, enabled: !source.enabled }),
      });
      fetchSources();
    } catch { /* ignore */ }
    setTogglingId(null);
  }

  const enabledCount = sources.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: "var(--foreground)" }}>
            <Settings2 className="h-7 w-7" style={{ color: "#00d4e8" }} />
            News Sources
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Configure which sources the News Scout agent monitors. Changes take effect on the next agent run.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={inputStyle}
          >
            <Rss className="h-4 w-4" />
            {seeding ? "Loading..." : "Load Defaults"}
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00d4e8, #7c3aed)" }}
          >
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 rounded-xl px-4 py-2.5" style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.15)" }}>
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          <span className="font-semibold" style={{ color: "#00d4e8" }}>{sources.length}</span> sources
        </span>
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          <span className="font-semibold" style={{ color: "#10b981" }}>{enabledCount}</span> active
        </span>
        {sources.length - enabledCount > 0 && (
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="font-semibold" style={{ color: "var(--muted-foreground)" }}>{sources.length - enabledCount}</span> disabled
          </span>
        )}
      </div>

      {/* ── Add / Edit Form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="glass-card rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              {editingId ? "Edit Source" : "Add New Source"}
            </h2>
            <button onClick={resetForm} className="hover:opacity-80" style={{ color: "var(--muted-foreground)" }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>Source Name</label>
              <input
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                placeholder="e.g. OpenAI Blog"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>URL</label>
              <input
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                placeholder="https://example.com/blog"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>Method</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>Frequency</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>
                Keywords <span style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>(comma-separated, leave empty for &quot;all&quot;)</span>
              </label>
              <input
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                placeholder="speech, voice AI, transcription"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={resetForm}
              className="rounded-xl px-4 py-2 text-sm font-medium hover:opacity-80 transition-colors"
              style={inputStyle}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.url.trim()}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00d4e8, #7c3aed)" }}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Update" : "Add Source"}
            </button>
          </div>
        </div>
      )}

      {/* ── Sources List ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>Loading sources...</div>
      ) : sources.length === 0 ? (
        <div className="glass-card rounded-xl py-16 text-center">
          <Rss className="mx-auto h-12 w-12 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No sources configured</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Add your first news source or load the built-in defaults.
          </p>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #00d4e8, #7c3aed)" }}
          >
            <Rss className="h-4 w-4" />
            {seeding ? "Loading defaults..." : "Load Default Sources (16)"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="glass-card rounded-xl px-5 py-4 flex items-center gap-4 group transition-all"
              style={{
                border: `1px solid ${source.enabled ? "var(--border)" : "rgba(239,68,68,0.15)"}`,
                opacity: source.enabled ? 1 : 0.6,
              }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: source.enabled ? "rgba(0,212,232,0.08)" : "var(--secondary)" }}
              >
                <Globe className="h-5 w-5" style={{ color: source.enabled ? "#00d4e8" : "var(--muted-foreground)" }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{source.name}</span>
                  {!source.enabled && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      Disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span className="flex items-center gap-1 truncate max-w-[300px]">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    {source.url}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {source.frequency === "six_hours" ? "6h" : "Daily"}
                  </span>
                  <span className="capitalize">{source.method.replace("_", " ")}</span>
                </div>
                {source.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {source.keywords.slice(0, 6).map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {kw}
                      </span>
                    ))}
                    {source.keywords.length > 6 && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>+{source.keywords.length - 6} more</span>
                    )}
                  </div>
                )}
                {source.keywords.length === 0 && (
                  <span className="text-xs mt-1 inline-block" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                    All keywords (broad scan)
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggle(source)}
                  disabled={togglingId === source.id}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title={source.enabled ? "Disable" : "Enable"}
                >
                  {source.enabled
                    ? <PowerOff className="h-4 w-4" style={{ color: "#f59e0b" }} />
                    : <Power className="h-4 w-4" style={{ color: "#10b981" }} />
                  }
                </button>
                <button
                  onClick={() => startEdit(source)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Edit"
                >
                  <Settings2 className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                </button>
                <button
                  onClick={() => handleDelete(source.id)}
                  disabled={deletingId === source.id}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" style={{ color: "#ef4444" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
