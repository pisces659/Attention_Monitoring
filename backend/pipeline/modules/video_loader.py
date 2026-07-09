import cv2


class VideoLoader:

    def __init__(self, path):

        self.cap = cv2.VideoCapture(path)

        self.fps = self.cap.get(cv2.CAP_PROP_FPS)

        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()