import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.db.supabase_client import get_service_client

router = APIRouter(tags=["health"])
logger = logging.getLogger("schemaflow.health")


class HealthResponse(BaseModel):
    status: str
    version: str = "0.1.0"


class ReadinessResponse(BaseModel):
    status: str
    checks: dict[str, str]


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Returns 200 when the application process is running.",
)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness probe",
    description="Returns 200 when the application is ready to serve traffic. Checks Supabase connectivity.",
)
async def ready() -> JSONResponse:
    checks: dict[str, str] = {}

    try:
        client = await get_service_client()
        # Lightweight connectivity check — list with zero rows returned.
        await client.table("projects").select("id").limit(1).execute()
        checks["database"] = "ok"
    except Exception as exc:
        logger.error("readiness check: database unreachable", extra={"error": str(exc)})
        checks["database"] = "unreachable"

    overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    http_status = status.HTTP_200_OK if overall == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content=ReadinessResponse(status=overall, checks=checks).model_dump(),
    )
