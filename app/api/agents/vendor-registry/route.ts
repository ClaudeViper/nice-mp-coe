import { NextResponse } from "next/server";
import { runVendorRegistry } from "@/lib/agents/vendor-registry";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const vendorSlug = (body as { vendor_slug?: string }).vendor_slug ?? undefined;
    const result = await runVendorRegistry(vendorSlug);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Agent run failed", detail: String(error) },
      { status: 500 }
    );
  }
}
