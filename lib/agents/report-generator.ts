import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { ReportType, Prisma } from "@prisma/client";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportRequest {
  type: ReportType;
  vendorSlugs?: string[];
  evaluationId?: string;
  title?: string;
}

export interface ReportResult {
  reportId: string;
  status: "Completed" | "Failed";
  title: string;
  error?: string;
}

// ─── Data Collectors ──────────────────────────────────────────────────────────

async function collectLandscapeData() {
  const [vendors, benchmarks, evaluations, news] = await Promise.all([
    prisma.vendor.findMany({
      where: { isTracked: true },
      include: {
        products: true,
        niceCompatibility: true,
        _count: { select: { benchmarkResults: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.benchmarkResult.findMany({
      include: { vendor: { select: { name: true, slug: true } } },
      orderBy: [{ benchmarkType: "asc" }, { metricName: "asc" }],
      take: 200,
    }),
    prisma.evaluation.findMany({
      where: { status: "Completed" },
      include: {
        vendor: { select: { name: true } },
        results: { where: { sampleId: null } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.newsItem.findMany({
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return { vendors, benchmarks, evaluations, news };
}

async function collectVendorComparisonData(vendorSlugs: string[]) {
  const vendors = await prisma.vendor.findMany({
    where: { slug: { in: vendorSlugs } },
    include: {
      products: true,
      deploymentOptions: true,
      securityCerts: true,
      pricingTiers: true,
      niceCompatibility: true,
      benchmarkResults: {
        orderBy: { metricName: "asc" },
        take: 100,
      },
    },
  });

  const evaluations = await prisma.evaluation.findMany({
    where: {
      vendor: { slug: { in: vendorSlugs } },
      status: "Completed",
    },
    include: {
      vendor: { select: { name: true, slug: true } },
      results: { where: { sampleId: null } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { vendors, evaluations };
}

async function collectEvaluationData(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      vendor: true,
      results: { orderBy: { metricName: "asc" } },
    },
  });

  if (!evaluation) throw new Error(`Evaluation ${evaluationId} not found`);

  const benchmarks = await prisma.benchmarkResult.findMany({
    where: {
      benchmarkType: evaluation.evaluationType,
    },
    include: { vendor: { select: { name: true, slug: true } } },
    orderBy: { metricName: "asc" },
    take: 100,
  });

  return { evaluation, benchmarks };
}

async function collectBuildVsBuyData() {
  const vendors = await prisma.vendor.findMany({
    where: { isTracked: true },
    include: {
      products: true,
      deploymentOptions: true,
      securityCerts: true,
      pricingTiers: true,
      niceCompatibility: true,
      _count: { select: { benchmarkResults: true, supportedLanguages: true } },
    },
    orderBy: { name: "asc" },
  });

  return { vendors };
}

// ─── Report Generators ───────────────────────────────────────────────────────

function summarizeForPrompt(data: unknown): string {
  const text = JSON.stringify(data, null, 2);
  // Truncate to avoid token limits
  return text.length > 15000 ? text.slice(0, 15000) + "\n... (truncated)" : text;
}

async function generateWithClaude(systemPrompt: string, dataPrompt: string): Promise<{ summary: string; content: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `${systemPrompt}\n\nHere is the data to analyze:\n\n${dataPrompt}\n\nGenerate the report in markdown format. Start with a 2-3 sentence executive summary, then the full report body with clear sections and headers.`,
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  const fullText = textBlock && textBlock.type === "text" ? textBlock.text : "Report generation failed.";

  // Extract summary (first paragraph)
  const lines = fullText.split("\n").filter((l) => l.trim());
  const summaryEnd = lines.findIndex((l, i) => i > 0 && l.startsWith("#"));
  const summary = lines.slice(0, summaryEnd > 0 ? summaryEnd : 3).join(" ").replace(/^#+\s*/, "").trim();

  return { summary, content: fullText };
}

function markdownToHtml(md: string): string {
  // Simple markdown to HTML conversion for display
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\|(.+)\|/g, (match) => `<code>${match}</code>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hulo])/gm, "<p>")
    .replace(/(?<![>])$/gm, "</p>");
}

// ─── Main Agent ──────────────────────────────────────────────────────────────

export async function generateReport(request: ReportRequest): Promise<ReportResult> {
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Determine title
  let title = request.title ?? "";
  if (!title) {
    switch (request.type) {
      case "MonthlyLandscape":
        title = `Speech Technology Landscape Report — ${monthYear}`;
        break;
      case "VendorComparison":
        title = `Vendor Comparison Report — ${(request.vendorSlugs ?? []).join(" vs ")}`;
        break;
      case "EvaluationSummary":
        title = `Evaluation Summary Report`;
        break;
      case "BuildVsBuy":
        title = `Build vs Buy Analysis — Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
        break;
      case "IntegrationReadiness":
        title = `NICE CXone Integration Readiness Assessment — ${monthYear}`;
        break;
    }
  }

  // Create report record
  const report = await prisma.report.create({
    data: {
      type: request.type,
      title,
      status: "Generating",
      generatedBy: "report-generator-agent",
      metadata: {
        vendorSlugs: request.vendorSlugs,
        evaluationId: request.evaluationId,
        generatedAt: now.toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  try {
    let systemPrompt: string;
    let dataPrompt: string;

    switch (request.type) {
      case "MonthlyLandscape": {
        const data = await collectLandscapeData();
        systemPrompt = `You are a senior speech technology analyst at NICE, a leading contact center technology company. Generate a comprehensive Monthly Speech Technology Landscape Report.

The report should include:
1. Executive Summary
2. Market Overview — key trends and developments
3. STT Technology Update — accuracy benchmarks, new models, pricing changes
4. TTS Technology Update — quality benchmarks, voice naturalness trends
5. V2V/Conversational AI Update — emerging voice agent capabilities
6. Vendor Highlights — notable developments per vendor
7. Recent News & Research — summary of industry news
8. Recommendations for NICE — actionable items for the CoE team
9. Next Month Outlook

Use specific data points from the provided data. Be analytical and opinionated about trends.`;
        dataPrompt = summarizeForPrompt(data);
        break;
      }

      case "VendorComparison": {
        const data = await collectVendorComparisonData(request.vendorSlugs ?? []);
        systemPrompt = `You are a senior speech technology analyst at NICE. Generate a detailed Vendor Comparison Report.

The report should include:
1. Executive Summary — which vendor is recommended and why
2. Company Profiles — brief overview of each vendor
3. Product Comparison — features, models, capabilities side-by-side
4. Performance Benchmarks — accuracy, latency, quality metrics comparison
5. Pricing Analysis — cost comparison across tiers and volumes
6. Deployment & Security — deployment options, certifications comparison
7. NICE CXone Compatibility — integration readiness per vendor
8. Build vs Buy Score — analysis of each vendor's score
9. Recommendation — final recommendation with rationale

Use tables where appropriate. Be specific with numbers.`;
        dataPrompt = summarizeForPrompt(data);
        break;
      }

      case "EvaluationSummary": {
        const data = await collectEvaluationData(request.evaluationId!);
        title = `Evaluation Summary: ${data.evaluation.vendor.name} ${data.evaluation.modelName} (${data.evaluation.evaluationType})`;
        systemPrompt = `You are a speech technology evaluation specialist at NICE. Generate an Evaluation Summary Report.

The report should include:
1. Executive Summary — key findings
2. Evaluation Configuration — what was tested and how
3. Results Overview — aggregate metrics with interpretation
4. Per-Sample Analysis — notable findings from individual samples
5. Benchmark Comparison — how this model compares to industry benchmarks
6. Strengths & Weaknesses
7. Recommendation — is this model suitable for NICE CXone integration?

Be specific about metrics and their implications for contact center use cases.`;
        dataPrompt = summarizeForPrompt(data);
        break;
      }

      case "BuildVsBuy": {
        const data = await collectBuildVsBuyData();
        systemPrompt = `You are a senior technology strategist at NICE. Generate a Build vs Buy Analysis Report for the speech technology stack.

The report should include:
1. Executive Summary — overall recommendation
2. Methodology — how build vs buy scores are calculated
3. Vendor Scorecard — detailed analysis per vendor with scores
4. Build Option Analysis — what it would take to build in-house STT/TTS/V2V
5. Buy Option Analysis — best vendor options per category
6. Hybrid Approach — recommendations for mix of build and buy
7. Cost Projection — 1-year and 3-year TCO estimates
8. Risk Assessment — risks for each approach
9. Final Recommendation — actionable next steps

Focus on practical business value and NICE-specific considerations.`;
        dataPrompt = summarizeForPrompt(data);
        break;
      }

      case "IntegrationReadiness": {
        const data = await collectBuildVsBuyData();
        systemPrompt = `You are a solutions architect at NICE specializing in CXone integrations. Generate a NICE Product Integration Readiness Assessment.

The report should include:
1. Executive Summary — overall integration landscape
2. Integration Readiness Matrix — table of all vendors with status, method, complexity, timeline
3. Certified Integrations — vendors with existing CXone certification
4. Compatible Vendors — vendors that can be integrated with moderate effort
5. Custom Integration Required — vendors needing significant development
6. Technical Requirements — API standards, security, performance requirements
7. Implementation Roadmap — suggested order and timeline for integrations
8. Resource Requirements — team size and skill sets needed
9. Recommendations — priority integrations for next quarter

Be specific about technical requirements and timelines.`;
        dataPrompt = summarizeForPrompt(data);
        break;
      }
    }

    const { summary, content } = await generateWithClaude(systemPrompt!, dataPrompt!);
    const contentHtml = markdownToHtml(content);

    await prisma.report.update({
      where: { id: report.id },
      data: {
        title,
        status: "Completed",
        summary,
        content,
        contentHtml,
      },
    });

    return { reportId: report.id, status: "Completed", title };
  } catch (err) {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "Failed" },
    });

    return {
      reportId: report.id,
      status: "Failed",
      title,
      error: String(err),
    };
  }
}
