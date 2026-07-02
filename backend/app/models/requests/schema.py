from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field


ColumnType = Literal["string", "integer", "float", "date", "boolean"]


class DestinationColumnRequest(BaseModel):
    name: str = Field(min_length=1)
    display_name: str | None = None
    type: ColumnType
    nullable: bool
    date_format: str | None = None


class CreateSchemaRequest(BaseModel):
    project_id: UUID
    name: str = Field(min_length=1, max_length=100)
    columns: list[DestinationColumnRequest] = Field(min_length=1)


class UpdateSchemaRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    columns: list[DestinationColumnRequest] | None = None
