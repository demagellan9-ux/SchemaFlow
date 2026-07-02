from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class SchemaResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    definition: dict
    created_at: datetime
    updated_at: datetime


class SchemaListResponse(BaseModel):
    items: list[SchemaResponse]
    next_cursor: str | None
