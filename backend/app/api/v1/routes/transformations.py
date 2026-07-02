from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.transformation import SaveTransformationRequest
from app.models.responses.transformation import (
    TransformationResponse,
    TransformationListResponse,
    TransformationRegistryResponse,
)

router = APIRouter()


@router.get("/registry", response_model=TransformationRegistryResponse)
async def list_registry(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationRegistryResponse:
    # Returns all transformation types available in the ETL registry with their param schemas.
    raise NotImplementedError


@router.get("/{schema_id}", response_model=TransformationListResponse)
async def list_transformations(
    schema_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationListResponse:
    raise NotImplementedError


@router.get("/{schema_id}/{dest_column}", response_model=TransformationResponse)
async def get_transformation(
    schema_id: UUID,
    dest_column: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationResponse:
    raise NotImplementedError


@router.put("/{schema_id}/{dest_column}", response_model=TransformationResponse)
async def save_transformation(
    schema_id: UUID,
    dest_column: str,
    body: SaveTransformationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> TransformationResponse:
    raise NotImplementedError
