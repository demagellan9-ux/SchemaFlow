from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class PresignResponse(BaseModel):
    upload_id: UUID
    presigned_url: str
    storage_path: str


class UploadResponse(BaseModel):
    id: UUID
    project_id: UUID
    filename: str
    status: str
    size_bytes: int | None
    created_at: datetime
    updated_at: datetime


class SliceResponse(BaseModel):
    upload_id: UUID
    status: str
    slice_data: dict | None
