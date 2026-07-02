from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class SourceColumnProfile(BaseModel):
    name: str
    inferred_type: str
    null_rate: float
    sample_values: list
    cardinality_estimate: int | None


class SliceData(BaseModel):
    version: int
    worksheet: str
    header_row_index: int
    columns: list[SourceColumnProfile]
    rows: list[dict]


class PresignResponse(BaseModel):
    upload_id: UUID
    presigned_url: str
    storage_path: str
    expires_in: int = 300


class UploadResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    original_filename: str
    filename: str
    file_extension: str | None
    size_bytes: int | None
    status: str
    slice_data: SliceData | None
    created_at: datetime
    updated_at: datetime


class UploadListResponse(BaseModel):
    items: list[UploadResponse]
    next_cursor: str | None
