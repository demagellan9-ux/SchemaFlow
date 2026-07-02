import polars as pl


def regex_extract(col: str, params: dict) -> pl.Expr:
    """
    Extracts the first regex capture group from string values.
    Params: { "pattern": "<regex>", "group_index": 1 }
    """
    pattern = params.get("pattern")
    if not pattern:
        raise ValueError("regex_extract requires 'pattern' param")
    group_index = params.get("group_index", 1)
    # TODO: Implement — return pl.col(col).str.extract(pattern, group_index=group_index)
    return pl.col(col)
