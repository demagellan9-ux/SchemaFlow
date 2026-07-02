from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class PresignResponse(BaseModel):
    upload_id: UUID
    presigned_url: str
    storage_path: str
    expires_in: int = 3600


class UploadResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    filename: str
    storage_path: str
    size_bytes: int | None
    status: str
    slice_data: dict | None = None
    created_at: datetime
    updated_at: datetime


class UploadListResponse(BaseModel):
    items: list[UploadResponse]
    next_cursor: str | None


class SliceResponse(BaseModel):
    upload_id: UUID
    status: str
    slice_data: dict | None
