from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.project import CreateProjectRequest
from app.models.responses.project import ProjectResponse, ProjectListResponse

router = APIRouter()


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ProjectListResponse:
    # TODO: Delegate to ProjectService.list(user_id, cursor, limit)
    raise NotImplementedError


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProjectRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ProjectResponse:
    # TODO: Delegate to ProjectService.create(user_id, body)
    raise NotImplementedError


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ProjectResponse:
    # TODO: Delegate to ProjectService.get(user_id, project_id)
    raise NotImplementedError


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    # TODO: Delegate to ProjectService.delete(user_id, project_id)
    raise NotImplementedError
