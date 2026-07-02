"""
RapidFuzz-based source→destination column matcher.
Returns confidence scores (0–100). Final mapping decision is always the user's.
"""
from rapidfuzz import process, fuzz
from etl.engine.mapping.scoring import normalize_col_name


DEFAULT_THRESHOLD = 60


class ColumnMatcher:
    def __init__(self, threshold: int = DEFAULT_THRESHOLD) -> None:
        self._threshold = threshold

    def match(
        self,
        source_cols: list[str],
        dest_cols: list[str],
    ) -> list[dict]:
        """
        Returns a list of { source_col, dest_col, confidence } dicts.
        dest_col is None when no match exceeds the threshold.
        """
        normalized_dest = {normalize_col_name(d): d for d in dest_cols}
        results = []

        for src in source_cols:
            norm_src = normalize_col_name(src)
            match = process.extractOne(
                norm_src,
                list(normalized_dest.keys()),
                scorer=fuzz.token_sort_ratio,
                score_cutoff=self._threshold,
            )
            if match:
                results.append({
                    "source_col": src,
                    "dest_col": normalized_dest[match[0]],
                    "confidence": round(match[1]),
                })
            else:
                results.append({"source_col": src, "dest_col": None, "confidence": 0})

        return results
