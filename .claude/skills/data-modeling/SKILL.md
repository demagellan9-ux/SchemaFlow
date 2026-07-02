# Skill: Data Modeling

Invoke this skill when: designing or modifying database tables, defining JSONB column structures, writing migrations, planning schema extensions, or auditing existing models for correctness.

---

## Core Table Definitions

### Reference Schema

```sql
-- users (mirrors auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- uploads
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,        -- Supabase Storage object path
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | sliced | mapped | error
  slice_data JSONB,                  -- { version, columns, rows[100], profile }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- schemas (destination schema definition)
CREATE TABLE schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  definition JSONB NOT NULL,         -- SchemaDefinition (see below)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- mappings (source→destination per upload)
CREATE TABLE mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  schema_id UUID NOT NULL REFERENCES schemas(id),
  user_id UUID NOT NULL REFERENCES users(id),
  mapping_data JSONB NOT NULL,       -- MappingData (see below)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- transformations (ordered rules per destination column)
CREATE TABLE transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  dest_column TEXT NOT NULL,
  rules JSONB NOT NULL,              -- TransformationRuleSet (see below)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  schema_id UUID NOT NULL REFERENCES schemas(id),
  status TEXT NOT NULL DEFAULT 'queued',  -- queued | running | completed | completed_with_errors | failed
  output_path TEXT,                  -- Storage path of export file (null until complete)
  errors JSONB,                      -- { files: [{ upload_id, stage, message }] }
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- job_files (per-file status within a batch)
CREATE TABLE job_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES uploads(id),
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  error_detail TEXT,
  rows_processed INTEGER,
  rows_failed INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## JSONB Type Specifications

### `schemas.definition` → `SchemaDefinition`

```typescript
type SchemaDefinition = {
  version: number;                   // increment on breaking structural changes
  columns: DestinationColumn[];
};

type DestinationColumn = {
  name: string;                      // unique within schema
  display_name?: string;
  type: "string" | "integer" | "float" | "date" | "boolean";
  nullable: boolean;
  date_format?: string;              // e.g. "YYYY-MM-DD" — only for type=date
  validation_rules?: ValidationRule[];
};

type ValidationRule = {
  type: "required" | "regex_match" | "range" | "allowed_values" | "type_check";
  params: Record<string, unknown>;   // rule-type-specific params
};
```

### `uploads.slice_data` → `SliceData`

```typescript
type SliceData = {
  version: number;
  worksheet: string;
  header_row_index: number;
  columns: SourceColumn[];
  rows: Record<string, unknown>[];   // max 100 rows
};

type SourceColumn = {
  name: string;
  inferred_type: "string" | "integer" | "float" | "date" | "boolean";
  null_rate: number;                 // 0.0–1.0
  sample_values: unknown[];          // up to 5 non-null samples
  cardinality_estimate: number | null;
};
```

### `mappings.mapping_data` → `MappingData`

```typescript
type MappingData = {
  version: number;
  entries: MappingEntry[];
};

type MappingEntry = {
  source_col: string;
  dest_col: string | null;           // null = explicitly unmapped
  confidence: number;                // 0–100
  user_confirmed: boolean;
};
```

### `transformations.rules` → `TransformationRuleSet`

```typescript
type TransformationRuleSet = {
  version: number;
  rules: TransformationRule[];       // ordered; executed in array order
};

type TransformationRule = {
  id: string;                        // uuid
  type: string;                      // matches ETL registry key
  params: Record<string, unknown>;
  order: number;                     // redundant with array index; kept for UI stability
};
```

### `jobs.errors` → `JobErrors`

```typescript
type JobErrors = {
  files: FileError[];
};

type FileError = {
  upload_id: string;
  filename: string;
  stage: string;                     // e.g. "map_columns_stage", "validate_stage"
  message: string;
  row_index?: number;                // null for stage-level errors
};
```

---

## Migration Authoring Guide

### File Naming

```
supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

Example: `20240915143022_add_job_files_table.sql`

### Template

```sql
-- Migration: add_job_files_table
-- Adds per-file tracking within batch jobs.
-- Rollback: DROP TABLE job_files;

CREATE TABLE job_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES uploads(id),
  status TEXT NOT NULL DEFAULT 'pending',
  error_detail TEXT,
  rows_processed INTEGER,
  rows_failed INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX job_files_job_id_idx ON job_files (job_id);
CREATE INDEX job_files_status_idx ON job_files (status)
  WHERE status IN ('pending', 'running');

-- RLS
ALTER TABLE job_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_job_files" ON job_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_files.job_id
        AND jobs.user_id = auth.uid()
    )
  );

-- Updated-at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON job_files
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### Migration Rules (repeated for in-skill reference)

1. **Additive only in production.** Add columns as nullable; never remove without a multi-phase plan.
2. **Include a rollback comment** — one line at the top describing how to manually reverse.
3. **Every new table** needs: RLS enabled, at least one policy, an `updated_at` trigger, and indexes on all FK columns.
4. **JSONB `version` bumps** are not DDL — handle in application code when reading/writing the column.

---

## JSONB Query Patterns

### Read a nested field

```sql
SELECT definition->'columns'->0->>'name' AS first_col_name
FROM schemas
WHERE id = $1;
```

### Filter by JSONB field (avoid on hot paths — prefer denormalized typed column)

```sql
SELECT * FROM uploads
WHERE slice_data->>'worksheet' = 'Sheet1';
```

### Append to a JSONB array

```sql
UPDATE transformations
SET rules = jsonb_set(
  rules,
  '{rules}',
  (rules->'rules') || $1::jsonb
)
WHERE id = $2;
```

### Update a versioned JSONB object

```sql
UPDATE schemas
SET definition = definition || jsonb_build_object(
  'version', (definition->>'version')::int + 1,
  'columns', $1::jsonb
)
WHERE id = $2;
```

---

## Denormalization Decision Guide

| Ask | Answer |
|---|---|
| Is this field queried in WHERE clauses? | Add a typed column alongside the JSONB |
| Is this field needed for ordering or indexing? | Must be a typed column |
| Is this field part of a stable, predictable structure? | Typed column preferred |
| Is this field part of user-defined, variable structure? | JSONB |
| Is this field queried rarely (e.g., only during job execution)? | JSONB is fine |

When in doubt: if the query planner will touch this field, put it in a typed column. If application code reads it after a known lookup, JSONB is acceptable.

---

## `updated_at` Trigger (one-time setup)

```sql
-- Run once per Supabase project
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Apply to each table individually
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON <table_name>
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```
