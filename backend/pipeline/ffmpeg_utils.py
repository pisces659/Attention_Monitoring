"""FFmpeg helpers — avoids moviepy import issues; uses bundled imageio-ffmpeg."""

from __future__ import annotations

import subprocess
from pathlib import Path

from imageio_ffmpeg import get_ffmpeg_exe


def _run_ffmpeg(args: list[str]) -> None:
    cmd = [get_ffmpeg_exe(), *args]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "ffmpeg failed").strip()
        raise RuntimeError(detail[-2000:])


def convert_to_mp4(source: Path, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            "-y",
            "-i",
            str(source),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-c:a",
            "aac",
            str(destination),
        ]
    )
    return destination


def extract_audio_wav(video_path: str | Path, output_audio: str | Path) -> None:
    output_audio = Path(output_audio)
    output_audio.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(output_audio),
        ]
    )


def merge_video_audio(
    original_video: str | Path,
    annotated_video: str | Path,
    output_video: str | Path,
) -> None:
    output_video = Path(output_video)
    output_video.parent.mkdir(parents=True, exist_ok=True)
    original_video = Path(original_video)
    annotated_video = Path(annotated_video)

    probe = subprocess.run(
        [get_ffmpeg_exe(), "-i", str(original_video)],
        capture_output=True,
        text=True,
    )
    has_audio = "Audio:" in (probe.stderr or "")

    if has_audio:
        _run_ffmpeg(
            [
                "-y",
                "-i",
                str(annotated_video),
                "-i",
                str(original_video),
                "-map",
                "0:v:0",
                "-map",
                "1:a:0",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-c:a",
                "aac",
                "-shortest",
                str(output_video),
            ]
        )
    else:
        _run_ffmpeg(
            [
                "-y",
                "-i",
                str(annotated_video),
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-an",
                str(output_video),
            ]
        )
