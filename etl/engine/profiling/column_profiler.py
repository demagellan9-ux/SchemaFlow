"""
Column profiler: computes null rate, cardinality estimate, and sample values.
Operates on the 100-row structural slice only — never the full dataset.
"""
from dataclasses import dataclass
from etl.engine.profiling.type_inferrer import infer_type, ColumnType


@dataclass
class ColumnProfile:
    name: str
    inferred_type: ColumnType
    null_rate: float
    sample_values: list
    cardinality_estimate: int | None


class ColumnProfiler:
    def profile(self, column_name: str, values: list) -> ColumnProfile:
        """
        Profiles a single column from a sample of values.
        Results are stored as JSONB in the uploads table.
        """
        non_null = [v for v in values if v is not None]
        null_rate = 1.0 - (len(non_null) / len(values)) if values else 1.0

        # TODO: Implement cardinality estimation (distinct count on sample)
        cardinality = len(set(str(v) for v in non_null)) if non_null else None

        return ColumnProfile(
            name=column_name,
            inferred_type=infer_type(values),
            null_rate=round(null_rate, 4),
            sample_values=non_null[:5],
            cardinality_estimate=cardinality,
        )
