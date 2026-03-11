"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Newspaper, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type NewsCategory = "STT" | "TTS" | "V2V" | "General" | "Research";

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

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  STT: "bg-blue-100 text-blue-700",
  TTS: "bg-purple-100 text-purple-700",
  V2V: "bg-green-100 text-green-700",
  General: "bg-gray-100 text-gray-700",
  Research: "bg-orange-100 text-orange-700",
};

const CATEGORIES: Array<NewsCategory | "All"> = [
  "All",
  "STT",
  "TTS",
  "V2V",
  "General",
  "Research",
];

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "All">(
    "All"
  );

  async function fetchNews(category?: NewsCategory) {
    setLoading(true);
    const url = category
      ? `/api/news?category=${category}`
      : "/api/news";
    const res = await fetch(url);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchNews();
  }, []);

  async function triggerAgent() {
    setRunning(true);
    try {
      await fetch("/api/agents/news-scout", { method: "POST" });
      await fetchNews(activeCategory === "All" ? undefined : activeCategory);
    } finally {
      setRunning(false);
    }
  }

  function handleCategoryChange(category: NewsCategory | "All") {
    setActiveCategory(category);
    fetchNews(category === "All" ? undefined : category);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            News Intelligence
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Latest speech & voice AI news, curated by the News Scout Agent
          </p>
        </div>
        <Button onClick={triggerAgent} disabled={running}>
          <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
          {running ? "Scouting..." : "Run News Scout"}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News Feed */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Newspaper className="h-10 w-10 mb-3" />
            <p className="text-sm">No news items yet.</p>
            <p className="text-xs mt-1">
              Click &quot;Run News Scout&quot; to fetch the latest news.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          CATEGORY_COLORS[item.category]
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.source} ·{" "}
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="ml-auto text-xs font-medium text-gray-500">
                        Relevance:{" "}
                        <span
                          className={
                            item.relevanceScore >= 8
                              ? "text-green-600"
                              : item.relevanceScore >= 6
                              ? "text-yellow-600"
                              : "text-gray-400"
                          }
                        >
                          {item.relevanceScore}/10
                        </span>
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {item.title}
                      <ExternalLink className="inline-block h-3.5 w-3.5 ml-1.5 text-gray-400" />
                    </a>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                      {item.summary}
                    </p>
                    {item.tags.length > 0 && (
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
