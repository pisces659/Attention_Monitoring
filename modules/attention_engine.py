class AttentionEngine:

    def __init__(self):

        self.focus_frames = 0
        self.away_frames = 0
        self.closed_frames = 0

    def classify(self,
                 gaze,
                 blink,
                 ear):

        if ear < 0.18:

            state = "Eyes Closed"

        elif blink:

            state = "Blink"

        elif gaze["Horizontal"] != "Center":

            state = "Looking " + gaze["Horizontal"]

        elif gaze["Vertical"] != "Center":

            state = "Looking " + gaze["Vertical"]

        else:

            state = "Focused"

        if state == "Focused":
            self.focus_frames += 1
        else:
            self.away_frames += 1

        if state == "Eyes Closed":
            self.closed_frames += 1

        return state

    def summary(self):

        return {
            "FocusedFrames": self.focus_frames,
            "AwayFrames": self.away_frames,
            "ClosedFrames": self.closed_frames
        }