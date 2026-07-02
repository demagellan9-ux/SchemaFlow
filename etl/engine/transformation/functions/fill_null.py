import polars as pl


def fill_null(col: str, params: dict) -> pl.Expr:
    """
    Replaces null values with a static fill value.
    Params: { "value": <any scalar> }
    """
    value = params.get("value")
    if value is None:
        raise ValueError("fill_null requires 'value' param")
    # TODO: Implement — return pl.col(col).fill_null(value)
    return pl.col(col)
