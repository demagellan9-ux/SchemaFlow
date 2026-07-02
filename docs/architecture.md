# Architecture Overview

## System Diagram

```
[ Browser ]
    │
    │ HTTPS
    ▼
[ Next.js 15 — Vercel ]
    │ File uploads → PUT presigned URL
    │ API calls → /api/v1/ (proxy)
    ▼
[ FastAPI Backend ]
    │ Auth, job orchestration, presigned URL generation
    │ Supabase service-role client
    ▼
[ Python ETL Engine ]
    │ Sequential file processing
    │ Polars LazyFrame pipeline
    ▼
[ Supabase ]
  PostgreSQL (metadata + JSONB configs)
  Storage (binary files — uploads + exports)
  Auth (JWT issuance)
```

## Layer Responsibilities

| Layer | Owns | Never |
|---|---|---|
| Frontend | UI state, file upload UX, mapping UI, job monitoring | ETL, direct DB writes |
| FastAPI | Auth, job queue, API contracts, presigned URLs | Spreadsheet parsing, transformation logic |
| ETL Engine | Parse, profile, map, transform, validate, export | UI decisions, direct DB writes |
| Supabase | Metadata storage, file storage, auth | Business logic, file parsing |

## Data Flow — File Upload

1. User selects file in browser
2. Frontend requests presigned PUT URL from FastAPI
3. FastAPI creates upload record (status=`pending`), generates presigned URL from Supabase Storage
4. Frontend PUTs binary directly to Supabase Storage (FastAPI never receives the binary)
5. Frontend calls confirm endpoint → FastAPI dispatches structural slice extraction to ETL
6. ETL reads first 100 rows, writes `slice_data` JSONB to uploads table (status=`sliced`)
7. Frontend polls for slice readiness and renders preview table

## Data Flow — ETL Job

1. User configures schema, mappings, and transformation rules via UI
2. User triggers job → Frontend POSTs to FastAPI
3. FastAPI creates job record (status=`queued`), dispatches to ETL runner
4. ETL iterates files sequentially; emits progress callbacks to FastAPI webhook
5. FastAPI updates job and job_file records from callbacks
6. ETL uploads output to Supabase Storage exports bucket, calls completion webhook
7. Frontend polls job status; renders download button on completion

## Memory Safety

- ETL never loads multiple files into memory concurrently
- LazyFrames are chained without collecting until final export
- `gc.collect()` is called between files
- XLSX parsed with OpenPyXL `read_only=True` with row limits
