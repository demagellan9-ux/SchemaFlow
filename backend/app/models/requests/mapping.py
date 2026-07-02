from uuid import UUID
from pydantic import BaseModel


class MappingEntryRequest(BaseModel):
    source_col: str
    dest_col: str | None
    confidence: float
    user_confirmed: bool


class SaveMappingRequest(BaseModel):
    schema_id: UUID
    entries: list[MappingEntryRequest]
