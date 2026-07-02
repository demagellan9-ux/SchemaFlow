"""
Heuristic header-row detection.
Scores candidate rows using configurable signal functions.
The row with the highest score is selected as the header.
"""


def detect_header_row(rows: list[tuple]) -> int:
    """
    Returns the 0-indexed row index most likely to be the header row.
    Evaluates up to the first 10 rows only.
    """
    # TODO: Implement signal scoring (see etl-engine SKILL.md for signal table)
    # Signals: all-string row, all non-null, unique values, precedes mixed-type rows, low index
    candidates = rows[:10]
    scores = [_score_row(i, row, rows) for i, row in enumerate(candidates)]
    return scores.index(max(scores))


def _score_row(index: int, row: tuple, all_rows: list[tuple]) -> int:
    score = 0
    # TODO: Implement individual signal scoring functions
    return score
