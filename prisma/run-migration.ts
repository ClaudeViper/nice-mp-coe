import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const statements = [
  // New enums
  `DO $$ BEGIN CREATE TYPE "ProductCategory" AS ENUM ('STT', 'TTS', 'V2V', 'NLU', 'Conversational', 'Platform'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "DeploymentType" AS ENUM ('Cloud', 'OnPrem', 'Hybrid', 'Edge'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // Add new columns to vendors
  `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "description" TEXT`,
  `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "logo_url" TEXT`,
  `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "founded_year" INTEGER`,
  `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "hq_location" TEXT`,

  // vendor_products
  `CREATE TABLE IF NOT EXISTS "vendor_products" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "category" "ProductCategory" NOT NULL, "version" TEXT, "description" TEXT, "api_endpoint" TEXT, "is_ga" BOOLEAN NOT NULL DEFAULT true, "released_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "vendor_products_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "vendor_products_vendor_id_slug_key" ON "vendor_products"("vendor_id", "slug")`,
  `CREATE INDEX IF NOT EXISTS "vendor_products_vendor_id_idx" ON "vendor_products"("vendor_id")`,
  `CREATE INDEX IF NOT EXISTS "vendor_products_category_idx" ON "vendor_products"("category")`,

  // vendor_deployment_options
  `CREATE TABLE IF NOT EXISTS "vendor_deployment_options" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "type" "DeploymentType" NOT NULL, "details" TEXT, "regions" TEXT[], "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "vendor_deployment_options_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "vendor_deployment_options_vendor_id_type_key" ON "vendor_deployment_options"("vendor_id", "type")`,
  `CREATE INDEX IF NOT EXISTS "vendor_deployment_options_vendor_id_idx" ON "vendor_deployment_options"("vendor_id")`,

  // vendor_security_certs
  `CREATE TABLE IF NOT EXISTS "vendor_security_certs" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "cert_name" TEXT NOT NULL, "cert_body" TEXT, "issued_at" TIMESTAMP(3), "expires_at" TIMESTAMP(3), "verification_url" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "vendor_security_certs_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "vendor_security_certs_vendor_id_cert_name_key" ON "vendor_security_certs"("vendor_id", "cert_name")`,
  `CREATE INDEX IF NOT EXISTS "vendor_security_certs_vendor_id_idx" ON "vendor_security_certs"("vendor_id")`,

  // vendor_languages
  `CREATE TABLE IF NOT EXISTS "vendor_languages" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "language" TEXT NOT NULL, "lang_code" TEXT NOT NULL, "accents" TEXT[], "category" "ProductCategory" NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vendor_languages_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "vendor_languages_vendor_id_lang_code_category_key" ON "vendor_languages"("vendor_id", "lang_code", "category")`,
  `CREATE INDEX IF NOT EXISTS "vendor_languages_vendor_id_idx" ON "vendor_languages"("vendor_id")`,

  // vendor_pricing_tiers
  `CREATE TABLE IF NOT EXISTS "vendor_pricing_tiers" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "tier_name" TEXT NOT NULL, "category" "ProductCategory" NOT NULL, "price_per_unit" DECIMAL(10,6) NOT NULL, "unit" TEXT NOT NULL, "monthly_minimum" DECIMAL(10,2), "volume_discount" TEXT, "commitment_terms" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "vendor_pricing_tiers_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "vendor_pricing_tiers_vendor_id_tier_name_category_key" ON "vendor_pricing_tiers"("vendor_id", "tier_name", "category")`,
  `CREATE INDEX IF NOT EXISTS "vendor_pricing_tiers_vendor_id_idx" ON "vendor_pricing_tiers"("vendor_id")`,

  // nice_compatibility
  `CREATE TABLE IF NOT EXISTS "nice_compatibility" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "cxone_integration_status" TEXT NOT NULL, "integration_method" TEXT, "certified_version" TEXT, "build_vs_buy_score" INTEGER NOT NULL, "build_vs_buy_rationale" TEXT, "migration_complexity" TEXT, "estimated_integration_days" INTEGER, "notes" TEXT, "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "nice_compatibility_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "nice_compatibility_vendor_id_key" ON "nice_compatibility"("vendor_id")`,

  // vendor_registry_run_log
  `CREATE TABLE IF NOT EXISTS "vendor_registry_run_log" ("id" TEXT NOT NULL, "vendor_id" TEXT, "status" TEXT NOT NULL, "vendors_processed" INTEGER NOT NULL DEFAULT 0, "fields_updated" INTEGER NOT NULL DEFAULT 0, "errors" JSONB, "started_at" TIMESTAMP(3) NOT NULL, "completed_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vendor_registry_run_log_pkey" PRIMARY KEY ("id"))`,

  // Foreign keys (drop first to be idempotent)
  `ALTER TABLE "vendor_products" DROP CONSTRAINT IF EXISTS "vendor_products_vendor_id_fkey"`,
  `ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "vendor_deployment_options" DROP CONSTRAINT IF EXISTS "vendor_deployment_options_vendor_id_fkey"`,
  `ALTER TABLE "vendor_deployment_options" ADD CONSTRAINT "vendor_deployment_options_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "vendor_security_certs" DROP CONSTRAINT IF EXISTS "vendor_security_certs_vendor_id_fkey"`,
  `ALTER TABLE "vendor_security_certs" ADD CONSTRAINT "vendor_security_certs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "vendor_languages" DROP CONSTRAINT IF EXISTS "vendor_languages_vendor_id_fkey"`,
  `ALTER TABLE "vendor_languages" ADD CONSTRAINT "vendor_languages_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "vendor_pricing_tiers" DROP CONSTRAINT IF EXISTS "vendor_pricing_tiers_vendor_id_fkey"`,
  `ALTER TABLE "vendor_pricing_tiers" ADD CONSTRAINT "vendor_pricing_tiers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "nice_compatibility" DROP CONSTRAINT IF EXISTS "nice_compatibility_vendor_id_fkey"`,
  `ALTER TABLE "nice_compatibility" ADD CONSTRAINT "nice_compatibility_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "vendor_registry_run_log" DROP CONSTRAINT IF EXISTS "vendor_registry_run_log_vendor_id_fkey"`,
  `ALTER TABLE "vendor_registry_run_log" ADD CONSTRAINT "vendor_registry_run_log_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
];

async function main() {
  console.log("Running vendor registry migration...\n");

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    const label = sql.substring(0, 80).replace(/\n/g, " ");
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✓ [${i + 1}/${statements.length}] ${label}...`);
    } catch (err) {
      console.error(`  ✗ [${i + 1}/${statements.length}] ${label}...`);
      console.error(`    Error: ${String(err)}`);
    }
  }

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
