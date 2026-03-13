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
    return NextResponse.json(
      { error: "Agent run failed", detail: String(error) },
      { status: 500 },
    );
  }
}
