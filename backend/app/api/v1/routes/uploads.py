from uuid import UUID

from fastapi import APIRouter, Depends, status
from supabase._async.client import AsyncClient

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.upload import PresignRequest, ConfirmUploadRequest
from app.models.responses.upload import PresignResponse, UploadResponse, UploadListResponse

router = APIRouter()


@router.get("", response_model=UploadListResponse)
async def list_uploads(
    project_id: UUID,
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UploadListResponse:
    raise NotImplementedError


@router.post("/presign", response_model=PresignResponse, status_code=status.HTTP_201_CREATED)
async def presign_upload(
    body: PresignRequest,
    current_user: AuthenticatedUser = Depends(require_user),
    svc: UploadService = Depends(_svc),
) -> PresignResponse:
    raise NotImplementedError


@router.post("/{upload_id}/confirm", response_model=UploadResponse)
async def confirm_upload(
    upload_id: UUID,
    body: ConfirmUploadRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UploadResponse:
    # Triggers async structural slice extraction in the ETL engine.
    raise NotImplementedError


@router.get("/{upload_id}", response_model=UploadResponse)
async def get_upload(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UploadResponse:
    raise NotImplementedError
