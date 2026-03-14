#!/usr/bin/env python3
"""
batch_generate_audio.py — Speech CoE batch TTS generator.

Reads audio_config.json, generates the full matrix of
(sentence × voice × speed × emotion) audio files, and writes
a manifest.csv for downstream STT evaluation.

Usage:
    python batch_generate_audio.py [--config audio_config.json]

Dependencies:
    pip install chatterbox-tts kokoro soundfile tqdm
"""

import argparse
import csv
import json
import os
import sys
import time
from itertools import product
from pathlib import Path

import numpy as np
import soundfile as sf
from tqdm import tqdm

# ---------------------------------------------------------------------------
# TTS backend loader — tries Chatterbox first, falls back to Kokoro
# ---------------------------------------------------------------------------

def load_tts_backend():
    """Return (backend_name, generate_fn) where generate_fn(text, voice, speed, emotion)
    returns (audio_np_array, sample_rate)."""
    try:
        import torch
        from chatterbox.tts import ChatterboxTTS

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[TTS] Loading Chatterbox on {device}...")
        model = ChatterboxTTS.from_pretrained(device=device)

        def generate_chatterbox(text: str, voice: str, speed: float, emotion: float):
            # Chatterbox uses cfg_weight for emotion intensity (0=neutral, 1=expressive)
            wav = model.generate(
                text,
                exaggeration=emotion,
                cfg_weight=0.5,
            )
            audio = wav.squeeze().cpu().numpy()
            sr = model.sr
            # Speed adjustment via resampling if != 1.0
            if speed != 1.0:
                import torchaudio
                audio_t = torch.from_numpy(audio).unsqueeze(0)
                new_len = int(audio_t.shape[-1] / speed)
                audio_t = torchaudio.functional.resample(audio_t, sr, int(sr / speed))
                audio = audio_t.squeeze().numpy()
            return audio, sr

        return "chatterbox", generate_chatterbox

    except Exception as e:
        print(f"[TTS] Chatterbox unavailable ({e}), falling back to Kokoro...")

    try:
        from kokoro import KPipeline

        print("[TTS] Loading Kokoro...")
        pipeline = KPipeline(lang_code="a")  # 'a' = American English

        KOKORO_VOICES = {
            "default": "af_heart",
        }

        def generate_kokoro(text: str, voice: str, speed: float, emotion: float):
            voice_id = KOKORO_VOICES.get(voice, "af_heart")
            generator = pipeline(text, voice=voice_id, speed=speed, split_pattern=None)
            chunks = [audio for _, _, audio in generator]
            audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
            sr = 24000  # Kokoro native sample rate
            return audio, sr

        return "kokoro", generate_kokoro

    except Exception as e:
        print(f"[TTS] Kokoro unavailable ({e}).")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Resampling helper
# ---------------------------------------------------------------------------

def maybe_resample(audio: np.ndarray, src_sr: int, dst_sr: int) -> np.ndarray:
    if src_sr == dst_sr:
        return audio
    try:
        import torchaudio, torch
        t = torch.from_numpy(audio).unsqueeze(0)
        t = torchaudio.functional.resample(t, src_sr, dst_sr)
        return t.squeeze().numpy()
    except ImportError:
        # Fallback: linear interpolation (low quality, only used if torchaudio missing)
        ratio = dst_sr / src_sr
        new_len = int(len(audio) * ratio)
        return np.interp(
            np.linspace(0, len(audio) - 1, new_len),
            np.arange(len(audio)),
            audio,
        ).astype(audio.dtype)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="Batch TTS audio generator for Speech CoE")
    p.add_argument(
        "--config",
        default="audio_config.json",
        help="Path to JSON config file (default: audio_config.json)",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Print all combinations without generating audio",
    )
    return p.parse_args()


def load_config(config_path: str) -> dict:
    with open(config_path, "r") as f:
        cfg = json.load(f)

    # Expand ~ in output_dir
    cfg["output_dir"] = str(Path(cfg["output_dir"]).expanduser())

    # Validate required keys
    required = ["sentences", "voices", "speeds", "emotions", "output_dir", "format", "sample_rate"]
    missing = [k for k in required if k not in cfg]
    if missing:
        raise ValueError(f"Config missing required keys: {missing}")

    return cfg


def build_combinations(cfg: dict) -> list[dict]:
    """Return list of dicts, one per (sentence, voice, speed, emotion) combo."""
    combos = []
    for sentence, voice, speed, emotion in product(
        cfg["sentences"], cfg["voices"], cfg["speeds"], cfg["emotions"]
    ):
        speed_str = f"{speed:.1f}".replace(".", "")   # 0.8 → "08", 1.0 → "10"
        emotion_str = f"{emotion:.1f}".replace(".", "")  # 0.3 → "03"
        filename = f"{sentence['id']}_v{voice}_s{speed_str}_e{emotion_str}.{cfg['format']}"
        combos.append(
            {
                "sentence_id": sentence["id"],
                "text": sentence["text"],
                "voice": voice,
                "speed": speed,
                "emotion": emotion,
                "filename": filename,
            }
        )
    return combos


MANIFEST_FIELDS = [
    "file_path",
    "sentence_id",
    "text",
    "voice",
    "speed",
    "emotion",
    "duration_seconds",
    "sample_rate",
]


def main():
    args = parse_args()
    cfg = load_config(args.config)

    output_dir = Path(cfg["output_dir"])
    target_sr = int(cfg["sample_rate"])
    combos = build_combinations(cfg)

    total = len(combos)
    print(f"[Batch] Config: {args.config}")
    print(f"[Batch] Output dir: {output_dir}")
    print(f"[Batch] Total combinations: {total}")
    print(
        f"         {len(cfg['sentences'])} sentences × "
        f"{len(cfg['voices'])} voice(s) × "
        f"{len(cfg['speeds'])} speeds × "
        f"{len(cfg['emotions'])} emotions"
    )

    if args.dry_run:
        print("\n[Dry run] Files that would be generated:")
        for c in combos:
            print(f"  {c['filename']}  |  \"{c['text']}\"  speed={c['speed']}  emotion={c['emotion']}")
        return

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    backend_name, generate = load_tts_backend()
    print(f"[TTS] Backend: {backend_name}\n")

    manifest_path = output_dir / "manifest.csv"
    manifest_rows = []
    errors = []

    with tqdm(total=total, unit="file", desc="Generating", ncols=80) as pbar:
        for combo in combos:
            file_path = output_dir / combo["filename"]
            pbar.set_postfix_str(combo["filename"][:40])

            try:
                t0 = time.time()
                audio, src_sr = generate(
                    text=combo["text"],
                    voice=combo["voice"],
                    speed=combo["speed"],
                    emotion=combo["emotion"],
                )

                # Resample to target sample rate if needed
                audio = maybe_resample(audio, src_sr, target_sr)

                # Normalise to [-1, 1] to avoid clipping
                peak = np.abs(audio).max()
                if peak > 0:
                    audio = audio / peak * 0.95

                sf.write(str(file_path), audio, target_sr, subtype="PCM_16")

                duration = len(audio) / target_sr
                manifest_rows.append(
                    {
                        "file_path": str(file_path),
                        "sentence_id": combo["sentence_id"],
                        "text": combo["text"],
                        "voice": combo["voice"],
                        "speed": combo["speed"],
                        "emotion": combo["emotion"],
                        "duration_seconds": round(duration, 4),
                        "sample_rate": target_sr,
                    }
                )

            except Exception as e:
                errors.append((combo["filename"], str(e)))
                tqdm.write(f"  [ERROR] {combo['filename']}: {e}")

            pbar.update(1)

    # Write manifest.csv
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=MANIFEST_FIELDS)
        writer.writeheader()
        writer.writerows(manifest_rows)

    # Summary
    print(f"\n[Done] Generated {len(manifest_rows)}/{total} files")
    print(f"[Done] Manifest: {manifest_path}")
    if errors:
        print(f"[Warn] {len(errors)} file(s) failed:")
        for fname, err in errors:
            print(f"  {fname}: {err}")


if __name__ == "__main__":
    main()
