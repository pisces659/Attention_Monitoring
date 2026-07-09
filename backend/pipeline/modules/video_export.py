from pipeline.ffmpeg_utils import merge_video_audio


class VideoExporter:
    def merge_audio(self, original_video, annotated_video, output_video):
        merge_video_audio(original_video, annotated_video, output_video)
