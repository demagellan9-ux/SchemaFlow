# SchemaFlow — Backend

FastAPI application. Handles authentication, job orchestration, API contracts, and presigned URL generation. Does not parse spreadsheets or execute transformations.

## Stack

- **Framework:** FastAPI
- **Language:** Python 3.11+
- **Config:** pydantic-settings (env vars only)
- **Auth:** Supabase JWT validation
- **DB:** supabase-py async client
- **ETL dispatch:** configurable via `ETL_RUNNER` env var

## Environment Variables

Create `.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
ETL_RUNNER=subprocess
DEBUG=false
CORS_ORIGINS=["http://localhost:3000"]
```

## Running

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Key Conventions

- Route handlers are thin: params → service call → response. No logic in routes.
- All DB access goes through service functions, never directly from routes.
- Service role key is never passed to the frontend.
- ETL runner is swappable via `ETL_RUNNER=subprocess|celery|http`.
- See `backend/CLAUDE.md` for full layer guidance.
