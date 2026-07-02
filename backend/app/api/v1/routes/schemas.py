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
    # TODO: Delegate to SchemaService.list(user_id, project_id, cursor, limit)
    raise NotImplementedError


@router.post("", response_model=SchemaResponse, status_code=status.HTTP_201_CREATED)
async def create_schema(
    body: CreateSchemaRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SchemaResponse:
    # TODO: Delegate to SchemaService.create(user_id, body)
    raise NotImplementedError


@router.patch("/{schema_id}", response_model=SchemaResponse)
async def update_schema(
    schema_id: UUID,
    body: UpdateSchemaRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SchemaResponse:
    # TODO: Delegate to SchemaService.update(user_id, schema_id, body)
    raise NotImplementedError
