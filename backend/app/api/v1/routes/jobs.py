from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.job import CreateJobRequest, CreateExportRequest
from app.models.responses.job import (
    JobResponse,
    JobListResponse,
    JobFileResponse,
    ExportResponse,
)

router = APIRouter()


@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job(
    body: CreateJobRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> JobResponse:
    # Inserts DB record (status=queued) and enqueues ETL via the configured runner strategy.
    raise NotImplementedError


@router.get("", response_model=JobListResponse)
async def list_jobs(
    project_id: UUID,
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> JobListResponse:
    raise NotImplementedError


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> JobResponse:
    raise NotImplementedError


@router.get("/{job_id}/files", response_model=list[JobFileResponse])
async def list_job_files(
    job_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[JobFileResponse]:
    raise NotImplementedError


@router.post("/{job_id}/exports", response_model=ExportResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_export(
    job_id: UUID,
    body: CreateExportRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ExportResponse:
    raise NotImplementedError


@router.get("/{job_id}/exports/{export_id}", response_model=ExportResponse)
async def get_export(
    job_id: UUID,
    export_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ExportResponse:
    raise NotImplementedError


@router.post("/{job_id}/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def etl_callback(
    job_id: UUID,
    x_internal_secret: str | None = Header(default=None),
) -> None:
    # Internal endpoint — called by the ETL runner on job completion.
    # Validates X-Internal-Secret header before processing.
    raise NotImplementedError
