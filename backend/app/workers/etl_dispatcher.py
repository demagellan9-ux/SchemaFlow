from uuid import UUID
from app.core.config import settings


async def dispatch_etl_job(job_id: UUID, job_config: dict) -> None:
    """
    Dispatches an ETL job using the configured runner strategy.
    Strategy is selected via ETL_RUNNER env var — swappable without code changes.
    """
    runner = settings.etl_runner

    if runner == "subprocess":
        await _dispatch_subprocess(job_id, job_config)
    elif runner == "http":
        await _dispatch_http(job_id, job_config)
    elif runner == "celery":
        await _dispatch_celery(job_id, job_config)
    else:
        raise ValueError(f"Unknown ETL_RUNNER: {runner}")


async def _dispatch_subprocess(job_id: UUID, job_config: dict) -> None:
    # TODO: Launch ETL runner as a subprocess with job_config serialized to stdin
    raise NotImplementedError


async def _dispatch_http(job_id: UUID, job_config: dict) -> None:
    # TODO: POST job_config to settings.etl_http_url; ETL engine calls back on completion
    raise NotImplementedError


async def _dispatch_celery(job_id: UUID, job_config: dict) -> None:
    # TODO: Enqueue Celery task with job_config payload
    raise NotImplementedError
