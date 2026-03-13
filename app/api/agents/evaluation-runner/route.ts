import { NextResponse } from "next/server";
import { runEvaluation, EvaluationConfig } from "@/lib/agents/evaluation-runner";
import { BenchmarkType } from "@prisma/client";

interface RequestBody {
  vendorId: string;
  evaluationType: BenchmarkType;
  modelName: string;
  config: EvaluationConfig;
  dataset?: string;
  language?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.vendorId || !body.evaluationType || !body.modelName) {
      return NextResponse.json(
        { error: "Missing required fields: vendorId, evaluationType, modelName" },
        { status: 400 }
      );
    }

    if (!["STT", "TTS", "V2V"].includes(body.evaluationType)) {
      return NextResponse.json(
        { error: "evaluationType must be STT, TTS, or V2V" },
        { status: 400 }
      );
    }

    const result = await runEvaluation({
      vendorId: body.vendorId,
      evaluationType: body.evaluationType,
      modelName: body.modelName,
      config: body.config ?? {},
      ...(body.dataset !== undefined && { dataset: body.dataset }),
      ...(body.language !== undefined && { language: body.language }),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Evaluation failed", detail: String(error) },
      { status: 500 }
    );
  }
}
