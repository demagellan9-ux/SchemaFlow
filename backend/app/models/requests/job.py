from uuid import UUID
from pydantic import BaseModel, Field


class CreateJobRequest(BaseModel):
    project_id: UUID
    schema_id: UUID
    upload_ids: list[UUID] = Field(min_length=1)
