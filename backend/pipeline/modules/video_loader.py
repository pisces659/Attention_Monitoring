import cv2


class VideoLoader:

    def __init__(self, path):

        self.cap = cv2.VideoCapture(path)

        fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.fps = fps if fps and fps > 1 else 30.0

        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()