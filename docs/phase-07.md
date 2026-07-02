# Phase 7 — Project Workspace & File Ingestion

## Overview

Phase 7 implements the first complete vertical slice of SchemaFlow: project management and spreadsheet ingestion. Users can create projects, upload CSV/XLS/XLSX files into them, and track upload status. No ETL processing occurs — files are stored in Supabase Storage and awaiting analysis in Phase 8.

---

## Implemented Features

### Project Management
- **Create project** — dialog form with name (required) and description (optional)
- **List projects** — grid view with cursor-based pagination
- **Edit project** — inline rename and description update
- **Delete project** — confirmation dialog; cascades to uploads via FK

### File Ingestion
- **Drag-and-drop upload** — multi-file selection via `UploadDropzone`
- **File validation** — extension filter (.csv, .xls, .xlsx), 30 MB per-file limit
- **Upload history table** — filename, size, status, upload time
- **Status tracking** — `pending` → `uploaded` per file

---

## Upload Architecture

```
User selects files in UploadDropzone
        │
        ▼
useFileUpload.mutateAsync(file)          [for each file, sequentially]
        │
        ├─ POST /api/v1/uploads/presign
        │    FastAPI: validate extension + ownership
        │    Insert uploads row (status=pending)
        │    Generate Supabase Storage signed upload URL
        │    Return { upload_id, presigned_url, storage_path }
        │
        ├─ PUT <presigned_url>  (binary direct to Supabase Storage)
        │    FastAPI never receives the binary
        │
        └─ POST /api/v1/uploads/{upload_id}/confirm
             FastAPI: update status → "uploaded"
             Return UploadResponse
```

### Why presigned URLs?
The FastAPI process never buffers the file binary. This keeps the API container memory footprint minimal regardless of file size, and places no file-size limit on the server process itself — the 30 MB cap is enforced at the API validation layer before the URL is issued.

---

## Storage Strategy

### Bucket structure

```
uploads/                             (private bucket)
  {user_id}/
    {project_id}/
      {upload_id}.{ext}

exports/                             (private bucket — Phase 9+)
  {user_id}/
    {project_id}/
      {job_id}.{ext}
```

- All buckets are **private**. No public object access.
- Object paths are stored in `uploads.storage_path`. The ETL engine resolves them to presigned download URLs at job start.
- Presigned upload URLs expire in 3600 seconds.
- The service role key (used to generate signed URLs) never reaches the frontend.

---

## Database Tables Used

| Table | Purpose in Phase 7 |
|---|---|
| `users` | Ownership anchor for RLS |
| `projects` | Project metadata (name, description) |
| `uploads` | File references (path, size, status) |

The `uploads.slice_data` JSONB column is populated by the ETL engine in Phase 8. It remains `null` after Phase 7 confirm.

---

## API Endpoints (Phase 7 scope)

### Projects
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/projects` | List user's projects (cursor pagination) |
| `POST` | `/api/v1/projects` | Create project (201) |
| `GET` | `/api/v1/projects/{id}` | Get project |
| `PATCH` | `/api/v1/projects/{id}` | Update name / description |
| `DELETE` | `/api/v1/projects/{id}` | Delete project (204) |

### Uploads
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/uploads?project_id=` | List uploads for project |
| `POST` | `/api/v1/uploads/presign` | Generate signed upload URL (201) |
| `GET` | `/api/v1/uploads/{id}` | Get upload record |
| `POST` | `/api/v1/uploads/{id}/confirm` | Mark upload stored |
| `GET` | `/api/v1/uploads/{id}/slice` | Get slice data (null until Phase 8) |

---

## File Validation Rules

| Rule | Enforcement Layer |
|---|---|
| Extension must be .csv, .xls, or .xlsx | Backend (`UploadService.presign`) + Frontend (`FileDropzone`) |
| File size ≤ 30 MB | Backend (`PresignRequest` field validator) + Frontend (`FileDropzone`) |
| Project must belong to authenticated user | Backend (ownership check before insert) |

Unsupported extensions return HTTP 422 with `{ error: "Unsupported file type '...'", details: [] }`.

---

## Frontend Component Map

```
pages/dashboard/projects/page.tsx            ProjectsPage (list + create)
  └─ ProjectCard                             Per-project card with edit/delete
       ├─ EditProjectDialog                  PATCH /projects/{id}
       └─ ConfirmDialog (delete)             DELETE /projects/{id}
  └─ CreateProjectDialog                     POST /projects

pages/dashboard/projects/[projectId]/page.tsx  ProjectDetailPage
  ├─ UploadDropzone                          Drag-drop → useFileUpload hook
  └─ UploadTable                             DataTable<Upload> with StatusBadge
```

---

## Readiness for Phase 8

Phase 8 (Schema Discovery & Column Profiling) can build directly on Phase 7:

- **`uploads.storage_path`** — the ETL engine reads this to stream the file from Storage
- **`uploads.status`** — ETL updates to `"sliced"` and writes `slice_data` JSONB after profiling
- **`useUploads` hook** — already polls the upload list; Phase 8 adds a detail view that reads `slice_data.columns`
- **`GET /uploads/{id}/slice`** — returns `slice_data` once ETL populates it; frontend can poll or subscribe

The `ConfirmUpload` endpoint is intentionally separated from the presign step so Phase 8 can dispatch the ETL slice job immediately on confirmation, without changing the upload flow.
