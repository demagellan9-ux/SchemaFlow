import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("schemaflow.errors")


# ── Domain exceptions ─────────────────────────────────────────────────────────


class SchemaFlowError(Exception):
    """Base class for all domain-level errors."""


class NotFoundError(SchemaFlowError):
    """Resource does not exist or is not owned by the requesting user."""


class ConflictError(SchemaFlowError):
    """Operation conflicts with existing state (e.g. ON DELETE RESTRICT)."""


class StorageError(SchemaFlowError):
    """Supabase Storage operation failed."""


class JobError(SchemaFlowError):
    """ETL job lifecycle error."""


class AuthorizationError(SchemaFlowError):
    """Authenticated user is not permitted to access this resource."""


class ValidationError(SchemaFlowError):
    """Business-rule validation failure (distinct from Pydantic field validation)."""


# ── Error response builder ───────────────────────────────────────────────────


def _error_response(status_code: int, error: str, details: list | None = None) -> JSONResponse:
    body: dict = {"error": error}
    if details:
        body["details"] = details
    return JSONResponse(status_code=status_code, content=body)


# ── Handler registration ─────────────────────────────────────────────────────


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(NotFoundError)
    async def _not_found(request: Request, exc: NotFoundError) -> JSONResponse:
        return _error_response(status.HTTP_404_NOT_FOUND, str(exc) or "Resource not found")

    @app.exception_handler(ConflictError)
    async def _conflict(request: Request, exc: ConflictError) -> JSONResponse:
        return _error_response(status.HTTP_409_CONFLICT, str(exc) or "Conflict")

    @app.exception_handler(AuthorizationError)
    async def _forbidden(request: Request, exc: AuthorizationError) -> JSONResponse:
        return _error_response(status.HTTP_403_FORBIDDEN, "Forbidden")

    @app.exception_handler(StorageError)
    async def _storage(request: Request, exc: StorageError) -> JSONResponse:
        logger.error("storage error: %s", exc, exc_info=True)
        return _error_response(status.HTTP_502_BAD_GATEWAY, "Storage operation failed")

    @app.exception_handler(JobError)
    async def _job(request: Request, exc: JobError) -> JSONResponse:
        logger.error("job error: %s", exc, exc_info=True)
        return _error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "Job operation failed")

    @app.exception_handler(ValidationError)
    async def _validation(request: Request, exc: ValidationError) -> JSONResponse:
        return _error_response(status.HTTP_400_BAD_REQUEST, str(exc))

    @app.exception_handler(RequestValidationError)
    async def _request_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return _error_response(status.HTTP_422_UNPROCESSABLE_ENTITY, "Validation failed", details)

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(exc.status_code, exc.detail or "HTTP error")

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled error %s %s", request.method, request.url.path)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal server error"
        )
