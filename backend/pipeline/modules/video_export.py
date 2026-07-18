from pipeline.ffmpeg_utils import merge_video_audio


class VideoExporter:
    def merge_audio(
        self,
        original_video,
        annotated_video,
        output_video,
        *,
        audio_start_seconds: float = 0.0,
    ):
        merge_video_audio(
            original_video,
            annotated_video,
            output_video,
            audio_start_seconds=audio_start_seconds,
        )
