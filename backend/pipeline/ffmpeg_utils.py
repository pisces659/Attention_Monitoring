"""FFmpeg helpers — avoids moviepy import issues; uses bundled imageio-ffmpeg."""

from __future__ import annotations

import subprocess
from pathlib import Path

from imageio_ffmpeg import get_ffmpeg_exe


def _run_subprocess(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def _run_ffmpeg(args: list[str]) -> None:
    cmd = [get_ffmpeg_exe(), *args]
    result = _run_subprocess(cmd)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "ffmpeg failed").strip()
        raise RuntimeError(detail[-2000:])


def _ffprobe(args: list[str]) -> str:
    result = _run_subprocess([get_ffmpeg_exe(), *args])
    return (result.stdout or "").strip()


def parse_frame_rate(value: str) -> float | None:
    cleaned = value.strip()
    if not cleaned or cleaned == "0/0":
        return None
    if "/" in cleaned:
        num, den = cleaned.split("/", 1)
        denominator = float(den)
        if denominator == 0:
            return None
        return float(num) / denominator
    try:
        return float(cleaned)
    except ValueError:
        return None


def clamp_fps(fps: float) -> float:
    return max(10.0, min(60.0, fps))


def probe_duration_seconds(path: Path) -> float | None:
    output = _ffprobe(
        [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    )
    try:
        duration = float(output)
    except ValueError:
        return None
    return duration if duration > 0 else None


def probe_stream_fps(path: Path) -> float | None:
    output = _ffprobe(
        [
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=avg_frame_rate,r_frame_rate",
            "-of",
            "csv=p=0",
            str(path),
        ]
    )
    for line in output.splitlines():
        fps = parse_frame_rate(line)
        if fps and 5 <= fps <= 120:
            return fps
    return None


def probe_frame_count(path: Path) -> int | None:
    output = _ffprobe(
        [
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=nb_frames",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    )
    try:
        count = int(float(output))
    except ValueError:
        return None
    return count if count > 0 else None


def resolve_output_fps(path: Path, *, opencv_fps: float, opencv_frame_count: int) -> float:
    """Pick a sane FPS for writing annotated output (webm often reports 1000fps)."""
    duration = probe_duration_seconds(path)
    stream_fps = probe_stream_fps(path)
    frame_count = probe_frame_count(path) or opencv_frame_count

    if duration and frame_count > 0:
        return clamp_fps(frame_count / duration)
    if stream_fps:
        return clamp_fps(stream_fps)
    if 5 <= opencv_fps <= 120:
        return opencv_fps
    return 30.0


def reencode_video_with_fps(source: Path, destination: Path, fps: float) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            "-y",
            "-i",
            str(source),
            "-r",
            f"{fps:.3f}",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-pix_fmt",
            "yuv420p",
            "-an",
            str(destination),
        ]
    )


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


def trim_video_segment(
    source: str | Path,
    destination: str | Path,
    *,
    start_seconds: float = 0.0,
) -> None:
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    args = ["-y"]
    if start_seconds > 0:
        args.extend(["-ss", f"{start_seconds:.3f}"])
    args.extend(["-i", str(source), "-c", "copy", str(destination)])
    _run_ffmpeg(args)


def extract_audio_wav(
    video_path: str | Path,
    output_audio: str | Path,
    *,
    start_seconds: float = 0.0,
) -> None:
    output_audio = Path(output_audio)
    output_audio.parent.mkdir(parents=True, exist_ok=True)
    args = ["-y"]
    if start_seconds > 0:
        args.extend(["-ss", f"{start_seconds:.3f}"])
    args.extend(
        [
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
    _run_ffmpeg(args)


def merge_video_audio(
    original_video: str | Path,
    annotated_video: str | Path,
    output_video: str | Path,
    *,
    audio_start_seconds: float = 0.0,
) -> None:
    output_video = Path(output_video)
    output_video.parent.mkdir(parents=True, exist_ok=True)
    original_video = Path(original_video)
    annotated_video = Path(annotated_video)

    probe = _run_subprocess(
        [get_ffmpeg_exe(), "-i", str(original_video)],
    )
    has_audio = "Audio:" in (probe.stderr or "")

    if has_audio:
        audio_input = ["-ss", f"{audio_start_seconds:.3f}", "-i", str(original_video)] if audio_start_seconds > 0 else ["-i", str(original_video)]
        _run_ffmpeg(
            [
                "-y",
                "-i",
                str(annotated_video),
                *audio_input,
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
