from uuid import UUID
from pydantic import BaseModel, Field

ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx"}
MAX_SIZE_BYTES = 30 * 1024 * 1024  # 30 MB


class PresignRequest(BaseModel):
    project_id: UUID
    filename: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0, le=MAX_SIZE_BYTES, description="File size in bytes")
    content_type: str = Field(default="application/octet-stream", max_length=100)
