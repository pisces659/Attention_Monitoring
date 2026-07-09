"""Download and cache MediaPipe task model files."""

from __future__ import annotations

import urllib.request
from pathlib import Path

FACE_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/1/face_landmarker.task"
)

_MODEL_DIR = Path(__file__).resolve().parent / "models"


def get_face_landmarker_model() -> Path:
    path = _MODEL_DIR / "face_landmarker.task"
    if path.exists():
        return path

    _MODEL_DIR.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(FACE_LANDMARKER_URL, path)
    return path
