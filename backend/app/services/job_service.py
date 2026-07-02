from uuid import UUID

# TODO: Implement using async Supabase client and ETL runner dispatcher

class JobService:
    async def create(self, user_id: UUID, project_id: UUID, schema_id: UUID, upload_ids: list[UUID]) -> dict:
        # TODO: Insert job record (status=queued) and job_file records
        #       Dispatch to ETL via settings.etl_runner strategy
        #       Return job record immediately (202 Accepted)
        raise NotImplementedError

    async def get(self, user_id: UUID, job_id: UUID) -> dict:
        # TODO: Fetch job by id + user_id; raise NotFoundError if missing
        raise NotImplementedError

    async def list(self, user_id: UUID, project_id: UUID, cursor: str | None, limit: int) -> dict:
        # TODO: Query jobs filtered by user_id + project_id, paginated by cursor
        raise NotImplementedError

    async def handle_etl_callback(self, job_id: UUID, payload: dict) -> None:
        # TODO: Update job status, output_path, errors from ETL completion payload
        raise NotImplementedError
