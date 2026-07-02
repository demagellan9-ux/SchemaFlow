from uuid import UUID

# TODO: Implement using async Supabase client from app/db/
# All methods accept user_id: UUID to enforce ownership; never accept raw JWT

class ProjectService:
    async def list(self, user_id: UUID, cursor: str | None, limit: int) -> dict:
        # TODO: Query projects table filtered by user_id, paginated by cursor
        raise NotImplementedError

    async def create(self, user_id: UUID, name: str, description: str | None) -> dict:
        # TODO: Insert into projects table; return created row
        raise NotImplementedError

    async def get(self, user_id: UUID, project_id: UUID) -> dict:
        # TODO: Fetch by id + user_id; raise NotFoundError if missing
        raise NotImplementedError

    async def delete(self, user_id: UUID, project_id: UUID) -> None:
        # TODO: Delete by id + user_id; raise NotFoundError if missing
        raise NotImplementedError
