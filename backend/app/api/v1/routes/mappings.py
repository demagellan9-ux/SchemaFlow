from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.mapping import SaveMappingRequest
from app.models.responses.mapping import MappingResponse

router = APIRouter()


@router.get("/{upload_id}", response_model=MappingResponse)
async def get_mapping(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> MappingResponse:
    # TODO: Delegate to MappingService.get(user_id, upload_id)
    raise NotImplementedError


@router.patch("/{upload_id}", response_model=MappingResponse)
async def save_mapping(
    upload_id: UUID,
    body: SaveMappingRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> MappingResponse:
    # TODO: Delegate to MappingService.save(user_id, upload_id, body)
    raise NotImplementedError
