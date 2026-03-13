import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const VENDORS = [
  // STT vendors
  { name: "OpenAI", slug: "openai", website: "https://openai.com", pricingUrl: "https://openai.com/api/pricing", docsUrl: "https://platform.openai.com/docs/guides/speech-to-text" },
  { name: "Google", slug: "google", website: "https://cloud.google.com", pricingUrl: "https://cloud.google.com/speech-to-text/pricing", docsUrl: "https://cloud.google.com/speech-to-text/docs" },
  { name: "Azure", slug: "azure", website: "https://azure.microsoft.com", pricingUrl: "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/", docsUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/" },
  { name: "AWS Transcribe", slug: "aws-transcribe", website: "https://aws.amazon.com/transcribe", pricingUrl: "https://aws.amazon.com/transcribe/pricing/", docsUrl: "https://docs.aws.amazon.com/transcribe/" },
  { name: "AssemblyAI", slug: "assemblyai", website: "https://www.assemblyai.com", pricingUrl: "https://www.assemblyai.com/pricing", docsUrl: "https://www.assemblyai.com/docs" },
  { name: "Deepgram", slug: "deepgram", website: "https://deepgram.com", pricingUrl: "https://deepgram.com/pricing", docsUrl: "https://developers.deepgram.com/docs" },
  { name: "Speechmatics", slug: "speechmatics", website: "https://www.speechmatics.com", pricingUrl: "https://www.speechmatics.com/pricing", docsUrl: "https://docs.speechmatics.com" },
  { name: "NVIDIA", slug: "nvidia", website: "https://www.nvidia.com", pricingUrl: null, docsUrl: "https://docs.nvidia.com/nemo/user-guide/docs/en/main/" },
  { name: "Meta", slug: "meta", website: "https://ai.meta.com", pricingUrl: null, docsUrl: "https://ai.meta.com/research/" },

  // TTS vendors
  { name: "ElevenLabs", slug: "elevenlabs", website: "https://elevenlabs.io", pricingUrl: "https://elevenlabs.io/pricing", docsUrl: "https://elevenlabs.io/docs" },
  { name: "Amazon Polly", slug: "amazon", website: "https://aws.amazon.com/polly", pricingUrl: "https://aws.amazon.com/polly/pricing/", docsUrl: "https://docs.aws.amazon.com/polly/" },

  // V2V vendors
  { name: "Hume AI", slug: "hume", website: "https://www.hume.ai", pricingUrl: "https://www.hume.ai/pricing", docsUrl: "https://dev.hume.ai/docs" },
  { name: "Retell AI", slug: "retell", website: "https://www.retellai.com", pricingUrl: "https://www.retellai.com/pricing", docsUrl: "https://docs.retellai.com" },
  { name: "VAPI", slug: "vapi", website: "https://vapi.ai", pricingUrl: "https://vapi.ai/pricing", docsUrl: "https://docs.vapi.ai" },

  // Research / open-source
  { name: "Microsoft", slug: "microsoft", website: "https://www.microsoft.com", pricingUrl: null, docsUrl: null },
  { name: "Coqui", slug: "coqui", website: "https://coqui.ai", pricingUrl: null, docsUrl: null },
];

async function main() {
  console.log("Seeding vendors...");

  for (const vendor of VENDORS) {
    await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: {
        name: vendor.name,
        website: vendor.website,
        pricingUrl: vendor.pricingUrl,
        docsUrl: vendor.docsUrl,
      },
      create: {
        name: vendor.name,
        slug: vendor.slug,
        website: vendor.website,
        pricingUrl: vendor.pricingUrl,
        docsUrl: vendor.docsUrl,
        isTracked: true,
      },
    });
    console.log(`  ✓ ${vendor.name} (${vendor.slug})`);
  }

  console.log(`\nSeeded ${VENDORS.length} vendors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
