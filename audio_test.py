from modules.audio.extractor import AudioExtractor
from modules.audio.speech import SpeechRecognizer
from modules.audio.similarity import Similarity

VIDEO = r"C:\Users\Ramprakash\Projects\Attention_Monitoring_System\Attention_Monitoring\videos\ele_1.mp4"

extractor = AudioExtractor()
extractor.extract(VIDEO, "audio.wav")

speech = SpeechRecognizer()

text = speech.recognize("audio.wav")

print("Expected : Elephant")
print("Recognized :", text)

sim = Similarity()

score = sim.compare(
    "Elephant",
    text
)

if score >= 90:
    result = "Correct"

elif score >= 70:
    result = "Partial"

else:
    result = "Incorrect"

print("score :", score)
print("Result :", result)