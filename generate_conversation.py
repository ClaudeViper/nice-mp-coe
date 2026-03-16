#!/usr/bin/env python3
"""Generate a two-channel (stereo) conversation audio file.

Agent utterances go on the LEFT channel; Customer utterances go on the RIGHT
channel.  During one speaker's turn the other channel stays silent, so the
resulting stereo file can be processed per-speaker by any STT engine.
"""

import argparse, json, os, shutil, struct, subprocess, sys, tempfile
from pathlib import Path
import numpy as np


AGENT_VOICE    = "male-1"    # Adam
CUSTOMER_VOICE = "female-1"  # Bella
SAMPLE_RATE    = 22050


# ─── WAV helpers ─────────────────────────────────────────────────────────────

def read_wav_mono(path: str) -> np.ndarray:
    """Read a WAV file and return a mono float32 numpy array."""
    import wave
    with wave.open(path, "rb") as f:
        n_ch   = f.getnchannels()
        sw     = f.getsampwidth()
        n_fr   = f.getnframes()
        raw    = f.readframes(n_fr)

    n_samples = n_fr * n_ch
    if sw == 2:
        arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sw == 4:
        arr = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2_147_483_648.0
    else:
        arr = np.frombuffer(raw, dtype=np.uint8).astype(np.float32) / 128.0 - 1.0

    if n_ch > 1:
        arr = arr.reshape(-1, n_ch).mean(axis=1)
    return arr.astype(np.float32)


def write_stereo_wav(path: str, left: np.ndarray, right: np.ndarray, sr: int) -> None:
    """Write a 16-bit stereo WAV."""
    import wave
    assert len(left) == len(right), "Channel length mismatch"
    interleaved        = np.empty(len(left) * 2, dtype=np.float32)
    interleaved[0::2]  = left
    interleaved[1::2]  = right
    int16 = np.clip(interleaved * 32767, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(sr)
        f.writeframes(int16.tobytes())


# ─── TTS helper ──────────────────────────────────────────────────────────────

def generate_utterance(script: str, text: str, voice: str,
                        speed: float, emotion: float, out_dir: str) -> dict:
    """Call generate_audio.py for a single utterance, return its JSON result."""
    result = subprocess.run(
        [
            "python3", script,
            "--text",       text,
            "--voice",      voice,
            "--speed",      str(speed),
            "--emotion",    str(emotion),
            "--format",     "wav",
            "--output-dir", out_dir,
            "--sample-rate", str(SAMPLE_RATE),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"TTS failed for '{text[:30]}': {result.stderr[:300]}")
    for line in reversed(result.stdout.strip().split("\n")):
        if line.strip().startswith("{"):
            obj = json.loads(line)
            if "error" in obj:
                raise RuntimeError(obj["error"])
            return obj
    raise RuntimeError(f"No JSON from TTS: {result.stdout[:200]}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate stereo conversation audio")
    parser.add_argument("--transcript",      required=True,
                        help='JSON array of {speaker, text} objects, or @filename')
    parser.add_argument("--title",           default="conversation")
    parser.add_argument("--output-dir",      default="~/audio_samples/conversations")
    parser.add_argument("--agent-voice",      default=AGENT_VOICE)
    parser.add_argument("--customer-voice",   default=CUSTOMER_VOICE)
    parser.add_argument("--supervisor-voice", default="british-f")
    parser.add_argument("--speed",            type=float, default=1.0)
    parser.add_argument("--emotion",         type=float, default=0.5)
    parser.add_argument("--pause-ms",        type=float, default=350.0)
    args = parser.parse_args()

    # ── Parse transcript ───────────────────────────────────────────────────
    if args.transcript.startswith("@"):
        with open(args.transcript[1:]) as fh:
            utterances = json.load(fh)
    else:
        utterances = json.loads(args.transcript)

    utterances = [u for u in utterances if str(u.get("text", "")).strip()]
    if not utterances:
        print(json.dumps({"error": "No non-empty utterances in transcript"}), flush=True)
        sys.exit(1)

    script_path = str(Path(__file__).parent / "generate_audio.py")
    out_dir     = Path(args.output_dir).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir     = Path(tempfile.mkdtemp(prefix="conv_"))
    pause       = np.zeros(int(SAMPLE_RATE * args.pause_ms / 1000), dtype=np.float32)

    left_parts: list[np.ndarray]  = []
    right_parts: list[np.ndarray] = []
    meta: list[dict]              = []
    engine_name: str              = "unknown"

    try:
        for i, utt in enumerate(utterances):
            speaker = str(utt.get("speaker", "agent")).lower()
            text    = str(utt.get("text", "")).strip()
            if speaker == "agent":
                voice = args.agent_voice
            elif speaker == "supervisor":
                voice = args.supervisor_voice
            else:
                voice = args.customer_voice

            # Stream progress so the SSE route can forward it
            print(json.dumps({
                "progress": i,
                "total":    len(utterances),
                "speaker":  speaker,
                "preview":  text[:50],
            }), flush=True)

            res   = generate_utterance(script_path, text, voice,
                                       args.speed, args.emotion, str(tmp_dir))
            if engine_name == "unknown":
                engine_name = res.get("engine", "unknown")
            audio = read_wav_mono(res["file_path"])

            silence = np.zeros_like(audio)
            if speaker == "agent":
                left_parts.extend([audio, pause])
                right_parts.extend([silence, pause])
            elif speaker == "supervisor":
                # Supervisor is centered — appears on both channels
                left_parts.extend([audio, pause])
                right_parts.extend([audio, pause])
            else:
                left_parts.extend([silence, pause])
                right_parts.extend([audio, pause])

            meta.append({
                "speaker":        speaker,
                "text":           text,
                "voice":          voice,
                "duration_secs":  res["duration_seconds"],
            })

        # ── Combine channels ───────────────────────────────────────────────
        left  = np.concatenate(left_parts)
        right = np.concatenate(right_parts)

        # Soft-limit to prevent clipping
        peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-9)
        if peak > 0.95:
            left  = left  / peak * 0.95
            right = right / peak * 0.95

        # ── Write output ───────────────────────────────────────────────────
        safe   = "".join(c if c.isalnum() or c in "_-" else "_" for c in args.title)[:40]
        out_fn = f"conv_{safe}.wav"
        out_p  = str(out_dir / out_fn)
        write_stereo_wav(out_p, left, right, SAMPLE_RATE)

        total_secs = len(left) / SAMPLE_RATE
        print(json.dumps({
            "file_path":        out_p,
            "filename":         out_fn,
            "duration_seconds": round(total_secs, 2),
            "sample_rate":      SAMPLE_RATE,
            "channels":         2,
            "engine":           engine_name,
            "utterance_count":  len(meta),
            "transcript":       meta,
        }), flush=True)

    finally:
        shutil.rmtree(str(tmp_dir), ignore_errors=True)


if __name__ == "__main__":
    main()
