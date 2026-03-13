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
  // ReportType enum
  `DO $$ BEGIN CREATE TYPE "ReportType" AS ENUM ('MonthlyLandscape', 'VendorComparison', 'EvaluationSummary', 'BuildVsBuy', 'IntegrationReadiness'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ReportStatus enum
  `DO $$ BEGIN CREATE TYPE "ReportStatus" AS ENUM ('Generating', 'Completed', 'Failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // reports table
  `CREATE TABLE IF NOT EXISTS "reports" ("id" TEXT NOT NULL, "type" "ReportType" NOT NULL, "title" TEXT NOT NULL, "status" "ReportStatus" NOT NULL DEFAULT 'Generating', "summary" TEXT, "content" TEXT, "content_html" TEXT, "metadata" JSONB, "generated_by" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "reports_pkey" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "reports_type_idx" ON "reports"("type")`,
  `CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status")`,
  `CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports"("created_at")`,
];

async function main() {
  console.log("Running reports migration...\n");

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
