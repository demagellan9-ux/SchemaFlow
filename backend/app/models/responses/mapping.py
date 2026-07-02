from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class MappingEntryResponse(BaseModel):
    source_col: str
    dest_col: str | None
    confidence: int
    user_confirmed: bool


class MappingDataResponse(BaseModel):
    version: int
    entries: list[MappingEntryResponse]


class MappingResponse(BaseModel):
    id: UUID
    upload_id: UUID
    schema_id: UUID
    user_id: UUID
    mapping_data: MappingDataResponse
    created_at: datetime
    updated_at: datetime


class AutoMapSuggestion(BaseModel):
    source_col: str
    dest_col: str
    confidence: int


class AutoMapResponse(BaseModel):
    upload_id: UUID
    schema_id: UUID
    suggestions: list[AutoMapSuggestion]
    unmatched_sources: list[str]
    unmatched_destinations: list[str]
