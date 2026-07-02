# Skill: Architecture Review

Invoke this skill when: reviewing a PR, auditing a new feature for constraint violations, assessing whether a proposed design fits SchemaFlow's architecture, or debugging a cross-layer issue.

---

## Review Checklist

Run through each section in order. Flag any violation with the layer, file, and line number.

---

### 1. Domain-Agnostic Verification

Search for hardcoded business domain terms. **Any match is a violation.**

```bash
# Run from repo root
grep -rn --include="*.py" --include="*.ts" --include="*.tsx" \
  -iE "(employee|agent|qa|attendance|kpi|program|vendor|invoice|payroll|headcount)" \
  frontend/ backend/ etl/
```

Expected result: zero matches. If matches exist, replace with generic metadata-driven equivalents (e.g., `column_name`, `record`, `entry`, `destination_field`).

---

### 2. Layer Responsibility Violations

#### Frontend must not:
- Import from `etl/` or `backend/`
- Parse file contents (no `FileReader` → binary parsing, no XLSX/CSV parsing in JS)
- Write directly to Supabase tables (use FastAPI endpoints)
- Render more than 100 rows in any table

```bash
grep -rn --include="*.ts" --include="*.tsx" \
  -E "(xlsx|csv-parse|papaparse|SheetJS|read_only|OpenPyXL)" frontend/
```

#### Backend must not:
- Import Polars, OpenPyXL, or RapidFuzz
- Contain transformation logic inline in route handlers
- Execute spreadsheet parsing

```bash
grep -rn --include="*.py" \
  -E "(import polars|import openpyxl|from rapidfuzz|\.parse_xlsx|\.parse_csv)" backend/
```

#### ETL must not:
- Make HTTP calls to the frontend
- Update job status directly in Supabase (use progress callbacks to FastAPI)
- Contain hardcoded column names or mapping rules

```bash
grep -rn --include="*.py" \
  -E "(employee_id|agent_name|attendance_date|program_code)" etl/
```

---

### 3. API Contract Integrity

For every FastAPI route:
- [ ] Has `response_model` declared
- [ ] Request body is a typed Pydantic model (not raw `dict` or `Any`)
- [ ] A corresponding TypeScript type exists in `frontend/types/`
- [ ] HTTP status code is semantically correct

```bash
# Find routes missing response_model
grep -n "@app\.\|@router\." backend/app/api/v1/routes/*.py | \
  grep -v "response_model"
```

---

### 4. JSONB Schema Versioning

For every JSONB column introduced or modified:
- [ ] A `version` field exists at the top level of the JSONB object
- [ ] The corresponding TypeScript type is documented in `supabase/types/`
- [ ] Any breaking change increments the version number

```bash
grep -rn "jsonb" supabase/migrations/ | \
  grep -v "version"
```

---

### 5. Memory Safety

In the ETL layer:
- [ ] No `list(ws.iter_rows(...))` calls without a row limit
- [ ] No concurrent file loading (no `asyncio.gather` over multiple file pipelines)
- [ ] `.collect()` is called only in `export_stage`, not in intermediate stages
- [ ] `gc.collect()` is called between files in the batch loop

```bash
grep -n "\.collect()" etl/engine/ | grep -v "export_stage\|test_"
grep -n "iter_rows" etl/engine/ingestion/ | grep -v "if i >="
```

---

### 6. RLS Coverage

Every table in Supabase must have RLS enabled and at least one policy:

```sql
-- Run in Supabase SQL editor
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  );
```

Expected result: empty. Any table listed here is missing RLS policies.

---

### 7. Migration Safety

For each migration file:
- [ ] Is additive (no `DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN TYPE` without fallback)
- [ ] Has a rollback comment documenting how to reverse it manually if needed
- [ ] Doesn't reference business domain terms

```bash
grep -n "DROP\|RENAME\|ALTER COLUMN" supabase/migrations/*.sql
```

---

### 8. Transformation Registry Completeness

For every transformation type referenced in JSONB configs in the test fixtures:
- [ ] A corresponding function exists in `etl/engine/transformation/functions/`
- [ ] It is registered in `etl/engine/transformation/registry.py`
- [ ] It has a unit test

```bash
# List all transformation types used in fixtures
grep -rh '"type"' etl/tests/fixtures/ | sort -u

# List all registered transformation types
grep "\".*\":" etl/engine/transformation/registry.py | sort
```

Diff the two lists. Any type in fixtures but not in the registry is a gap.

---

## Common Violation Patterns

| Pattern | Violation | Fix |
|---|---|---|
| `const employees = data.filter(...)` in a React component | Domain term in frontend | Rename to `records` or `entries` |
| `pd.read_excel(...)` in `backend/` | Parsing in wrong layer | Move to `etl/engine/ingestion/` |
| `ALTER TABLE uploads ADD COLUMN vendor_id UUID` | DDL for layout variation | Store in uploads JSONB metadata instead |
| `lf.collect()` inside `map_columns_stage` | Premature collect | Remove; keep as LazyFrame expression |
| Supabase client import in a React component | Direct DB access from frontend | Route through FastAPI endpoint |
| `os.environ.get("SECRET")` in ETL code | Config in wrong layer | Use pydantic-settings in backend; pass as job config param to ETL |

---

## Architecture Decision Record Template

When a non-obvious architectural decision is made, document it:

```markdown
## ADR-NNNN: <Title>

**Date:** YYYY-MM-DD
**Status:** Accepted

**Context:**
Why this decision was needed.

**Decision:**
What was decided.

**Consequences:**
What changes as a result. What becomes easier. What becomes harder.

**Constraints preserved:**
List which non-negotiable principles this decision respects.
```

Store ADRs in `docs/architecture/decisions/`.
