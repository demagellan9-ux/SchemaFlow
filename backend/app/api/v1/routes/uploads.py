from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.upload import PresignRequest
from app.models.responses.upload import PresignResponse, UploadResponse, SliceResponse

router = APIRouter()


@router.post("/presign", response_model=PresignResponse, status_code=status.HTTP_201_CREATED)
async def presign_upload(
    body: PresignRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PresignResponse:
    # TODO: Delegate to UploadService.presign(user_id, project_id, filename, size)
    raise NotImplementedError


@router.post("/{upload_id}/confirm", response_model=UploadResponse)
async def confirm_upload(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UploadResponse:
    # TODO: Delegate to UploadService.confirm(user_id, upload_id)
    #       Triggers async structural slice extraction in ETL engine
    raise NotImplementedError


@router.get("/{upload_id}/slice", response_model=SliceResponse)
async def get_slice(
    upload_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SliceResponse:
    # TODO: Delegate to UploadService.get_slice(user_id, upload_id)
    raise NotImplementedError
