from __future__ import annotations

from faster_whisper import WhisperModel

_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel("base", device="cpu", compute_type="int8")
    return _model


class SpeechRecognizer:
    def recognize(self, audio_path):
        model = get_whisper_model()
        segments, _info = model.transcribe(audio_path, beam_size=5, vad_filter=True)

        speech_segments = []
        text = ""

        for seg in segments:
            text += seg.text + " "
            speech_segments.append(
                {
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip(),
                }
            )

        return text.strip(), speech_segments
