from __future__ import annotations

from rapidfuzz import fuzz


def parse_expected_words(value: str | list[str]) -> list[str]:
  """Parse comma-separated or list input into ordered expected words."""
  if isinstance(value, list):
    return [word.strip() for word in value if word and word.strip()]
  return [word.strip() for word in value.split(",") if word.strip()]


def _format_response_time(seconds: float | None) -> str:
  if seconds is None:
    return "—"
  return f"{seconds:.1f}s"


def _word_match_score(expected: str, candidate: str) -> float:
  expected_norm = expected.lower().strip()
  candidate_norm = candidate.lower().strip()
  if not expected_norm or not candidate_norm:
    return 0.0
  if expected_norm == candidate_norm or expected_norm in candidate_norm:
    return 100.0
  return float(fuzz.partial_ratio(expected_norm, candidate_norm))


class Similarity:
  MATCH_THRESHOLD = 60.0
  TIMING_TOLERANCE_SECONDS = 0.5

  def _timing_factor(
    self,
    response_time: float | None,
    window_start: float,
    window_end: float,
    *,
    tolerance: float | None = None,
  ) -> float:
    if response_time is None:
      return 0.0

    tol = self.TIMING_TOLERANCE_SECONDS if tolerance is None else tolerance
    expanded_start = window_start - tol
    expanded_end = window_end + tol

    if expanded_start <= response_time <= expanded_end:
      midpoint = (window_start + window_end) / 2.0
      half_width = max((window_end - window_start) / 2.0, 0.25)
      distance = abs(response_time - midpoint)
      return max(0.85, 1.0 - (distance / half_width) * 0.15)

    if response_time < expanded_start:
      gap = expanded_start - response_time
    else:
      gap = response_time - expanded_end
    return max(0.0, 0.55 - gap * 0.35)

  def find_keyword(self, expected_word, speech_segments):
    expected = expected_word.lower().strip()

    best = {
      "Found": False,
      "Score": 0,
      "Start": None,
      "End": None,
      "Text": "",
    }

    for seg in speech_segments:
      text = seg["text"].lower()

      if expected in text:
        best["Found"] = True
        best["Score"] = 100
        best["Start"] = seg["start"]
        best["End"] = seg["end"]
        best["Text"] = seg["text"]
        return best

      score = fuzz.partial_ratio(expected, text)

      if score > best["Score"]:
        best["Score"] = round(score, 2)
        best["Start"] = seg["start"]
        best["End"] = seg["end"]
        best["Text"] = seg["text"]

    return best

  def extract_word_candidates(self, speech_segments: list[dict]) -> list[dict]:
    """Split segment transcripts into ordered word candidates."""
    candidates: list[dict] = []
    for seg in speech_segments:
      words = seg.get("text", "").split()
      for word in words:
        cleaned = word.strip(".,!?;:\"'()[]")
        if not cleaned:
          continue
        candidates.append(
          {
            "word": cleaned,
            "normalized": cleaned.lower(),
            "start": seg.get("start"),
            "end": seg.get("end"),
            "segmentText": seg.get("text", ""),
          }
        )
    return candidates

  def match_expected_words(
    self,
    expected_words: list[str],
    speech_segments: list[dict],
  ) -> dict:
    """Match each expected word to the best unused detected word by confidence."""
    expected_words = parse_expected_words(expected_words)
    candidates = self.extract_word_candidates(speech_segments)
    used_indices: set[int] = set()
    matches: list[dict] = []

    for expected in expected_words:
      best_idx: int | None = None
      best_score = 0.0
      for idx, candidate in enumerate(candidates):
        if idx in used_indices:
          continue
        score = _word_match_score(expected, candidate["word"])
        if score > best_score:
          best_score = score
          best_idx = idx

      if best_idx is not None and best_score >= self.MATCH_THRESHOLD:
        candidate = candidates[best_idx]
        used_indices.add(best_idx)
        matches.append(
          {
            "expectedWord": expected,
            "detectedWord": candidate["word"],
            "confidence": round(best_score, 1),
            "responseTime": _format_response_time(candidate.get("start")),
            "responseTimeSeconds": candidate.get("start"),
            "found": True,
          }
        )
      else:
        matches.append(
          {
            "expectedWord": expected,
            "detectedWord": None,
            "confidence": 0,
            "responseTime": "—",
            "responseTimeSeconds": None,
            "found": False,
          }
        )

    other_words: list[dict] = []
    seen_normalized: set[str] = set()
    for idx, candidate in enumerate(candidates):
      if idx in used_indices:
        continue
      normalized = candidate["normalized"]
      if normalized in seen_normalized:
        continue
      seen_normalized.add(normalized)
      best_against_expected = max(
        (_word_match_score(expected, candidate["word"]) for expected in expected_words),
        default=0.0,
      )
      other_words.append(
        {
          "word": candidate["word"],
          "confidence": round(best_against_expected, 1),
        }
      )

    correct_count = sum(1 for match in matches if match["found"] and match["confidence"] >= 90)
    partial_count = sum(
      1 for match in matches if match["found"] and 60 <= match["confidence"] < 90
    )
    incorrect_count = len(matches) - correct_count - partial_count
    total = len(expected_words) or 1
    completion_percent = round((sum(1 for match in matches if match["found"]) / total) * 100)
    avg_confidence = (
      round(sum(match["confidence"] for match in matches if match["found"]) / max(1, correct_count + partial_count))
      if any(match["found"] for match in matches)
      else 0
    )

    first_match = next((match for match in matches if match["found"]), matches[0] if matches else None)

    return {
      "expectedWords": expected_words,
      "matches": matches,
      "otherWords": other_words,
      "correctCount": correct_count,
      "partialCount": partial_count,
      "incorrectCount": incorrect_count,
      "completionPercent": completion_percent,
      "speechScore": avg_confidence,
      "firstMatch": first_match,
    }

  def match_expected_words_with_timing(
    self,
    focus_areas: list[dict],
    speech_segments: list[dict],
    *,
    timing_tolerance_seconds: float | None = None,
  ) -> dict:
    """Match stimulus focus-area keywords with word + timing confidence."""
    candidates = self.extract_word_candidates(speech_segments)
    used_indices: set[int] = set()
    matches: list[dict] = []
    expected_words: list[str] = []

    for area in focus_areas:
      keywords = area.get("keywords") or []
      if not keywords:
        continue

      expected = str(keywords[0]).strip()
      if not expected:
        continue

      expected_words.append(expected)
      window_start = float(area.get("startMs", 0)) / 1000.0
      window_end = float(area.get("endMs", 0)) / 1000.0

      best_idx: int | None = None
      best_word_score = 0.0
      best_timing = 0.0
      best_combined = 0.0

      for idx, candidate in enumerate(candidates):
        if idx in used_indices:
          continue

        word_score = _word_match_score(expected, candidate["word"])
        if word_score < self.MATCH_THRESHOLD:
          continue

        timing = self._timing_factor(
          candidate.get("start"),
          window_start,
          window_end,
          tolerance=timing_tolerance_seconds,
        )
        combined = word_score * max(timing, 0.35)

        if combined > best_combined:
          best_combined = combined
          best_word_score = word_score
          best_timing = timing
          best_idx = idx

      if best_idx is not None:
        candidate = candidates[best_idx]
        used_indices.add(best_idx)
        in_window = best_timing >= 0.85
        confidence = round(min(100.0, best_word_score * max(best_timing, 0.35)), 1)
        matches.append(
          {
            "expectedWord": expected,
            "detectedWord": candidate["word"],
            "confidence": confidence,
            "wordConfidence": round(best_word_score, 1),
            "timingConfidence": round(best_timing * 100.0, 1),
            "inTimeWindow": in_window,
            "expectedWindowStart": round(window_start, 2),
            "expectedWindowEnd": round(window_end, 2),
            "responseTime": _format_response_time(candidate.get("start")),
            "responseTimeSeconds": candidate.get("start"),
            "found": True,
            "focusAreaId": area.get("id"),
            "focusAreaLabel": area.get("label") or expected,
          }
        )
      else:
        matches.append(
          {
            "expectedWord": expected,
            "detectedWord": None,
            "confidence": 0,
            "wordConfidence": 0,
            "timingConfidence": 0,
            "inTimeWindow": False,
            "expectedWindowStart": round(window_start, 2),
            "expectedWindowEnd": round(window_end, 2),
            "responseTime": "—",
            "responseTimeSeconds": None,
            "found": False,
            "focusAreaId": area.get("id"),
            "focusAreaLabel": area.get("label") or expected,
          }
        )

    other_words: list[dict] = []
    seen_normalized: set[str] = set()
    for idx, candidate in enumerate(candidates):
      if idx in used_indices:
        continue
      normalized = candidate["normalized"]
      if normalized in seen_normalized:
        continue
      seen_normalized.add(normalized)
      best_against_expected = max(
        (_word_match_score(expected, candidate["word"]) for expected in expected_words),
        default=0.0,
      )
      other_words.append(
        {
          "word": candidate["word"],
          "confidence": round(best_against_expected, 1),
        }
      )

    correct_count = sum(
      1 for match in matches if match["found"] and match["confidence"] >= 90 and match["inTimeWindow"]
    )
    partial_count = sum(
      1
      for match in matches
      if match["found"] and (match["confidence"] >= 60 and not match["inTimeWindow"] or 60 <= match["confidence"] < 90)
    )
    incorrect_count = len(matches) - correct_count - partial_count
    total = len(expected_words) or 1
    completion_percent = round((sum(1 for match in matches if match["found"]) / total) * 100)
    avg_confidence = (
      round(sum(match["confidence"] for match in matches if match["found"]) / max(1, correct_count + partial_count))
      if any(match["found"] for match in matches)
      else 0
    )

    first_match = next((match for match in matches if match["found"]), matches[0] if matches else None)

    return {
      "expectedWords": expected_words,
      "matches": matches,
      "otherWords": other_words,
      "correctCount": correct_count,
      "partialCount": partial_count,
      "incorrectCount": incorrect_count,
      "completionPercent": completion_percent,
      "speechScore": avg_confidence,
      "firstMatch": first_match,
    }
