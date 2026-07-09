from faster_whisper import WhisperModel


class SpeechRecognizer:

    def __init__(self):

        self.model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8"
        )

    def recognize(self, audio_path):

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True
        )

        speech_segments = []

        text = ""

        for seg in segments:

            text += seg.text + " "

            speech_segments.append(
                {
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip()
                }
            )

        return text.strip(), speech_segments