"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Newspaper,
  ExternalLink,
  Search,
  X,
  ArrowUpDown,
  Calendar,
  Bookmark,
  Share2,
  Zap,
  Mic,
  Volume2,
  MessageSquare,
  FlaskConical,
  Globe,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

type NewsCategory = "STT" | "TTS" | "V2V" | "General" | "Research";
type SortKey = "relevance" | "date" | "category";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  source: string;
  url: string;
  summary: string;
  category: NewsCategory;
  relevanceScore: number;
  tags: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NewsCategory, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  STT: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.25)", icon: <Mic className="h-3 w-3" /> },
  TTS: { color: "#00d4e8", bg: "rgba(0,212,232,0.1)", border: "rgba(0,212,232,0.25)", icon: <Volume2 className="h-3 w-3" /> },
  V2V: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", icon: <MessageSquare className="h-3 w-3" /> },
  General: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", icon: <Globe className="h-3 w-3" /> },
  Research: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", icon: <FlaskConical className="h-3 w-3" /> },
};

const CATEGORIES: Array<NewsCategory | "All"> = ["All", "STT", "TTS", "V2V", "General", "Research"];

const inputStyle = {
  background: "var(--secondary)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RelevanceDots({ score }: { score: number }) {
  const dotColor = score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="flex items-center gap-0.5" title={`Relevance: ${score}/10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: i < score ? dotColor : "var(--border)" }}
        />
      ))}
    </div>
  );
}

// ─── News Card ───────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const [bookmarked, setBookmarked] = useState(false);
  const catConfig = CATEGORY_CONFIG[item.category];
  const isBreaking = item.relevanceScore >= 8;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: item.title, url: item.url });
    } else {
      navigator.clipboard.writeText(item.url);
    }
  }

  return (
    <Card className={`glass-card border-0 ${isBreaking ? "ai-glow" : ""}`} style={isBreaking ? { border: "1px solid rgba(245,158,11,0.3)" } : undefined}>
      <CardContent className="p-5">
        {/* Breaking Banner */}
        {isBreaking && (
          <div className="mb-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Zap className="h-3.5 w-3.5" />
            High Relevance
          </div>
        )}

        {/* Top row: Category + Date + Relevance */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: catConfig.bg, color: catConfig.color, border: `1px solid ${catConfig.border}` }}>
            {catConfig.icon}
            {item.category}
          </span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{relativeDate(item.date)}</span>
          <span className="ml-auto">
            <RelevanceDots score={item.relevanceScore} />
          </span>
        </div>

        {/* Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-base font-semibold leading-snug transition-colors hover:opacity-80"
          style={{ color: "var(--foreground)" }}
        >
          {item.title}
        </a>

        {/* Summary */}
        <p className="mt-2 text-sm leading-relaxed line-clamp-3" style={{ color: "var(--muted-foreground)" }}>
          {item.summary}
        </p>

        {/* Source row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}>
            {item.source.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.source}</span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "#00d4e8" }}
          >
            Read More <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-all"
              style={bookmarked
                ? { background: "rgba(0,212,232,0.1)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.25)" }
                : { color: "var(--muted-foreground)", background: "transparent" }
              }
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
              {bookmarked ? "Saved" : "Bookmark"}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-secondary"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface RunLog {
  id: string;
  status: string;
  found: number;
  inserted: number;
  duplicates: number;
  sources_queried: number;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<RunLog | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<NewsCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchRunLog = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/news-scout");
      if (res.ok) {
        const runs: RunLog[] = await res.json();
        if (runs.length > 0) setLastRun(runs[0]);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (sortKey) params.set("sort", sortKey);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error(`API error (${res.status})`);
      setItems(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, sortKey, dateFrom, dateTo]);

  useEffect(() => {
    fetchNews();
    fetchRunLog();
  }, [fetchNews, fetchRunLog]);

  async function triggerAgent() {
    setRunning(true);
    setAgentError(null);
    try {
      const res = await fetch("/api/agents/news-scout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAgentError(body.detail || body.error || `Agent failed (${res.status})`);
      }
      await fetchNews();
      await fetchRunLog();
    } catch (e) {
      setAgentError(String(e));
    } finally {
      setRunning(false);
    }
  }

  const breakingItems = useMemo(() => items.filter((i) => i.relevanceScore >= 8), [items]);
  const regularItems = useMemo(() => items.filter((i) => i.relevanceScore < 8), [items]);

  const stats = useMemo(() => ({
    total: items.length,
    breaking: breakingItems.length,
    sources: new Set(items.map((i) => i.source)).size,
  }), [items, breakingItems]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            News <span className="gradient-text">Intelligence</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            AI-curated feed of speech technology developments
          </p>
        </div>
        <button
          onClick={triggerAgent}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#00d4e8,#7c3aed)" }}
        >
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Scouting..." : "Run News Scout"}
        </button>
      </div>

      {/* Agent Error */}
      {agentError && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <div>
            <p className="font-medium" style={{ color: "#ef4444" }}>News Scout failed</p>
            <p className="mt-1 text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>{agentError}</p>
          </div>
          <button onClick={() => setAgentError(null)} className="ml-auto flex-shrink-0">
            <X className="h-4 w-4" style={{ color: "rgba(239,68,68,0.5)" }} />
          </button>
        </div>
      )}

      {/* Last Run Info */}
      {lastRun && (
        <div className="flex items-center gap-4 rounded-xl px-4 py-2.5" style={{ background: "rgba(148,163,184,0.05)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {lastRun.status === "completed" ? (
              <CheckCircle2 className="h-4 w-4" style={{ color: "#10b981" }} />
            ) : lastRun.status === "failed" ? (
              <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
            ) : (
              <RefreshCw className="h-4 w-4 animate-spin" style={{ color: "#00d4e8" }} />
            )}
            <span className="text-xs font-medium" style={{ color: lastRun.status === "completed" ? "#10b981" : lastRun.status === "failed" ? "#ef4444" : "#00d4e8" }}>
              {lastRun.status === "completed" ? "Last run completed" : lastRun.status === "failed" ? "Last run failed" : "Running..."}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Clock className="h-3 w-3" />
            {lastRun.completed_at
              ? relativeDate(lastRun.completed_at)
              : relativeDate(lastRun.started_at)}
          </div>
          {lastRun.status === "completed" && (
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span><span className="font-semibold" style={{ color: "#00d4e8" }}>{lastRun.found}</span> found</span>
              <span><span className="font-semibold" style={{ color: "#10b981" }}>{lastRun.inserted}</span> new</span>
              <span><span className="font-semibold" style={{ color: "#94a3b8" }}>{lastRun.duplicates}</span> duplicates</span>
              <span><span className="font-semibold" style={{ color: "#94a3b8" }}>{lastRun.sources_queried}</span> queries</span>
            </div>
          )}
          {lastRun.status === "failed" && lastRun.error && (
            <span className="text-xs truncate max-w-[300px]" style={{ color: "rgba(239,68,68,0.7)" }} title={lastRun.error}>
              {lastRun.error}
            </span>
          )}
        </div>
      )}

      {/* Stats Bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-5 rounded-xl px-4 py-2.5" style={{ background: "rgba(0,212,232,0.05)", border: "1px solid rgba(0,212,232,0.15)" }}>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="font-semibold" style={{ color: "#00d4e8" }}>{stats.total}</span> articles
          </span>
          {stats.breaking > 0 && (
            <span className="inline-flex items-center gap-1 text-sm" style={{ color: "#f59e0b" }}>
              <Zap className="h-3.5 w-3.5" />
              <span className="font-semibold">{stats.breaking}</span> high relevance
            </span>
          )}
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="font-semibold" style={{ color: "#00d4e8" }}>{stats.sources}</span> sources
          </span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl p-1" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {CATEGORIES.map((cat) => {
          const catConf = cat !== "All" ? CATEGORY_CONFIG[cat] : null;
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all"
              style={active
                ? { background: catConf ? catConf.bg : "rgba(0,212,232,0.1)", color: catConf ? catConf.color : "#00d4e8", border: `1px solid ${catConf ? catConf.border : "rgba(0,212,232,0.3)"}` }
                : { color: "var(--muted-foreground)", background: "transparent", border: "1px solid transparent" }
              }
            >
              {catConf?.icon}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search, Sort & Date Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder="Search articles, sources, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
            style={inputStyle}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all"
          style={dateFrom || dateTo
            ? { background: "rgba(0,212,232,0.12)", color: "#00d4e8", border: "1px solid rgba(0,212,232,0.3)" }
            : inputStyle
          }
        >
          <Calendar className="h-4 w-4" />
          Date Range
        </button>

        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none rounded-xl py-2.5 pl-3 pr-8 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="date">Sort: Date</option>
            <option value="category">Sort: Category</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>

      {/* Date Range Picker */}
      {showDateFilter && (
        <div className="flex items-center gap-3 rounded-xl p-3 flex-wrap" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <label className="text-sm" style={{ color: "var(--muted-foreground)" }}>From:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm focus:outline-none" style={inputStyle} />
          <label className="text-sm" style={{ color: "var(--muted-foreground)" }}>To:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm focus:outline-none" style={inputStyle} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-medium hover:opacity-80" style={{ color: "#00d4e8" }}>
              Clear dates
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          <span style={{ color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-2" style={{ color: "var(--muted-foreground)" }}>
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: "#00d4e8" }} />
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !error && (
        <div className="glass-card rounded-xl py-16 text-center">
          <Newspaper className="mx-auto h-12 w-12 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No news articles found</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {searchQuery || dateFrom || dateTo
              ? "Try adjusting your filters or search query."
              : "Click \"Run News Scout\" to fetch the latest speech AI news."}
          </p>
        </div>
      )}

      {/* News Feed */}
      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {breakingItems.length > 0 && (
            <div className="space-y-4">
              {breakingItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {regularItems.length > 0 && (
            <div className="space-y-4">
              {breakingItems.length > 0 && regularItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>More articles</span>
                  <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                </div>
              )}
              {regularItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
