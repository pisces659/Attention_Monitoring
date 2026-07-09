from moviepy.editor import VideoFileClip


class VideoExporter:
    def merge_audio(self, original_video, annotated_video, output_video):
        original = VideoFileClip(original_video)
        annotated = VideoFileClip(annotated_video)

        if original.audio is None:
            annotated.write_videofile(
                output_video,
                codec="libx264",
                audio=False,
                logger=None,
            )
            original.close()
            annotated.close()
            return

        final = annotated.set_audio(original.audio)
        final.write_videofile(
            output_video,
            codec="libx264",
            audio_codec="aac",
            logger=None,
        )

        original.close()
        annotated.close()
        final.close()
