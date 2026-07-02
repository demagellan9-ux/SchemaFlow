from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.transformation import SaveTransformationRequest
from app.models.responses.transformation import TransformationResponse, TransformationTypeListResponse

router = APIRouter()


@router.get("/types", response_model=TransformationTypeListResponse)
async def list_transformation_types(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationTypeListResponse:
    # TODO: Return available transformation registry keys and their param schemas
    raise NotImplementedError


@router.get("/{schema_id}/{dest_column}", response_model=TransformationResponse)
async def get_transformation(
    schema_id: UUID,
    dest_column: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationResponse:
    # TODO: Delegate to TransformationService.get(user_id, schema_id, dest_column)
    raise NotImplementedError


@router.put("/{schema_id}/{dest_column}", response_model=TransformationResponse)
async def save_transformation(
    schema_id: UUID,
    dest_column: str,
    body: SaveTransformationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationResponse:
    # TODO: Delegate to TransformationService.save(user_id, schema_id, dest_column, body)
    raise NotImplementedError
