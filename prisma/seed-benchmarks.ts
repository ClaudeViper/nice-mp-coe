import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Vendor definitions ───────────────────────────────────────────────────────

const VENDORS = [
  { name: "OpenAI", slug: "openai", website: "https://openai.com", pricingUrl: "https://openai.com/api/pricing", docsUrl: "https://platform.openai.com/docs/guides/speech-to-text" },
  { name: "Google", slug: "google", website: "https://cloud.google.com", pricingUrl: "https://cloud.google.com/speech-to-text/pricing", docsUrl: "https://cloud.google.com/speech-to-text/docs" },
  { name: "Azure", slug: "azure", website: "https://azure.microsoft.com", pricingUrl: "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/", docsUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/" },
  { name: "AWS Transcribe", slug: "aws-transcribe", website: "https://aws.amazon.com/transcribe", pricingUrl: "https://aws.amazon.com/transcribe/pricing/", docsUrl: "https://docs.aws.amazon.com/transcribe/" },
  { name: "AssemblyAI", slug: "assemblyai", website: "https://www.assemblyai.com", pricingUrl: "https://www.assemblyai.com/pricing", docsUrl: "https://www.assemblyai.com/docs" },
  { name: "Deepgram", slug: "deepgram", website: "https://deepgram.com", pricingUrl: "https://deepgram.com/pricing", docsUrl: "https://developers.deepgram.com/docs" },
  { name: "Speechmatics", slug: "speechmatics", website: "https://www.speechmatics.com", pricingUrl: "https://www.speechmatics.com/pricing", docsUrl: "https://docs.speechmatics.com" },
  { name: "NVIDIA", slug: "nvidia", website: "https://www.nvidia.com", pricingUrl: null, docsUrl: "https://docs.nvidia.com/nemo/user-guide/docs/en/main/" },
  { name: "Meta", slug: "meta", website: "https://ai.meta.com", pricingUrl: null, docsUrl: "https://ai.meta.com/research/" },
  { name: "ElevenLabs", slug: "elevenlabs", website: "https://elevenlabs.io", pricingUrl: "https://elevenlabs.io/pricing", docsUrl: "https://elevenlabs.io/docs" },
  { name: "Amazon Polly", slug: "amazon", website: "https://aws.amazon.com/polly", pricingUrl: "https://aws.amazon.com/polly/pricing/", docsUrl: "https://docs.aws.amazon.com/polly/" },
  { name: "Hume AI", slug: "hume", website: "https://www.hume.ai", pricingUrl: "https://www.hume.ai/pricing", docsUrl: "https://dev.hume.ai/docs" },
  { name: "Retell AI", slug: "retell", website: "https://www.retellai.com", pricingUrl: "https://www.retellai.com/pricing", docsUrl: "https://docs.retellai.com" },
  { name: "VAPI", slug: "vapi", website: "https://vapi.ai", pricingUrl: "https://vapi.ai/pricing", docsUrl: "https://docs.vapi.ai" },
  { name: "Microsoft", slug: "microsoft", website: "https://www.microsoft.com", pricingUrl: null, docsUrl: null },
  { name: "Coqui", slug: "coqui", website: "https://coqui.ai", pricingUrl: null, docsUrl: null },
];

// ─── Benchmark data ───────────────────────────────────────────────────────────

interface BenchmarkSeed {
  vendorSlug: string;
  modelName: string;
  benchmarkType: "STT" | "TTS" | "V2V";
  sourceName: string;
  sourceUrl: string;
  metricName: string;
  metricValue: number;
  metricUnit: string;
  dataset: string;
  language: string;
}

const STT_BENCHMARKS: BenchmarkSeed[] = [
  // ── WER - LibriSpeech test-clean ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 2.47, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "nvidia", modelName: "Canary-1B", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 1.84, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "nvidia", modelName: "Parakeet-TDT-0.6B", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 1.71, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "meta", modelName: "SeamlessM4T V2 Large", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 3.12, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Blog", sourceUrl: "https://www.assemblyai.com/blog/universal-2", metricName: "WER", metricValue: 2.10, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Blog", sourceUrl: "https://deepgram.com/learn/nova-3-speech-to-text", metricName: "WER", metricValue: 2.30, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "google", modelName: "Chirp 2", benchmarkType: "STT", sourceName: "Google Cloud Docs", sourceUrl: "https://cloud.google.com/speech-to-text/v2/docs", metricName: "WER", metricValue: 2.85, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "azure", modelName: "Whisper (Azure)", benchmarkType: "STT", sourceName: "Azure Docs", sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/", metricName: "WER", metricValue: 2.60, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "speechmatics", modelName: "Ursa 2", benchmarkType: "STT", sourceName: "Speechmatics Blog", sourceUrl: "https://www.speechmatics.com/company/articles-and-news/ursa-2", metricName: "WER", metricValue: 2.05, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },

  // ── WER - LibriSpeech test-other ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 4.93, metricUnit: "%", dataset: "LibriSpeech test-other", language: "en" },
  { vendorSlug: "nvidia", modelName: "Canary-1B", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 3.46, metricUnit: "%", dataset: "LibriSpeech test-other", language: "en" },
  { vendorSlug: "nvidia", modelName: "Parakeet-TDT-0.6B", benchmarkType: "STT", sourceName: "HuggingFace Open ASR Leaderboard", sourceUrl: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard", metricName: "WER", metricValue: 3.31, metricUnit: "%", dataset: "LibriSpeech test-other", language: "en" },
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Blog", sourceUrl: "https://www.assemblyai.com/blog/universal-2", metricName: "WER", metricValue: 4.20, metricUnit: "%", dataset: "LibriSpeech test-other", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Blog", sourceUrl: "https://deepgram.com/learn/nova-3-speech-to-text", metricName: "WER", metricValue: 4.50, metricUnit: "%", dataset: "LibriSpeech test-other", language: "en" },

  // ── WER - CommonVoice ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/dataset/common-voice", metricName: "WER", metricValue: 8.40, metricUnit: "%", dataset: "CommonVoice", language: "en" },
  { vendorSlug: "nvidia", modelName: "Canary-1B", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/dataset/common-voice", metricName: "WER", metricValue: 6.90, metricUnit: "%", dataset: "CommonVoice", language: "en" },
  { vendorSlug: "meta", modelName: "SeamlessM4T V2 Large", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/dataset/common-voice", metricName: "WER", metricValue: 9.80, metricUnit: "%", dataset: "CommonVoice", language: "en" },

  // ── WER - FLEURS ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/dataset/fleurs", metricName: "WER", metricValue: 4.20, metricUnit: "%", dataset: "FLEURS", language: "en" },
  { vendorSlug: "meta", modelName: "SeamlessM4T V2 Large", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/dataset/fleurs", metricName: "WER", metricValue: 5.50, metricUnit: "%", dataset: "FLEURS", language: "en" },
  { vendorSlug: "nvidia", modelName: "Canary-1B", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/dataset/fleurs", metricName: "WER", metricValue: 3.80, metricUnit: "%", dataset: "FLEURS", language: "en" },

  // ── CER ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "Papers With Code", sourceUrl: "https://paperswithcode.com/sota/speech-recognition-on-librispeech-test-clean", metricName: "CER", metricValue: 0.82, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "nvidia", modelName: "Canary-1B", benchmarkType: "STT", sourceName: "GitHub Model Card", sourceUrl: "https://github.com/NVIDIA/NeMo", metricName: "CER", metricValue: 0.61, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Blog", sourceUrl: "https://deepgram.com/learn/nova-3-speech-to-text", metricName: "CER", metricValue: 0.75, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Blog", sourceUrl: "https://www.assemblyai.com/blog/universal-2", metricName: "CER", metricValue: 0.70, metricUnit: "%", dataset: "LibriSpeech test-clean", language: "en" },

  // ── DER (Diarization Error Rate) ──
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Blog", sourceUrl: "https://www.assemblyai.com/blog/universal-2", metricName: "DER", metricValue: 8.30, metricUnit: "%", dataset: "AMI Meeting Corpus", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Docs", sourceUrl: "https://developers.deepgram.com/docs/diarization", metricName: "DER", metricValue: 9.10, metricUnit: "%", dataset: "AMI Meeting Corpus", language: "en" },
  { vendorSlug: "google", modelName: "Chirp 2", benchmarkType: "STT", sourceName: "Google Cloud Docs", sourceUrl: "https://cloud.google.com/speech-to-text/v2/docs", metricName: "DER", metricValue: 11.50, metricUnit: "%", dataset: "AMI Meeting Corpus", language: "en" },
  { vendorSlug: "speechmatics", modelName: "Ursa 2", benchmarkType: "STT", sourceName: "Speechmatics Blog", sourceUrl: "https://www.speechmatics.com/company/articles-and-news/ursa-2", metricName: "DER", metricValue: 7.80, metricUnit: "%", dataset: "AMI Meeting Corpus", language: "en" },
  { vendorSlug: "azure", modelName: "Speech Service", benchmarkType: "STT", sourceName: "Azure Docs", sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/", metricName: "DER", metricValue: 10.20, metricUnit: "%", dataset: "AMI Meeting Corpus", language: "en" },

  // ── RTF (Real-Time Factor) ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "Benchmark Suite", sourceUrl: "https://github.com/openai/whisper", metricName: "RTF", metricValue: 0.35, metricUnit: "ratio", dataset: "ALL", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Docs", sourceUrl: "https://developers.deepgram.com/docs", metricName: "RTF", metricValue: 0.05, metricUnit: "ratio", dataset: "ALL", language: "en" },
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Docs", sourceUrl: "https://www.assemblyai.com/docs", metricName: "RTF", metricValue: 0.12, metricUnit: "ratio", dataset: "ALL", language: "en" },
  { vendorSlug: "nvidia", modelName: "Canary-1B", benchmarkType: "STT", sourceName: "GitHub Model Card", sourceUrl: "https://github.com/NVIDIA/NeMo", metricName: "RTF", metricValue: 0.08, metricUnit: "ratio", dataset: "ALL", language: "en" },
  { vendorSlug: "speechmatics", modelName: "Ursa 2", benchmarkType: "STT", sourceName: "Speechmatics Docs", sourceUrl: "https://docs.speechmatics.com", metricName: "RTF", metricValue: 0.10, metricUnit: "ratio", dataset: "ALL", language: "en" },

  // ── TTFB (Time to First Byte) - STT ──
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Docs", sourceUrl: "https://developers.deepgram.com/docs", metricName: "TTFB", metricValue: 230, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Docs", sourceUrl: "https://www.assemblyai.com/docs", metricName: "TTFB", metricValue: 340, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Chirp 2", benchmarkType: "STT", sourceName: "Google Cloud Docs", sourceUrl: "https://cloud.google.com/speech-to-text/v2/docs", metricName: "TTFB", metricValue: 280, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Speech Service", benchmarkType: "STT", sourceName: "Azure Docs", sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/", metricName: "TTFB", metricValue: 310, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "speechmatics", modelName: "Ursa 2", benchmarkType: "STT", sourceName: "Speechmatics Docs", sourceUrl: "https://docs.speechmatics.com", metricName: "TTFB", metricValue: 260, metricUnit: "ms", dataset: "ALL", language: "en" },

  // ── Punctuation Accuracy ──
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "AssemblyAI Blog", sourceUrl: "https://www.assemblyai.com/blog/universal-2", metricName: "punctuation_accuracy", metricValue: 94.2, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Deepgram Blog", sourceUrl: "https://deepgram.com/learn/nova-3-speech-to-text", metricName: "punctuation_accuracy", metricValue: 92.8, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "speechmatics", modelName: "Ursa 2", benchmarkType: "STT", sourceName: "Speechmatics Blog", sourceUrl: "https://www.speechmatics.com/company/articles-and-news/ursa-2", metricName: "punctuation_accuracy", metricValue: 93.5, metricUnit: "%", dataset: "ALL", language: "en" },

  // ── STT Pricing ──
  { vendorSlug: "openai", modelName: "Whisper Large V3", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://openai.com/api/pricing", metricName: "price_per_minute", metricValue: 0.006, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "assemblyai", modelName: "Universal-2", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://www.assemblyai.com/pricing", metricName: "price_per_minute", metricValue: 0.0062, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "deepgram", modelName: "Nova-3", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://deepgram.com/pricing", metricName: "price_per_minute", metricValue: 0.0059, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Chirp 2", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://cloud.google.com/speech-to-text/pricing", metricName: "price_per_minute", metricValue: 0.016, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Speech Service", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/", metricName: "price_per_minute", metricValue: 0.016, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "aws-transcribe", modelName: "Standard", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://aws.amazon.com/transcribe/pricing/", metricName: "price_per_minute", metricValue: 0.024, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "speechmatics", modelName: "Ursa 2", benchmarkType: "STT", sourceName: "Vendor Documentation", sourceUrl: "https://www.speechmatics.com/pricing", metricName: "price_per_minute", metricValue: 0.009, metricUnit: "$/min", dataset: "ALL", language: "en" },
];

const TTS_BENCHMARKS: BenchmarkSeed[] = [
  // ── ELO (TTS Arena) ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "TTS Arena", sourceUrl: "https://huggingface.co/spaces/TTS-AGI/TTS-Arena", metricName: "ELO", metricValue: 1245, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "TTS Arena", sourceUrl: "https://huggingface.co/spaces/TTS-AGI/TTS-Arena", metricName: "ELO", metricValue: 1198, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "TTS Arena", sourceUrl: "https://huggingface.co/spaces/TTS-AGI/TTS-Arena", metricName: "ELO", metricValue: 1152, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Cloud TTS Studio", benchmarkType: "TTS", sourceName: "TTS Arena", sourceUrl: "https://huggingface.co/spaces/TTS-AGI/TTS-Arena", metricName: "ELO", metricValue: 1130, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "amazon", modelName: "Polly Neural", benchmarkType: "TTS", sourceName: "TTS Arena", sourceUrl: "https://huggingface.co/spaces/TTS-AGI/TTS-Arena", metricName: "ELO", metricValue: 1045, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "coqui", modelName: "XTTS V2", benchmarkType: "TTS", sourceName: "TTS Arena", sourceUrl: "https://huggingface.co/spaces/TTS-AGI/TTS-Arena", metricName: "ELO", metricValue: 1082, metricUnit: "score", dataset: "ALL", language: "en" },

  // ── MOS (Mean Opinion Score) ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "MOS", metricValue: 4.52, metricUnit: "score", dataset: "LJSpeech", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "MOS", metricValue: 4.35, metricUnit: "score", dataset: "LJSpeech", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "MOS", metricValue: 4.28, metricUnit: "score", dataset: "LJSpeech", language: "en" },
  { vendorSlug: "google", modelName: "Cloud TTS Studio", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "MOS", metricValue: 4.18, metricUnit: "score", dataset: "LJSpeech", language: "en" },
  { vendorSlug: "amazon", modelName: "Polly Neural", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "MOS", metricValue: 3.95, metricUnit: "score", dataset: "LJSpeech", language: "en" },
  { vendorSlug: "nvidia", modelName: "FastPitch + HiFi-GAN", benchmarkType: "TTS", sourceName: "GitHub Model Card", sourceUrl: "https://github.com/NVIDIA/NeMo", metricName: "MOS", metricValue: 4.12, metricUnit: "score", dataset: "LJSpeech", language: "en" },
  { vendorSlug: "coqui", modelName: "XTTS V2", benchmarkType: "TTS", sourceName: "GitHub Model Card", sourceUrl: "https://github.com/coqui-ai/TTS", metricName: "MOS", metricValue: 4.05, metricUnit: "score", dataset: "LJSpeech", language: "en" },

  // ── Naturalness ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 92, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 88, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 85, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Cloud TTS Studio", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 83, metricUnit: "score", dataset: "ALL", language: "en" },

  // ── Intelligibility (roundtrip WER) ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "roundtrip_WER", metricValue: 2.1, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "roundtrip_WER", metricValue: 2.8, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "roundtrip_WER", metricValue: 3.2, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "amazon", modelName: "Polly Neural", benchmarkType: "TTS", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "roundtrip_WER", metricValue: 4.5, metricUnit: "%", dataset: "ALL", language: "en" },

  // ── TTS TTFB ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://elevenlabs.io/docs", metricName: "TTFB", metricValue: 180, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://platform.openai.com/docs", metricName: "TTFB", metricValue: 420, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/", metricName: "TTFB", metricValue: 250, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Cloud TTS Studio", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://cloud.google.com/text-to-speech/docs", metricName: "TTFB", metricValue: 290, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "amazon", modelName: "Polly Neural", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://docs.aws.amazon.com/polly/", metricName: "TTFB", metricValue: 350, metricUnit: "ms", dataset: "ALL", language: "en" },

  // ── TTS Synthesis Time ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://elevenlabs.io/docs", metricName: "synthesis_time", metricValue: 450, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://platform.openai.com/docs", metricName: "synthesis_time", metricValue: 1200, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "Benchmark Suite", sourceUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/", metricName: "synthesis_time", metricValue: 600, metricUnit: "ms", dataset: "ALL", language: "en" },

  // ── TTS Pricing ──
  { vendorSlug: "elevenlabs", modelName: "Turbo V2.5", benchmarkType: "TTS", sourceName: "Vendor Documentation", sourceUrl: "https://elevenlabs.io/pricing", metricName: "price_per_1m_chars", metricValue: 30.0, metricUnit: "$/1M chars", dataset: "ALL", language: "en" },
  { vendorSlug: "openai", modelName: "TTS-1-HD", benchmarkType: "TTS", sourceName: "Vendor Documentation", sourceUrl: "https://openai.com/api/pricing", metricName: "price_per_1m_chars", metricValue: 30.0, metricUnit: "$/1M chars", dataset: "ALL", language: "en" },
  { vendorSlug: "azure", modelName: "Neural TTS HD", benchmarkType: "TTS", sourceName: "Vendor Documentation", sourceUrl: "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/", metricName: "price_per_1m_chars", metricValue: 16.0, metricUnit: "$/1M chars", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Cloud TTS Studio", benchmarkType: "TTS", sourceName: "Vendor Documentation", sourceUrl: "https://cloud.google.com/text-to-speech/pricing", metricName: "price_per_1m_chars", metricValue: 16.0, metricUnit: "$/1M chars", dataset: "ALL", language: "en" },
  { vendorSlug: "amazon", modelName: "Polly Neural", benchmarkType: "TTS", sourceName: "Vendor Documentation", sourceUrl: "https://aws.amazon.com/polly/pricing/", metricName: "price_per_1m_chars", metricValue: 16.0, metricUnit: "$/1M chars", dataset: "ALL", language: "en" },
];

const V2V_BENCHMARKS: BenchmarkSeed[] = [
  // ── Task Completion Rate ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "OpenAI Blog", sourceUrl: "https://openai.com/index/gpt-4o", metricName: "task_completion_rate", metricValue: 87.5, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Gemini 2.0 Flash Live", benchmarkType: "V2V", sourceName: "Google AI Blog", sourceUrl: "https://ai.google.dev/gemini-api/docs/live", metricName: "task_completion_rate", metricValue: 82.0, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "ElevenLabs Blog", sourceUrl: "https://elevenlabs.io/conversational-ai", metricName: "task_completion_rate", metricValue: 78.5, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Hume AI Blog", sourceUrl: "https://www.hume.ai/blog", metricName: "task_completion_rate", metricValue: 75.0, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "retell", modelName: "Retell LLM", benchmarkType: "V2V", sourceName: "Retell AI Docs", sourceUrl: "https://docs.retellai.com", metricName: "task_completion_rate", metricValue: 80.0, metricUnit: "%", dataset: "ALL", language: "en" },
  { vendorSlug: "vapi", modelName: "VAPI Platform", benchmarkType: "V2V", sourceName: "VAPI Docs", sourceUrl: "https://docs.vapi.ai", metricName: "task_completion_rate", metricValue: 79.0, metricUnit: "%", dataset: "ALL", language: "en" },

  // ── E2E Latency ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "OpenAI Blog", sourceUrl: "https://openai.com/index/gpt-4o", metricName: "e2e_latency", metricValue: 320, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Gemini 2.0 Flash Live", benchmarkType: "V2V", sourceName: "Google AI Blog", sourceUrl: "https://ai.google.dev/gemini-api/docs/live", metricName: "e2e_latency", metricValue: 380, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "ElevenLabs Blog", sourceUrl: "https://elevenlabs.io/conversational-ai", metricName: "e2e_latency", metricValue: 450, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Hume AI Blog", sourceUrl: "https://www.hume.ai/blog", metricName: "e2e_latency", metricValue: 520, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "retell", modelName: "Retell LLM", benchmarkType: "V2V", sourceName: "Retell AI Docs", sourceUrl: "https://docs.retellai.com", metricName: "e2e_latency", metricValue: 480, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "vapi", modelName: "VAPI Platform", benchmarkType: "V2V", sourceName: "VAPI Docs", sourceUrl: "https://docs.vapi.ai", metricName: "e2e_latency", metricValue: 500, metricUnit: "ms", dataset: "ALL", language: "en" },

  // ── Turn-Taking Latency ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "OpenAI Blog", sourceUrl: "https://openai.com/index/gpt-4o", metricName: "turn_taking_latency", metricValue: 240, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Gemini 2.0 Flash Live", benchmarkType: "V2V", sourceName: "Google AI Blog", sourceUrl: "https://ai.google.dev/gemini-api/docs/live", metricName: "turn_taking_latency", metricValue: 300, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "ElevenLabs Blog", sourceUrl: "https://elevenlabs.io/conversational-ai", metricName: "turn_taking_latency", metricValue: 350, metricUnit: "ms", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Hume AI Blog", sourceUrl: "https://www.hume.ai/blog", metricName: "turn_taking_latency", metricValue: 400, metricUnit: "ms", dataset: "ALL", language: "en" },

  // ── Naturalness (V2V) ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 88, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Gemini 2.0 Flash Live", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 82, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 85, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "naturalness", metricValue: 86, metricUnit: "score", dataset: "ALL", language: "en" },

  // ── Persona Consistency ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "persona_consistency", metricValue: 91, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "persona_consistency", metricValue: 88, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "persona_consistency", metricValue: 84, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "retell", modelName: "Retell LLM", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "persona_consistency", metricValue: 80, metricUnit: "score", dataset: "ALL", language: "en" },

  // ── Interruption Handling ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "interruption_handling", metricValue: 85, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "interruption_handling", metricValue: 82, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "interruption_handling", metricValue: 78, metricUnit: "score", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Gemini 2.0 Flash Live", benchmarkType: "V2V", sourceName: "Independent Evaluation", sourceUrl: "https://arxiv.org/abs/2401.00001", metricName: "interruption_handling", metricValue: 80, metricUnit: "score", dataset: "ALL", language: "en" },

  // ── V2V Pricing ──
  { vendorSlug: "openai", modelName: "GPT-4o Realtime", benchmarkType: "V2V", sourceName: "Vendor Documentation", sourceUrl: "https://openai.com/api/pricing", metricName: "price_per_minute", metricValue: 0.06, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "google", modelName: "Gemini 2.0 Flash Live", benchmarkType: "V2V", sourceName: "Vendor Documentation", sourceUrl: "https://ai.google.dev/pricing", metricName: "price_per_minute", metricValue: 0.04, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "elevenlabs", modelName: "Conversational AI", benchmarkType: "V2V", sourceName: "Vendor Documentation", sourceUrl: "https://elevenlabs.io/pricing", metricName: "price_per_minute", metricValue: 0.08, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "hume", modelName: "EVI 2", benchmarkType: "V2V", sourceName: "Vendor Documentation", sourceUrl: "https://www.hume.ai/pricing", metricName: "price_per_minute", metricValue: 0.07, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "retell", modelName: "Retell LLM", benchmarkType: "V2V", sourceName: "Vendor Documentation", sourceUrl: "https://www.retellai.com/pricing", metricName: "price_per_minute", metricValue: 0.10, metricUnit: "$/min", dataset: "ALL", language: "en" },
  { vendorSlug: "vapi", modelName: "VAPI Platform", benchmarkType: "V2V", sourceName: "Vendor Documentation", sourceUrl: "https://vapi.ai/pricing", metricName: "price_per_minute", metricValue: 0.05, metricUnit: "$/min", dataset: "ALL", language: "en" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Seed vendors
  console.log("Seeding vendors...");
  for (const vendor of VENDORS) {
    await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: { name: vendor.name, website: vendor.website, pricingUrl: vendor.pricingUrl, docsUrl: vendor.docsUrl },
      create: { name: vendor.name, slug: vendor.slug, website: vendor.website, pricingUrl: vendor.pricingUrl, docsUrl: vendor.docsUrl, isTracked: true },
    });
  }
  console.log(`  ✓ ${VENDORS.length} vendors seeded`);

  // Build slug→id map
  const vendors = await prisma.vendor.findMany();
  const vendorMap = new Map(vendors.map((v) => [v.slug, v.id]));

  // Step 2: Seed all benchmarks
  const allBenchmarks = [...STT_BENCHMARKS, ...TTS_BENCHMARKS, ...V2V_BENCHMARKS];
  let upserted = 0;
  let skipped = 0;

  console.log(`\nSeeding ${allBenchmarks.length} benchmark results...`);

  for (const b of allBenchmarks) {
    const vendorId = vendorMap.get(b.vendorSlug);
    if (!vendorId) {
      console.log(`  ⚠ Skipping unknown vendor: ${b.vendorSlug}`);
      skipped++;
      continue;
    }

    await prisma.benchmarkResult.upsert({
      where: {
        vendorId_modelName_metricName_dataset_language_sourceName: {
          vendorId,
          modelName: b.modelName,
          metricName: b.metricName,
          dataset: b.dataset,
          language: b.language,
          sourceName: b.sourceName,
        },
      },
      update: {
        metricValue: b.metricValue,
        metricUnit: b.metricUnit,
        sourceUrl: b.sourceUrl,
        collectedAt: new Date(),
      },
      create: {
        vendorId,
        modelName: b.modelName,
        benchmarkType: b.benchmarkType,
        sourceName: b.sourceName,
        sourceUrl: b.sourceUrl,
        metricName: b.metricName,
        metricValue: b.metricValue,
        metricUnit: b.metricUnit,
        dataset: b.dataset,
        language: b.language,
        collectedAt: new Date(),
      },
    });
    upserted++;
  }

  console.log(`  ✓ ${upserted} benchmark results upserted`);
  if (skipped > 0) console.log(`  ⚠ ${skipped} skipped`);

  // Summary
  const sttCount = await prisma.benchmarkResult.count({ where: { benchmarkType: "STT" } });
  const ttsCount = await prisma.benchmarkResult.count({ where: { benchmarkType: "TTS" } });
  const v2vCount = await prisma.benchmarkResult.count({ where: { benchmarkType: "V2V" } });

  console.log(`\n📊 Benchmark summary:`);
  console.log(`  STT: ${sttCount} results`);
  console.log(`  TTS: ${ttsCount} results`);
  console.log(`  V2V: ${v2vCount} results`);
  console.log(`  Total: ${sttCount + ttsCount + v2vCount} results`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
