import polars as pl


def date_format(col: str, params: dict) -> pl.Expr:
    """
    Reformats a date string column using a source and target format.
    Params: { "from_format": "YYYY/MM/DD", "to_format": "YYYY-MM-DD" }
    """
    from_fmt = params.get("from_format")
    to_fmt = params.get("to_format")
    if not from_fmt or not to_fmt:
        raise ValueError("date_format requires 'from_format' and 'to_format' params")
    # TODO: Implement — parse with from_fmt, serialize with to_fmt using Polars temporal expressions
    return pl.col(col)
