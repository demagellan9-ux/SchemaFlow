from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class FileErrorResponse(BaseModel):
    upload_id: UUID
    filename: str
    stage: str
    message: str
    row_index: int | None


class JobErrorsResponse(BaseModel):
    files: list[FileErrorResponse]


class JobFileResponse(BaseModel):
    id: UUID
    job_id: UUID
    upload_id: UUID
    status: str
    rows_processed: int | None
    rows_failed: int | None
    error_detail: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    schema_id: UUID
    status: str
    total_files: int
    completed_files: int
    failed_files: int
    errors: JobErrorsResponse | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    items: list[JobResponse]
    next_cursor: str | None


class ExportResponse(BaseModel):
    id: UUID
    job_id: UUID
    user_id: UUID
    format: str
    size_bytes: int | None
    row_count: int | None
    status: str
    download_url: str | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
