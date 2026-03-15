/**
 * Vendor endpoint registry — free-tier APIs, known endpoints, model lists.
 * Used by the Evaluate wizard to auto-fill connection details and show
 * free-tier availability badges.
 */

export interface VendorModel {
  id: string;
  name: string;
  notes?: string;
  isDefault?: boolean;
}

export interface VendorEndpoint {
  /** Primary REST endpoint URL */
  endpoint: string;
  /** Available models / voices for this type */
  models: VendorModel[];
  /**
   * HTTP header name for authentication.
   * e.g. "Authorization", "xi-api-key", "Ocp-Apim-Subscription-Key"
   */
  authHeader: string;
  /**
   * Prefix to prepend to the API key value in the auth header.
   * Empty string = use key directly (no prefix).
   */
  authScheme: string;
  /** Optional integration notes shown in the UI */
  notes?: string;
}

export interface VendorConfig {
  /** Must match the slug stored in the Vendor DB table */
  slug: string;
  name: string;
  /** Whether this vendor has a genuinely free tier (not just a trial) */
  hasFree: boolean;
  /** Human-readable description of what the free tier includes */
  freeTier: string;
  /** Direct link to the free signup / API-key creation page */
  signupUrl: string;
  /** API reference docs URL */
  docsUrl: string;
  /** Placeholder / format hint for the API key field */
  apiKeyHint: string;
  stt?: VendorEndpoint;
  tts?: VendorEndpoint;
  v2v?: VendorEndpoint;
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

export const VENDOR_CONFIGS: VendorConfig[] = [

  /* ── DEEPGRAM ─────────────────────────────────────────────────────────────── */
  {
    slug: "deepgram",
    name: "Deepgram",
    hasFree: true,
    freeTier: "$200 free credit on signup — no credit card required",
    signupUrl: "https://console.deepgram.com/signup",
    docsUrl: "https://developers.deepgram.com/docs/introduction",
    apiKeyHint: "dg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    stt: {
      endpoint: "https://api.deepgram.com/v1/listen",
      models: [
        { id: "nova-3",    name: "Nova-3 (SOTA, 2025)",        isDefault: true, notes: "Best WER on contact-center audio" },
        { id: "nova-2",    name: "Nova-2",                                       notes: "Balanced accuracy / speed" },
        { id: "enhanced",  name: "Enhanced",                                     notes: "Optimized for telephony" },
        { id: "base",      name: "Base",                                         notes: "Fastest, lowest cost" },
        { id: "whisper-large", name: "Whisper Large (via Deepgram)",            notes: "Open-weights, hosted by Deepgram" },
      ],
      authHeader: "Authorization",
      authScheme: "Token",
      notes: "Accepts audio URL (JSON body) or raw audio bytes. Supports real-time streaming.",
    },
  },

  /* ── ASSEMBLYAI ───────────────────────────────────────────────────────────── */
  {
    slug: "assemblyai",
    name: "AssemblyAI",
    hasFree: true,
    freeTier: "Free developer access — limited hours per month, no credit card required",
    signupUrl: "https://www.assemblyai.com/app/account",
    docsUrl: "https://www.assemblyai.com/docs",
    apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (32-char hex key)",
    stt: {
      endpoint: "https://api.assemblyai.com/v2/transcript",
      models: [
        { id: "best",  name: "Best / Universal-1 (highest accuracy)", isDefault: true },
        { id: "nano",  name: "Nano (faster, lower cost)" },
      ],
      authHeader: "Authorization",
      authScheme: "",
      notes: "Two-step async: POST to create job → poll GET /{id} until status=completed.",
    },
  },

  /* ── OPENAI ───────────────────────────────────────────────────────────────── */
  {
    slug: "openai",
    name: "OpenAI",
    hasFree: false,
    freeTier: "No free tier — pay-as-you-go. STT: ~$0.006/min. TTS: from $15/1M chars",
    signupUrl: "https://platform.openai.com/signup",
    docsUrl: "https://platform.openai.com/docs/guides/speech-to-text",
    apiKeyHint: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    stt: {
      endpoint: "https://api.openai.com/v1/audio/transcriptions",
      models: [
        { id: "whisper-1",              name: "Whisper-1 ($0.006/min)",      isDefault: true },
        { id: "gpt-4o-audio-preview",  name: "GPT-4o Audio Preview",        notes: "Experimental" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "Multipart form upload required (file field). Supports mp3, mp4, wav, webm, etc.",
    },
    tts: {
      endpoint: "https://api.openai.com/v1/audio/speech",
      models: [
        { id: "tts-1",           name: "TTS-1 — fast ($15/1M chars)",     isDefault: true },
        { id: "tts-1-hd",        name: "TTS-1 HD — high quality ($30/1M chars)" },
        { id: "gpt-4o-mini-tts", name: "GPT-4o Mini TTS (latest)" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "Voices: alloy, echo, fable, onyx, nova, shimmer. Returns MP3/opus/aac.",
    },
  },

  /* ── GOOGLE CLOUD ─────────────────────────────────────────────────────────── */
  {
    slug: "google",
    name: "Google Cloud",
    hasFree: true,
    freeTier: "STT: 60 min/month free. TTS: 1M standard chars/month free. $300 credit for new accounts",
    signupUrl: "https://cloud.google.com/free",
    docsUrl: "https://cloud.google.com/speech-to-text/docs",
    apiKeyHint: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  (API Key from Cloud Console)",
    stt: {
      endpoint: "https://speech.googleapis.com/v1/speech:recognize",
      models: [
        { id: "latest_long",         name: "Latest Long — best accuracy",   isDefault: true },
        { id: "latest_short",        name: "Latest Short — fastest" },
        { id: "telephony",           name: "Telephony — contact center",    notes: "Optimized for 8kHz" },
        { id: "telephony_short",     name: "Telephony Short" },
        { id: "medical_dictation",   name: "Medical Dictation" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "Append ?key=YOUR_API_KEY to URL when using API keys (no Bearer needed). Accepts base64-encoded audio or GCS URI.",
    },
    tts: {
      endpoint: "https://texttospeech.googleapis.com/v1/text:synthesize",
      models: [
        { id: "en-US-Standard-C",   name: "Standard-C — female (free tier)", isDefault: true },
        { id: "en-US-Neural2-C",    name: "Neural2-C — premium female" },
        { id: "en-US-Journey-D",    name: "Journey-D — conversational male" },
        { id: "en-US-Studio-O",     name: "Studio-O — highest quality" },
        { id: "en-US-Polyglot-1",   name: "Polyglot-1 — multilingual" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "Append ?key=YOUR_API_KEY to URL for API key auth. Returns base64 audio.",
    },
  },

  /* ── AZURE AI SPEECH ──────────────────────────────────────────────────────── */
  {
    slug: "azure",
    name: "Azure AI Speech",
    hasFree: true,
    freeTier: "STT: 5 hours/month free. TTS: 500K standard chars/month free",
    signupUrl: "https://azure.microsoft.com/free/cognitive-services/",
    docsUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/",
    apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (32-char hex — from Azure portal → Speech resource → Keys)",
    stt: {
      endpoint: "https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1",
      models: [
        { id: "en-US-DefaultModel",  name: "Default Neural (Azure)",    isDefault: true },
        { id: "en-US-CustomModel",   name: "Custom Model (if configured)" },
      ],
      authHeader: "Ocp-Apim-Subscription-Key",
      authScheme: "",
      notes: "Replace 'eastus' in the endpoint URL with your Azure resource region.",
    },
    tts: {
      endpoint: "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1",
      models: [
        { id: "en-US-JennyNeural",  name: "Jenny Neural — female",   isDefault: true },
        { id: "en-US-AriaNeural",   name: "Aria Neural — female" },
        { id: "en-US-GuyNeural",    name: "Guy Neural — male" },
        { id: "en-US-DavisNeural",  name: "Davis Neural — male" },
        { id: "en-US-JaneNeural",   name: "Jane Neural — female" },
        { id: "en-US-TonyNeural",   name: "Tony Neural — male" },
      ],
      authHeader: "Ocp-Apim-Subscription-Key",
      authScheme: "",
      notes: "Replace 'eastus' with your Azure region. Request body is SSML.",
    },
  },

  /* ── MICROSOFT (alias for Azure) ─────────────────────────────────────────── */
  {
    slug: "microsoft",
    name: "Microsoft Azure Speech",
    hasFree: true,
    freeTier: "STT: 5 hours/month free. TTS: 500K standard chars/month free",
    signupUrl: "https://azure.microsoft.com/free/cognitive-services/",
    docsUrl: "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/",
    apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (32-char hex — Azure portal → Speech resource → Keys)",
    stt: {
      endpoint: "https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1",
      models: [
        { id: "en-US-DefaultModel", name: "Default Neural (Azure)", isDefault: true },
      ],
      authHeader: "Ocp-Apim-Subscription-Key",
      authScheme: "",
      notes: "Replace 'eastus' with your Azure region.",
    },
    tts: {
      endpoint: "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1",
      models: [
        { id: "en-US-JennyNeural", name: "Jenny Neural — female", isDefault: true },
        { id: "en-US-AriaNeural",  name: "Aria Neural — female" },
        { id: "en-US-GuyNeural",   name: "Guy Neural — male" },
      ],
      authHeader: "Ocp-Apim-Subscription-Key",
      authScheme: "",
      notes: "Replace 'eastus' with your Azure region. Request body is SSML.",
    },
  },

  /* ── ELEVENLABS ───────────────────────────────────────────────────────────── */
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    hasFree: true,
    freeTier: "10,000 characters/month free — no credit card required",
    signupUrl: "https://elevenlabs.io/app/sign-up",
    docsUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech",
    apiKeyHint: "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    tts: {
      endpoint: "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      models: [
        { id: "eleven_turbo_v2_5",      name: "Turbo v2.5 — fastest, cheapest",  isDefault: true, notes: "Best for real-time / contact center" },
        { id: "eleven_multilingual_v2", name: "Multilingual v2 — 28 languages",                   notes: "Highest quality" },
        { id: "eleven_turbo_v2",        name: "Turbo v2" },
        { id: "eleven_monolingual_v1",  name: "Monolingual v1 — English only" },
      ],
      authHeader: "xi-api-key",
      authScheme: "",
      notes: "Voice ID in URL: 21m00Tcm4TlvDq8ikWAM (Rachel). Replace with any voice ID from your library.",
    },
  },

  /* ── SPEECHMATICS ─────────────────────────────────────────────────────────── */
  {
    slug: "speechmatics",
    name: "Speechmatics",
    hasFree: true,
    freeTier: "Free trial credits on signup — contact for ongoing free development tier",
    signupUrl: "https://portal.speechmatics.com/signup",
    docsUrl: "https://docs.speechmatics.com/introduction/getting-started",
    apiKeyHint: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  (UUID format)",
    stt: {
      endpoint: "https://asr.api.speechmatics.com/v2/jobs/",
      models: [
        { id: "default",  name: "Default — Global English", isDefault: true },
        { id: "enhanced", name: "Enhanced — higher accuracy" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "Async jobs API: POST multipart/form-data → poll GET /v2/jobs/{id} → GET /v2/jobs/{id}/transcript",
    },
  },

  /* ── NVIDIA NIM ───────────────────────────────────────────────────────────── */
  {
    slug: "nvidia",
    name: "NVIDIA NIM",
    hasFree: true,
    freeTier: "1,000 free API calls/month via NVIDIA API Catalog — no credit card required",
    signupUrl: "https://build.nvidia.com/explore/speech",
    docsUrl: "https://docs.nvidia.com/nim/nemo-asr/latest/index.html",
    apiKeyHint: "nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    stt: {
      endpoint: "https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions/1598d209-5e27-4d3c-8079-4751568b1081",
      models: [
        { id: "parakeet-ctc-1.1b",  name: "Parakeet CTC 1.1B (NVIDIA)",  isDefault: true, notes: "NVIDIA-trained ASR" },
        { id: "canary-1b",           name: "Canary 1B (multilingual)" },
        { id: "whisper-large-v3",    name: "Whisper Large v3 (via NIM)" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "NVIDIA Cloud Functions. Function ID in URL changes per model — check the NIM catalog for current IDs.",
    },
  },

  /* ── META / SEAMLESS ──────────────────────────────────────────────────────── */
  {
    slug: "meta",
    name: "Meta AI (SeamlessM4T)",
    hasFree: true,
    freeTier: "Open-weights model — free self-hosting. HuggingFace hosted inference has a free tier.",
    signupUrl: "https://huggingface.co/settings/tokens",
    docsUrl: "https://github.com/facebookresearch/seamless_communication",
    apiKeyHint: "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (HuggingFace access token)",
    stt: {
      endpoint: "https://api-inference.huggingface.co/models/facebook/seamless-m4t-v2-large",
      models: [
        { id: "seamless-m4t-v2-large",  name: "SeamlessM4T v2 Large (best)",     isDefault: true },
        { id: "seamless-m4t-medium",     name: "SeamlessM4T Medium (faster)" },
        { id: "mms-300m",                name: "MMS 300M — 1,100+ languages",     notes: "Massively multilingual" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "HuggingFace Inference API. Cold-start may be slow on free tier. Accepts raw audio bytes.",
    },
  },

  /* ── AWS (TRANSCRIBE + POLLY) ─────────────────────────────────────────────── */
  {
    slug: "aws",
    name: "AWS",
    hasFree: true,
    freeTier: "Transcribe: 60 min/month free for 12 months. Polly: 5M standard chars/month free for 12 months",
    signupUrl: "https://aws.amazon.com/free/",
    docsUrl: "https://docs.aws.amazon.com/transcribe/",
    apiKeyHint: "AKIAXXXXXXXXXXXXXXXX  (AWS Access Key ID — requires Secret Key too)",
    stt: {
      endpoint: "https://transcribe.us-east-1.amazonaws.com",
      models: [
        { id: "default",        name: "AWS Transcribe — general",          isDefault: true },
        { id: "call-analytics", name: "Call Analytics — contact center",   notes: "Sentiment, categories, PII" },
      ],
      authHeader: "Authorization",
      authScheme: "AWS4-HMAC-SHA256",
      notes: "AWS Signature V4 auth — requires both Access Key ID and Secret Access Key. Using the AWS SDK is strongly recommended.",
    },
    tts: {
      endpoint: "https://polly.us-east-1.amazonaws.com/v1/speech",
      models: [
        { id: "Joanna",  name: "Joanna — Neural female (US)",   isDefault: true },
        { id: "Matthew", name: "Matthew — Neural male (US)" },
        { id: "Amy",     name: "Amy — Neural female (British)" },
        { id: "Brian",   name: "Brian — Neural male (British)" },
        { id: "Ivy",     name: "Ivy — Neural child female (US)" },
      ],
      authHeader: "Authorization",
      authScheme: "AWS4-HMAC-SHA256",
      notes: "AWS Signature V4 auth. SDK recommended. Returns MP3/OGG/PCM/JSON.",
    },
  },

  /* ── COQUI (open-source TTS) ──────────────────────────────────────────────── */
  {
    slug: "coqui",
    name: "Coqui TTS",
    hasFree: true,
    freeTier: "Fully open-source (MIT/MPL). Self-hosted. HuggingFace Spaces demo is free.",
    signupUrl: "https://huggingface.co/coqui",
    docsUrl: "https://github.com/coqui-ai/TTS",
    apiKeyHint: "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (HuggingFace token for hosted inference)",
    tts: {
      endpoint: "https://api-inference.huggingface.co/models/coqui/XTTS-v2",
      models: [
        { id: "XTTS-v2",     name: "XTTS-v2 — multilingual voice cloning",  isDefault: true },
        { id: "tts_models/en/ljspeech/tacotron2-DDC", name: "Tacotron2 (LJSpeech, English)" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "Self-host with `pip install TTS` for production. HuggingFace Spaces for quick testing.",
    },
  },

  /* ── HUME AI ──────────────────────────────────────────────────────────────── */
  {
    slug: "hume-ai",
    name: "Hume AI",
    hasFree: true,
    freeTier: "Free developer tier with limited API credits on signup",
    signupUrl: "https://platform.hume.ai/sign-up",
    docsUrl: "https://dev.hume.ai/docs/empathic-voice-interface-evi/overview",
    apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (API key from Hume portal)",
    v2v: {
      endpoint: "https://api.hume.ai/v0/evi/chat",
      models: [
        { id: "evi2",  name: "EVI 2 — Empathic Voice Interface (latest)", isDefault: true, notes: "Emotionally expressive" },
        { id: "evi",   name: "EVI v1" },
      ],
      authHeader: "X-Hume-Api-Key",
      authScheme: "",
      notes: "Hume EVI uses WebSocket for real-time voice. REST endpoint is for configuration and batch testing.",
    },
  },

  /* ── VAPI ─────────────────────────────────────────────────────────────────── */
  {
    slug: "vapi",
    name: "VAPI",
    hasFree: true,
    freeTier: "$10 free credit on signup — no credit card required",
    signupUrl: "https://vapi.ai",
    docsUrl: "https://docs.vapi.ai",
    apiKeyHint: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  (UUID from VAPI dashboard → API Keys)",
    v2v: {
      endpoint: "https://api.vapi.ai/call",
      models: [
        { id: "gpt-4o-realtime-preview",  name: "GPT-4o Realtime (via VAPI)",         isDefault: true },
        { id: "claude-3-5-sonnet",         name: "Claude 3.5 Sonnet (via VAPI)" },
        { id: "gemini-1.5-flash",          name: "Gemini 1.5 Flash (via VAPI)" },
        { id: "llama3.1-70b",              name: "Llama 3.1 70B (via VAPI)" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
      notes: "VAPI orchestrates STT + LLM + TTS providers. Supports phone calls and web calls.",
    },
  },

  /* ── RETELL AI ────────────────────────────────────────────────────────────── */
  {
    slug: "retell-ai",
    name: "Retell AI",
    hasFree: true,
    freeTier: "Free credits on signup for development and testing",
    signupUrl: "https://app.retellai.com/sign-up",
    docsUrl: "https://docs.retellai.com",
    apiKeyHint: "key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    v2v: {
      endpoint: "https://api.retellai.com/v2/call",
      models: [
        { id: "default",           name: "Default (Retell custom model)",  isDefault: true },
        { id: "gpt-4o",            name: "GPT-4o (via Retell)" },
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet (via Retell)" },
      ],
      authHeader: "Authorization",
      authScheme: "Bearer",
    },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getVendorConfig(slug: string): VendorConfig | undefined {
  return VENDOR_CONFIGS.find((v) => v.slug === slug);
}

export function getEndpointConfig(
  slug: string,
  type: "STT" | "TTS" | "V2V"
): VendorEndpoint | undefined {
  const cfg = getVendorConfig(slug);
  if (!cfg) return undefined;
  return type === "STT" ? cfg.stt : type === "TTS" ? cfg.tts : cfg.v2v;
}

/** Returns slugs of all vendors that support a given evaluation type */
export function vendorsWithFreeAPI(type: "STT" | "TTS" | "V2V"): string[] {
  return VENDOR_CONFIGS.filter((v) => {
    const ep = type === "STT" ? v.stt : type === "TTS" ? v.tts : v.v2v;
    return ep && v.hasFree;
  }).map((v) => v.slug);
}
