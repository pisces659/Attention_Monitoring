import math


LEFT_EYE_LEFT = 33
LEFT_EYE_RIGHT = 133
LEFT_IRIS = 468

LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145


class GazeEstimator:

    def __init__(self):

        self.left_threshold = 0.38
        self.right_threshold = 0.62

        self.up_threshold = 0.38
        self.down_threshold = 0.62

    def distance(self, p1, p2):

        return math.dist(p1, p2)

    def estimate(self,
                 face_landmarks,
                 frame_shape,
                 ear,
                 yaw,
                 pitch):

        h, w = frame_shape[:2]

        lm = face_landmarks.landmark

        # -----------------------
        # Left Eye
        # -----------------------

        left_corner = (
            lm[LEFT_EYE_LEFT].x * w,
            lm[LEFT_EYE_LEFT].y * h
        )

        right_corner = (
            lm[LEFT_EYE_RIGHT].x * w,
            lm[LEFT_EYE_RIGHT].y * h
        )

        iris = (
            lm[LEFT_IRIS].x * w,
            lm[LEFT_IRIS].y * h
        )

        eye_width = self.distance(
            left_corner,
            right_corner
        )

        iris_offset = self.distance(
            left_corner,
            iris
        )

        horizontal_ratio = iris_offset / eye_width

        # -----------------------
        # Vertical
        # -----------------------

        top = (
            lm[LEFT_EYE_TOP].x * w,
            lm[LEFT_EYE_TOP].y * h
        )

        bottom = (
            lm[LEFT_EYE_BOTTOM].x * w,
            lm[LEFT_EYE_BOTTOM].y * h
        )

        eye_height = self.distance(
            top,
            bottom
        )

        iris_height = self.distance(
            top,
            iris
        )

        vertical_ratio = iris_height / eye_height

        # -----------------------
        # Closed Eye
        # -----------------------

        if ear < 0.20:

            horizontal = "Closed"
            vertical = "Closed"

        else:

            yaw_value = yaw if yaw is not None else 0.0
            pitch_value = pitch if pitch is not None else 0.0

            # Horizontal

            if yaw_value < -15:

                horizontal = "Left"

            elif yaw_value > 15:

                horizontal = "Right"

            else:

                if horizontal_ratio < self.left_threshold:

                    horizontal = "Left"

                elif horizontal_ratio > self.right_threshold:

                    horizontal = "Right"

                else:

                    horizontal = "Center"

            # Vertical

            if pitch_value < -12:

                vertical = "Up"

            elif pitch_value > 12:

                vertical = "Down"

            else:

                if vertical_ratio < self.up_threshold:

                    vertical = "Up"

                elif vertical_ratio > self.down_threshold:

                    vertical = "Down"

                else:

                    vertical = "Center"

        onscreen = (
            horizontal == "Center"
            and
            vertical == "Center"
        )

        return {
            "Horizontal": horizontal,
            "Vertical": vertical,
            "OnScreen": onscreen,
            "HRatio": round(horizontal_ratio,3),
            "VRatio": round(vertical_ratio,3)
        }