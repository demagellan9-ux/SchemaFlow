import logging
import sys
from typing import Any


def configure_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application."""
    level = getattr(logging, log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(_StructuredFormatter())

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Quiet noisy third-party loggers in production
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


class _StructuredFormatter(logging.Formatter):
    """Single-line structured log format: level | logger | message [key=value ...]"""

    def format(self, record: logging.LogRecord) -> str:
        base = f"{record.levelname:<8} | {record.name} | {record.getMessage()}"
        extras = self._extract_extras(record)
        return f"{base} {extras}" if extras else base

    def _extract_extras(self, record: logging.LogRecord) -> str:
        skip = {
            "name", "msg", "args", "levelname", "levelno", "pathname",
            "filename", "module", "exc_info", "exc_text", "stack_info",
            "lineno", "funcName", "created", "msecs", "relativeCreated",
            "thread", "threadName", "processName", "process", "message",
            "taskName",
        }
        parts = [f"{k}={v!r}" for k, v in record.__dict__.items() if k not in skip]
        return " ".join(parts)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class JobLogger:
    """Structured logging interface for ETL job progress and errors."""

    def __init__(self, job_id: str) -> None:
        self._log = get_logger("schemaflow.job")
        self._job_id = job_id

    def _ctx(self) -> dict[str, Any]:
        return {"job_id": self._job_id}

    def started(self, total_files: int) -> None:
        self._log.info("job started", extra={**self._ctx(), "total_files": total_files})

    def file_started(self, upload_id: str, filename: str) -> None:
        self._log.info(
            "file processing started",
            extra={**self._ctx(), "upload_id": upload_id, "filename": filename},
        )

    def file_completed(self, upload_id: str, rows_processed: int) -> None:
        self._log.info(
            "file processing completed",
            extra={**self._ctx(), "upload_id": upload_id, "rows_processed": rows_processed},
        )

    def file_error(self, upload_id: str, filename: str, error: str) -> None:
        self._log.error(
            "file processing failed",
            extra={**self._ctx(), "upload_id": upload_id, "filename": filename, "error": error},
        )

    def completed(self, completed_files: int, failed_files: int) -> None:
        self._log.info(
            "job completed",
            extra={**self._ctx(), "completed_files": completed_files, "failed_files": failed_files},
        )

    def failed(self, reason: str) -> None:
        self._log.error("job failed", extra={**self._ctx(), "reason": reason})
