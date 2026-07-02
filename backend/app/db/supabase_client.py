import logging
from typing import AsyncGenerator

from supabase._async.client import AsyncClient
from supabase import acreate_client

from app.core.config import settings

logger = logging.getLogger("schemaflow.db")

_service_client: AsyncClient | None = None


async def get_service_client() -> AsyncClient:
    """
    Returns the singleton async Supabase service-role client.
    Initialized once on first call. Service-role key is never exposed to clients.
    """
    global _service_client
    if _service_client is None:
        logger.info("initializing Supabase service-role client", extra={"url": settings.supabase_url})
        _service_client = await acreate_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _service_client


async def close_service_client() -> None:
    """Called during application shutdown to release the client."""
    global _service_client
    if _service_client is not None:
        # supabase-py async client does not expose an explicit close;
        # the underlying httpx session is cleaned up by the garbage collector.
        _service_client = None
        logger.info("Supabase service-role client released")


async def db_dependency() -> AsyncGenerator[AsyncClient, None]:
    """FastAPI dependency that yields the service-role client."""
    client = await get_service_client()
    yield client
