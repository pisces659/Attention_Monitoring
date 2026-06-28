import cv2
import time

from config import *

from modules.video_loader import VideoLoader
from modules.face_detector import FaceDetector
from modules.iris_tracker import IrisTracker
from modules.blink_detector import BlinkDetector
from modules.head_pose import HeadPoseEstimator
from modules.gaze_estimator import GazeEstimator
from modules.attention_engine import AttentionEngine
from modules.visualization import *
from modules.report import Report

video = VideoLoader(VIDEO_PATH)

detector = FaceDetector()
iris = IrisTracker()
blink_detector = BlinkDetector()
head_pose = HeadPoseEstimator()
gaze = GazeEstimator()
attention = AttentionEngine()

report = Report(OUTPUT_FOLDER)

frame_no = 0

start = time.time()

while True:

    success, frame = video.read()

    if not success:
        break

    frame_no += 1

    results = detector.process(frame)

    found = False

    if results.multi_face_landmarks:

        found = True

        for face in results.multi_face_landmarks:

            if SHOW_LANDMARKS:
                draw_landmarks(frame, face)
            
            left, right = iris.extract(
                face,
                frame.shape
            )

            left_center = left[0]
            right_center = right[0]

            draw_iris(frame, left, (255,0,0))
            draw_iris(frame, right, (0,0,255))

            ear, blink, total_blinks = blink_detector.process(
                face,
                frame.shape,
            )
            
            draw_blink(frame, ear, total_blinks)

            pose = head_pose.estimate(face, frame)

            if pose is not None:
                yaw, pitch, roll = pose
                gaze_result = gaze.estimate(
                    face,
                    frame.shape,
                    ear,
                    yaw,
                    pitch
                )
                attention_state = attention.classify(
                    gaze_result,
                    blink,
                    ear
                )
            else:
                yaw = pitch = roll = None
            
            draw_pose(frame, yaw, pitch, roll)

            draw_gaze(
                frame,
                gaze_result
            )

            draw_attention(
                frame,
                attention_state
            )

    elapsed = time.time() - start

    fps = frame_no / elapsed

    draw_info(frame, frame_no, fps)

    timestamp = frame_no / video.fps

    frame_data = {
    "Frame": frame_no,
    "Time": round(timestamp, 3),
    "FaceDetected": found,

    "LeftIrisX": left_center[0] if found else None,
    "LeftIrisY": left_center[1] if found else None,

    "RightIrisX": right_center[0] if found else None,
    "RightIrisY": right_center[1] if found else None,

    "EAR": round(ear, 4),
    "Blink": blink,
    "TotalBlinks": total_blinks
    }

    frame_data["Yaw"] = yaw
    frame_data["Pitch"] = pitch
    frame_data["Roll"] = roll

    frame_data["HorizontalGaze"] = gaze_result["Horizontal"]
    frame_data["VerticalGaze"] = gaze_result["Vertical"]
    frame_data["OnScreen"] = gaze_result["OnScreen"]
    frame_data["HorizontalRatio"] = gaze_result["HRatio"]
    frame_data["VerticalRatio"] = gaze_result["VRatio"]
    frame_data["AttentionState"] = attention_state

    
    report.add(frame_data)

    cv2.imshow(WINDOW_NAME, frame)

    key = cv2.waitKey(1)

    if key == ord("q"):
        break

video.release()

cv2.destroyAllWindows()

summary = attention.summary()

report.save(summary)

print(summary)

print("Finished.")

