from uuid import UUID
from pydantic import BaseModel, Field


class TransformationRuleRequest(BaseModel):
    id: str = Field(description="Client-generated UUID. Used for UI identity and ordering stability.")
    type: str = Field(min_length=1, description="Must match a key in the ETL transformation registry.")
    params: dict = Field(default_factory=dict)
    order: int = Field(ge=0, description="Execution order within the rule chain for this column.")


class SaveTransformationRequest(BaseModel):
    rules: list[TransformationRuleRequest] = Field(
        default_factory=list,
        description="Replaces the full rule chain for this destination column. Empty list clears all rules.",
    )
