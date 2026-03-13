import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { ProductCategory, DeploymentType, Prisma } from "@prisma/client";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorProfile {
  slug: string;
  description: string;
  founded_year: number | null;
  hq_location: string | null;
  products: Array<{
    name: string;
    slug: string;
    category: string;
    version: string | null;
    description: string | null;
    api_endpoint: string | null;
    is_ga: boolean;
  }>;
  deployment_options: Array<{
    type: string;
    details: string | null;
    regions: string[];
  }>;
  security_certs: Array<{
    cert_name: string;
    cert_body: string | null;
    verification_url: string | null;
  }>;
  supported_languages: Array<{
    language: string;
    lang_code: string;
    accents: string[];
    category: string;
  }>;
  pricing_tiers: Array<{
    tier_name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    monthly_minimum: number | null;
    volume_discount: string | null;
    commitment_terms: string | null;
  }>;
  nice_compatibility: {
    cxone_integration_status: string;
    integration_method: string | null;
    certified_version: string | null;
    build_vs_buy_score: number;
    build_vs_buy_rationale: string | null;
    migration_complexity: string | null;
    estimated_integration_days: number | null;
    notes: string | null;
  };
}

export interface VendorRegistryResult {
  vendors_processed: number;
  fields_updated: number;
  errors: string[];
}

// ─── Source queries ───────────────────────────────────────────────────────────

const PROFILE_SOURCES: Array<{
  name: string;
  queryTemplate: string;
  prompt: string;
}> = [
  {
    name: "Company Overview & Products",
    queryTemplate: "{vendor} speech AI products API models catalog 2025 2026",
    prompt: `Search for comprehensive information about {vendor}'s speech/voice AI products and company information.

Return ONLY a JSON object (no markdown, no explanation) matching this schema:
{
  "slug": "{slug}",
  "description": string,           // 2-3 sentence company overview focused on speech/voice AI
  "founded_year": number | null,
  "hq_location": string | null,    // e.g. "San Francisco, CA"
  "products": [{
    "name": string,                 // e.g. "Whisper Large V3"
    "slug": string,                 // lowercase hyphenated, e.g. "whisper-large-v3"
    "category": string,             // "STT", "TTS", "V2V", "NLU", "Conversational", "Platform"
    "version": string | null,       // e.g. "v3", "2.0"
    "description": string | null,   // brief description
    "api_endpoint": string | null,  // base API URL if public
    "is_ga": boolean                // generally available (not beta)
  }]
}

Include ALL speech/voice related products. Be accurate about versions.`,
  },
  {
    name: "Deployment & Security",
    queryTemplate: "{vendor} deployment cloud on-premise security certifications SOC2 HIPAA GDPR 2025 2026",
    prompt: `Search for {vendor}'s deployment options and security certifications for their speech/voice AI services.

Return ONLY a JSON object (no markdown, no explanation) matching this schema:
{
  "deployment_options": [{
    "type": string,             // "Cloud", "OnPrem", "Hybrid", or "Edge"
    "details": string | null,   // brief description of this option
    "regions": string[]         // available regions, e.g. ["us-east-1", "eu-west-1"] or ["Global"]
  }],
  "security_certs": [{
    "cert_name": string,              // e.g. "SOC2 Type II", "HIPAA BAA", "GDPR", "FedRAMP", "ISO 27001"
    "cert_body": string | null,       // certifying body
    "verification_url": string | null // URL to verification page
  }]
}

Include ALL deployment types and security certifications available.`,
  },
  {
    name: "Languages & Pricing",
    queryTemplate: "{vendor} speech API supported languages pricing tiers volume discount 2025 2026",
    prompt: `Search for {vendor}'s supported languages and pricing for their speech/voice AI services.

Return ONLY a JSON object (no markdown, no explanation) matching this schema:
{
  "supported_languages": [{
    "language": string,          // e.g. "English"
    "lang_code": string,         // ISO 639-1, e.g. "en"
    "accents": string[],         // e.g. ["US", "UK", "AU", "IN"]
    "category": string           // "STT", "TTS", "V2V"
  }],
  "pricing_tiers": [{
    "tier_name": string,              // e.g. "Pay-as-you-go", "Growth", "Enterprise"
    "category": string,               // "STT", "TTS", "V2V"
    "price_per_unit": number,         // USD price per unit
    "unit": string,                   // e.g. "per minute", "per 1M characters"
    "monthly_minimum": number | null, // USD monthly min commitment
    "volume_discount": string | null, // e.g. "20% off over 10K hours/month"
    "commitment_terms": string | null // e.g. "Annual contract required"
  }]
}

Include all available languages (top 20 if many) and all pricing tiers.`,
  },
  {
    name: "NICE CXone Compatibility",
    queryTemplate: "{vendor} NICE CXone integration contact center compatibility API 2025 2026",
    prompt: `Search for {vendor}'s compatibility and integration status with NICE CXone contact center platform.
Assess the feasibility of integrating {vendor}'s speech/voice AI into a NICE CXone environment.

Return ONLY a JSON object (no markdown, no explanation) matching this schema:
{
  "nice_compatibility": {
    "cxone_integration_status": string,      // "Certified", "Compatible", "Requires Custom Integration", "Not Compatible", "Unknown"
    "integration_method": string | null,      // e.g. "REST API", "WebSocket", "SDK", "Marketplace App"
    "certified_version": string | null,       // version certified with CXone
    "build_vs_buy_score": number,            // 1-10 where 10 = strong buy, 1 = build in-house
    "build_vs_buy_rationale": string | null,  // brief explanation
    "migration_complexity": string | null,    // "Low", "Medium", "High", "Very High"
    "estimated_integration_days": number | null, // estimated days to integrate
    "notes": string | null                   // additional notes
  }
}

Be realistic about the integration assessment. If no direct CXone integration exists, assess based on API capabilities.`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJsonObject(text: string): Record<string, unknown> | null {
  // Try to find a JSON object in the response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function toProductCategory(cat: string): ProductCategory | null {
  const map: Record<string, ProductCategory> = {
    STT: "STT",
    TTS: "TTS",
    V2V: "V2V",
    NLU: "NLU",
    Conversational: "Conversational",
    Platform: "Platform",
  };
  return map[cat] ?? null;
}

function toDeploymentType(type: string): DeploymentType | null {
  const map: Record<string, DeploymentType> = {
    Cloud: "Cloud",
    OnPrem: "OnPrem",
    Hybrid: "Hybrid",
    Edge: "Edge",
  };
  return map[type] ?? null;
}

// ─── Main agent ───────────────────────────────────────────────────────────────

export async function runVendorRegistry(vendorSlug?: string): Promise<VendorRegistryResult> {
  const startedAt = new Date();
  const errors: string[] = [];
  let vendorsProcessed = 0;
  let fieldsUpdated = 0;

  // Load vendors to process
  const whereClause = vendorSlug
    ? { slug: vendorSlug, isTracked: true }
    : { isTracked: true };
  const vendors = await prisma.vendor.findMany({ where: whereClause });

  if (vendors.length === 0) {
    errors.push(vendorSlug ? `Vendor "${vendorSlug}" not found or not tracked` : "No tracked vendors found");
    return { vendors_processed: 0, fields_updated: 0, errors };
  }

  for (const vendor of vendors) {
    const profile: Partial<VendorProfile> = { slug: vendor.slug };

    // ── Collect data from all sources ──────────────────────────────────────
    for (const source of PROFILE_SOURCES) {
      try {
        const query = source.queryTemplate.replace(/\{vendor\}/g, vendor.name).replace(/\{slug\}/g, vendor.slug);
        const prompt = source.prompt.replace(/\{vendor\}/g, vendor.name).replace(/\{slug\}/g, vendor.slug);

        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          tools: [{ type: "web_search_20250305", name: "web_search" } as never],
          messages: [
            { role: "user", content: `Search query: "${query}"\n\n${prompt}` },
          ],
        });

        const textBlock = response.content.find((c) => c.type === "text");
        if (textBlock && textBlock.type === "text") {
          const data = extractJsonObject(textBlock.text);
          if (data) {
            Object.assign(profile, data);
          }
        }
      } catch (err) {
        errors.push(`[${vendor.slug}] Source "${source.name}": ${String(err)}`);
      }
    }

    // ── Upsert collected data ──────────────────────────────────────────────
    try {
      // Update vendor base fields
      const updateData: Prisma.VendorUpdateInput = {};
      if (profile.description) { updateData.description = profile.description; fieldsUpdated++; }
      if (profile.founded_year) { updateData.foundedYear = profile.founded_year; fieldsUpdated++; }
      if (profile.hq_location) { updateData.hqLocation = profile.hq_location; fieldsUpdated++; }

      if (Object.keys(updateData).length > 0) {
        await prisma.vendor.update({ where: { id: vendor.id }, data: updateData });
      }

      // Upsert products
      if (profile.products) {
        for (const prod of profile.products) {
          const category = toProductCategory(prod.category);
          if (!category) continue;
          await prisma.vendorProduct.upsert({
            where: { vendorId_slug: { vendorId: vendor.id, slug: prod.slug } },
            update: {
              name: prod.name,
              category,
              version: prod.version,
              description: prod.description,
              apiEndpoint: prod.api_endpoint,
              isGa: prod.is_ga,
            },
            create: {
              vendorId: vendor.id,
              name: prod.name,
              slug: prod.slug,
              category,
              version: prod.version,
              description: prod.description,
              apiEndpoint: prod.api_endpoint,
              isGa: prod.is_ga,
            },
          });
          fieldsUpdated++;
        }
      }

      // Upsert deployment options
      if (profile.deployment_options) {
        for (const dep of profile.deployment_options) {
          const type = toDeploymentType(dep.type);
          if (!type) continue;
          await prisma.vendorDeploymentOption.upsert({
            where: { vendorId_type: { vendorId: vendor.id, type } },
            update: { details: dep.details, regions: dep.regions },
            create: { vendorId: vendor.id, type, details: dep.details, regions: dep.regions },
          });
          fieldsUpdated++;
        }
      }

      // Upsert security certs
      if (profile.security_certs) {
        for (const cert of profile.security_certs) {
          await prisma.vendorSecurityCert.upsert({
            where: { vendorId_certName: { vendorId: vendor.id, certName: cert.cert_name } },
            update: { certBody: cert.cert_body, verificationUrl: cert.verification_url },
            create: {
              vendorId: vendor.id,
              certName: cert.cert_name,
              certBody: cert.cert_body,
              verificationUrl: cert.verification_url,
            },
          });
          fieldsUpdated++;
        }
      }

      // Upsert supported languages
      if (profile.supported_languages) {
        for (const lang of profile.supported_languages) {
          const category = toProductCategory(lang.category);
          if (!category) continue;
          await prisma.vendorLanguage.upsert({
            where: { vendorId_langCode_category: { vendorId: vendor.id, langCode: lang.lang_code, category } },
            update: { language: lang.language, accents: lang.accents },
            create: {
              vendorId: vendor.id,
              language: lang.language,
              langCode: lang.lang_code,
              accents: lang.accents,
              category,
            },
          });
          fieldsUpdated++;
        }
      }

      // Upsert pricing tiers
      if (profile.pricing_tiers) {
        for (const tier of profile.pricing_tiers) {
          const category = toProductCategory(tier.category);
          if (!category) continue;
          await prisma.vendorPricingTier.upsert({
            where: { vendorId_tierName_category: { vendorId: vendor.id, tierName: tier.tier_name, category } },
            update: {
              pricePerUnit: new Prisma.Decimal(tier.price_per_unit),
              unit: tier.unit,
              monthlyMinimum: tier.monthly_minimum ? new Prisma.Decimal(tier.monthly_minimum) : null,
              volumeDiscount: tier.volume_discount,
              commitmentTerms: tier.commitment_terms,
            },
            create: {
              vendorId: vendor.id,
              tierName: tier.tier_name,
              category,
              pricePerUnit: new Prisma.Decimal(tier.price_per_unit),
              unit: tier.unit,
              monthlyMinimum: tier.monthly_minimum ? new Prisma.Decimal(tier.monthly_minimum) : null,
              volumeDiscount: tier.volume_discount,
              commitmentTerms: tier.commitment_terms,
            },
          });
          fieldsUpdated++;
        }
      }

      // Upsert NICE compatibility
      if (profile.nice_compatibility) {
        const compat = profile.nice_compatibility;
        await prisma.niceCompatibility.upsert({
          where: { vendorId: vendor.id },
          update: {
            cxoneIntegrationStatus: compat.cxone_integration_status,
            integrationMethod: compat.integration_method,
            certifiedVersion: compat.certified_version,
            buildVsBuyScore: compat.build_vs_buy_score,
            buildVsBuyRationale: compat.build_vs_buy_rationale,
            migrationComplexity: compat.migration_complexity,
            estimatedIntegrationDays: compat.estimated_integration_days,
            notes: compat.notes,
            assessedAt: new Date(),
          },
          create: {
            vendorId: vendor.id,
            cxoneIntegrationStatus: compat.cxone_integration_status,
            integrationMethod: compat.integration_method,
            certifiedVersion: compat.certified_version,
            buildVsBuyScore: compat.build_vs_buy_score,
            buildVsBuyRationale: compat.build_vs_buy_rationale,
            migrationComplexity: compat.migration_complexity,
            estimatedIntegrationDays: compat.estimated_integration_days,
            notes: compat.notes,
            assessedAt: new Date(),
          },
        });
        fieldsUpdated++;
      }

      vendorsProcessed++;
    } catch (err) {
      errors.push(`[${vendor.slug}] DB upsert: ${String(err)}`);
    }
  }

  // ── Write audit log ─────────────────────────────────────────────────────
  await prisma.vendorRegistryRunLog.create({
    data: {
      vendorId: vendorSlug ? vendors[0]?.id : null,
      status: errors.length === 0 ? "success" : vendorsProcessed > 0 ? "partial" : "failed",
      vendorsProcessed,
      fieldsUpdated,
      errors: errors.length > 0 ? (errors as Prisma.InputJsonValue) : Prisma.JsonNull,
      startedAt,
      completedAt: new Date(),
    },
  });

  return { vendors_processed: vendorsProcessed, fields_updated: fieldsUpdated, errors };
}
