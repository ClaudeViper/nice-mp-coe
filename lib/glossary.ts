/**
 * Central glossary of technical terms used across the Speech CoE application.
 * Each entry provides a short label (shown in the tooltip header) and a full
 * human-readable definition (shown in the tooltip body).
 *
 * Add new terms here; they are automatically picked up by <GlossaryTerm />.
 */

export interface GlossaryEntry {
  /** Short expanded form / label shown bold in the tooltip */
  short: string;
  /** Full definition paragraph */
  full: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ─── STT Metrics ────────────────────────────────────────────────────────────
  WER: {
    short: "Word Error Rate",
    full: "Percentage of words incorrectly transcribed compared to reference text. Calculated as (Substitutions + Deletions + Insertions) ÷ Total Reference Words. Lower is better; industry target is <5% for English.",
  },
  CER: {
    short: "Character Error Rate",
    full: "Same principle as WER but measured at character level instead of word level. Useful for languages without clear word boundaries (e.g. Mandarin, Japanese) and for detecting subtle transcription errors.",
  },
  MER: {
    short: "Match Error Rate",
    full: "Considers both insertions and deletions symmetrically. Defined as 1 – (matches / max(reference_length, hypothesis_length)). Treats over- and under-generation equally.",
  },
  WIL: {
    short: "Word Information Lost",
    full: "Measures how much information is lost during transcription relative to the reference. Ranges 0–1; lower values mean less information was lost. Complements WER by weighting common words less.",
  },
  RTF: {
    short: "Real-Time Factor",
    full: "Ratio of processing time to audio duration. RTF = processing_time ÷ audio_duration. RTF < 1 means faster than real-time (required for live transcription); RTF > 1 means slower than real-time.",
  },
  DIAR: {
    short: "Speaker Diarization",
    full: "The process of identifying and separating different speakers in an audio recording (\"who spoke when\"). Evaluated with Diarization Error Rate (DER). Critical for multi-party call transcription.",
  },
  LM: {
    short: "Language Model",
    full: "A statistical or neural model that predicts the probability of word sequences. Used in STT to rescore hypotheses and improve accuracy on domain-specific vocabulary.",
  },
  AM: {
    short: "Acoustic Model",
    full: "Maps raw audio features (e.g. mel-spectrograms) to phonetic units or sub-word tokens. The front-end of most STT systems; trained on large speech corpora.",
  },
  VAD: {
    short: "Voice Activity Detection",
    full: "Detects when speech is present vs. silence or background noise in an audio stream. Reduces compute cost and prevents feeding noise to the ASR engine.",
  },
  SNR: {
    short: "Signal-to-Noise Ratio",
    full: "Measure of signal clarity relative to background noise, expressed in decibels (dB). Higher SNR = cleaner audio. STT accuracy degrades significantly below ~10 dB SNR.",
  },

  // ─── TTS Metrics ────────────────────────────────────────────────────────────
  MOS: {
    short: "Mean Opinion Score",
    full: "Human-rated perceptual quality score on a 1–5 scale: 1 = Bad, 2 = Poor, 3 = Fair, 4 = Good, 5 = Excellent. The gold standard for TTS evaluation. Commercial systems typically score 4.0–4.5.",
  },
  MUSHRA: {
    short: "Multiple Stimuli with Hidden Reference and Anchor",
    full: "A blind listening test methodology (ITU-R BS.1534) where listeners rate multiple stimuli including a hidden reference and a degraded anchor on a 0–100 scale. More sensitive than MOS for detecting subtle quality differences.",
  },
  SSML: {
    short: "Speech Synthesis Markup Language",
    full: "An XML-based markup language (W3C standard) used to control TTS output — including pronunciation, speaking rate, pitch, pauses, and emphasis. Supported by most commercial TTS APIs.",
  },
  Prosody: {
    short: "Speech Prosody",
    full: "The rhythm, stress, and intonation patterns of speech. Good prosody makes synthesized speech sound natural and emotionally appropriate. Poor prosody is the most common complaint about TTS quality.",
  },
  Naturalness: {
    short: "Naturalness Score",
    full: "How human-like the synthesized speech sounds; typically rated by human listeners on a 1–5 MOS scale. Encompasses voice quality, prosody, pronunciation, and overall conversational feel.",
  },
  Intelligibility: {
    short: "Intelligibility",
    full: "How easily the synthesized speech can be understood. Measured objectively via STT WER on TTS output, or subjectively via word recognition tests. Distinct from naturalness — speech can be intelligible but robotic.",
  },
  TTFB: {
    short: "Time To First Byte",
    full: "Latency from sending the TTS request to receiving the first audio byte. Critical for interactive applications; target is <300 ms for a responsive feel. Also called \"streaming latency\" or \"first-chunk latency\".",
  },
  "Streaming TTS": {
    short: "Streaming TTS",
    full: "Generating and playing audio simultaneously without waiting for the full synthesis to complete. Enables sub-second perceived latency. Requires chunked HTTP or WebSocket delivery.",
  },

  // ─── General AI / ML Terms ───────────────────────────────────────────────────
  ELO: {
    short: "ELO Rating",
    full: "Chess-inspired rating system where models gain/lose points based on head-to-head comparisons. Widely used in AI leaderboards (e.g. LMSYS Chatbot Arena). A model with higher ELO has beaten more opponents.",
  },
  Benchmark: {
    short: "Benchmark",
    full: "A standardised test or dataset used to compare model performance objectively. Good benchmarks are reproducible, cover diverse conditions, and correlate with real-world performance.",
  },
  "Zero-shot": {
    short: "Zero-shot",
    full: "The model performs a task without any task-specific training examples — it relies purely on general pre-training. Contrast with few-shot (a handful of examples) and fine-tuning (full training run).",
  },
  "Fine-tuning": {
    short: "Fine-tuning",
    full: "Additional training of a pre-trained model on domain-specific data to improve performance for a particular use case, vocabulary, or accent. Typically requires far less data than training from scratch.",
  },
  Inference: {
    short: "Inference",
    full: "Running a trained model to generate predictions or outputs (as opposed to training). Inference costs dominate production AI deployments and are typically measured in cost-per-1000-requests or cost-per-hour.",
  },
  Hallucination: {
    short: "AI Hallucination",
    full: "When an AI model generates plausible-sounding but factually incorrect or fabricated information. In STT context, this can manifest as inserting words not present in the audio.",
  },
  RLHF: {
    short: "Reinforcement Learning from Human Feedback",
    full: "A training technique that uses human preference judgements (e.g. \"which response is better?\") as a reward signal to fine-tune models. Used to align models with human values and communication styles.",
  },

  // ─── Additional ──────────────────────────────────────────────────────────────
  "Build vs Buy": {
    short: "Build vs Buy Score",
    full: "NICE internal metric (0–10) rating whether it is better to build a custom integration vs. use the vendor's off-the-shelf product for CXone. Higher = stronger case for buying / using directly.",
  },
  CXone: {
    short: "NICE CXone",
    full: "NICE's flagship cloud customer experience platform. The primary integration target for all vendors evaluated in this registry.",
  },
};
