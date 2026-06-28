import mediapipe as mp


class FaceDetector:

    def __init__(self):

        self.mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def process(self, frame):

        import cv2

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        return self.mesh.process(rgb)