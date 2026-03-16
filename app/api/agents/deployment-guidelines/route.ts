import { NextResponse } from "next/server";
import { runDeploymentGuidelines } from "@/lib/agents/deployment-guidelines";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      vendor_slug?: string;
      product_slug?: string | null;
    };

    if (!body.vendor_slug) {
      return NextResponse.json(
        { error: "vendor_slug is required" },
        { status: 400 },
      );
    }

    const result = await runDeploymentGuidelines(
      body.vendor_slug,
      body.product_slug ?? null,
    );

    return NextResponse.json(result, {
      status: result.status === "Failed" ? 500 : 200,
    });
  } catch (error) {
    // Surface the real error message so UI shows actionable info
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}
