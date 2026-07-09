"""Video format helpers for the analysis pipeline."""

from __future__ import annotations

from pathlib import Path

import cv2

from pipeline.ffmpeg_utils import convert_to_mp4


def _can_read_video(path: Path) -> bool:
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        cap.release()
        return False
    ok, _ = cap.read()
    cap.release()
    return ok


def ensure_opencv_readable(video_path: Path) -> Path:
    """Convert webcam WEBM/MOV inputs to MP4 when OpenCV cannot decode them."""
    if _can_read_video(video_path):
        return video_path

    converted = video_path.parent / f"{video_path.stem}_converted.mp4"
    return convert_to_mp4(video_path, converted)
