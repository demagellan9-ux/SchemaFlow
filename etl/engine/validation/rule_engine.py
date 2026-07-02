"""
Applies validation rules from metadata config to a LazyFrame.
Validation annotates rows — it never mutates data.
Failed rows are written to a separate error output.
"""
import polars as pl


class RuleEngine:
    def validate(self, lf: pl.LazyFrame, rules: dict[str, list[dict]]) -> tuple[pl.LazyFrame, pl.LazyFrame]:
        """
        Applies column-level validation rules.
        Returns (valid_lf, error_lf) — error rows include error metadata columns.

        rules: { dest_column: [{ type, params }] }
        """
        # TODO: Implement rule types: required, type_check, regex_match, range, allowed_values
        # Each rule adds an error annotation column; collect errors into error_lf at the end
        return lf, pl.LazyFrame()
