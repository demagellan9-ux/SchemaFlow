from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.mapping import SaveMappingRequest, AutoMapRequest
from app.models.responses.mapping import MappingResponse, AutoMapResponse

router = APIRouter()


@router.get("/{upload_id}", response_model=MappingResponse)
async def get_mapping(
    upload_id: UUID,
    schema_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> MappingResponse:
    raise NotImplementedError


@router.put("/{upload_id}", response_model=MappingResponse)
async def save_mapping(
    upload_id: UUID,
    body: SaveMappingRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> MappingResponse:
    raise NotImplementedError


@router.post("/auto", response_model=AutoMapResponse)
async def auto_map(
    body: AutoMapRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AutoMapResponse:
    # Returns scored suggestions only — does not persist. User reviews and confirms via PUT /{upload_id}.
    raise NotImplementedError
