"""
Unit tests for the RapidFuzz column matcher.
No Supabase or Storage dependencies — pure function tests.
"""
from etl.engine.mapping.matcher import ColumnMatcher
from etl.engine.mapping.scoring import normalize_col_name


def test_normalize_strips_punctuation() -> None:
    assert normalize_col_name("First_Name!") == "first name"


def test_normalize_collapses_spaces() -> None:
    assert normalize_col_name("  col   name  ") == "col name"


def test_matcher_returns_best_match() -> None:
    matcher = ColumnMatcher(threshold=60)
    result = matcher.match(["first name"], ["first_name", "last_name"])
    assert result[0]["dest_col"] == "first_name"
    assert result[0]["confidence"] > 60


def test_matcher_returns_none_below_threshold() -> None:
    matcher = ColumnMatcher(threshold=60)
    result = matcher.match(["xyz_unrelated"], ["first_name", "last_name"])
    assert result[0]["dest_col"] is None
    assert result[0]["confidence"] == 0
