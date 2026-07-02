import base64
import json
import logging
from uuid import UUID

from supabase._async.client import AsyncClient

from app.core.exceptions import NotFoundError

logger = logging.getLogger("schemaflow.services.project")


class ProjectService:
    def __init__(self, db: AsyncClient) -> None:
        self._db = db

    async def list(self, user_id: UUID, cursor: str | None, limit: int) -> dict:
        query = (
            self._db.table("projects")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .order("id", desc=True)
            .limit(limit + 1)
        )

        if cursor:
            try:
                payload = json.loads(base64.b64decode(cursor).decode())
                query = query.lt("created_at", payload["created_at"])
            except Exception:
                pass  # Invalid cursor — ignore and return first page

        result = await query.execute()
        rows = result.data

        has_more = len(rows) > limit
        items = rows[:limit]
        next_cursor = None
        if has_more and items:
            last = items[-1]
            raw = json.dumps({"created_at": last["created_at"]})
            next_cursor = base64.b64encode(raw.encode()).decode()

        return {"items": items, "next_cursor": next_cursor}

    async def create(self, user_id: UUID, name: str, description: str | None) -> dict:
        payload = {"user_id": str(user_id), "name": name}
        if description is not None:
            payload["description"] = description

        result = await self._db.table("projects").insert(payload).execute()
        row = result.data[0]
        logger.info("project created", extra={"project_id": row["id"], "user_id": str(user_id)})
        return row

    async def get(self, user_id: UUID, project_id: UUID) -> dict:
        result = (
            await self._db.table("projects")
            .select("*")
            .eq("id", str(project_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            raise NotFoundError(f"Project {project_id} not found")
        return result.data[0]

    async def update(self, user_id: UUID, project_id: UUID, name: str | None, description: str | None) -> dict:
        await self.get(user_id, project_id)  # ownership check

        patch: dict = {}
        if name is not None:
            patch["name"] = name
        if description is not None:
            patch["description"] = description

        if not patch:
            return await self.get(user_id, project_id)

        result = (
            await self._db.table("projects")
            .update(patch)
            .eq("id", str(project_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        return result.data[0]

    async def delete(self, user_id: UUID, project_id: UUID) -> None:
        await self.get(user_id, project_id)  # ownership check raises NotFoundError if missing
        await (
            self._db.table("projects")
            .delete()
            .eq("id", str(project_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        logger.info("project deleted", extra={"project_id": str(project_id), "user_id": str(user_id)})
