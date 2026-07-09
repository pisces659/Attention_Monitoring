"""Face mesh detection via MediaPipe Tasks API (0.10.30+)."""

from __future__ import annotations

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

from pipeline.model_assets import get_face_landmarker_model


class _FaceLandmarks:
    """Compatibility wrapper matching legacy mp.solutions.face_mesh output."""

    def __init__(self, landmarks: list) -> None:
        self.landmark = landmarks


class FaceMeshResult:
    def __init__(self, faces: list | None) -> None:
        self.multi_face_landmarks = (
            [_FaceLandmarks(face) for face in faces] if faces else None
        )


class FaceDetector:
    def __init__(self) -> None:
        options = vision.FaceLandmarkerOptions(
            base_options=mp_tasks.BaseOptions(
                model_asset_path=str(get_face_landmarker_model())
            ),
            running_mode=vision.RunningMode.VIDEO,
            num_faces=1,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
        )
        self._landmarker = vision.FaceLandmarker.create_from_options(options)

    def process(self, frame, timestamp_ms: int) -> FaceMeshResult:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self._landmarker.detect_for_video(mp_image, timestamp_ms)
        return FaceMeshResult(result.face_landmarks if result.face_landmarks else None)

    def close(self) -> None:
        self._landmarker.close()
