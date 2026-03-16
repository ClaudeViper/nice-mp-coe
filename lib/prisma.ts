import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

// In production use a singleton to avoid connection exhaustion.
// In development always create a fresh client so that newly generated Prisma
// models (after `npx prisma generate`) are immediately available without
// requiring a server restart.
function getOrCreateClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    globalForPrisma.prisma ??= createPrismaClient();
    return globalForPrisma.prisma;
  }
  // Dev: recreate if the singleton is missing a model added in a recent generate
  if (globalForPrisma.prisma && (globalForPrisma.prisma as unknown as Record<string, unknown>).deploymentGuideline) {
    return globalForPrisma.prisma;
  }
  globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

export const prisma = getOrCreateClient();
