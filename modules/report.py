from pathlib import Path
import pandas as pd


class Report:

    def __init__(self, folder):

        self.folder = Path(folder)
        self.folder.mkdir(exist_ok=True)
        self.rows = []

    def add(self, frame_data):

        self.rows.append(frame_data.copy())

    def save(self, attention_summary):

        df = pd.DataFrame(self.rows)

        print(df.columns)     # <-- Temporary debugging

        df.to_csv(
            self.folder / "frame_data.csv",
            index=False,
        )

        with open(self.folder / "summary.txt", "w") as f:

            f.write(
                f"Focused Frames : {attention_summary['FocusedFrames']}\n"
            )

            f.write(
                f"Away Frames : {attention_summary['AwayFrames']}\n"
            )

            f.write(
                f"Eyes Closed Frames : {attention_summary['ClosedFrames']}\n"
            )