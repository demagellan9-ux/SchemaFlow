# SchemaFlow — Supabase

PostgreSQL database, Auth, and Storage configuration for SchemaFlow.

## Structure

```
supabase/
  schema.sql          # Canonical full schema reference
  seed.sql            # Structural seed data only
  migrations/         # Timestamped additive migration files
  types/              # JSONB column type specs (TypeScript-style, for cross-layer reference)
```

## Core Tables

| Table | Purpose |
|---|---|
| `users` | Extended user profile (mirrors auth.users) |
| `projects` | User-scoped consolidation task containers |
| `uploads` | Per-file upload records + structural slice data (JSONB) |
| `schemas` | Destination schema definitions (JSONB) |
| `mappings` | Source→destination column mappings per upload (JSONB) |
| `transformations` | Ordered transformation rules per destination column (JSONB) |
| `jobs` | ETL job execution records |
| `job_files` | Per-file status within a batch job |

## Storage Buckets

| Bucket | Path Pattern | Access |
|---|---|---|
| `uploads` | `{user_id}/{project_id}/{upload_id}.{ext}` | Private, presigned URL |
| `exports` | `{user_id}/{project_id}/{job_id}.{ext}` | Private, presigned URL |

## Key Rules

- RLS enabled on all tables. Default: deny all.
- JSONB objects always include a `version` field.
- Migrations are additive only in production.
- File binaries live in Storage; DB stores only object paths.
- See `supabase/CLAUDE.md` for full layer guidance.
