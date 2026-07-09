LEFT_IRIS = [468, 469, 470, 471, 472]
RIGHT_IRIS = [473, 474, 475, 476, 477]


class IrisTracker:

    def __init__(self):
        pass

    def extract(self, face_landmarks, frame_shape):

        h, w = frame_shape[:2]

        left = []
        right = []

        for idx in LEFT_IRIS:

            lm = face_landmarks.landmark[idx]

            left.append(
                (
                    int(lm.x * w),
                    int(lm.y * h)
                )
            )

        for idx in RIGHT_IRIS:

            lm = face_landmarks.landmark[idx]

            right.append(
                (
                    int(lm.x * w),
                    int(lm.y * h)
                )
            )

        return left, right