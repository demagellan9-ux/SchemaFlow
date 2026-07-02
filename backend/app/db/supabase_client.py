from functools import lru_cache
from supabase import AsyncClient, acreate_client
from app.core.config import settings

# TODO: Replace with proper async dependency injection pattern for FastAPI
@lru_cache(maxsize=1)
def get_service_client() -> AsyncClient:
    # Service-role client for backend operations — never exposed to frontend
    return acreate_client(settings.supabase_url, settings.supabase_service_role_key)
