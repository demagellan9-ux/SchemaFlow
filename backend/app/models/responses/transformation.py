from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class TransformationRuleResponse(BaseModel):
    id: str
    type: str
    params: dict
    order: int


class TransformationRuleSetResponse(BaseModel):
    version: int
    rules: list[TransformationRuleResponse]


class TransformationResponse(BaseModel):
    id: UUID
    schema_id: UUID
    user_id: UUID
    dest_column: str
    rules: TransformationRuleSetResponse
    created_at: datetime
    updated_at: datetime


class TransformationListResponse(BaseModel):
    items: list[TransformationResponse]


class RegistryEntryResponse(BaseModel):
    type: str
    description: str
    params_schema: dict


class TransformationRegistryResponse(BaseModel):
    entries: list[RegistryEntryResponse]
