from uuid import UUID

from fastapi import APIRouter, Depends, status
from supabase._async.client import AsyncClient

from app.api.v1.dependencies import require_user
from app.core.security import AuthenticatedUser
from app.db.supabase_client import db_dependency
from app.models.requests.upload import PresignRequest
from app.models.responses.upload import PresignResponse, UploadResponse, UploadListResponse, SliceResponse
from app.services.upload_service import UploadService

router = APIRouter()


def _svc(db: AsyncClient = Depends(db_dependency)) -> UploadService:
    return UploadService(db)


@router.get("", response_model=UploadListResponse)
async def list_uploads(
    project_id: UUID,
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: UploadService = Depends(_svc),
) -> UploadListResponse:
    result = await svc.list(current_user.user_id, project_id, cursor, limit)
    return UploadListResponse(**result)


@router.post("/presign", response_model=PresignResponse, status_code=status.HTTP_201_CREATED)
async def presign_upload(
    body: PresignRequest,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: UploadService = Depends(_svc),
) -> PresignResponse:
    result = await svc.presign(
        current_user.user_id,
        body.project_id,
        body.filename,
        body.size_bytes,
        body.content_type,
    )
    return PresignResponse(**result)


@router.get("/{upload_id}", response_model=UploadResponse)
async def get_upload(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: UploadService = Depends(_svc),
) -> UploadResponse:
    row = await svc.get(current_user.user_id, upload_id)
    return UploadResponse(**row)


@router.post("/{upload_id}/confirm", response_model=UploadResponse)
async def confirm_upload(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: UploadService = Depends(_svc),
) -> UploadResponse:
    row = await svc.confirm(current_user.user_id, upload_id)
    return UploadResponse(**row)


@router.get("/{upload_id}/slice", response_model=SliceResponse)
async def get_slice(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: UploadService = Depends(_svc),
) -> SliceResponse:
    result = await svc.get_slice(current_user.user_id, upload_id)
    return SliceResponse(**result)
