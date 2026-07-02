from uuid import UUID

from fastapi import APIRouter, Depends, status
from supabase._async.client import AsyncClient

from app.api.v1.dependencies import require_user
from app.core.security import AuthenticatedUser
from app.db.supabase_client import db_dependency
from app.models.requests.project import CreateProjectRequest, UpdateProjectRequest
from app.models.responses.project import ProjectResponse, ProjectListResponse
from app.services.project_service import ProjectService

router = APIRouter()


def _svc(db: AsyncClient = Depends(db_dependency)) -> ProjectService:
    return ProjectService(db)


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: ProjectService = Depends(_svc),
) -> ProjectListResponse:
    result = await svc.list(current_user.user_id, cursor, limit)
    return ProjectListResponse(**result)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProjectRequest,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: ProjectService = Depends(_svc),
) -> ProjectResponse:
    row = await svc.create(current_user.user_id, body.name, body.description)
    return ProjectResponse(**row)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: ProjectService = Depends(_svc),
) -> ProjectResponse:
    row = await svc.get(current_user.user_id, project_id)
    return ProjectResponse(**row)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    body: UpdateProjectRequest,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: ProjectService = Depends(_svc),
) -> ProjectResponse:
    row = await svc.update(current_user.user_id, project_id, body.name, body.description)
    return ProjectResponse(**row)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: ProjectService = Depends(_svc),
) -> None:
    await svc.delete(current_user.user_id, project_id)
