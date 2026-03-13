import { NextResponse } from "next/server";
import { generateReport } from "@/lib/agents/report-generator";
import { ReportType } from "@prisma/client";

interface RequestBody {
  type: ReportType;
  vendorSlugs?: string[];
  evaluationId?: string;
  title?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.type) {
      return NextResponse.json(
        { error: "Missing required field: type" },
        { status: 400 }
      );
    }

    const validTypes: ReportType[] = [
      "MonthlyLandscape",
      "VendorComparison",
      "EvaluationSummary",
      "BuildVsBuy",
      "IntegrationReadiness",
    ];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (body.type === "VendorComparison" && (!body.vendorSlugs || body.vendorSlugs.length < 2)) {
      return NextResponse.json(
        { error: "VendorComparison requires at least 2 vendorSlugs" },
        { status: 400 }
      );
    }

    if (body.type === "EvaluationSummary" && !body.evaluationId) {
      return NextResponse.json(
        { error: "EvaluationSummary requires an evaluationId" },
        { status: 400 }
      );
    }

    const result = await generateReport({
      type: body.type,
      vendorSlugs: body.vendorSlugs,
      evaluationId: body.evaluationId,
      title: body.title,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Report generation failed", detail: String(error) },
      { status: 500 }
    );
  }
}
