# Backend Layer — SchemaFlow

> Global rules are in the root `CLAUDE.md`. This file adds FastAPI-specific guidance only.

---

## Responsibilities

The backend owns:
- Authentication verification (Supabase JWT validation)
- Job creation, queuing, and status tracking
- Orchestrating ETL Engine invocations (subprocess, task queue, or HTTP depending on deployment)
- API contracts between frontend and ETL
- Webhook endpoints for async ETL completion callbacks
- Presigned URL generation for Supabase Storage uploads/downloads

The backend **never**:
- Parses spreadsheet files
- Executes transformation logic
- Contains hardcoded business domain rules

---

## Project Structure

```
backend/
  app/
    api/
      v1/
        routes/         # One module per resource (jobs, projects, uploads, schemas)
        dependencies/   # Shared FastAPI dependency functions (auth, db session)
    core/
      config.py         # Settings via pydantic-settings (env vars only)
      security.py       # JWT validation, Supabase auth helpers
    models/
      domain/           # Pydantic domain models (Job, Upload, Schema, etc.)
      requests/         # Typed request bodies
      responses/        # Typed response bodies
    services/           # Business logic services (one per domain)
    db/                 # Supabase async client wrappers
  tests/
    unit/
    integration/
  main.py               # FastAPI app factory
```

---

## API Design

- All routes are versioned under `/api/v1/`.
- Every route handler must have explicit `response_model` and typed request body.
- Route handlers are thin: extract params → call service → return response. No logic in route handlers.
- HTTP status codes must be semantically correct (201 for creation, 202 for accepted async jobs, 422 for validation errors).
- Paginate all list endpoints using cursor-based pagination (`cursor` + `limit`), not offset.

---

## Pydantic Models

- Define separate models for requests, responses, and domain objects. Never reuse the same model for all three.
- Use `pydantic-settings` for all environment-variable configuration. No `os.environ.get()` calls in business logic.
- Validation errors from Pydantic bubble up as 422 responses automatically — do not catch and re-raise them manually.

---

## Authentication

- All protected routes use a `CurrentUser` dependency that validates the Supabase JWT from the `Authorization: Bearer` header.
- The dependency returns a typed `AuthenticatedUser` dataclass. Route handlers receive the user object, not the raw token.
- Service functions accept `user_id: UUID` — never the raw JWT or token string.

---

## Job Orchestration

- Jobs are created synchronously (DB record inserted, status = `queued`) and processed asynchronously.
- ETL invocation strategy is configured via environment variable (`ETL_RUNNER=subprocess|celery|http`), making it swappable without code changes.
- Job status transitions: `queued` → `running` → `completed` | `failed`.
- Partial batch failures set status to `completed_with_errors`. Individual file errors are stored in the job's JSONB `errors` field.

---

## Error Handling

- Use a global FastAPI exception handler for `HTTPException`, `RequestValidationError`, and unhandled `Exception`.
- Service-layer errors raise typed domain exceptions (`JobNotFoundError`, `StorageAccessError`). Route handlers catch these and map them to HTTP status codes.
- Never expose internal stack traces in API responses (log them server-side only).

---

## Supabase Integration

- Use the `supabase-py` async client. Never use the sync client in async route handlers.
- Database operations go through service functions in `app/services/`. Never call the Supabase client directly from route handlers.
- Presigned URLs for Storage are generated in the backend and returned to the frontend — the frontend never has direct Storage admin credentials.

---

## Testing

- Unit tests cover service functions with mocked Supabase clients.
- Integration tests run against a real Supabase local dev instance (`supabase start`).
- Every new route must have at least one integration test covering the happy path and one covering auth failure (401).
