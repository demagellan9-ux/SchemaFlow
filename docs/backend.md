# Backend Architecture — SchemaFlow

## Overview

The FastAPI backend is the orchestration layer between the Next.js UI and the Python ETL Engine. It owns authentication, job lifecycle management, API contracts, and presigned URL generation. It never parses spreadsheets, executes transformation logic, or contains business domain rules.

---

## Application Lifecycle

```
startup (lifespan)
  │
  ├── configure_logging()       — structured log format applied to root logger
  ├── get_service_client()      — Supabase async client initialized and cached
  │
yield (application serves traffic)
  │
shutdown (lifespan)
  └── close_service_client()   — client reference released
```

The lifespan context manager (`app/main.py`) handles startup and shutdown as a single async generator via FastAPI's `lifespan` parameter.

---

## Module Map

```
backend/
  app/
    main.py                     Application factory + lifespan
    core/
      config.py                 Pydantic Settings — strongly typed env vars
      logging.py                Structured formatter + JobLogger interface
      exceptions.py             Domain exception hierarchy + handler registration
      security.py               JWT validation → AuthenticatedUser dataclass
      middleware.py             RequestLoggingMiddleware, SecurityHeadersMiddleware
    api/
      v1/
        router.py               Aggregates all route modules under /api/v1
        routes/
          health.py             GET /health, GET /ready
          projects.py           CRUD /projects
          uploads.py            /uploads (presign, confirm, get)
          schemas.py            CRUD /schemas
          mappings.py           /mappings (get, save, auto-map)
          transformations.py    /transformations (registry, per-column rules)
          jobs.py               /jobs + /exports + ETL webhook
        dependencies/
          auth.py               require_user → AuthenticatedUser
          database.py           DatabaseDep → AsyncClient
          settings.py           SettingsDep → Settings
    db/
      supabase_client.py        Singleton async client + FastAPI dependency
    models/
      requests/                 Typed Pydantic request bodies (one file per resource)
      responses/                Typed Pydantic response bodies (one file per resource)
    services/                   Business logic layer — Phase 6 implementation target
    workers/
      job_config.py             JobConfig + FileJobConfig dataclasses (ETL contract)
      etl_dispatcher.py         Strategy dispatcher (subprocess / http / celery)
  tests/
    conftest.py                 Shared fixtures: client, mock_db, make_auth_header
    unit/
      test_config.py            Settings validation tests
      test_security.py          JWT acceptance / rejection tests
    integration/
      test_health.py            /health and /ready endpoint tests
```

---

## Configuration Strategy

All configuration flows through `app/core/config.py` via `pydantic-settings`. Environment variables are the single source of truth — no `os.environ.get()` calls anywhere in business logic.

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `APP_ENV` | `development\|testing\|production` | `development` | Controls docs, log verbosity |
| `DEBUG` | `bool` | `false` | Enables OpenAPI docs in production |
| `LOG_LEVEL` | `str` | `INFO` | Root logger level |
| `SUPABASE_URL` | `str` | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | `str` | — | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `str` | — | Backend-only service key |
| `JWT_SECRET` | `str` | — | Supabase JWT signing secret |
| `JWT_ALGORITHM` | `str` | `HS256` | JWT algorithm |
| `CORS_ORIGINS` | `list[str]` | `["http://localhost:3000"]` | Allowed CORS origins |
| `ETL_RUNNER` | `subprocess\|http\|celery` | `subprocess` | ETL dispatch strategy |
| `ETL_HTTP_URL` | `str` | `""` | Required when `ETL_RUNNER=http` |
| `INTERNAL_WEBHOOK_SECRET` | `str` | `""` | Shared secret for ETL → API callback |

`get_settings()` is `lru_cache`-wrapped. Tests override it by patching `app.core.config.settings`.

---

## Authentication Flow

```
Client → Authorization: Bearer <supabase_jwt>
          │
          ▼
  get_current_user() dependency
          │
          ├── No header → 401
          ├── Expired token → 401
          ├── Invalid signature → 401
          ├── Missing sub claim → 401
          └── Valid → AuthenticatedUser(user_id, email)
                          │
                          ▼
                  Route handler receives typed user object.
                  Service functions accept user_id: UUID only.
                  Raw token never propagates past the dependency.
```

`verify_internal_secret()` in `security.py` validates the `X-Internal-Secret` header on the ETL webhook endpoint — this route is not protected by JWT.

---

## Error Handling

All errors are normalized to a consistent JSON shape:

```json
{
  "error": "Human-readable category",
  "details": [{ "field": "body.name", "message": "Field required" }]
}
```

| Exception class | HTTP status | Notes |
|---|---|---|
| `NotFoundError` | 404 | Resource missing or not owned |
| `ConflictError` | 409 | ON DELETE RESTRICT or duplicate |
| `AuthorizationError` | 403 | Authenticated but not permitted |
| `StorageError` | 502 | Supabase Storage failure (logged server-side) |
| `JobError` | 500 | ETL lifecycle failure (logged server-side) |
| `ValidationError` | 400 | Business rule violation |
| `RequestValidationError` | 422 | Pydantic field validation (details populated) |
| `HTTPException` | varies | Starlette/FastAPI HTTP errors |
| `Exception` | 500 | Unhandled — stack trace suppressed in response |

---

## Middleware Stack

Middleware executes outermost-first. Registration order in `create_app()`:

1. `SecurityHeadersMiddleware` — adds `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
2. `RequestLoggingMiddleware` — logs method, path, status, duration; injects `X-Request-ID` header
3. `CORSMiddleware` — handles preflight and origin validation

---

## Dependency Injection

Three reusable `Annotated` dependency aliases in `app/api/v1/dependencies/`:

| Alias | Type | Source |
|---|---|---|
| `require_user` | `AuthenticatedUser` | JWT validation |
| `DatabaseDep` | `AsyncClient` | Supabase singleton |
| `SettingsDep` | `Settings` | `lru_cache`-wrapped settings |

Route handlers import from `app.api.v1.dependencies` — never directly from `app.core.*`.

---

## Background Job Interface

Job dispatch is encapsulated in `app/workers/etl_dispatcher.py`. The strategy is selected at runtime via `ETL_RUNNER`:

- `subprocess` — launches `etl/pipeline.py` as a child process (Phase 6)
- `http` — POSTs job config to `ETL_HTTP_URL`; ETL calls back on completion (Phase 6)
- `celery` — enqueues a Celery task (Phase 6)

The `JobConfig` and `FileJobConfig` dataclasses in `app/workers/job_config.py` define the contract between the backend and the ETL engine. These are the only shared types — no imports cross the layer boundary.

---

## Health Endpoints

| Endpoint | Purpose | Auth |
|---|---|---|
| `GET /api/v1/health` | Liveness — process is alive | None |
| `GET /api/v1/ready` | Readiness — Supabase reachable | None |

`/ready` returns `503` if the database check fails, enabling deployment orchestrators (Render, Railway, Fly.io) to gate traffic until the application is fully connected.

---

## Testing

Tests are in `backend/tests/`. Run with `pytest` from the `backend/` directory.

- `conftest.py` — provides `client`, `mock_db`, and `make_auth_header` fixtures. Settings are overridden to use in-memory test values; no real `.env` file is required.
- `tests/unit/` — pure logic tests (config validation, JWT handling). No network calls.
- `tests/integration/` — TestClient tests against the full FastAPI app with mocked Supabase.

Every new route requires at minimum: one happy-path test and one `401` auth-failure test.

---

## Extension Points for Phase 6

| Component | Current state | Phase 6 action |
|---|---|---|
| `app/services/` | Empty stubs | Implement service methods using `DatabaseDep` |
| `etl_dispatcher.py` | `NotImplementedError` stubs | Implement subprocess / http / celery strategies |
| `job_config.py` | Data contracts defined | Wire into `JobService.create()` |
| Route handlers | `raise NotImplementedError` | Delegate to service layer |
| `app/db/supabase_client.py` | Singleton client | Add typed query helpers per resource |
