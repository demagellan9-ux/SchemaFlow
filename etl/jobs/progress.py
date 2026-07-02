import httpx


class ProgressReporter:
    """
    Emits job progress callbacks to FastAPI.
    All ETL state is reported here — the ETL engine never writes directly to the DB.
    """

    def __init__(self, job_id: str, callback_url: str) -> None:
        self._job_id = job_id
        self._callback_url = callback_url
        self._file_errors: list[dict] = []

    def start(self) -> None:
        self._post({"status": "running"})

    def file_start(self, upload_id: str) -> None:
        self._post({"event": "file_start", "upload_id": upload_id})

    def file_complete(self, upload_id: str, rows_processed: int = 0, rows_failed: int = 0) -> None:
        self._post({
            "event": "file_complete",
            "upload_id": upload_id,
            "rows_processed": rows_processed,
            "rows_failed": rows_failed,
        })

    def file_error(self, upload_id: str, filename: str, exc: Exception, stage: str = "unknown") -> None:
        error = {
            "upload_id": upload_id,
            "filename": filename,
            "stage": stage,
            "message": str(exc),
        }
        self._file_errors.append(error)
        self._post({"event": "file_error", **error})

    def complete(self) -> None:
        status = "completed_with_errors" if self._file_errors else "completed"
        self._post({"status": status, "errors": {"files": self._file_errors}})

    def _post(self, payload: dict) -> None:
        # TODO: Add internal auth header for webhook endpoint
        try:
            httpx.post(f"{self._callback_url}/{self._job_id}/webhook", json=payload, timeout=5)
        except httpx.RequestError:
            pass  # Progress callbacks are best-effort; never abort processing on callback failure
