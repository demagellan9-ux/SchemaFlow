import base64
import json
import logging
import uuid
from pathlib import Path
from uuid import UUID

from supabase._async.client import AsyncClient

from app.core.exceptions import NotFoundError, StorageError, ValidationError
from app.models.requests.upload import ALLOWED_EXTENSIONS

logger = logging.getLogger("schemaflow.services.upload")

STORAGE_BUCKET = "uploads"


class UploadService:
    def __init__(self, db: AsyncClient) -> None:
        self._db = db

    async def presign(
        self,
        user_id: UUID,
        project_id: UUID,
        filename: str,
        size_bytes: int,
        content_type: str,
    ) -> dict:
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # Verify project ownership before accepting the upload
        proj = (
            await self._db.table("projects")
            .select("id")
            .eq("id", str(project_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        if not proj.data:
            raise NotFoundError(f"Project {project_id} not found")

        upload_id = uuid.uuid4()
        storage_path = f"{user_id}/{project_id}/{upload_id}{ext}"

        # Create the upload record (status=pending) before generating the URL
        await self._db.table("uploads").insert({
            "id": str(upload_id),
            "project_id": str(project_id),
            "user_id": str(user_id),
            "filename": filename,
            "storage_path": storage_path,
            "size_bytes": size_bytes,
            "status": "pending",
        }).execute()

        try:
            signed = self._db.storage.from_(STORAGE_BUCKET).create_signed_upload_url(storage_path)
            presigned_url = signed.signed_url
        except Exception as exc:
            # Roll back the DB row if storage URL generation fails
            await self._db.table("uploads").delete().eq("id", str(upload_id)).execute()
            raise StorageError(f"Failed to generate upload URL: {exc}") from exc

        logger.info(
            "upload presigned",
            extra={"upload_id": str(upload_id), "project_id": str(project_id)},
        )
        return {
            "upload_id": upload_id,
            "presigned_url": presigned_url,
            "storage_path": storage_path,
            "expires_in": 3600,
        }

    async def confirm(self, user_id: UUID, upload_id: UUID) -> dict:
        result = (
            await self._db.table("uploads")
            .select("*")
            .eq("id", str(upload_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            raise NotFoundError(f"Upload {upload_id} not found")

        updated = (
            await self._db.table("uploads")
            .update({"status": "uploaded"})
            .eq("id", str(upload_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        logger.info("upload confirmed", extra={"upload_id": str(upload_id)})
        return updated.data[0]

    async def list(self, user_id: UUID, project_id: UUID, cursor: str | None, limit: int) -> dict:
        query = (
            self._db.table("uploads")
            .select("*")
            .eq("project_id", str(project_id))
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(limit + 1)
        )

        if cursor:
            try:
                payload = json.loads(base64.b64decode(cursor).decode())
                query = query.lt("created_at", payload["created_at"])
            except Exception:
                pass

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

    async def get(self, user_id: UUID, upload_id: UUID) -> dict:
        result = (
            await self._db.table("uploads")
            .select("*")
            .eq("id", str(upload_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute()
        )
        if not result.data:
            raise NotFoundError(f"Upload {upload_id} not found")
        return result.data[0]

    async def get_slice(self, user_id: UUID, upload_id: UUID) -> dict:
        row = await self.get(user_id, upload_id)
        return {
            "upload_id": row["id"],
            "status": row["status"],
            "slice_data": row.get("slice_data"),
        }
