from pydantic import BaseModel


class TransformationRuleRequest(BaseModel):
    id: str
    type: str
    params: dict
    order: int


class SaveTransformationRequest(BaseModel):
    rules: list[TransformationRuleRequest]
