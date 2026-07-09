from rapidfuzz import fuzz


class Similarity:

    def find_keyword(self, expected_word, speech_segments):

        expected = expected_word.lower().strip()

        best = {
            "Found": False,
            "Score": 0,
            "Start": None,
            "End": None,
            "Text": ""
        }

        for seg in speech_segments:

            text = seg["text"].lower()

            # Exact match anywhere
            if expected in text:

                best["Found"] = True
                best["Score"] = 100
                best["Start"] = seg["start"]
                best["End"] = seg["end"]
                best["Text"] = seg["text"]

                return best

            # Partial match
            score = fuzz.partial_ratio(expected, text)

            if score > best["Score"]:

                best["Score"] = round(score, 2)
                best["Start"] = seg["start"]
                best["End"] = seg["end"]
                best["Text"] = seg["text"]

        return best