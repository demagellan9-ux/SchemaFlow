from typing import Literal, Annotated
from uuid import UUID
from pydantic import BaseModel, Field

ColumnType = Literal["string", "integer", "float", "date", "boolean"]

ValidationRuleType = Literal[
    "required", "regex_match", "range", "allowed_values", "type_check"
]


class ValidationRuleRequest(BaseModel):
    type: ValidationRuleType
    params: dict = Field(default_factory=dict)


class DestinationColumnRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    display_name: str | None = Field(default=None, max_length=255)
    type: ColumnType
    nullable: bool
    date_format: str | None = Field(
        default=None,
        description="Required when type='date'. E.g. 'YYYY-MM-DD'.",
    )
    validation_rules: list[ValidationRuleRequest] = Field(default_factory=list)


class CreateSchemaRequest(BaseModel):
    project_id: UUID
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    columns: list[DestinationColumnRequest] = Field(
        min_length=1, description="At least one destination column is required."
    )


class UpdateSchemaRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    columns: list[DestinationColumnRequest] | None = Field(
        default=None,
        description="Replaces the full column list. Partial column updates are not supported.",
    )
