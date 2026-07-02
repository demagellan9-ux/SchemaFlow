"""
Transformation function registry.
Each registered function accepts (col: str, params: dict) → pl.Expr.
New functions are added by creating a module in functions/ and registering here.
No other files need to change.
"""
from typing import Callable
import polars as pl

from etl.engine.transformation.functions.trim import trim
from etl.engine.transformation.functions.cast import cast
from etl.engine.transformation.functions.fill_null import fill_null
from etl.engine.transformation.functions.regex_extract import regex_extract
from etl.engine.transformation.functions.date_format import date_format

REGISTRY: dict[str, Callable[[str, dict], pl.Expr]] = {
    "trim": trim,
    "cast": cast,
    "fill_null": fill_null,
    "regex_extract": regex_extract,
    "date_format": date_format,
}


def get_transform(name: str) -> Callable[[str, dict], pl.Expr]:
    if name not in REGISTRY:
        raise KeyError(f"Unknown transformation: '{name}'. Available: {sorted(REGISTRY)}")
    return REGISTRY[name]


def apply_rules(lf: pl.LazyFrame, rules: list[dict]) -> pl.LazyFrame:
    """
    Applies an ordered list of transformation rules to a LazyFrame.
    Rules are applied as expression chains — no intermediate collects.
    """
    for rule in sorted(rules, key=lambda r: r["order"]):
        col = rule["col"]
        fn = get_transform(rule["type"])
        expr = fn(col, rule.get("params", {}))
        lf = lf.with_columns(expr.alias(col))
    return lf
