import math
from typing import Any


LEFT_EYE_LEFT = 33
LEFT_EYE_RIGHT = 133
LEFT_IRIS = 468

LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145


class GazeEstimator:

    def __init__(self):
        self.left_threshold = 0.36
        self.right_threshold = 0.64
        self.up_threshold = 0.32
        self.down_threshold = 0.68
        self.yaw_left_threshold = -18.0
        self.yaw_right_threshold = 18.0
        self.pitch_up_threshold = -20.0
        self.pitch_down_threshold = 20.0
        self.h_ratio_center = 0.5
        self.v_ratio_center = 0.5
        self.pitch_neutral = 0.0
        self.yaw_neutral = 0.0

    @classmethod
    def from_calibration(cls, calibration: dict[str, Any] | None) -> "GazeEstimator":
        instance = cls()
        if not calibration:
            return instance

        baseline = calibration.get("baseline") or {}
        instance.h_ratio_center = float(baseline.get("hRatioCenter", 0.5))
        instance.v_ratio_center = float(baseline.get("vRatioCenter", 0.5))
        instance.pitch_neutral = float(baseline.get("pitchNeutral", 0.0))
        instance.yaw_neutral = float(baseline.get("yawNeutral", 0.0))
        instance.left_threshold = float(baseline.get("irisLeftThreshold", 0.36))
        instance.right_threshold = float(baseline.get("irisRightThreshold", 0.64))
        instance.up_threshold = float(baseline.get("irisUpThreshold", 0.32))
        instance.down_threshold = float(baseline.get("irisDownThreshold", 0.68))
        instance.yaw_left_threshold = float(baseline.get("yawLeftThreshold", -18.0))
        instance.yaw_right_threshold = float(baseline.get("yawRightThreshold", 18.0))
        instance.pitch_up_threshold = float(baseline.get("pitchUpThreshold", -20.0))
        instance.pitch_down_threshold = float(baseline.get("pitchDownThreshold", 20.0))
        return instance

    def distance(self, p1, p2):
        return math.dist(p1, p2)

    @staticmethod
    def raw_eye_ratios(face_landmarks, frame_shape) -> tuple[float, float]:
        """Iris position ratios within the left eye (0=left corner, 1=right corner)."""
        h, w = frame_shape[:2]
        lm = face_landmarks.landmark

        left_corner = (lm[LEFT_EYE_LEFT].x * w, lm[LEFT_EYE_LEFT].y * h)
        right_corner = (lm[LEFT_EYE_RIGHT].x * w, lm[LEFT_EYE_RIGHT].y * h)
        iris = (lm[LEFT_IRIS].x * w, lm[LEFT_IRIS].y * h)

        eye_width = math.dist(left_corner, right_corner)
        horizontal_ratio = math.dist(left_corner, iris) / eye_width if eye_width else 0.5

        top = (lm[LEFT_EYE_TOP].x * w, lm[LEFT_EYE_TOP].y * h)
        bottom = (lm[LEFT_EYE_BOTTOM].x * w, lm[LEFT_EYE_BOTTOM].y * h)
        eye_height = math.dist(top, bottom)
        vertical_ratio = math.dist(top, iris) / eye_height if eye_height else 0.5

        return horizontal_ratio, vertical_ratio

    def estimate(self, face_landmarks, frame_shape, ear, yaw, pitch):
        h, w = frame_shape[:2]
        lm = face_landmarks.landmark

        left_corner = (lm[LEFT_EYE_LEFT].x * w, lm[LEFT_EYE_LEFT].y * h)
        right_corner = (lm[LEFT_EYE_RIGHT].x * w, lm[LEFT_EYE_RIGHT].y * h)
        iris = (lm[LEFT_IRIS].x * w, lm[LEFT_IRIS].y * h)

        horizontal_ratio, vertical_ratio = self.raw_eye_ratios(face_landmarks, frame_shape)

        if ear < 0.20:
            horizontal = "Closed"
            vertical = "Closed"
        else:
            yaw_value = (yaw if yaw is not None else 0.0) - self.yaw_neutral
            pitch_value = (pitch if pitch is not None else 0.0) - self.pitch_neutral
            adjusted_h = horizontal_ratio - self.h_ratio_center + 0.5
            adjusted_v = vertical_ratio - self.v_ratio_center + 0.5

            if yaw_value < self.yaw_left_threshold:
                horizontal = "Left"
            elif yaw_value > self.yaw_right_threshold:
                horizontal = "Right"
            elif adjusted_h < self.left_threshold:
                horizontal = "Left"
            elif adjusted_h > self.right_threshold:
                horizontal = "Right"
            else:
                horizontal = "Center"

            pitch_up = pitch_value < self.pitch_up_threshold
            pitch_down = pitch_value > self.pitch_down_threshold
            iris_up = adjusted_v < self.up_threshold
            iris_down = adjusted_v > self.down_threshold

            if pitch_up and iris_up:
                vertical = "Up"
            elif pitch_down and iris_down:
                vertical = "Down"
            elif iris_up and pitch_value < self.pitch_up_threshold + 6:
                vertical = "Up"
            elif iris_down and pitch_value > self.pitch_down_threshold - 6:
                vertical = "Down"
            else:
                vertical = "Center"

        onscreen = horizontal == "Center" and vertical == "Center"

        return {
            "Horizontal": horizontal,
            "Vertical": vertical,
            "OnScreen": onscreen,
            "HRatio": round(horizontal_ratio, 3),
            "VRatio": round(vertical_ratio, 3),
        }
