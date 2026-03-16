#!/usr/bin/env python3
"""
generate_audio.py — Single-file TTS generator for Speech CoE.

Accepts CLI arguments, generates one audio file, and prints a JSON
result to stdout so the Next.js API route can parse it.

Usage:
    python generate_audio.py \
        --text "Hello world" \
        --voice default \
        --speed 1.0 \
        --emotion 0.5 \
        --pitch 0.0 \
        --format wav \
        --output-dir ~/audio_samples/single \
        --sample-rate 22050
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

# ---------------------------------------------------------------------------
# TTS backend loader (Chatterbox → Kokoro fallback)
# ---------------------------------------------------------------------------

def load_tts_backend():
    try:
        import torch
        from chatterbox.tts import ChatterboxTTS

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = ChatterboxTTS.from_pretrained(device=device)

        def generate_chatterbox(text, voice, speed, emotion):
            wav = model.generate(text, exaggeration=emotion, cfg_weight=0.5)
            # Always detach before .numpy() to avoid gradient/leaf-tensor errors
            audio = wav.squeeze().detach().cpu().numpy()
            sr = model.sr
            if speed != 1.0:
                import torchaudio
                audio_t = torch.from_numpy(audio).unsqueeze(0)
                audio_t = torchaudio.functional.resample(audio_t, sr, int(sr / speed))
                audio = audio_t.squeeze().detach().cpu().numpy()
            return audio, sr

        return "chatterbox", generate_chatterbox

    except Exception:
        pass

    try:
        from kokoro import KPipeline

        pipeline = KPipeline(lang_code="a")

        KOKORO_VOICES = {
            "default":  "af_heart",
            "female-1": "af_bella",
            "female-2": "af_nova",
            "male-1":   "am_adam",
            "male-2":   "am_michael",
            "british-f": "bf_emma",
            "british-m": "bm_george",
        }

        def generate_kokoro(text, voice, speed, emotion):
            voice_id = KOKORO_VOICES.get(voice, "af_heart")
            generator = pipeline(text, voice=voice_id, speed=speed, split_pattern=None)
            chunks = [audio for _, _, audio in generator]
            audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
            return audio, 24000

        return "kokoro", generate_kokoro

    except Exception as e:
        print(json.dumps({"error": f"No TTS backend available: {e}"}), file=sys.stdout)
        sys.exit(1)


def maybe_resample(audio, src_sr, dst_sr):
    if src_sr == dst_sr:
        return audio
    # Normalise: convert Tensor → numpy before resampling
    if hasattr(audio, "detach"):
        audio = audio.detach().cpu().numpy()
    try:
        import torchaudio, torch
        t = torch.from_numpy(np.asarray(audio)).unsqueeze(0)
        t = torchaudio.functional.resample(t, src_sr, dst_sr)
        return t.squeeze().detach().cpu().numpy()
    except ImportError:
        ratio = dst_sr / src_sr
        new_len = int(len(audio) * ratio)
        return np.interp(
            np.linspace(0, len(audio) - 1, new_len),
            np.arange(len(audio)),
            audio,
        ).astype(audio.dtype)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--text", required=True)
    p.add_argument("--voice", default="default")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--emotion", type=float, default=0.5)
    p.add_argument("--pitch", type=float, default=0.0)
    p.add_argument("--format", default="wav", choices=["wav", "mp3"])
    p.add_argument("--output-dir", default="~/audio_samples/single")
    p.add_argument("--sample-rate", type=int, default=22050)
    args = p.parse_args()

    output_dir = Path(args.output_dir).expanduser()
    output_dir.mkdir(parents=True, exist_ok=True)

    ts = int(time.time() * 1000)
    speed_str = f"{args.speed:.1f}".replace(".", "")
    emotion_str = f"{args.emotion:.1f}".replace(".", "")
    filename = f"tts_{ts}_v{args.voice}_s{speed_str}_e{emotion_str}.{args.format}"
    file_path = output_dir / filename

    _backend, generate = load_tts_backend()
    audio, src_sr = generate(args.text, args.voice, args.speed, args.emotion)

    audio = maybe_resample(audio, src_sr, args.sample_rate)

    peak = np.abs(audio).max()
    if peak > 0:
        audio = audio / peak * 0.95

    sf.write(str(file_path), audio, args.sample_rate, subtype="PCM_16")

    duration = len(audio) / args.sample_rate
    print(json.dumps({
        "file_path": str(file_path),
        "filename": filename,
        "duration_seconds": round(duration, 4),
        "sample_rate": args.sample_rate,
        "format": args.format,
        "engine": _backend,
        "voice": args.voice,
        "speed": args.speed,
        "emotion": args.emotion,
        "pitch": args.pitch,
        "text": args.text,
    }))


if __name__ == "__main__":
    main()
