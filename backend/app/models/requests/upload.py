from uuid import UUID
from pydantic import BaseModel, Field


class PresignRequest(BaseModel):
    project_id: UUID
    filename: str = Field(min_length=1, max_length=255)
    size: int = Field(gt=0, description="File size in bytes")
