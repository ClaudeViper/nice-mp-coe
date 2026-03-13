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
  // EvaluationStatus enum
  `DO $$ BEGIN CREATE TYPE "EvaluationStatus" AS ENUM ('Pending', 'Running', 'Completed', 'Failed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // evaluations table
  `CREATE TABLE IF NOT EXISTS "evaluations" ("id" TEXT NOT NULL, "vendor_id" TEXT NOT NULL, "evaluation_type" "BenchmarkType" NOT NULL, "model_name" TEXT NOT NULL, "status" "EvaluationStatus" NOT NULL DEFAULT 'Pending', "config" JSONB NOT NULL, "dataset" TEXT NOT NULL DEFAULT 'standard', "language" TEXT NOT NULL DEFAULT 'en', "total_samples" INTEGER NOT NULL DEFAULT 0, "processed_samples" INTEGER NOT NULL DEFAULT 0, "started_at" TIMESTAMP(3), "completed_at" TIMESTAMP(3), "error_message" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "evaluations_vendor_id_idx" ON "evaluations"("vendor_id")`,
  `CREATE INDEX IF NOT EXISTS "evaluations_evaluation_type_idx" ON "evaluations"("evaluation_type")`,
  `CREATE INDEX IF NOT EXISTS "evaluations_status_idx" ON "evaluations"("status")`,

  // evaluation_results table
  `CREATE TABLE IF NOT EXISTS "evaluation_results" ("id" TEXT NOT NULL, "evaluation_id" TEXT NOT NULL, "metric_name" TEXT NOT NULL, "metric_value" DECIMAL(10,4) NOT NULL, "metric_unit" TEXT NOT NULL, "sample_id" TEXT, "details" JSONB, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "evaluation_results_pkey" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "evaluation_results_evaluation_id_idx" ON "evaluation_results"("evaluation_id")`,
  `CREATE INDEX IF NOT EXISTS "evaluation_results_metric_name_idx" ON "evaluation_results"("metric_name")`,

  // evaluation_datasets table
  `CREATE TABLE IF NOT EXISTS "evaluation_datasets" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "type" "BenchmarkType" NOT NULL, "description" TEXT, "sample_count" INTEGER NOT NULL, "language" TEXT NOT NULL DEFAULT 'en', "samples" JSONB NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "evaluation_datasets_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "evaluation_datasets_name_key" ON "evaluation_datasets"("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "evaluation_datasets_slug_key" ON "evaluation_datasets"("slug")`,
  `CREATE INDEX IF NOT EXISTS "evaluation_datasets_type_idx" ON "evaluation_datasets"("type")`,

  // Foreign keys
  `ALTER TABLE "evaluations" DROP CONSTRAINT IF EXISTS "evaluations_vendor_id_fkey"`,
  `ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "evaluation_results" DROP CONSTRAINT IF EXISTS "evaluation_results_evaluation_id_fkey"`,
  `ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
];

async function main() {
  console.log("Running evaluations migration...\n");

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
