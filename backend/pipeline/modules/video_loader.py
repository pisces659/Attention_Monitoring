import cv2
from pathlib import Path

from pipeline.ffmpeg_utils import probe_duration_seconds, resolve_output_fps


class VideoLoader:

    def __init__(self, path):
        self.path = Path(path)
        self.cap = cv2.VideoCapture(str(self.path))

        reported_fps = float(self.cap.get(cv2.CAP_PROP_FPS) or 0)
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        self.duration_seconds = probe_duration_seconds(path)
        self.fps = resolve_output_fps(
            path,
            opencv_fps=reported_fps,
            opencv_frame_count=self.frame_count,
        )

        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()
