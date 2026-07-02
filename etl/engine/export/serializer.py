"""
Serializes a Polars LazyFrame to the target output format.
collect() is called only here — the single allowed collect point in the pipeline.
Writes in chunks of ≤10,000 rows when serializing to XLSX.
"""
from pathlib import Path
import polars as pl

CHUNK_SIZE = 10_000


class OutputSerializer:
    def serialize(self, lf: pl.LazyFrame, output_path: str, fmt: str) -> None:
        """
        Collects the LazyFrame and writes to output_path in the specified format.
        fmt: "csv" | "xlsx"
        """
        df = lf.collect()  # Only collect() call in the pipeline

        if fmt == "csv":
            df.write_csv(output_path)
        elif fmt == "xlsx":
            self._write_xlsx_chunked(df, output_path)
        else:
            raise ValueError(f"Unsupported output format: {fmt}")

    def _write_xlsx_chunked(self, df: pl.DataFrame, output_path: str) -> None:
        # TODO: Implement chunked XLSX write using openpyxl in write mode
        # Chunks of CHUNK_SIZE rows to prevent memory spikes during serialization
        raise NotImplementedError
