"""
ETL pipeline entry point.
Receives a job config dict from the dispatcher and runs each stage sequentially.
Each file in the batch is processed one at a time — never concurrently.
"""
from dataclasses import dataclass
from typing import Any
import gc

from etl.jobs.progress import ProgressReporter
from etl.engine.ingestion.reader import FileReader
from etl.engine.profiling.column_profiler import ColumnProfiler
from etl.engine.mapping.matcher import ColumnMatcher
from etl.engine.transformation.registry import TransformationRegistry
from etl.engine.validation.rule_engine import RuleEngine
from etl.engine.export.serializer import OutputSerializer


@dataclass
class FileConfig:
    upload_id: str
    storage_path: str
    filename: str


@dataclass
class JobConfig:
    job_id: str
    schema_definition: dict
    mappings: list[dict]
    transformation_rules: dict[str, list[dict]]
    validation_rules: dict[str, list[dict]]
    output_format: str
    callback_url: str
    files: list[FileConfig]


def run_job(config: JobConfig) -> None:
    """
    Main pipeline runner. Processes each file sequentially.
    A single file failure does not abort the batch.
    """
    reporter = ProgressReporter(config.job_id, config.callback_url)
    reporter.start()

    for file_config in config.files:
        try:
            _process_file(file_config, config, reporter)
        except Exception as exc:
            reporter.file_error(file_config.upload_id, file_config.filename, exc)
        finally:
            gc.collect()

    reporter.complete()


def _process_file(file_config: FileConfig, job_config: JobConfig, reporter: ProgressReporter) -> None:
    reporter.file_start(file_config.upload_id)

    # TODO: Implement each stage when the respective module is built
    # Stage 1: Ingest — stream file from Storage into LazyFrame
    # Stage 2: Profile — infer types, detect header (structural slice only)
    # Stage 3: Map — apply user-confirmed column mappings
    # Stage 4: Transform — apply ordered transformation rules via registry
    # Stage 5: Validate — apply validation rules; collect error rows
    # Stage 6: Export — serialize and stream output to Supabase Storage

    reporter.file_complete(file_config.upload_id)
