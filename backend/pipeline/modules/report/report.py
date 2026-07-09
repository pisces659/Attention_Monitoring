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

        df.to_csv(
            self.folder / "frame_data.csv",
            index=False,
        )

        with open(self.folder / "summary.txt", "w") as f:

            f.write("------ Attention Summary ------\n\n")

            f.write(
                f"Focus Time : {attention_summary['FocusTime']} sec\n"
            )

            f.write(
                f"Attention Drifts : {attention_summary['AttentionDrifts']}\n"
            )

            f.write(
                f"Longest Focus : {attention_summary['LongestFocus']} sec\n"
            )
            
            f.write("\n")
            f.write("----- Speech Assessment -----\n\n")

            f.write(f"Expected Word : {attention_summary['ExpectedWord']}\n")
            f.write(f"Keyword Found : {attention_summary['SpeechFound']}\n")
            f.write(f"Matched Text  : {attention_summary['RecognizedWord']}\n")
            f.write(f"Confidence    : {attention_summary['SpeechScore']} %\n")
            f.write(f"Response Time : {attention_summary['ResponseTime']} sec\n")

            f.write("Speech Timeline\n")
            f.write("-" * 45 + "\n")

            for seg in attention_summary["SpeechSegments"]:
                f.write(
                    f"[{seg['start']:5.2f} - {seg['end']:5.2f}]  {seg['text']}\n"
                )