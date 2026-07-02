# SchemaFlow

## Project Identity

SchemaFlow is a **metadata-driven spreadsheet consolidation platform**. It ingests heterogeneous spreadsheets, discovers their structure, maps source schemas to a user-defined destination schema, applies configurable transformations, validates data, and exports standardized datasets.

SchemaFlow is **completely domain-agnostic**. Business meaning lives in user configuration — never in application code. Do not introduce concepts like `Employee`, `Agent`, `QA`, `Attendance`, `KPI`, or any industry-specific term into source code.

---

## Architecture

```
[ Next.js 15 UI ]  ──HTTP──►  [ FastAPI Backend ]  ──►  [ Python ETL Engine ]
       │                              │                          │
       └──────────────────────────────┴──────────────────────────┘
                                      │
                              [ Supabase Layer ]
                         (PostgreSQL + Storage + Auth)
```

**Layer responsibilities — these are non-negotiable:**

| Layer | Owns |
|---|---|
| Frontend | UI state, schema mapping UX, job monitoring, file uploads to Supabase Storage |
| FastAPI | Auth, job orchestration, webhook coordination, API contracts |
| ETL Engine | Spreadsheet parsing, column profiling, transformation execution, validation, export |
| Supabase | Metadata, job state, transformation configs, file object references |

**Frontend never performs ETL. Backend orchestrates jobs. ETL parses, transforms, validates, and exports.**

---

## Technology Stack

| Domain | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, TanStack Query, React Hook Form |
| Backend | FastAPI (Python) |
| ETL | Python, Polars, OpenPyXL, RapidFuzz |
| Database | Supabase PostgreSQL (JSONB metadata), Supabase Storage, Supabase Auth |

---

## Non-Negotiable Principles

1. **Domain-agnostic** — No hardcoded business domains anywhere in code.
2. **Metadata-driven** — Pipelines are configurations; code handles raw strings and numbers.
3. **Configuration-first** — Transformation rules, schema mappings, and validation logic are stored as structured metadata (PostgreSQL JSONB), not embedded logic.
4. **Separation of concerns** — Each layer does exactly one thing. No cross-layer responsibility leakage.
5. **Modular architecture** — Small, independently testable units. Functional registry pattern for transformations.
6. **No local runtime dependencies** — The local workspace is a text editor only. No local Node.js, Python, or database engines are required to modify or run the codebase.
7. **Memory safety** — Never load multiple large files concurrently. Process sequentially; wipe execution state between files.

---

## Database Philosophy

- Use stable relational tables: `users`, `projects`, `uploads`, `schemas`, `transformations`, `jobs`.
- Schema variations are represented as **PostgreSQL JSONB** objects — never via `ALTER TABLE`.
- File binaries live in Supabase Storage; the database stores only object references.

---

## Engineering Standards

- Strong structural typing in TypeScript and Python (use `pydantic` models in FastAPI, typed dataclasses or protocols in ETL).
- Small, focused components and functions. No premature abstractions.
- Write no comments unless the **why** is non-obvious (hidden constraint, workaround, subtle invariant).
- Never write docstrings or comment blocks that describe **what** the code does.
- Errors are captured at the individual file level — one malformed sheet must not abort the entire batch.

---

## Definition of Done

A feature is complete only when:

1. It compiles and deploys cleanly in remote environments (Vercel, Supabase, FastAPI host) without local installation.
2. Multi-file uploads do not cause OOM crashes in the ETL runner or browser tab.
3. A single malformed file fails gracefully while the rest of the batch completes.
4. Schema mapping logic contains zero hardcoded business domain references.
5. All new API contracts have typed request/response models.
6. UI never renders more than 100 rows in a preview table.

---

## Subdirectory Instructions

Layer-specific guidance lives in co-located `CLAUDE.md` files:

- `frontend/CLAUDE.md` — Next.js UI conventions, component rules, data-fetching patterns
- `backend/CLAUDE.md` — FastAPI structure, auth, job orchestration, API contracts
- `etl/CLAUDE.md` — Python ETL engine, Polars usage, transformation registry, parsing rules
- `supabase/CLAUDE.md` — Schema design, JSONB conventions, RLS policies, Storage rules

On-demand procedural guidance lives in `.claude/skills/`:

- `etl-engine/SKILL.md` — Building transformation functions and pipeline stages
- `architecture-review/SKILL.md` — Cross-layer consistency and constraint verification
- `frontend-ui/SKILL.md` — Building mapping UIs, preview tables, and job dashboards
- `data-modeling/SKILL.md` — Designing JSONB schemas and relational metadata tables
