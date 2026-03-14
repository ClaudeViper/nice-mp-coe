#!/usr/bin/env node
/**
 * fetch_benchmarks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches public benchmark data from artificialanalysis.ai and writes it to
 * data/benchmarks/artificialanalysis_{stt|tts|s2s}.json.
 *
 * Usage:
 *   node scripts/fetch_benchmarks.js           # fetch all
 *   node scripts/fetch_benchmarks.js --type stt
 *   node scripts/fetch_benchmarks.js --type tts
 *   node scripts/fetch_benchmarks.js --type s2s
 *
 * Requires: cheerio (npm i -D cheerio)
 * For JS-rendered pages fall back to: playwright (npm i -D playwright)
 *
 * NOTE: Only public, non-authenticated data is accessed. Results are cached
 * for 24 hours (via the timestamp in the JSON) to avoid excessive requests.
 */

const fs   = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────

const CACHE_TTL_HOURS = 24;

const SOURCES = {
  stt: {
    url:      "https://artificialanalysis.ai/speech-to-text",
    outFile:  "artificialanalysis_stt.json",
  },
  tts: {
    url:      "https://artificialanalysis.ai/text-to-speech/models",
    outFile:  "artificialanalysis_tts.json",
  },
  s2s: {
    url:      "https://artificialanalysis.ai/models/speech-to-speech",
    outFile:  "artificialanalysis_s2s.json",
  },
};

const OUT_DIR = path.join(__dirname, "..", "data", "benchmarks");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the cached file is younger than CACHE_TTL_HOURS. */
function isCacheFresh(filePath) {
  try {
    const raw  = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const ts   = raw._meta?.last_updated;
    if (!ts) return false;
    const age  = (Date.now() - new Date(ts).getTime()) / 3_600_000;
    return age < CACHE_TTL_HOURS;
  } catch {
    return false;
  }
}

/** Normalise a vendor/model name to a slug. */
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Fetch logic ──────────────────────────────────────────────────────────────

/**
 * Attempts to fetch the given URL and extract benchmark table data.
 * artificialanalysis.ai renders server-side HTML tables that cheerio can parse.
 *
 * @param {string} url  - Page URL
 * @param {string} type - "stt" | "tts" | "s2s"
 * @returns {Promise<object[]>} Array of model benchmark objects
 */
async function fetchBenchmarkData(url, type) {
  let cheerio;
  try {
    cheerio = require("cheerio");
  } catch {
    console.warn("  ⚠  cheerio not installed — run: npm install -D cheerio");
    return [];
  }

  console.log(`  ↓ Fetching ${url} …`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NICE-CoE-BenchmarkFetcher/1.0; +https://github.com/nice/mp-coe)",
      "Accept":     "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    console.warn(`  ✗ HTTP ${res.status} for ${url}`);
    return [];
  }

  const html = await res.text();
  const $    = cheerio.load(html);
  const rows = [];

  // artificialanalysis.ai uses standard <table> or grid structures.
  // We look for rows that contain model names + numeric scores.
  $("table tbody tr, [class*='model-row'], [data-model]").each((i, el) => {
    const cells = $(el).find("td, [class*='cell'], [class*='value']").map((_, c) => $(c).text().trim()).get();
    if (cells.length < 3) return;

    const name  = cells[0] ?? "";
    const score = parseFloat(cells[1] ?? "");
    if (!name || isNaN(score)) return;

    rows.push({
      vendor_slug:      toSlug(name.split(" ")[0] ?? name),
      vendor_name:      name,
      model_name:       name,
      aa_quality_score: score,
      aa_speed_score:   parseFloat(cells[2] ?? "") || null,
      aa_price_per_hour:parseFloat(cells[3] ?? "") || null,
      aa_latency_ms:    parseFloat(cells[4] ?? "") || null,
      aa_rank:          i + 1,
      aa_source_url:    url,
    });
  });

  console.log(`  ✓ Parsed ${rows.length} model rows from ${url}`);
  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args     = process.argv.slice(2);
  const typeArg  = args[args.indexOf("--type") + 1];
  const force    = args.includes("--force");
  const types    = typeArg ? [typeArg] : Object.keys(SOURCES);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const type of types) {
    const source = SOURCES[type];
    if (!source) {
      console.warn(`Unknown type: ${type}. Choose: stt, tts, s2s`);
      continue;
    }

    const outPath = path.join(OUT_DIR, source.outFile);

    if (!force && isCacheFresh(outPath)) {
      console.log(`✓ ${type.toUpperCase()} cache is fresh (<${CACHE_TTL_HOURS}h old). Use --force to override.`);
      continue;
    }

    console.log(`\nFetching ${type.toUpperCase()} benchmarks …`);
    const models = await fetchBenchmarkData(source.url, type);

    const payload = {
      _meta: {
        source:       `artificialanalysis.ai/${type === "stt" ? "speech-to-text" : type === "tts" ? "text-to-speech/models" : "models/speech-to-speech"}`,
        source_url:   source.url,
        last_updated: new Date().toISOString().split("T")[0],
        model_count:  models.length,
      },
      models,
    };

    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    console.log(`✓ Wrote ${models.length} models → ${path.relative(process.cwd(), outPath)}`);
  }

  console.log("\nDone. Re-run with --force to bypass the 24-hour cache.");
}

main().catch((e) => { console.error(e); process.exit(1); });
