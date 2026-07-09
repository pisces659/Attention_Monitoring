import wave
from pathlib import Path

from moviepy.editor import VideoFileClip


class AudioExtractor:
    def extract(self, video_path, output_audio):
        clip = VideoFileClip(video_path)
        if clip.audio is None:
            clip.close()
            self._write_silent_wav(output_audio, duration_seconds=1.0)
            return

        clip.audio.write_audiofile(output_audio, logger=None)
        clip.close()

    @staticmethod
    def _write_silent_wav(path: str, *, duration_seconds: float, sample_rate: int = 16000) -> None:
        frames = int(duration_seconds * sample_rate)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with wave.open(path, "w") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(b"\x00\x00" * frames)
