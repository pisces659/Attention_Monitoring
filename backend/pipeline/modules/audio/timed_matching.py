"""Timing-aware speech matching against stimulus focus-area windows."""

from __future__ import annotations

from pipeline.modules.audio.similarity import (
    Similarity,
    _format_response_time,
    _word_match_score,
)


def _timing_factor(
    word_time_s: float | None,
    window_start_s: float,
    window_end_s: float,
    tolerance_s: float,
) -> tuple[float, bool]:
    if word_time_s is None:
        return 0.0, False

    in_window_start = window_start_s - tolerance_s
    in_window_end = window_end_s + tolerance_s
    if in_window_start <= word_time_s <= in_window_end:
        return 1.0, True

    extended_start = window_start_s - (2 * tolerance_s)
    extended_end = window_end_s + (2 * tolerance_s)
    if extended_start <= word_time_s <= extended_end:
        return 0.5, False

    return 0.0, False


def match_focus_areas(
    focus_areas: list[dict],
    speech_segments: list[dict],
    tolerance_s: float = 0.5,
) -> dict:
    """Match focus-area keywords to speech with timing confidence."""
    similarity = Similarity()
    candidates = similarity.extract_word_candidates(speech_segments)
    used_indices: set[int] = set()
    matches: list[dict] = []
    expected_words: list[str] = []

    for area in focus_areas:
        start_ms = int(area.get("startMs", 0))
        end_ms = int(area.get("endMs", 0))
        window_start_s = start_ms / 1000.0
        window_end_s = end_ms / 1000.0

        for expected in area.get("keywords", []):
            expected_words.append(expected)
            best_idx: int | None = None
            best_word_score = 0.0
            best_timing_factor = 0.0
            best_combined = 0.0
            best_in_window = False

            for idx, candidate in enumerate(candidates):
                if idx in used_indices:
                    continue

                word_score = _word_match_score(expected, candidate["word"])
                if word_score < similarity.MATCH_THRESHOLD:
                    continue

                timing_factor, in_window = _timing_factor(
                    candidate.get("start"),
                    window_start_s,
                    window_end_s,
                    tolerance_s,
                )
                combined = word_score * timing_factor
                if combined > best_combined:
                    best_combined = combined
                    best_idx = idx
                    best_word_score = word_score
                    best_timing_factor = timing_factor
                    best_in_window = in_window

            if best_idx is not None and best_combined >= similarity.MATCH_THRESHOLD:
                candidate = candidates[best_idx]
                used_indices.add(best_idx)
                response_time = candidate.get("start")
                matches.append(
                    {
                        "expectedWord": expected,
                        "detectedWord": candidate["word"],
                        "confidence": round(best_word_score * best_timing_factor, 1),
                        "timingConfidence": round(best_timing_factor * 100, 1),
                        "inWindow": best_in_window,
                        "responseTime": _format_response_time(response_time),
                        "responseTimeSeconds": response_time,
                        "windowStartMs": start_ms,
                        "windowEndMs": end_ms,
                        "found": True,
                    }
                )
            else:
                matches.append(
                    {
                        "expectedWord": expected,
                        "detectedWord": None,
                        "confidence": 0,
                        "timingConfidence": 0,
                        "inWindow": False,
                        "responseTime": "—",
                        "responseTimeSeconds": None,
                        "windowStartMs": start_ms,
                        "windowEndMs": end_ms,
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

    correct_count = sum(
        1 for match in matches if match["found"] and match["confidence"] >= 90
    )
    partial_count = sum(
        1 for match in matches if match["found"] and 60 <= match["confidence"] < 90
    )
    incorrect_count = len(matches) - correct_count - partial_count
    total = len(expected_words) or 1
    completion_percent = round((sum(1 for match in matches if match["found"]) / total) * 100)
    avg_confidence = (
        round(
            sum(match["confidence"] for match in matches if match["found"])
            / max(1, correct_count + partial_count)
        )
        if any(match["found"] for match in matches)
        else 0
    )
    first_match = next(
        (match for match in matches if match["found"]),
        matches[0] if matches else None,
    )

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
