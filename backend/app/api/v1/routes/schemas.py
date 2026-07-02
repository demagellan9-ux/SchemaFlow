from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.schema import CreateSchemaRequest, UpdateSchemaRequest
from app.models.responses.schema import SchemaResponse, SchemaListResponse

router = APIRouter()


@router.get("", response_model=SchemaListResponse)
async def list_schemas(
    project_id: UUID,
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SchemaListResponse:
    raise NotImplementedError


@router.post("", response_model=SchemaResponse, status_code=status.HTTP_201_CREATED)
async def create_schema(
    body: CreateSchemaRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SchemaResponse:
    raise NotImplementedError


@router.get("/{schema_id}", response_model=SchemaResponse)
async def get_schema(
    schema_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SchemaResponse:
    raise NotImplementedError


@router.patch("/{schema_id}", response_model=SchemaResponse)
async def update_schema(
    schema_id: UUID,
    body: UpdateSchemaRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SchemaResponse:
    raise NotImplementedError


@router.delete("/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(
    schema_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    raise NotImplementedError
