from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class TransformationTypeSchema(BaseModel):
    type: str
    description: str
    params_schema: dict


class TransformationTypeListResponse(BaseModel):
    types: list[TransformationTypeSchema]


class TransformationResponse(BaseModel):
    id: UUID
    schema_id: UUID
    dest_column: str
    rules: dict
    created_at: datetime
    updated_at: datetime
