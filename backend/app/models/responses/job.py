from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class JobResponse(BaseModel):
    id: UUID
    project_id: UUID
    schema_id: UUID
    status: str
    output_path: str | None
    errors: dict | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    items: list[JobResponse]
    next_cursor: str | None
