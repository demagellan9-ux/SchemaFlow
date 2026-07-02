from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class ValidationRuleResponse(BaseModel):
    type: str
    params: dict


class DestinationColumnResponse(BaseModel):
    name: str
    display_name: str | None
    type: str
    nullable: bool
    date_format: str | None
    validation_rules: list[ValidationRuleResponse]


class SchemaDefinitionResponse(BaseModel):
    version: int
    columns: list[DestinationColumnResponse]


class SchemaResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    name: str
    description: str | None
    definition: SchemaDefinitionResponse
    created_at: datetime
    updated_at: datetime


class SchemaListResponse(BaseModel):
    items: list[SchemaResponse]
    next_cursor: str | None
