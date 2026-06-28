import cv2
import numpy as np


class HeadPoseEstimator:

    def __init__(self):
        pass

    def estimate(self, face_landmarks, frame):

        h, w = frame.shape[:2]

        image_points = []
        object_points = []

        # MediaPipe landmark IDs
        indices = [1, 33, 61, 199, 263, 291]

        for idx in indices:

            lm = face_landmarks.landmark[idx]

            x = lm.x * w
            y = lm.y * h

            image_points.append([x, y])

        image_points = np.array(image_points, dtype=np.float64)

        # Approximate 3D model
        object_points = np.array([
            [0.0, 0.0, 0.0],        # Nose
            [-30.0, -30.0, -30.0],  # Left eye
            [-20.0, 20.0, -20.0],   # Left mouth
            [0.0, 60.0, -20.0],     # Chin
            [30.0, -30.0, -30.0],   # Right eye
            [20.0, 20.0, -20.0],    # Right mouth
        ])

        focal_length = w

        camera_matrix = np.array([
            [focal_length, 0, w / 2],
            [0, focal_length, h / 2],
            [0, 0, 1]
        ])

        dist_coeffs = np.zeros((4, 1))

        success, rvec, tvec = cv2.solvePnP(
            object_points,
            image_points,
            camera_matrix,
            dist_coeffs
        )

        if not success:
            return None

        rotation_matrix, _ = cv2.Rodrigues(rvec)

        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rotation_matrix)

        pitch = angles[0]
        yaw = angles[1]
        roll = angles[2]

        return yaw, pitch, roll