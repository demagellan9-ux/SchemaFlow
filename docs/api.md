# API Overview

All routes are versioned under `/api/v1/`. Authentication uses `Authorization: Bearer <supabase_jwt>`.

## Projects

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/projects` | List projects (cursor paginated) |
| `POST` | `/api/v1/projects` | Create project → 201 |
| `GET` | `/api/v1/projects/{id}` | Get project |
| `DELETE` | `/api/v1/projects/{id}` | Delete project → 204 |

## Uploads

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/uploads/presign` | Request presigned Storage PUT URL → 201 |
| `POST` | `/api/v1/uploads/{id}/confirm` | Confirm upload complete; triggers slice extraction |
| `GET` | `/api/v1/uploads/{id}/slice` | Get structural slice + column profiles |

## Schemas

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/schemas?project_id=` | List schemas for a project |
| `POST` | `/api/v1/schemas` | Create destination schema → 201 |
| `PATCH` | `/api/v1/schemas/{id}` | Update schema definition |

## Mappings

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/mappings/{upload_id}` | Get current column mapping for an upload |
| `PATCH` | `/api/v1/mappings/{upload_id}` | Save column mapping entries |

## Transformations

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/transformations/types` | List available transformation types + param schemas |
| `GET` | `/api/v1/transformations/{schema_id}/{dest_column}` | Get rules for a column |
| `PUT` | `/api/v1/transformations/{schema_id}/{dest_column}` | Save ordered rule chain |

## Jobs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/jobs` | Create and queue ETL job → 202 Accepted |
| `GET` | `/api/v1/jobs/{id}` | Get job status + errors |
| `GET` | `/api/v1/jobs?project_id=` | List jobs for a project |
| `POST` | `/api/v1/jobs/{id}/webhook` | ETL completion callback (internal, service-role only) |

## Pagination

All list endpoints use cursor-based pagination:
```
GET /api/v1/projects?cursor=<opaque_cursor>&limit=20
Response: { items: [...], next_cursor: "<cursor>" | null }
```

## Error Responses

| Status | Meaning |
|---|---|
| 401 | Missing or invalid JWT |
| 404 | Resource not found or not owned by user |
| 422 | Request validation error (field-level details in body) |
| 500 | Internal server error (no stack trace exposed) |
