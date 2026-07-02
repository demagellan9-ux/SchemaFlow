import logging
from uuid import UUID

from app.core.config import settings
from app.workers.job_config import JobConfig

logger = logging.getLogger("schemaflow.dispatcher")


async def dispatch_etl_job(job_id: UUID, job_config: JobConfig) -> None:
    """
    Dispatches an ETL job using the configured runner strategy.
    ETL_RUNNER env var selects the strategy — no code changes required to swap.
    """
    runner = settings.etl_runner
    logger.info("dispatching job", extra={"job_id": str(job_id), "runner": runner})

    if runner == "subprocess":
        await _dispatch_subprocess(job_id, job_config)
    elif runner == "http":
        await _dispatch_http(job_id, job_config)
    elif runner == "celery":
        await _dispatch_celery(job_id, job_config)
    else:
        raise ValueError(f"Unknown ETL_RUNNER value: {runner!r}")


async def _dispatch_subprocess(job_id: UUID, job_config: JobConfig) -> None:
    # Phase 6: Launch etl/pipeline.py as a subprocess.
    # Serialize job_config to JSON and pass via stdin or a temp file.
    raise NotImplementedError("subprocess runner is not yet implemented")


async def _dispatch_http(job_id: UUID, job_config: JobConfig) -> None:
    # Phase 6: POST job_config payload to settings.etl_http_url.
    # ETL engine calls back on completion via POST /jobs/{job_id}/webhook.
    raise NotImplementedError("http runner is not yet implemented")


async def _dispatch_celery(job_id: UUID, job_config: JobConfig) -> None:
    # Phase 6: Enqueue a Celery task with the serialized job_config.
    raise NotImplementedError("celery runner is not yet implemented")
