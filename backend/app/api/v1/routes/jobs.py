from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security import AuthenticatedUser, get_current_user
from app.models.requests.job import CreateJobRequest
from app.models.responses.job import JobResponse, JobListResponse

router = APIRouter()


@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job(
    body: CreateJobRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> JobResponse:
    # TODO: Delegate to JobService.create(user_id, body)
    #       Inserts DB record (status=queued), enqueues ETL via configured runner
    raise NotImplementedError


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> JobResponse:
    # TODO: Delegate to JobService.get(user_id, job_id)
    raise NotImplementedError


@router.get("", response_model=JobListResponse)
async def list_jobs(
    project_id: UUID,
    cursor: str | None = None,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> JobListResponse:
    # TODO: Delegate to JobService.list(user_id, project_id, cursor, limit)
    raise NotImplementedError


@router.post("/{job_id}/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def etl_callback(job_id: UUID) -> None:
    # TODO: Receives async completion callback from ETL runner
    #       Updates job status, stores output_path and errors in DB
    #       This endpoint is service-role only — add internal auth check
    raise NotImplementedError
