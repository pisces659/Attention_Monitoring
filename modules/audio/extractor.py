from moviepy import VideoFileClip


class AudioExtractor:

    def extract(self, video_path, output_audio):

        clip = VideoFileClip(video_path)
        clip.audio.write_audiofile(
            output_audio,
            logger=None
        )
        clip.close()