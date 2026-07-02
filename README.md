# SchemaFlow

Metadata-driven spreadsheet consolidation platform. Upload heterogeneous spreadsheets, discover their structure, map source schemas to a destination schema, apply configurable transformations, and export standardized datasets.

## Architecture

```
Next.js 15 (Vercel)  →  FastAPI Backend  →  Python ETL Engine
                              ↕
                         Supabase
                    (PostgreSQL + Storage + Auth)
```

## Repository Structure

```
SchemaFlow/
├── frontend/         Next.js 15 — UI, file uploads, schema mapping, job monitoring
├── backend/          FastAPI — auth, job orchestration, API contracts
├── etl/              Python ETL engine — parse, profile, map, transform, validate, export
├── supabase/         Database schema, migrations, seed data
├── docs/             Architecture, API, database, and workflow documentation
├── tests/            Integration and unit tests per layer
└── .github/          CI workflows
```

## Layer READMEs

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)
- [etl/README.md](etl/README.md)
- [supabase/README.md](supabase/README.md)

## Core Principles

- **Domain-agnostic** — No hardcoded business domains in code.
- **Metadata-driven** — Pipelines are configurations stored as JSONB.
- **Separation of concerns** — Each layer owns exactly one responsibility.
- **Memory-safe** — Files processed sequentially; LazyFrame pipeline collected once at export.

## Development

Each layer is independently deployable. See the layer README for setup instructions.

No local runtime is required to edit source files — all execution happens in remote environments (Vercel, Supabase, FastAPI host).
