const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

// Use a dummy URL just to test model accessors exist (no actual connection)
const adapter = new PrismaPg({ connectionString: "postgresql://test:test@localhost:5432/test" });
const p = new PrismaClient({ adapter });

console.log("vendor type:", typeof p.vendor);
console.log("benchmarkResult type:", typeof p.benchmarkResult);
console.log("newsItem type:", typeof p.newsItem);

const keys = Object.keys(p).filter(k => k[0] !== "$" && k[0] !== "_");
console.log("model keys:", keys);
