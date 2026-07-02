import polars as pl

DTYPE_MAP: dict[str, pl.DataType] = {
    "string": pl.Utf8,
    "integer": pl.Int64,
    "float": pl.Float64,
    "boolean": pl.Boolean,
    "date": pl.Date,
}


def cast(col: str, params: dict) -> pl.Expr:
    """
    Casts a column to the target Polars dtype.
    Params: { "to": "string" | "integer" | "float" | "boolean" | "date" }
    """
    target = params.get("to")
    if target not in DTYPE_MAP:
        raise ValueError(f"cast: unknown target type '{target}'. Valid: {list(DTYPE_MAP)}")
    # TODO: Implement — return pl.col(col).cast(DTYPE_MAP[target])
    return pl.col(col)
