import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const info: Record<string, unknown> = {};

  info.DATABASE_URL_SET = !!process.env.DATABASE_URL;
  info.DATABASE_URL_HOST = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : "NOT SET";

  try {
    const client = new PrismaClient();

    info.clientKeys = Object.keys(client).filter(
      (k) => !k.startsWith("$") && !k.startsWith("_")
    );
    info.hasVendor = "vendor" in client;
    info.vendorType = typeof (client as unknown as Record<string, unknown>).vendor;

    const count = await client.vendor.count();
    info.vendorCount = count;
    info.status = "OK";

    await client.$disconnect();
  } catch (err) {
    info.error = String(err);
    info.stack = (err as Error).stack?.split("\n").slice(0, 5);
  }

  return NextResponse.json(info, { status: info.status === "OK" ? 200 : 500 });
}
