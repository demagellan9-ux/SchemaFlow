"""
Unit tests for the transformation registry.
Each function is tested with a minimal in-memory Polars DataFrame.
No I/O — pure function tests only.
"""
import pytest
import polars as pl

from etl.engine.transformation.registry import get_transform, apply_rules


def test_get_transform_raises_on_unknown_type() -> None:
    with pytest.raises(KeyError, match="Unknown transformation"):
        get_transform("nonexistent_type")


def test_apply_rules_empty_rules_returns_unchanged() -> None:
    lf = pl.LazyFrame({"col_a": ["hello", "world"]})
    result = apply_rules(lf, [])
    assert result.collect().equals(lf.collect())


# TODO: Add per-function tests once trim, cast, fill_null, regex_extract, date_format are implemented
# Pattern: small in-memory DataFrame → apply expr → assert output values
# Must cover: happy path, null handling, invalid params (ValueError)
