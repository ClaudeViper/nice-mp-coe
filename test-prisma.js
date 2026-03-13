const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const a = new PrismaPg({ connectionString: "postgresql://test:test@localhost:5432/test" });
const p = new PrismaClient({ adapter: a });

console.log("vendor type:", typeof p.vendor);
console.log("benchmarkResult type:", typeof p.benchmarkResult);
console.log("newsItem type:", typeof p.newsItem);

const keys = Object.keys(p).filter(k => !k.startsWith("$") && !k.startsWith("_"));
console.log("model keys:", keys);
