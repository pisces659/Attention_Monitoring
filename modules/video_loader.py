import cv2


class VideoLoader:

    def __init__(self, video_path):

        self.cap = cv2.VideoCapture(video_path)

        if not self.cap.isOpened():
            raise Exception(f"Cannot open video : {video_path}")

        self.fps = self.cap.get(cv2.CAP_PROP_FPS)

        self.total_frames = int(
            self.cap.get(cv2.CAP_PROP_FRAME_COUNT)
        )

    def read(self):

        return self.cap.read()

    def release(self):

        self.cap.release()