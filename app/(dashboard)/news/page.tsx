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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

const CATEGORY_CONFIG: Record<NewsCategory, { color: string; icon: React.ReactNode }> = {
  STT: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Mic className="h-3 w-3" /> },
  TTS: { color: "bg-teal-100 text-teal-700 border-teal-200", icon: <Volume2 className="h-3 w-3" /> },
  V2V: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: <MessageSquare className="h-3 w-3" /> },
  General: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Globe className="h-3 w-3" /> },
  Research: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: <FlaskConical className="h-3 w-3" /> },
};

const CATEGORIES: Array<NewsCategory | "All"> = ["All", "STT", "TTS", "V2V", "General", "Research"];

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
  return (
    <div className="flex items-center gap-0.5" title={`Relevance: ${score}/10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < score
              ? score >= 8
                ? "bg-green-500"
                : score >= 6
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function SourceAvatar({ source }: { source: string }) {
  const initial = source.charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
      {initial}
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
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        isBreaking ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
      }`}
    >
      {/* Breaking Banner */}
      {isBreaking && (
        <div className="mb-3 flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <Zap className="h-3.5 w-3.5" />
          High Relevance
        </div>
      )}

      {/* Top row: Category + Date + Relevance */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${catConfig.color}`}>
          {catConfig.icon}
          {item.category}
        </span>
        <span className="text-xs text-gray-400">{relativeDate(item.date)}</span>
        <span className="ml-auto">
          <RelevanceDots score={item.relevanceScore} />
        </span>
      </div>

      {/* Title */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-lg font-semibold text-gray-900 leading-snug hover:text-blue-600 transition-colors"
      >
        {item.title}
      </a>

      {/* Summary */}
      <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
        {item.summary}
      </p>

      {/* Source row */}
      <div className="mt-3 flex items-center gap-2">
        <SourceAvatar source={item.source} />
        <span className="text-sm font-medium text-gray-700">{item.source}</span>
        <span className="text-xs text-gray-400">
          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Read More <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              bookmarked
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
            {bookmarked ? "Saved" : "Bookmark"}
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

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
  }, [fetchNews]);

  async function triggerAgent() {
    setRunning(true);
    try {
      await fetch("/api/agents/news-scout", { method: "POST" });
      await fetchNews();
    } finally {
      setRunning(false);
    }
  }

  // Breaking items (relevance >= 8)
  const breakingItems = useMemo(() => items.filter((i) => i.relevanceScore >= 8), [items]);
  const regularItems = useMemo(() => items.filter((i) => i.relevanceScore < 8), [items]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    breaking: breakingItems.length,
    sources: new Set(items.map((i) => i.source)).size,
  }), [items, breakingItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Intelligence</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-curated feed of speech technology developments
          </p>
        </div>
        <Button onClick={triggerAgent} disabled={running}>
          <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
          {running ? "Scouting..." : "Run News Scout"}
        </Button>
      </div>

      {/* Stats Bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{stats.total}</span> articles
          </span>
          {stats.breaking > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-amber-700">
              <Zap className="h-3.5 w-3.5" />
              <span className="font-semibold">{stats.breaking}</span> high relevance
            </span>
          )}
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{stats.sources}</span> sources
          </span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {CATEGORIES.map((cat) => {
          const catConf = cat !== "All" ? CATEGORY_CONFIG[cat] : null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {catConf?.icon}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search, Sort & Date Filter */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles, sources, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Date Range */}
        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            dateFrom || dateTo
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Date Range
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="date">Sort: Date</option>
            <option value="category">Sort: Category</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Date Range Picker */}
      {showDateFilter && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
          <label className="text-sm text-gray-600">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-blue-300 focus:outline-none"
          />
          <label className="text-sm text-gray-600">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-blue-300 focus:outline-none"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <Newspaper className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading...
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Newspaper className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium text-gray-600">No news articles found</p>
          <p className="text-xs mt-1">
            {searchQuery || dateFrom || dateTo
              ? "Try adjusting your filters or search query."
              : "Click \"Run News Scout\" to fetch the latest speech AI news."}
          </p>
        </div>
      )}

      {/* News Feed */}
      {!loading && items.length > 0 && (
        <div className="max-w-3xl space-y-4">
          {/* Breaking items first */}
          {breakingItems.length > 0 && (
            <div className="space-y-4">
              {breakingItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Regular items */}
          {regularItems.length > 0 && (
            <div className="space-y-4">
              {breakingItems.length > 0 && regularItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">More articles</span>
                  <div className="h-px flex-1 bg-gray-200" />
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
