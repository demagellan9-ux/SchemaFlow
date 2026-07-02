from uuid import UUID
from pydantic import BaseModel, Field


class CreateJobRequest(BaseModel):
    project_id: UUID
    schema_id: UUID
    upload_ids: list[UUID] = Field(
        min_length=1,
        description="All uploads must belong to the given project and have status 'mapped'.",
    )


class ExportFormat(str):
    CSV = "csv"
    XLSX = "xlsx"


class CreateExportRequest(BaseModel):
    job_id: UUID
    format: str = Field(
        default="csv",
        pattern="^(csv|xlsx)$",
        description="Output file format.",
    )
