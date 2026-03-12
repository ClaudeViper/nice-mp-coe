import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    where: { isTracked: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(vendors);
}
