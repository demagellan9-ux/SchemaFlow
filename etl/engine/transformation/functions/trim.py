import polars as pl


def trim(col: str, params: dict) -> pl.Expr:
    """Removes leading and trailing whitespace from string values."""
    # TODO: Implement — return pl.col(col).str.strip_chars()
    return pl.col(col)
