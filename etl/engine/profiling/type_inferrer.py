"""
Primitive type inference for column values.
Priority: boolean → integer → float → date → string.
A type is accepted when it fits ≥95% of non-null values.
"""
from typing import Literal

ColumnType = Literal["boolean", "integer", "float", "date", "string"]

THRESHOLD = 0.95


def infer_type(values: list) -> ColumnType:
    """
    Infers the most specific primitive type for a column's sample values.
    Operates on a sample (e.g. 100-row slice) — never on the full dataset.
    """
    non_null = [v for v in values if v is not None]
    if not non_null:
        return "string"

    for col_type, check_fn in _TYPE_CHECKS:
        match_count = sum(1 for v in non_null if _safe_check(check_fn, v))
        if match_count / len(non_null) >= THRESHOLD:
            return col_type

    return "string"


def _safe_check(fn, value) -> bool:
    try:
        return fn(value)
    except Exception:
        return False


def _is_boolean(value) -> bool:
    # TODO: Implement boolean detection: "true"/"false", "yes"/"no", "1"/"0"
    return False


def _is_integer(value) -> bool:
    # TODO: Implement integer detection
    return False


def _is_float(value) -> bool:
    # TODO: Implement float detection
    return False


def _is_date(value) -> bool:
    # TODO: Implement date detection using dateutil.parser.parse
    return False


_TYPE_CHECKS: list[tuple[ColumnType, object]] = [
    ("boolean", _is_boolean),
    ("integer", _is_integer),
    ("float", _is_float),
    ("date", _is_date),
]
