# ETL Workflow

## Pipeline Stages

Each file in a batch passes through these stages sequentially. A stage failure on one file does not abort the batch.

```
[1] Ingest          Download from Storage → parse into LazyFrame (streaming, read_only)
[2] Profile         Detect header row → infer column types → compute null rates (100-row slice)
[3] Map             Apply user-confirmed source→destination column mappings
[4] Transform       Apply ordered transformation rules from metadata config via registry
[5] Validate        Apply validation rules; annotate error rows; split valid/error sets
[6] Export          Serialize → chunk write → stream to Supabase Storage exports bucket
```

## Transformation Registry

Transformations are pure functions registered by name:

| Key | Function | Params |
|---|---|---|
| `trim` | Strip whitespace | _(none)_ |
| `cast` | Type cast | `{ to: "string" \| "integer" \| "float" \| "date" \| "boolean" }` |
| `fill_null` | Replace nulls | `{ value: <scalar> }` |
| `regex_extract` | Regex capture | `{ pattern, group_index }` |
| `date_format` | Reformat dates | `{ from_format, to_format }` |

New types: add module to `etl/engine/transformation/functions/`, register in `registry.py`.

## Column Matching

RapidFuzz `token_sort_ratio` on normalized column names. Default threshold: 60/100.
Matches below threshold return `null` — never force-mapped. Auto-match is a suggestion only.

## Type Inference Priority

`boolean` → `integer` → `float` → `date` → `string`

A type is accepted when ≥95% of non-null sample values match. Profiling runs on the 100-row structural slice only.

## Memory Safety

- Files processed sequentially; `gc.collect()` between files
- LazyFrame pipeline — `collect()` called once at export
- OpenPyXL `read_only=True` + row limit for XLSX
- XLSX export chunked at ≤10,000 rows

## Job States

```
queued → running → completed
                 → completed_with_errors  (partial success; per-file errors in JSONB)
                 → failed                 (all files failed or pipeline-level error)
```
