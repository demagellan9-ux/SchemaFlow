from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class MappingResponse(BaseModel):
    id: UUID
    upload_id: UUID
    schema_id: UUID
    mapping_data: dict
    created_at: datetime
    updated_at: datetime
