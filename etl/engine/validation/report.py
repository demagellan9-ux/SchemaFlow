"""
Builds per-row, per-column validation error reports.
Produces a structured dict ready for storage as JSONB.
"""
import polars as pl


def build_report(error_lf: pl.LazyFrame, filename: str) -> dict:
    """
    Collects error rows into a structured validation report.
    Does not load the full dataset — only the error-annotated rows.
    """
    # TODO: Implement — collect error_lf and build { filename, total_errors, rows: [...] }
    return {"filename": filename, "total_errors": 0, "rows": []}
