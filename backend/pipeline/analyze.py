"""Headless video analysis — Ram branch pipeline without GUI preview."""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path

# Anaconda + MediaPipe + OpenCV often conflict on OpenMP — must be set before native imports.
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import cv2

from pipeline.calibration import load_calibration
from pipeline.calibration_baseline import apply_session_calibration_baseline
from pipeline.modules import visualization as viz
from pipeline.modules.assessment.attention_engine import AttentionEngine
from pipeline.modules.audio.extractor import AudioExtractor
from pipeline.modules.audio.similarity import Similarity, parse_expected_words
from pipeline.modules.report.report import Report
from pipeline.modules.video_export import VideoExporter
from pipeline.modules.video_loader import VideoLoader
from pipeline.modules.vision.blink_detector import BlinkDetector
from pipeline.modules.vision.face_detector import FaceDetector
from pipeline.modules.vision.gaze_estimator import GazeEstimator
from pipeline.modules.vision.head_pose import HeadPoseEstimator
from pipeline.modules.vision.iris_tracker import IrisTracker
from pipeline.ffmpeg_utils import clamp_fps, probe_duration_seconds, reencode_video_with_fps
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


def _load_focus_areas(output_dir: Path) -> list[dict] | None:
    meta_path = output_dir.parent / "stimulus_meta.json"
    if not meta_path.exists():
        return None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    focus_areas = meta.get("focusAreas")
    return focus_areas if isinstance(focus_areas, list) and focus_areas else None


def _keywords_from_focus_areas(focus_areas: list[dict]) -> list[str]:
    return [kw for area in focus_areas for kw in area.get("keywords", [])]


def analyze_video(
    video_path: str | Path,
    output_dir: str | Path,
    *,
    expected_word: str = "Elephant",
    expected_words: list[str] | None = None,
    focus_areas: list[dict] | None = None,
    show_landmarks: bool = True,
    analysis_start_seconds: float = 0.0,
) -> AnalysisResult:
    video_path = ensure_opencv_readable(Path(video_path))
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if focus_areas is None:
        focus_areas = _load_focus_areas(output_dir)

    words = expected_words if expected_words else parse_expected_words(expected_word)
    if not words:
        words = [expected_word.strip() or "Elephant"]

    if focus_areas:
        focus_keywords = _keywords_from_focus_areas(focus_areas)
        if focus_keywords:
            words = focus_keywords

    video = VideoLoader(str(video_path))
    source_duration = video.duration_seconds or probe_duration_seconds(Path(video_path))
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
    session_calibration = load_calibration(output_dir.parent)
    session_calibration = apply_session_calibration_baseline(
        output_dir.parent,
        video_path,
        session_calibration,
    )
    gaze = GazeEstimator.from_calibration(session_calibration)
    attention = AttentionEngine()
    audio_extractor = AudioExtractor()
    similarity = Similarity()
    exporter = VideoExporter()
    report = Report(str(output_dir))

    logger.info(
        "Starting frame analysis for %s (fps=%.2f, duration=%ss)",
        video_path,
        video.fps,
        f"{source_duration:.2f}" if source_duration else "unknown",
    )

    frame_no = 0
    output_frame_no = 0
    start = time.time()
    frame_time = 1 / video.fps if video.fps else 1 / 30
    analysis_started = analysis_start_seconds <= 0

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
            timestamp = frame_no / video.fps if video.fps else frame_no * frame_time

            if timestamp < analysis_start_seconds:
                continue

            if not analysis_started:
                attention = AttentionEngine()
                blink_detector = BlinkDetector()
                analysis_started = True
                logger.info(
                    "Analysis output begins at %.2fs (frame %s)",
                    analysis_start_seconds,
                    frame_no,
                )

            timestamp_ms = int(timestamp * 1000)
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
            viz.draw_info(frame, output_frame_no + 1, fps)

            output_time = round(timestamp - analysis_start_seconds, 3)
            output_frame_no += 1
            frame_data = {
                "Frame": output_frame_no,
                "Time": output_time,
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

    if source_duration and output_frame_no > 0:
        stimulus_duration = max(source_duration - analysis_start_seconds, 0.01)
        actual_fps = clamp_fps(output_frame_no / stimulus_duration)
        if abs(actual_fps - video.fps) > 0.5:
            logger.info(
                "Re-timing annotated video from %.2f fps to %.2f fps",
                video.fps,
                actual_fps,
            )
            corrected_path = output_dir / "annotated_timed.mp4"
            reencode_video_with_fps(annotated_path, corrected_path, actual_fps)
            annotated_path = corrected_path

    logger.info("Frame analysis complete (%s output frames). Merging audio...", output_frame_no)
    exporter.merge_audio(
        str(video_path),
        str(annotated_path),
        str(final_path),
        audio_start_seconds=analysis_start_seconds,
    )

    logger.info("Extracting audio and running speech recognition...")
    audio_extractor.extract(
        str(video_path),
        str(audio_path),
        start_seconds=analysis_start_seconds,
    )
    from pipeline.modules.audio.speech import SpeechRecognizer

    speech = SpeechRecognizer()
    _recognized, speech_segments = speech.recognize(str(audio_path))
    if focus_areas:
        from pipeline.modules.audio.timed_matching import match_focus_areas

        speech_result = match_focus_areas(focus_areas, speech_segments)
    else:
        speech_result = similarity.match_expected_words(words, speech_segments)
    first_match = speech_result.get("firstMatch")

    pipeline_summary = attention.summary()
    pipeline_summary["ExpectedWords"] = speech_result["expectedWords"]
    pipeline_summary["ExpectedWord"] = ", ".join(speech_result["expectedWords"])
    pipeline_summary["SpeechMatches"] = speech_result["matches"]
    pipeline_summary["SpeechOtherWords"] = speech_result["otherWords"]
    pipeline_summary["RecognizedWord"] = (
        first_match.get("detectedWord") if first_match and first_match.get("found") else ""
    )
    pipeline_summary["SpeechScore"] = speech_result["speechScore"]
    pipeline_summary["ResponseTime"] = (
        first_match.get("responseTimeSeconds") if first_match else None
    )
    pipeline_summary["SpeechFound"] = any(match.get("found") for match in speech_result["matches"])
    pipeline_summary["SpeechSegments"] = speech_segments
    pipeline_summary["SpeechCorrectCount"] = speech_result["correctCount"]
    pipeline_summary["SpeechPartialCount"] = speech_result["partialCount"]
    pipeline_summary["SpeechIncorrectCount"] = speech_result["incorrectCount"]
    pipeline_summary["SpeechCompletionPercent"] = speech_result["completionPercent"]

    report.save(pipeline_summary)

    logger.info("Analysis finished for %s", video_path)
    return AnalysisResult(
        annotated_video_path=final_path,
        csv_path=output_dir / "frame_data.csv",
        summary_path=output_dir / "summary.txt",
        pipeline_summary=pipeline_summary,
    )
