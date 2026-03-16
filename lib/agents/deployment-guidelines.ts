import { createAnthropicClient } from "@/lib/anthropic-client";
import { prisma } from "@/lib/prisma";

const client = createAnthropicClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeploymentGuidelinesResult {
  vendor_slug: string;
  product_slug: string | null;
  status: "Completed" | "Failed";
  guidelines_id: string | null;
  error?: string;
}

interface RawGuideline {
  id: string;
  vendor_id: string;
  product_slug: string | null;
  content: string;
  status: string;
}

// ─── DB helpers (raw SQL — avoids stale Prisma generated client) ──────────────

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS deployment_guidelines (
      id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
      vendor_id    TEXT        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      product_slug TEXT,
      content      TEXT        NOT NULL DEFAULT '',
      status       TEXT        NOT NULL DEFAULT 'Completed',
      generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      error_msg    TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (vendor_id, product_slug)
    )
  `);
}

async function upsertGenerating(vendorId: string, productSlug: string | null): Promise<string> {
  // Use INSERT … ON CONFLICT to atomically create-or-update the row
  await prisma.$executeRawUnsafe(
    `INSERT INTO deployment_guidelines (id, vendor_id, product_slug, content, status, generated_at, updated_at)
     VALUES (gen_random_uuid()::text, $1, $2, '', 'Generating', now(), now())
     ON CONFLICT (vendor_id, product_slug)
     DO UPDATE SET status = 'Generating', error_msg = NULL, updated_at = now()`,
    vendorId,
    productSlug,
  );

  const rows = await prisma.$queryRawUnsafe<RawGuideline[]>(
    `SELECT id FROM deployment_guidelines WHERE vendor_id = $1 AND product_slug IS NOT DISTINCT FROM $2`,
    vendorId,
    productSlug,
  );
  return rows[0].id;
}

async function markCompleted(id: string, content: string) {
  await prisma.$executeRawUnsafe(
    `UPDATE deployment_guidelines SET content=$1, status='Completed', error_msg=NULL, generated_at=now(), updated_at=now() WHERE id=$2`,
    content,
    id,
  );
}

async function markFailed(id: string, errorMsg: string) {
  await prisma.$executeRawUnsafe(
    `UPDATE deployment_guidelines SET status='Failed', error_msg=$1, updated_at=now() WHERE id=$2`,
    errorMsg,
    id,
  );
}

// ─── AI generation ────────────────────────────────────────────────────────────

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

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system: systemPrompt,
    tools: [{ type: "web_search_20250305" as never, name: "web_search" }],
    messages: [{ role: "user", content: userPrompt }],
  });

  const finalText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  if (!finalText) throw new Error("Agent produced no text output");
  return finalText;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function runDeploymentGuidelines(
  vendorSlug: string,
  productSlug: string | null = null,
): Promise<DeploymentGuidelinesResult> {
  // Look up vendor using stable prisma models (vendor existed before generate)
  const vendor = await prisma.vendor.findUnique({
    where: { slug: vendorSlug },
    include: { products: true, niceCompatibility: true },
  });

  if (!vendor) {
    return { vendor_slug: vendorSlug, product_slug: productSlug, status: "Failed", guidelines_id: null, error: `Vendor "${vendorSlug}" not found` };
  }

  const product = productSlug ? vendor.products.find((p) => p.slug === productSlug) ?? null : null;
  if (productSlug && !product) {
    return { vendor_slug: vendorSlug, product_slug: productSlug, status: "Failed", guidelines_id: null, error: `Product "${productSlug}" not found for vendor "${vendorSlug}"` };
  }

  // Ensure table exists and create/update the row via raw SQL
  await ensureTable();
  const rowId = await upsertGenerating(vendor.id, productSlug);

  try {
    const content = await runSearchAndGenerate(
      vendor.name,
      product?.name ?? null,
      vendor.website,
      vendor.docsUrl,
      vendor.niceCompatibility?.integrationMethod ?? null,
    );

    await markCompleted(rowId, content);
    return { vendor_slug: vendorSlug, product_slug: productSlug, status: "Completed", guidelines_id: rowId };
  } catch (err) {
    const msg = String(err);
    await markFailed(rowId, msg);
    return { vendor_slug: vendorSlug, product_slug: productSlug, status: "Failed", guidelines_id: rowId, error: msg };
  }
}
