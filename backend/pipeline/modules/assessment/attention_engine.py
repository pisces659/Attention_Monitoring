class AttentionEngine:

    def __init__(self):

        self.focus_time = 0.0
        self.current_focus = 0.0
        self.longest_focus = 0.0

        self.distraction_count = 0
        self.was_focused = False

    def classify(self, gaze, blink, ear, frame_time):

        if ear < 0.18:
            state = "Eyes Closed"
            attention_break = True

        elif blink:
            state = "Blink"
            attention_break = False      # <-- Ignore blinks

        elif gaze["Horizontal"] != "Center":
            state = "Looking " + gaze["Horizontal"]
            attention_break = True

        elif gaze["Vertical"] != "Center":
            state = "Looking " + gaze["Vertical"]
            attention_break = True

        else:
            state = "Focused"
            attention_break = False

        # ---------- Statistics ----------
        # Focus continues during normal focus OR blink
        if not attention_break:

            self.focus_time += frame_time
            self.current_focus += frame_time
            self.was_focused = True

        else:

            if self.was_focused:
                self.distraction_count += 1

            self.longest_focus = max(
                self.longest_focus,
                self.current_focus
            )

            self.current_focus = 0
            self.was_focused = False

        return state

    def summary(self):

        # Video ended while still focused
        if self.current_focus > self.longest_focus:
            self.longest_focus = self.current_focus

        return {
            "FocusTime": round(self.focus_time, 2),
            "AttentionDrifts": self.distraction_count,
            "LongestFocus": round(self.longest_focus, 2)
        }