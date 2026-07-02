from uuid import UUID
from pydantic import BaseModel, Field


class MappingEntryRequest(BaseModel):
    source_col: str = Field(min_length=1)
    dest_col: str | None = Field(
        default=None,
        description="Null to explicitly mark the source column as unmapped.",
    )
    user_confirmed: bool = Field(default=False)


class SaveMappingRequest(BaseModel):
    upload_id: UUID
    schema_id: UUID
    entries: list[MappingEntryRequest] = Field(min_length=1)


class AutoMapRequest(BaseModel):
    upload_id: UUID
    schema_id: UUID
    threshold: int = Field(
        default=60,
        ge=0,
        le=100,
        description="RapidFuzz score cutoff (0–100). Suggestions below this score are excluded.",
    )
