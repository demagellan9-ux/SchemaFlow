"""
Dispatches to the correct format parser based on file extension.
Downloads files from Supabase Storage via presigned URL before parsing.
"""
from pathlib import Path
import httpx
import polars as pl

from etl.engine.ingestion.xlsx_parser import parse_xlsx
from etl.engine.ingestion.csv_parser import parse_csv


class FileReader:
    def read(self, presigned_url: str, filename: str, max_rows: int | None = None) -> pl.LazyFrame:
        """
        Downloads and parses a file into a LazyFrame.
        max_rows: None = full file, integer = structural slice (e.g. 100 for profiling)
        """
        # TODO: Stream download to temp file; delete after LazyFrame is created
        ext = Path(filename).suffix.lower()
        if ext in (".xlsx", ".xls"):
            return parse_xlsx(presigned_url, max_rows=max_rows)
        elif ext == ".csv":
            return parse_csv(presigned_url, max_rows=max_rows)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
