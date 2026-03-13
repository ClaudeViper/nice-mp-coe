import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Vendor Registry Data ─────────────────────────────────────────────────────

interface VendorRegistryEntry {
  slug: string;
  description: string;
  foundedYear: number | null;
  hqLocation: string | null;
  products: Array<{
    name: string;
    slug: string;
    category: "STT" | "TTS" | "V2V" | "NLU" | "Conversational" | "Platform";
    version: string | null;
    description: string | null;
    isGa: boolean;
  }>;
  deploymentOptions: Array<{
    type: "Cloud" | "OnPrem" | "Hybrid" | "Edge";
    details: string | null;
    regions: string[];
  }>;
  securityCerts: Array<{
    certName: string;
    certBody: string | null;
  }>;
  languages: Array<{
    language: string;
    langCode: string;
    accents: string[];
    category: "STT" | "TTS" | "V2V";
  }>;
  pricingTiers: Array<{
    tierName: string;
    category: "STT" | "TTS" | "V2V" | "Conversational" | "Platform";
    pricePerUnit: number;
    unit: string;
    volumeDiscount: string | null;
    commitmentTerms: string | null;
  }>;
  niceCompatibility: {
    cxoneIntegrationStatus: string;
    integrationMethod: string | null;
    buildVsBuyScore: number;
    buildVsBuyRationale: string;
    migrationComplexity: string;
    estimatedIntegrationDays: number | null;
    notes: string | null;
  };
}

const REGISTRY: VendorRegistryEntry[] = [
  // ── OpenAI ───────────────────────────────────────────────────────────────
  {
    slug: "openai",
    description: "Leading AI research company offering Whisper for STT, TTS API for speech synthesis, and GPT-4o Realtime for voice-to-voice conversations. Pioneered the open-source Whisper model that became an industry standard.",
    foundedYear: 2015,
    hqLocation: "San Francisco, CA",
    products: [
      { name: "Whisper Large V3", slug: "whisper-large-v3", category: "STT", version: "v3", description: "Open-source multilingual speech recognition model", isGa: true },
      { name: "Whisper Large V3 Turbo", slug: "whisper-large-v3-turbo", category: "STT", version: "v3-turbo", description: "Optimized Whisper for faster inference", isGa: true },
      { name: "GPT-4o Audio", slug: "gpt-4o-audio", category: "STT", version: null, description: "GPT-4o with native audio understanding", isGa: true },
      { name: "TTS-1", slug: "tts-1", category: "TTS", version: "1.0", description: "Standard text-to-speech model", isGa: true },
      { name: "TTS-1 HD", slug: "tts-1-hd", category: "TTS", version: "1.0", description: "High-definition text-to-speech", isGa: true },
      { name: "GPT-4o Realtime", slug: "gpt-4o-realtime", category: "V2V", version: null, description: "Voice-to-voice conversational AI via Realtime API", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "OpenAI API cloud-hosted endpoints", regions: ["Global"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "GDPR", certBody: "EU" },
      { certName: "CCPA", certBody: "California" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX", "AR"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR", "CA"], category: "STT" },
      { language: "German", langCode: "de", accents: ["DE", "AT"], category: "STT" },
      { language: "Chinese", langCode: "zh", accents: ["Mandarin", "Cantonese"], category: "STT" },
      { language: "Japanese", langCode: "ja", accents: [], category: "STT" },
      { language: "English", langCode: "en", accents: ["US", "UK"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Pay-as-you-go", category: "STT", pricePerUnit: 0.006, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Pay-as-you-go", category: "TTS", pricePerUnit: 15.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "HD", category: "TTS", pricePerUnit: 30.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Pay-as-you-go", category: "V2V", pricePerUnit: 0.06, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Compatible",
      integrationMethod: "REST API",
      buildVsBuyScore: 8,
      buildVsBuyRationale: "Mature API with excellent documentation. Easy REST integration. Strong community support. No native CXone connector but straightforward to build.",
      migrationComplexity: "Low",
      estimatedIntegrationDays: 15,
      notes: "Whisper can also be self-hosted for on-prem requirements",
    },
  },

  // ── Google ───────────────────────────────────────────────────────────────
  {
    slug: "google",
    description: "Google Cloud offers Speech-to-Text and Text-to-Speech APIs with deep neural network models, supporting 125+ languages. Part of the broader Google Cloud AI portfolio with enterprise-grade SLAs.",
    foundedYear: 1998,
    hqLocation: "Mountain View, CA",
    products: [
      { name: "Cloud Speech-to-Text V2", slug: "cloud-stt-v2", category: "STT", version: "v2", description: "Enhanced STT with Chirp model", isGa: true },
      { name: "Chirp", slug: "chirp", category: "STT", version: "2.0", description: "Universal speech model supporting 100+ languages", isGa: true },
      { name: "Cloud Text-to-Speech", slug: "cloud-tts", category: "TTS", version: "v1", description: "Neural TTS with WaveNet and Neural2 voices", isGa: true },
      { name: "Gemini Live", slug: "gemini-live", category: "V2V", version: null, description: "Real-time multimodal conversation with Gemini", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "Google Cloud Platform", regions: ["us-central1", "us-east1", "europe-west1", "europe-west4", "asia-east1", "asia-northeast1"] },
      { type: "OnPrem", details: "Speech-to-Text On-Prem via GKE Enterprise", regions: [] },
      { type: "Edge", details: "On-device models via ML Kit", regions: [] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "SOC3", certBody: "AICPA" },
      { certName: "ISO 27001", certBody: "ISO" },
      { certName: "ISO 27017", certBody: "ISO" },
      { certName: "HIPAA BAA", certBody: "HHS" },
      { certName: "FedRAMP High", certBody: "US Government" },
      { certName: "GDPR", certBody: "EU" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN", "SG", "ZA"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX", "AR", "CO"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR", "CA"], category: "STT" },
      { language: "Mandarin", langCode: "zh", accents: ["CN", "TW"], category: "STT" },
      { language: "Arabic", langCode: "ar", accents: ["SA", "EG", "AE"], category: "STT" },
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN"], category: "TTS" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Standard", category: "STT", pricePerUnit: 0.016, unit: "per minute", volumeDiscount: "Tiered: $0.012/min over 500K min/mo", commitmentTerms: null },
      { tierName: "Enhanced", category: "STT", pricePerUnit: 0.024, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Standard", category: "TTS", pricePerUnit: 4.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "WaveNet", category: "TTS", pricePerUnit: 16.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Neural2", category: "TTS", pricePerUnit: 16.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Certified",
      integrationMethod: "REST API + gRPC",
      buildVsBuyScore: 9,
      buildVsBuyRationale: "Enterprise-grade platform with existing CXone marketplace integrations. Strong compliance story (FedRAMP, HIPAA). On-prem option available. Excellent language coverage.",
      migrationComplexity: "Low",
      estimatedIntegrationDays: 10,
      notes: "Google CCAI has native CXone integrations via marketplace",
    },
  },

  // ── Azure ────────────────────────────────────────────────────────────────
  {
    slug: "azure",
    description: "Microsoft Azure Cognitive Services provides enterprise-grade Speech Services including real-time and batch STT, neural TTS with custom voice, and speech translation. Deep integration with Microsoft ecosystem.",
    foundedYear: 2010,
    hqLocation: "Redmond, WA",
    products: [
      { name: "Azure Speech-to-Text", slug: "azure-stt", category: "STT", version: "v3.2", description: "Real-time and batch transcription", isGa: true },
      { name: "Azure Custom Speech", slug: "azure-custom-speech", category: "STT", version: null, description: "Fine-tuned STT models for specific domains", isGa: true },
      { name: "Azure Neural TTS", slug: "azure-neural-tts", category: "TTS", version: null, description: "Neural text-to-speech with 400+ voices", isGa: true },
      { name: "Azure Custom Neural Voice", slug: "azure-custom-voice", category: "TTS", version: null, description: "Create custom branded voices", isGa: true },
      { name: "Azure Speech Translation", slug: "azure-speech-translation", category: "STT", version: null, description: "Real-time speech translation", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "Azure global cloud", regions: ["eastus", "westus2", "westeurope", "northeurope", "southeastasia", "eastasia", "australiaeast"] },
      { type: "OnPrem", details: "Speech containers for disconnected environments", regions: [] },
      { type: "Hybrid", details: "Azure Arc-enabled containers", regions: [] },
      { type: "Edge", details: "Embedded Speech SDK for IoT", regions: [] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "ISO 27001", certBody: "ISO" },
      { certName: "HIPAA BAA", certBody: "HHS" },
      { certName: "FedRAMP High", certBody: "US Government" },
      { certName: "GDPR", certBody: "EU" },
      { certName: "PCI DSS", certBody: "PCI SSC" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN", "CA", "NZ"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX", "AR", "CO", "CL"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR", "CA", "BE", "CH"], category: "STT" },
      { language: "German", langCode: "de", accents: ["DE", "AT", "CH"], category: "STT" },
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN"], category: "TTS" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Pay-as-you-go", category: "STT", pricePerUnit: 0.016, unit: "per minute", volumeDiscount: "Custom pricing for >500 hrs/mo", commitmentTerms: null },
      { tierName: "Commitment (1yr)", category: "STT", pricePerUnit: 0.0108, unit: "per minute", volumeDiscount: "33% discount with annual commitment", commitmentTerms: "1 year" },
      { tierName: "Neural", category: "TTS", pricePerUnit: 16.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Custom Neural", category: "TTS", pricePerUnit: 24.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Certified",
      integrationMethod: "REST API + SDK + WebSocket",
      buildVsBuyScore: 9,
      buildVsBuyRationale: "Best-in-class enterprise compliance (FedRAMP High, HIPAA). On-prem container deployment for regulated industries. Native Microsoft ecosystem integration. CXone marketplace connector available.",
      migrationComplexity: "Low",
      estimatedIntegrationDays: 10,
      notes: "Azure Bot Service provides additional CXone integration options",
    },
  },

  // ── AWS Transcribe ───────────────────────────────────────────────────────
  {
    slug: "aws-transcribe",
    description: "Amazon Transcribe provides automatic speech recognition powered by deep learning, with specialized models for medical and call analytics. Part of the AWS AI/ML stack with native Lambda/S3 integration.",
    foundedYear: 2006,
    hqLocation: "Seattle, WA",
    products: [
      { name: "Amazon Transcribe", slug: "transcribe", category: "STT", version: null, description: "General-purpose STT with streaming", isGa: true },
      { name: "Transcribe Medical", slug: "transcribe-medical", category: "STT", version: null, description: "HIPAA-eligible medical transcription", isGa: true },
      { name: "Transcribe Call Analytics", slug: "transcribe-call-analytics", category: "STT", version: null, description: "Contact center call analytics", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "AWS global infrastructure", regions: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "ISO 27001", certBody: "ISO" },
      { certName: "HIPAA BAA", certBody: "HHS" },
      { certName: "FedRAMP High", certBody: "US Government" },
      { certName: "PCI DSS", certBody: "PCI SSC" },
      { certName: "GDPR", certBody: "EU" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "US"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR", "CA"], category: "STT" },
    ],
    pricingTiers: [
      { tierName: "Standard", category: "STT", pricePerUnit: 0.024, unit: "per minute", volumeDiscount: "$0.015/min for 250K+ min/mo", commitmentTerms: null },
      { tierName: "Call Analytics", category: "STT", pricePerUnit: 0.03, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Compatible",
      integrationMethod: "REST API + WebSocket + SDK",
      buildVsBuyScore: 7,
      buildVsBuyRationale: "Strong compliance certifications. Call Analytics feature is purpose-built for contact centers. Limited TTS offering. Good if already on AWS infrastructure.",
      migrationComplexity: "Medium",
      estimatedIntegrationDays: 20,
      notes: "Amazon Connect competes with CXone, potential vendor lock-in concerns",
    },
  },

  // ── AssemblyAI ───────────────────────────────────────────────────────────
  {
    slug: "assemblyai",
    description: "AI-first company focused exclusively on speech understanding. Offers Universal-2 model with best-in-class accuracy, plus LeMUR for applying LLMs to transcripts. Strong developer experience and documentation.",
    foundedYear: 2017,
    hqLocation: "San Francisco, CA",
    products: [
      { name: "Universal-2", slug: "universal-2", category: "STT", version: "2.0", description: "State-of-the-art multilingual STT model", isGa: true },
      { name: "Nano", slug: "nano", category: "STT", version: null, description: "Fast, cost-effective STT for high-volume", isGa: true },
      { name: "LeMUR", slug: "lemur", category: "NLU", version: null, description: "LLM framework for audio intelligence", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "AssemblyAI hosted API", regions: ["US", "EU"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "HIPAA BAA", certBody: "HHS" },
      { certName: "GDPR", certBody: "EU" },
      { certName: "PCI DSS", certBody: "PCI SSC" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR"], category: "STT" },
      { language: "German", langCode: "de", accents: ["DE"], category: "STT" },
    ],
    pricingTiers: [
      { tierName: "Universal-2", category: "STT", pricePerUnit: 0.0062, unit: "per minute", volumeDiscount: "Volume pricing available", commitmentTerms: null },
      { tierName: "Nano", category: "STT", pricePerUnit: 0.002, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Compatible",
      integrationMethod: "REST API + WebSocket",
      buildVsBuyScore: 8,
      buildVsBuyRationale: "Excellent accuracy and developer experience. Strong compliance posture. LeMUR adds unique value for transcript analysis. STT-only focus means separate TTS vendor needed.",
      migrationComplexity: "Low",
      estimatedIntegrationDays: 12,
      notes: "Best choice if primary need is high-accuracy transcription with built-in analytics",
    },
  },

  // ── Deepgram ─────────────────────────────────────────────────────────────
  {
    slug: "deepgram",
    description: "AI speech recognition company offering Nova-2 with industry-leading speed and accuracy. Specializes in real-time streaming transcription for contact centers, media, and enterprise applications.",
    foundedYear: 2015,
    hqLocation: "San Francisco, CA",
    products: [
      { name: "Nova-2", slug: "nova-2", category: "STT", version: "2.0", description: "Fastest and most accurate STT model", isGa: true },
      { name: "Nova-2 Medical", slug: "nova-2-medical", category: "STT", version: "2.0", description: "Medical terminology optimized", isGa: true },
      { name: "Aura TTS", slug: "aura-tts", category: "TTS", version: "1.0", description: "Real-time text-to-speech", isGa: true },
      { name: "Voice Agent API", slug: "voice-agent-api", category: "V2V", version: null, description: "End-to-end voice agent platform", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "Deepgram hosted API", regions: ["US", "EU"] },
      { type: "OnPrem", details: "Self-hosted deployment for enterprise", regions: [] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "HIPAA BAA", certBody: "HHS" },
      { certName: "GDPR", certBody: "EU" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN", "NZ"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX", "LATAM"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR", "CA"], category: "STT" },
      { language: "German", langCode: "de", accents: ["DE"], category: "STT" },
      { language: "Portuguese", langCode: "pt", accents: ["BR", "PT"], category: "STT" },
      { language: "English", langCode: "en", accents: ["US"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Pay-as-you-go", category: "STT", pricePerUnit: 0.0043, unit: "per minute", volumeDiscount: "Volume discounts at 10K+ hrs/mo", commitmentTerms: null },
      { tierName: "Growth", category: "STT", pricePerUnit: 0.0036, unit: "per minute", volumeDiscount: "15% discount", commitmentTerms: "Annual contract" },
      { tierName: "Pay-as-you-go", category: "TTS", pricePerUnit: 0.015, unit: "per 1K characters", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Compatible",
      integrationMethod: "REST API + WebSocket",
      buildVsBuyScore: 8,
      buildVsBuyRationale: "Excellent real-time streaming performance, purpose-built for contact centers. On-prem option for regulated environments. Competitive pricing at scale. Now offers TTS and voice agent capabilities.",
      migrationComplexity: "Low",
      estimatedIntegrationDays: 12,
      notes: "Strong fit for real-time contact center use cases",
    },
  },

  // ── Speechmatics ─────────────────────────────────────────────────────────
  {
    slug: "speechmatics",
    description: "UK-based speech technology company offering the Ursa model for multilingual STT. Known for excellent accent handling across 50+ languages and strong European compliance posture.",
    foundedYear: 2009,
    hqLocation: "Cambridge, UK",
    products: [
      { name: "Ursa", slug: "ursa", category: "STT", version: "2.0", description: "Multi-language real-time and batch STT", isGa: true },
      { name: "Flow", slug: "flow", category: "Platform", version: null, description: "Real-time speech processing pipeline", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "Speechmatics SaaS", regions: ["EU", "US"] },
      { type: "OnPrem", details: "Containerized on-premise deployment", regions: [] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "ISO 27001", certBody: "ISO" },
      { certName: "GDPR", certBody: "EU" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN", "SG", "ZA", "NZ", "IE"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX", "AR", "CO"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR", "CA", "BE"], category: "STT" },
      { language: "German", langCode: "de", accents: ["DE", "AT", "CH"], category: "STT" },
      { language: "Arabic", langCode: "ar", accents: ["SA", "EG", "AE", "MA"], category: "STT" },
      { language: "Hindi", langCode: "hi", accents: ["IN"], category: "STT" },
    ],
    pricingTiers: [
      { tierName: "Standard", category: "STT", pricePerUnit: 0.024, unit: "per minute", volumeDiscount: "Custom pricing for enterprise volumes", commitmentTerms: null },
      { tierName: "Enterprise", category: "STT", pricePerUnit: 0.015, unit: "per minute", volumeDiscount: "Volume-based", commitmentTerms: "Annual contract" },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Compatible",
      integrationMethod: "REST API + WebSocket",
      buildVsBuyScore: 7,
      buildVsBuyRationale: "Excellent multilingual and accent support, important for global contact centers. Strong EU compliance. On-prem available. STT-only, would need separate TTS vendor.",
      migrationComplexity: "Medium",
      estimatedIntegrationDays: 18,
      notes: "Best choice for multilingual European contact center deployments",
    },
  },

  // ── ElevenLabs ───────────────────────────────────────────────────────────
  {
    slug: "elevenlabs",
    description: "Leading AI voice company offering the most natural-sounding TTS, voice cloning, and conversational AI. Powers millions of content creators and enterprises with ultra-realistic synthetic speech.",
    foundedYear: 2022,
    hqLocation: "New York, NY",
    products: [
      { name: "Multilingual V2", slug: "multilingual-v2", category: "TTS", version: "v2", description: "Premium multilingual TTS", isGa: true },
      { name: "Turbo V2.5", slug: "turbo-v2-5", category: "TTS", version: "v2.5", description: "Low-latency streaming TTS", isGa: true },
      { name: "Flash", slug: "flash", category: "TTS", version: null, description: "Fastest TTS for real-time applications", isGa: true },
      { name: "Voice Cloning", slug: "voice-cloning", category: "TTS", version: null, description: "Create custom voice from audio samples", isGa: true },
      { name: "Conversational AI", slug: "conversational-ai", category: "V2V", version: null, description: "End-to-end voice agent platform", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "ElevenLabs hosted API", regions: ["Global"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "GDPR", certBody: "EU" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU"], category: "TTS" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX"], category: "TTS" },
      { language: "French", langCode: "fr", accents: ["FR"], category: "TTS" },
      { language: "German", langCode: "de", accents: ["DE"], category: "TTS" },
      { language: "Japanese", langCode: "ja", accents: [], category: "TTS" },
      { language: "Korean", langCode: "ko", accents: [], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Starter", category: "TTS", pricePerUnit: 0.30, unit: "per 1K characters", volumeDiscount: null, commitmentTerms: "$5/mo plan" },
      { tierName: "Scale", category: "TTS", pricePerUnit: 0.18, unit: "per 1K characters", volumeDiscount: "40% discount vs Starter", commitmentTerms: "$99/mo plan" },
      { tierName: "Enterprise", category: "TTS", pricePerUnit: 0.11, unit: "per 1K characters", volumeDiscount: "Custom volume pricing", commitmentTerms: "Annual contract" },
      { tierName: "Conversational", category: "Conversational", pricePerUnit: 0.08, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Requires Custom Integration",
      integrationMethod: "REST API + WebSocket",
      buildVsBuyScore: 7,
      buildVsBuyRationale: "Best-in-class voice quality for TTS. Strong for outbound IVR and virtual agents. Conversational AI product adds V2V capabilities. Young company, growing compliance posture.",
      migrationComplexity: "Medium",
      estimatedIntegrationDays: 20,
      notes: "Ideal for use cases where voice quality is the top priority",
    },
  },

  // ── Amazon Polly ─────────────────────────────────────────────────────────
  {
    slug: "amazon",
    description: "Amazon Polly is a cloud TTS service that turns text into lifelike speech using advanced deep learning. Part of AWS AI Services with neural and standard engine options across 30+ languages.",
    foundedYear: 2006,
    hqLocation: "Seattle, WA",
    products: [
      { name: "Amazon Polly Neural", slug: "polly-neural", category: "TTS", version: null, description: "Neural TTS engine", isGa: true },
      { name: "Amazon Polly Standard", slug: "polly-standard", category: "TTS", version: null, description: "Standard TTS engine", isGa: true },
      { name: "Amazon Polly Long-Form", slug: "polly-long-form", category: "TTS", version: null, description: "Optimized for long-form content", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "AWS global infrastructure", regions: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "ISO 27001", certBody: "ISO" },
      { certName: "HIPAA BAA", certBody: "HHS" },
      { certName: "FedRAMP High", certBody: "US Government" },
      { certName: "PCI DSS", certBody: "PCI SSC" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK", "AU", "IN", "ZA", "NZ"], category: "TTS" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX", "US"], category: "TTS" },
      { language: "French", langCode: "fr", accents: ["FR", "CA"], category: "TTS" },
      { language: "German", langCode: "de", accents: ["DE", "AT"], category: "TTS" },
      { language: "Japanese", langCode: "ja", accents: [], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Standard", category: "TTS", pricePerUnit: 4.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Neural", category: "TTS", pricePerUnit: 16.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Long-Form", category: "TTS", pricePerUnit: 100.0, unit: "per 1M characters", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Compatible",
      integrationMethod: "REST API + SDK",
      buildVsBuyScore: 7,
      buildVsBuyRationale: "Mature, reliable TTS with excellent compliance. Good for organizations already on AWS. Competitive pricing. Less natural than ElevenLabs but more enterprise-ready.",
      migrationComplexity: "Low",
      estimatedIntegrationDays: 10,
      notes: "Often used as secondary TTS alongside Amazon Connect",
    },
  },

  // ── Hume AI ──────────────────────────────────────────────────────────────
  {
    slug: "hume",
    description: "Hume AI builds emotionally intelligent voice interfaces. Their Empathic Voice Interface (EVI) can understand and respond to emotional nuances in speech, enabling more natural human-AI conversations.",
    foundedYear: 2021,
    hqLocation: "New York, NY",
    products: [
      { name: "EVI 2", slug: "evi-2", category: "V2V", version: "2.0", description: "Empathic Voice Interface with emotion understanding", isGa: true },
      { name: "Expression Measurement", slug: "expression-measurement", category: "NLU", version: null, description: "Emotion and expression analysis API", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "Hume hosted API", regions: ["US"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "GDPR", certBody: "EU" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US"], category: "V2V" },
    ],
    pricingTiers: [
      { tierName: "Pay-as-you-go", category: "V2V", pricePerUnit: 0.07, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Enterprise", category: "V2V", pricePerUnit: 0.05, unit: "per minute", volumeDiscount: "Custom pricing", commitmentTerms: "Annual contract" },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Requires Custom Integration",
      integrationMethod: "WebSocket API",
      buildVsBuyScore: 6,
      buildVsBuyRationale: "Unique emotion-aware capabilities valuable for contact center sentiment analysis. Early-stage company. Limited language support. WebSocket integration requires more development effort.",
      migrationComplexity: "High",
      estimatedIntegrationDays: 30,
      notes: "Best suited for emotion-aware use cases in customer service",
    },
  },

  // ── Retell AI ────────────────────────────────────────────────────────────
  {
    slug: "retell",
    description: "Retell AI provides a developer platform for building, deploying, and managing AI voice agents. Purpose-built for phone call automation with natural conversation handling and telephony integration.",
    foundedYear: 2023,
    hqLocation: "San Francisco, CA",
    products: [
      { name: "Retell Voice Agent", slug: "voice-agent", category: "V2V", version: null, description: "End-to-end voice agent platform", isGa: true },
      { name: "Retell Phone", slug: "phone", category: "Platform", version: null, description: "Managed telephony for voice agents", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "Retell hosted platform", regions: ["US"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "HIPAA BAA", certBody: "HHS" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US"], category: "V2V" },
      { language: "Spanish", langCode: "es", accents: ["US"], category: "V2V" },
    ],
    pricingTiers: [
      { tierName: "Pay-as-you-go", category: "V2V", pricePerUnit: 0.07, unit: "per minute", volumeDiscount: null, commitmentTerms: null },
      { tierName: "Enterprise", category: "V2V", pricePerUnit: 0.05, unit: "per minute", volumeDiscount: "Custom volume pricing", commitmentTerms: "Annual contract" },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Requires Custom Integration",
      integrationMethod: "REST API + WebSocket",
      buildVsBuyScore: 6,
      buildVsBuyRationale: "Purpose-built for phone automation. Good developer experience. Very early-stage company. Limited language support. Telephony integration built-in but may compete with CXone telephony.",
      migrationComplexity: "High",
      estimatedIntegrationDays: 25,
      notes: "Good option for specific phone automation use cases outside CXone",
    },
  },

  // ── VAPI ─────────────────────────────────────────────────────────────────
  {
    slug: "vapi",
    description: "VAPI is a platform for building voice AI agents with support for multiple LLM/STT/TTS providers. Focuses on developer experience with easy orchestration of voice pipelines and telephony integration.",
    foundedYear: 2023,
    hqLocation: "San Francisco, CA",
    products: [
      { name: "VAPI Platform", slug: "vapi-platform", category: "V2V", version: null, description: "Voice AI orchestration platform", isGa: true },
      { name: "VAPI Phone", slug: "vapi-phone", category: "Platform", version: null, description: "Managed phone numbers for voice agents", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "VAPI hosted platform", regions: ["US"] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "HIPAA BAA", certBody: "HHS" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US"], category: "V2V" },
      { language: "Spanish", langCode: "es", accents: ["US", "MX"], category: "V2V" },
    ],
    pricingTiers: [
      { tierName: "Pay-as-you-go", category: "V2V", pricePerUnit: 0.05, unit: "per minute", volumeDiscount: null, commitmentTerms: "Plus provider costs" },
      { tierName: "Enterprise", category: "V2V", pricePerUnit: 0.03, unit: "per minute", volumeDiscount: "Custom pricing", commitmentTerms: "Annual contract" },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Requires Custom Integration",
      integrationMethod: "REST API + WebSocket",
      buildVsBuyScore: 5,
      buildVsBuyRationale: "Flexible orchestration platform. Supports mix-and-match STT/TTS/LLM providers. Very early-stage. May add unnecessary abstraction layer when integrating with CXone.",
      migrationComplexity: "High",
      estimatedIntegrationDays: 30,
      notes: "More useful as evaluation/prototyping tool than production CXone integration",
    },
  },

  // ── NVIDIA ───────────────────────────────────────────────────────────────
  {
    slug: "nvidia",
    description: "NVIDIA provides GPU-accelerated speech AI models through NVIDIA NeMo and Riva. Offers self-hosted STT and TTS with industry-leading inference performance on NVIDIA hardware.",
    foundedYear: 1993,
    hqLocation: "Santa Clara, CA",
    products: [
      { name: "Riva ASR", slug: "riva-asr", category: "STT", version: "2.0", description: "GPU-accelerated automatic speech recognition", isGa: true },
      { name: "Riva TTS", slug: "riva-tts", category: "TTS", version: "2.0", description: "GPU-accelerated text-to-speech synthesis", isGa: true },
      { name: "Canary", slug: "canary", category: "STT", version: "1B", description: "Multi-language ASR foundation model", isGa: true },
      { name: "Parakeet", slug: "parakeet", category: "STT", version: "1.1B", description: "English-optimized ASR model", isGa: true },
    ],
    deploymentOptions: [
      { type: "Cloud", details: "NVIDIA NGC / DGX Cloud", regions: ["Global"] },
      { type: "OnPrem", details: "Self-hosted on NVIDIA GPUs", regions: [] },
      { type: "Edge", details: "Jetson platform for edge deployment", regions: [] },
    ],
    securityCerts: [
      { certName: "SOC2 Type II", certBody: "AICPA" },
      { certName: "ISO 27001", certBody: "ISO" },
    ],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES"], category: "STT" },
      { language: "German", langCode: "de", accents: ["DE"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR"], category: "STT" },
      { language: "English", langCode: "en", accents: ["US"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Riva Enterprise", category: "STT", pricePerUnit: 0.0, unit: "self-hosted (GPU cost only)", volumeDiscount: null, commitmentTerms: "NVIDIA AI Enterprise license" },
      { tierName: "Riva Enterprise", category: "TTS", pricePerUnit: 0.0, unit: "self-hosted (GPU cost only)", volumeDiscount: null, commitmentTerms: "NVIDIA AI Enterprise license" },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Requires Custom Integration",
      integrationMethod: "gRPC API",
      buildVsBuyScore: 5,
      buildVsBuyRationale: "Best option for self-hosted/on-prem with maximum performance. Requires significant GPU infrastructure investment. No per-API-call costs. Strong for regulated industries needing data sovereignty.",
      migrationComplexity: "Very High",
      estimatedIntegrationDays: 45,
      notes: "Ideal for organizations with existing NVIDIA GPU infrastructure and strict data sovereignty requirements",
    },
  },

  // ── Meta ─────────────────────────────────────────────────────────────────
  {
    slug: "meta",
    description: "Meta AI Research produces open-source speech models including SeamlessM4T for multilingual speech translation, MMS for massively multilingual speech, and Voicebox for generative speech synthesis.",
    foundedYear: 2004,
    hqLocation: "Menlo Park, CA",
    products: [
      { name: "SeamlessM4T V2", slug: "seamlessm4t-v2", category: "STT", version: "v2", description: "Massively multilingual speech translation", isGa: true },
      { name: "MMS", slug: "mms", category: "STT", version: "1.0", description: "Massively Multilingual Speech - 1100+ languages", isGa: true },
      { name: "Voicebox", slug: "voicebox", category: "TTS", version: null, description: "Generative AI model for speech", isGa: false },
    ],
    deploymentOptions: [
      { type: "OnPrem", details: "Open-source self-hosted models", regions: [] },
      { type: "Cloud", details: "Via HuggingFace Inference API", regions: ["Global"] },
    ],
    securityCerts: [],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK"], category: "STT" },
      { language: "Spanish", langCode: "es", accents: ["ES", "MX"], category: "STT" },
      { language: "French", langCode: "fr", accents: ["FR"], category: "STT" },
      { language: "Chinese", langCode: "zh", accents: ["CN"], category: "STT" },
      { language: "Hindi", langCode: "hi", accents: ["IN"], category: "STT" },
      { language: "Arabic", langCode: "ar", accents: ["SA"], category: "STT" },
    ],
    pricingTiers: [
      { tierName: "Open Source", category: "STT", pricePerUnit: 0.0, unit: "free (compute cost only)", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Requires Custom Integration",
      integrationMethod: "Self-hosted",
      buildVsBuyScore: 4,
      buildVsBuyRationale: "Open-source models with no licensing cost. Requires significant engineering to productionize. No enterprise support or SLAs. Best for research and prototyping.",
      migrationComplexity: "Very High",
      estimatedIntegrationDays: 60,
      notes: "Research-grade models. Best for organizations with ML engineering capacity and specific multilingual needs.",
    },
  },

  // ── Microsoft ────────────────────────────────────────────────────────────
  {
    slug: "microsoft",
    description: "Microsoft Research contributes open-source speech models like SpeechT5 and ValleX. Distinct from Azure commercial offerings, these are research-grade models available for self-hosted deployment.",
    foundedYear: 1975,
    hqLocation: "Redmond, WA",
    products: [
      { name: "SpeechT5", slug: "speecht5", category: "TTS", version: null, description: "Unified-modal speech-text pre-training", isGa: true },
      { name: "Valle-X", slug: "valle-x", category: "TTS", version: null, description: "Cross-lingual speech synthesis", isGa: false },
    ],
    deploymentOptions: [
      { type: "OnPrem", details: "Open-source self-hosted", regions: [] },
      { type: "Cloud", details: "Via HuggingFace Inference API", regions: ["Global"] },
    ],
    securityCerts: [],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Open Source", category: "TTS", pricePerUnit: 0.0, unit: "free (compute cost only)", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Not Compatible",
      integrationMethod: "Self-hosted",
      buildVsBuyScore: 3,
      buildVsBuyRationale: "Research models not production-ready. Use Azure Speech Services instead for enterprise needs. No support or SLAs.",
      migrationComplexity: "Very High",
      estimatedIntegrationDays: null,
      notes: "For Azure commercial speech, see the 'azure' vendor entry",
    },
  },

  // ── Coqui ────────────────────────────────────────────────────────────────
  {
    slug: "coqui",
    description: "Coqui (formerly Mozilla TTS) provides open-source text-to-speech with the XTTS model supporting voice cloning and multilingual synthesis. Community-driven project after the company pivoted.",
    foundedYear: 2021,
    hqLocation: "Berlin, Germany",
    products: [
      { name: "XTTS V2", slug: "xtts-v2", category: "TTS", version: "v2", description: "Cross-lingual TTS with voice cloning", isGa: true },
      { name: "VITS", slug: "vits", category: "TTS", version: null, description: "End-to-end TTS model", isGa: true },
    ],
    deploymentOptions: [
      { type: "OnPrem", details: "Open-source self-hosted (pip install)", regions: [] },
    ],
    securityCerts: [],
    languages: [
      { language: "English", langCode: "en", accents: ["US", "UK"], category: "TTS" },
      { language: "Spanish", langCode: "es", accents: ["ES"], category: "TTS" },
      { language: "French", langCode: "fr", accents: ["FR"], category: "TTS" },
      { language: "German", langCode: "de", accents: ["DE"], category: "TTS" },
      { language: "Portuguese", langCode: "pt", accents: ["BR"], category: "TTS" },
    ],
    pricingTiers: [
      { tierName: "Open Source", category: "TTS", pricePerUnit: 0.0, unit: "free (compute cost only)", volumeDiscount: null, commitmentTerms: null },
    ],
    niceCompatibility: {
      cxoneIntegrationStatus: "Not Compatible",
      integrationMethod: "Self-hosted",
      buildVsBuyScore: 3,
      buildVsBuyRationale: "Open-source with no licensing costs. No enterprise support, SLAs, or managed service. Company pivoted, community-maintained. Good for prototyping, not production contact center.",
      migrationComplexity: "Very High",
      estimatedIntegrationDays: null,
      notes: "Useful for prototyping and evaluation. Not recommended for production CXone deployment.",
    },
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding vendor registry data...\n");

  for (const entry of REGISTRY) {
    const vendor = await prisma.vendor.findUnique({ where: { slug: entry.slug } });
    if (!vendor) {
      console.log(`  ✗ Vendor "${entry.slug}" not found in DB, skipping`);
      continue;
    }

    // Update vendor base fields
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        description: entry.description,
        foundedYear: entry.foundedYear,
        hqLocation: entry.hqLocation,
      },
    });

    // Upsert products
    for (const p of entry.products) {
      await prisma.vendorProduct.upsert({
        where: { vendorId_slug: { vendorId: vendor.id, slug: p.slug } },
        update: { name: p.name, category: p.category, version: p.version, description: p.description, isGa: p.isGa },
        create: { vendorId: vendor.id, name: p.name, slug: p.slug, category: p.category, version: p.version, description: p.description, isGa: p.isGa },
      });
    }

    // Upsert deployment options
    for (const d of entry.deploymentOptions) {
      await prisma.vendorDeploymentOption.upsert({
        where: { vendorId_type: { vendorId: vendor.id, type: d.type } },
        update: { details: d.details, regions: d.regions },
        create: { vendorId: vendor.id, type: d.type, details: d.details, regions: d.regions },
      });
    }

    // Upsert security certs
    for (const c of entry.securityCerts) {
      await prisma.vendorSecurityCert.upsert({
        where: { vendorId_certName: { vendorId: vendor.id, certName: c.certName } },
        update: { certBody: c.certBody },
        create: { vendorId: vendor.id, certName: c.certName, certBody: c.certBody },
      });
    }

    // Upsert languages
    for (const l of entry.languages) {
      await prisma.vendorLanguage.upsert({
        where: { vendorId_langCode_category: { vendorId: vendor.id, langCode: l.langCode, category: l.category } },
        update: { language: l.language, accents: l.accents },
        create: { vendorId: vendor.id, language: l.language, langCode: l.langCode, accents: l.accents, category: l.category },
      });
    }

    // Upsert pricing tiers
    for (const t of entry.pricingTiers) {
      await prisma.vendorPricingTier.upsert({
        where: { vendorId_tierName_category: { vendorId: vendor.id, tierName: t.tierName, category: t.category } },
        update: {
          pricePerUnit: new Prisma.Decimal(t.pricePerUnit),
          unit: t.unit,
          volumeDiscount: t.volumeDiscount,
          commitmentTerms: t.commitmentTerms,
        },
        create: {
          vendorId: vendor.id,
          tierName: t.tierName,
          category: t.category,
          pricePerUnit: new Prisma.Decimal(t.pricePerUnit),
          unit: t.unit,
          volumeDiscount: t.volumeDiscount,
          commitmentTerms: t.commitmentTerms,
        },
      });
    }

    // Upsert NICE compatibility
    const nc = entry.niceCompatibility;
    await prisma.niceCompatibility.upsert({
      where: { vendorId: vendor.id },
      update: {
        cxoneIntegrationStatus: nc.cxoneIntegrationStatus,
        integrationMethod: nc.integrationMethod,
        buildVsBuyScore: nc.buildVsBuyScore,
        buildVsBuyRationale: nc.buildVsBuyRationale,
        migrationComplexity: nc.migrationComplexity,
        estimatedIntegrationDays: nc.estimatedIntegrationDays,
        notes: nc.notes,
        assessedAt: new Date(),
      },
      create: {
        vendorId: vendor.id,
        cxoneIntegrationStatus: nc.cxoneIntegrationStatus,
        integrationMethod: nc.integrationMethod,
        buildVsBuyScore: nc.buildVsBuyScore,
        buildVsBuyRationale: nc.buildVsBuyRationale,
        migrationComplexity: nc.migrationComplexity,
        estimatedIntegrationDays: nc.estimatedIntegrationDays,
        notes: nc.notes,
        assessedAt: new Date(),
      },
    });

    console.log(`  ✓ ${vendor.name} — ${entry.products.length} products, ${entry.deploymentOptions.length} deployments, ${entry.securityCerts.length} certs, ${entry.languages.length} languages, ${entry.pricingTiers.length} pricing tiers`);
  }

  console.log(`\nSeeded registry data for ${REGISTRY.length} vendors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
