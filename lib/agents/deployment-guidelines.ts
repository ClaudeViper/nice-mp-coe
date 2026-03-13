import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeploymentGuidelinesResult {
  vendor_slug: string;
  product_slug: string | null;
  status: "Completed" | "Failed";
  guidelines_id: string | null;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function runSearchAndGenerate(
  vendorName: string,
  productName: string | null,
  vendorWebsite: string | null,
  docsUrl: string | null,
  integrationMethod: string | null,
): Promise<string> {
  const target = productName ? `${vendorName} ${productName}` : vendorName;

  const systemPrompt = `You are a senior solutions architect at NICE, the contact center technology company.
Your job is to write clear, accurate, actionable deployment guidelines for integrating speech/voice AI vendors into NICE CXone.
Always base your response on real, researched information from the vendor's official documentation.
Format your output as clean markdown without any preamble or explanation outside the document.`;

  const userPrompt = `Research and write comprehensive deployment guidelines for: **${target}**

${vendorWebsite ? `Vendor website: ${vendorWebsite}` : ""}
${docsUrl ? `Documentation: ${docsUrl}` : ""}
${integrationMethod ? `NICE CXone integration method: ${integrationMethod}` : ""}

Please search for:
1. Official API documentation and authentication methods for ${target}
2. SDK/library availability and installation instructions
3. Deployment requirements (cloud regions, on-prem options, network requirements)
4. Rate limits, quotas and pricing tiers for ${target}
5. Any NICE CXone or contact center specific integration guidance

Then produce a deployment guideline document with EXACTLY these sections in markdown:

# Deployment Guidelines: ${target}

## Prerequisites
List all accounts, tools, credentials, and system requirements needed before starting.

## Authentication & API Keys
Explain how to obtain and use API credentials. Include the exact environment variables needed.

## Quick Start
Provide a working code snippet (curl or Python) showing the simplest possible API call.

## NICE CXone Integration
Step-by-step instructions for connecting ${target} to NICE CXone. Include the integration method, endpoint configuration, and validation steps.

## Configuration Parameters
A table of key configuration options with field name, type, default, and description.

## Rate Limits & Quotas
Document API rate limits, concurrency limits, and recommended retry strategies.

## Troubleshooting
List the 4-5 most common integration issues and their solutions.

Be specific, accurate, and practical. Use real API endpoint paths and real parameter names where known.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  let finalText = "";

  // Agentic loop — keep going until Claude stops calling tools
  while (true) {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages,
    });

    // Collect any text blocks
    const textBlocks = response.content.filter((b) => b.type === "text");
    if (textBlocks.length > 0) {
      finalText = textBlocks.map((b) => (b as Anthropic.TextBlock).text).join("\n");
    }

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "tool_use") {
      // Build tool results and continue
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b) => b.type === "tool_use")
        .map((b) => {
          const toolUse = b as Anthropic.ToolUseBlock;
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: "Search executed.",
          };
        });

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  if (!finalText) {
    throw new Error("Agent produced no text output");
  }

  return finalText;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate or refresh deployment guidelines for a vendor or a specific product.
 *
 * @param vendorSlug  - vendor slug in the DB (required)
 * @param productSlug - product slug; pass null for vendor-level guidelines
 */
export async function runDeploymentGuidelines(
  vendorSlug: string,
  productSlug: string | null = null,
): Promise<DeploymentGuidelinesResult> {
  // Look up vendor
  const vendor = await prisma.vendor.findUnique({
    where: { slug: vendorSlug },
    include: {
      products: true,
      niceCompatibility: true,
    },
  });

  if (!vendor) {
    return {
      vendor_slug: vendorSlug,
      product_slug: productSlug,
      status: "Failed",
      guidelines_id: null,
      error: `Vendor "${vendorSlug}" not found`,
    };
  }

  const product = productSlug
    ? vendor.products.find((p) => p.slug === productSlug) ?? null
    : null;

  if (productSlug && !product) {
    return {
      vendor_slug: vendorSlug,
      product_slug: productSlug,
      status: "Failed",
      guidelines_id: null,
      error: `Product "${productSlug}" not found for vendor "${vendorSlug}"`,
    };
  }

  // Mark as Generating
  const existing = await prisma.deploymentGuideline.upsert({
    where: {
      vendorId_productSlug: {
        vendorId: vendor.id,
        productSlug: productSlug ?? null,
      },
    },
    create: {
      vendorId: vendor.id,
      productSlug: productSlug ?? null,
      content: "",
      status: "Generating",
    },
    update: {
      status: "Generating",
      errorMsg: null,
    },
  });

  try {
    const content = await runSearchAndGenerate(
      vendor.name,
      product?.name ?? null,
      vendor.website,
      vendor.docsUrl,
      vendor.niceCompatibility?.integrationMethod ?? null,
    );

    const updated = await prisma.deploymentGuideline.update({
      where: { id: existing.id },
      data: {
        content,
        status: "Completed",
        generatedAt: new Date(),
        errorMsg: null,
      },
    });

    return {
      vendor_slug: vendorSlug,
      product_slug: productSlug,
      status: "Completed",
      guidelines_id: updated.id,
    };
  } catch (err) {
    const msg = String(err);
    await prisma.deploymentGuideline.update({
      where: { id: existing.id },
      data: { status: "Failed", errorMsg: msg },
    });

    return {
      vendor_slug: vendorSlug,
      product_slug: productSlug,
      status: "Failed",
      guidelines_id: existing.id,
      error: msg,
    };
  }
}
