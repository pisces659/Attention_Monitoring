import math


LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]


class BlinkDetector:

    def __init__(self, threshold=0.22):

        self.threshold = threshold

        self.total_blinks = 0

        self.eye_closed = False

    def distance(self, p1, p2):

        return math.dist(p1, p2)

    def ear(self, eye):

        A = self.distance(eye[1], eye[5])
        B = self.distance(eye[2], eye[4])
        C = self.distance(eye[0], eye[3])

        return (A + B) / (2.0 * C)

    def process(self, face_landmarks, frame_shape):

        h, w = frame_shape[:2]

        left = []
        right = []

        for idx in LEFT_EYE:

            lm = face_landmarks.landmark[idx]

            left.append((lm.x * w, lm.y * h))

        for idx in RIGHT_EYE:

            lm = face_landmarks.landmark[idx]

            right.append((lm.x * w, lm.y * h))

        leftEAR = self.ear(left)
        rightEAR = self.ear(right)

        ear = (leftEAR + rightEAR) / 2

        blink = False

        if ear < self.threshold:

            if not self.eye_closed:

                self.total_blinks += 1

                blink = True

            self.eye_closed = True

        else:

            self.eye_closed = False

        return ear, blink, self.total_blinks