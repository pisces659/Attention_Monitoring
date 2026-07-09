"""Headless video analysis — Ram branch pipeline without GUI preview."""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path

# Anaconda + MediaPipe + OpenCV often conflict on OpenMP — must be set before native imports.
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import cv2

from pipeline.modules import visualization as viz
from pipeline.modules.assessment.attention_engine import AttentionEngine
from pipeline.modules.audio.extractor import AudioExtractor
from pipeline.modules.audio.similarity import Similarity
from pipeline.modules.report.report import Report
from pipeline.modules.video_export import VideoExporter
from pipeline.modules.video_loader import VideoLoader
from pipeline.modules.vision.blink_detector import BlinkDetector
from pipeline.modules.vision.face_detector import FaceDetector
from pipeline.modules.vision.gaze_estimator import GazeEstimator
from pipeline.modules.vision.head_pose import HeadPoseEstimator
from pipeline.modules.vision.iris_tracker import IrisTracker
from pipeline.video_utils import ensure_opencv_readable

logger = logging.getLogger(__name__)

DEFAULT_GAZE = {
    "Horizontal": "Center",
    "Vertical": "Center",
    "OnScreen": False,
    "HRatio": 0.5,
    "VRatio": 0.5,
}


@dataclass
class AnalysisResult:
    annotated_video_path: Path
    csv_path: Path
    summary_path: Path
    pipeline_summary: dict


def analyze_video(
    video_path: str | Path,
    output_dir: str | Path,
    *,
    expected_word: str = "Elephant",
    show_landmarks: bool = True,
) -> AnalysisResult:
    video_path = ensure_opencv_readable(Path(video_path))
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    video = VideoLoader(str(video_path))
    annotated_path = output_dir / "annotated_output.mp4"
    final_path = output_dir / "Final_Output.mp4"
    audio_path = output_dir / "audio.wav"

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    video_writer = cv2.VideoWriter(
        str(annotated_path),
        fourcc,
        video.fps,
        (video.width, video.height),
    )

    detector = FaceDetector()
    iris = IrisTracker()
    blink_detector = BlinkDetector()
    head_pose = HeadPoseEstimator()
    gaze = GazeEstimator()
    attention = AttentionEngine()
    audio_extractor = AudioExtractor()
    similarity = Similarity()
    exporter = VideoExporter()
    report = Report(str(output_dir))

    logger.info("Starting frame analysis for %s", video_path)

    frame_no = 0
    start = time.time()
    frame_time = 1 / video.fps if video.fps else 1 / 30

    ear = 0.0
    blink = False
    total_blinks = 0
    gaze_result = DEFAULT_GAZE.copy()
    attention_state = "No Face"
    yaw = pitch = roll = None
    left_center = (0.0, 0.0)
    right_center = (0.0, 0.0)

    try:
        while True:
            success, frame = video.read()
            if not success:
                break

            frame_no += 1
            timestamp_ms = int((frame_no / video.fps) * 1000) if video.fps else frame_no * 33
            results = detector.process(frame, timestamp_ms)
            found = False

            if results.multi_face_landmarks:
                found = True
                for face in results.multi_face_landmarks:
                    if show_landmarks:
                        viz.draw_landmarks(frame, face)

                    left, right = iris.extract(face, frame.shape)
                    left_center = left[0]
                    right_center = right[0]
                    viz.draw_iris(frame, left, (255, 0, 0))
                    viz.draw_iris(frame, right, (0, 0, 255))

                    ear, blink, total_blinks = blink_detector.process(face, frame.shape)
                    viz.draw_blink(frame, ear, total_blinks)

                    pose = head_pose.estimate(face, frame)
                    if pose is not None:
                        yaw, pitch, roll = pose
                        gaze_result = gaze.estimate(face, frame.shape, ear, yaw, pitch)
                        attention_state = attention.classify(gaze_result, blink, ear, frame_time)
                    else:
                        yaw = pitch = roll = None
                        gaze_result = DEFAULT_GAZE.copy()
                        attention_state = "No Face"

                    viz.draw_pose(frame, yaw, pitch, roll)
                    viz.draw_gaze(frame, gaze_result)
                    viz.draw_attention(frame, attention_state)
            else:
                ear = 0.0
                blink = False
                total_blinks = blink_detector.total_blinks
                gaze_result = DEFAULT_GAZE.copy()
                attention_state = "No Face"
                yaw = pitch = roll = None
                left_center = (0.0, 0.0)
                right_center = (0.0, 0.0)

            elapsed = time.time() - start
            fps = frame_no / elapsed if elapsed > 0 else 0
            viz.draw_info(frame, frame_no, fps)

            timestamp = frame_no / video.fps if video.fps else frame_no * frame_time
            frame_data = {
                "Frame": frame_no,
                "Time": round(timestamp, 3),
                "FaceDetected": found,
                "LeftIrisX": left_center[0] if found else 0.0,
                "LeftIrisY": left_center[1] if found else 0.0,
                "RightIrisX": right_center[0] if found else 0.0,
                "RightIrisY": right_center[1] if found else 0.0,
                "EAR": round(ear, 4),
                "Blink": blink,
                "TotalBlinks": total_blinks,
                "Yaw": yaw if yaw is not None else 0.0,
                "Pitch": pitch if pitch is not None else 0.0,
                "Roll": roll if roll is not None else 0.0,
                "HorizontalGaze": gaze_result["Horizontal"],
                "VerticalGaze": gaze_result["Vertical"],
                "OnScreen": gaze_result["OnScreen"],
                "HorizontalRatio": gaze_result["HRatio"],
                "VerticalRatio": gaze_result["VRatio"],
                "AttentionState": attention_state,
            }
            report.add(frame_data)
            video_writer.write(frame)
    finally:
        video.release()
        video_writer.release()
        detector.close()

    logger.info("Frame analysis complete (%s frames). Merging audio...", frame_no)
    exporter.merge_audio(str(video_path), str(annotated_path), str(final_path))

    logger.info("Extracting audio and running speech recognition...")
    audio_extractor.extract(str(video_path), str(audio_path))
    from pipeline.modules.audio.speech import SpeechRecognizer

    speech = SpeechRecognizer()
    _recognized, speech_segments = speech.recognize(str(audio_path))
    match = similarity.find_keyword(expected_word, speech_segments)

    pipeline_summary = attention.summary()
    pipeline_summary["ExpectedWord"] = expected_word
    pipeline_summary["RecognizedWord"] = match["Text"]
    pipeline_summary["SpeechScore"] = match["Score"]
    pipeline_summary["ResponseTime"] = match["Start"]
    pipeline_summary["SpeechFound"] = match["Found"]
    pipeline_summary["SpeechSegments"] = speech_segments

    report.save(pipeline_summary)

    logger.info("Analysis finished for %s", video_path)
    return AnalysisResult(
        annotated_video_path=final_path,
        csv_path=output_dir / "frame_data.csv",
        summary_path=output_dir / "summary.txt",
        pipeline_summary=pipeline_summary,
    )
