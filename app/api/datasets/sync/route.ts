import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  NICE_CX_CLEAN_EN,
  NICE_CX_NOISY_EN,
  NICE_TTS_IVR_EN,
  NICE_TTS_AGENT_EN,
  NICE_V2V_SUPPORT_EN,
  NICE_V2V_IVR_EN,
  DATASET_CATALOG,
} from "@/lib/agents/evaluation-runner";

const BUILT_IN = [
  { slug: "NICE-CX-Clean-EN",   type: "STT" as const, samples: NICE_CX_CLEAN_EN,    ...DATASET_CATALOG.STT[0] },
  { slug: "NICE-CX-Noisy-EN",   type: "STT" as const, samples: NICE_CX_NOISY_EN,    ...DATASET_CATALOG.STT[1] },
  { slug: "NICE-TTS-IVR-EN",    type: "TTS" as const, samples: NICE_TTS_IVR_EN,     ...DATASET_CATALOG.TTS[0] },
  { slug: "NICE-TTS-Agent-EN",  type: "TTS" as const, samples: NICE_TTS_AGENT_EN,   ...DATASET_CATALOG.TTS[1] },
  { slug: "NICE-V2V-Support-EN",type: "V2V" as const, samples: NICE_V2V_SUPPORT_EN, ...DATASET_CATALOG.V2V[0] },
  { slug: "NICE-V2V-IVR-EN",    type: "V2V" as const, samples: NICE_V2V_IVR_EN,     ...DATASET_CATALOG.V2V[1] },
];

export async function POST() {
  try {
    const results: string[] = [];

    for (const ds of BUILT_IN) {
      await prisma.evaluationDataset.upsert({
        where: { slug: ds.slug },
        create: {
          name:        ds.name,
          slug:        ds.slug,
          type:        ds.type,
          description: ds.description,
          language:    "en",
          sampleCount: ds.samples.length,
          samples:     ds.samples as never,
        },
        update: {
          name:        ds.name,
          description: ds.description,
          sampleCount: ds.samples.length,
          samples:     ds.samples as never,
        },
      });
      results.push(ds.slug);
    }

    return NextResponse.json({ synced: results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
