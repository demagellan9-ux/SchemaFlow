from pydantic import BaseModel


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    error: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None
