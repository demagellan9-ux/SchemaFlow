from uuid import UUID
from pydantic import BaseModel, Field

ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx"}
MAX_SIZE_BYTES = 30 * 1024 * 1024  # 30 MB


class PresignRequest(BaseModel):
    project_id: UUID
    original_filename: str = Field(min_length=1, max_length=255)
    size: int = Field(gt=0, le=31_457_280, description="File size in bytes. Max 30MB.")
    mime_type: str | None = Field(default=None)


class ConfirmUploadRequest(BaseModel):
    """
    Sent after the binary has been PUT to Supabase Storage.
    Triggers structural slice extraction via the ETL runner.
    """
    checksum: str | None = Field(
        default=None,
        description="Optional SHA-256 hex digest for integrity verification.",
    )
