"""
CSV parser using Polars native reader (streaming-compatible).
"""
import polars as pl


def parse_csv(file_path: str, max_rows: int | None = None) -> pl.LazyFrame:
    """
    Parses a CSV file into a LazyFrame using Polars native CSV scanner.
    max_rows applies a row limit for structural slice extraction.
    """
    # TODO: Detect encoding and delimiter before parsing
    lf = pl.scan_csv(file_path, infer_schema_length=100)
    if max_rows is not None:
        lf = lf.limit(max_rows)
    return lf
