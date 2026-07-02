# ETL Layer — SchemaFlow

> Global rules are in the root `CLAUDE.md`. This file adds ETL-engine-specific guidance only.
> For detailed procedural guidance on building transformation functions or pipeline stages, invoke `.claude/skills/etl-engine/SKILL.md`.

---

## Responsibilities

The ETL engine owns:
- Streaming spreadsheet ingestion from Supabase Storage
- Worksheet and table detection
- Header row inference
- Column type profiling (primitive inference only — no domain semantics)
- Source-to-destination column matching (RapidFuzz string distance)
- Transformation execution (functional registry pattern)
- Data validation against destination schema rules
- Output serialization and export to Supabase Storage

The ETL engine **never**:
- Makes UI decisions
- Stores job state (it reports status back to FastAPI via callback)
- Contains hardcoded column names, business rules, or domain mappings

---

## Project Structure

```
etl/
  engine/
    ingestion/
      reader.py           # Streams files from Storage; dispatches to format parsers
      xlsx_parser.py      # OpenPyXL-based XLSX streaming parser
      csv_parser.py       # CSV streaming parser
    profiling/
      header_detector.py  # Heuristic header-row detection
      type_inferrer.py    # Primitive type inference (string, integer, float, date, boolean)
      column_profiler.py  # Null rate, cardinality, sample values per column
    mapping/
      matcher.py          # RapidFuzz-based source→destination column matching
      scoring.py          # Confidence score normalization (0–100)
    transformation/
      registry.py         # Transformation function registry (loads by name from config)
      functions/          # One module per transformation function
        trim.py
        cast.py
        regex_extract.py
        date_format.py
        fill_null.py
    validation/
      rule_engine.py      # Applies validation rules from metadata config
      report.py           # Builds per-row, per-column validation reports
    export/
      serializer.py       # Converts Polars DataFrame to target format (CSV, XLSX)
      uploader.py         # Streams output to Supabase Storage
  jobs/
    runner.py             # Entry point: receives job config, runs pipeline stages
    progress.py           # Emits progress callbacks to FastAPI
  tests/
    fixtures/             # Sample XLSX and CSV files for tests
    unit/
    integration/
```

---

## Memory Safety — Critical Rules

- **Never load multiple files concurrently.** Iterate files sequentially within a job. Wipe all references to a file's DataFrame before loading the next.
- **Stream, don't buffer.** Use OpenPyXL's `read_only=True` mode for XLSX. Never call `.values` on a full worksheet at once for files over 1MB.
- **Use Polars LazyFrames** for all transformation chains. Only call `.collect()` at the final export stage.
- **Chunk exports.** Write output files in chunks of ≤ 10,000 rows when serializing to XLSX.

---

## Polars Usage

- Use `pl.LazyFrame` for all intermediate pipeline stages.
- Apply transformations as expression chains (`.with_columns(...)`) — never iterate rows with Python loops.
- Cast types using Polars native dtypes (`pl.Int64`, `pl.Utf8`, `pl.Date`, etc.) — never Python built-ins.
- Use `pl.Expr` objects returned from transformation functions; compose them in the registry, not in individual functions.

---

## Transformation Registry Pattern

Transformation functions follow a strict contract:

```python
# Each function returns a Polars expression, not a value.
def trim(col: str, params: dict) -> pl.Expr:
    return pl.col(col).str.strip_chars()

def cast(col: str, params: dict) -> pl.Expr:
    target_type = DTYPE_MAP[params["to"]]
    return pl.col(col).cast(target_type)
```

- The registry loads functions by name from the metadata config.
- Functions are **pure** — no I/O, no global state, no side effects.
- The `params` dict is always the raw JSONB config from the database — functions must validate their own params.
- New transformation types are added by creating a new module in `transformation/functions/` and registering it in `registry.py`. No other files change.

---

## Column Matching

- Use `rapidfuzz.process.extractOne` with `scorer=rapidfuzz.fuzz.token_sort_ratio`.
- Matches below a configurable threshold (default 60) are returned as `None` (unmatched) — never force-mapped.
- The matcher returns a scored list; the final mapping decision is always the user's. Auto-match is a suggestion, not an action.
- Column names are normalized (lowercased, punctuation stripped) before matching. Normalization is a pure function in `mapping/scoring.py`.

---

## Type Profiling Rules

- Infer the **most specific** primitive type that fits 95%+ of non-null values in the sample.
- Types in priority order: `boolean` → `integer` → `float` → `date` → `string`.
- Profiling operates on the 100-row structural slice only — never on the full dataset.
- Profile results are stored as JSONB in the database. The ETL engine reads them back during full processing to apply pre-agreed casts.

---

## Validation

- Validation rules are defined as metadata (stored in the `transformations` table as JSONB).
- Rule types: `required`, `type_check`, `regex_match`, `range`, `allowed_values`.
- The rule engine produces a per-row error report, not a single pass/fail. Failed rows are written to a separate error output file.
- Validation never mutates data — it only annotates.

---

## Error Handling

- Each file in a batch is wrapped in a `try/except` block. Exceptions are caught, serialized, and reported via the progress callback. Processing continues with the next file.
- Transformation errors on individual rows are recorded in the validation report and do not abort the pipeline.
- All exceptions include the file name, stage name, and row index (where applicable).

---

## Testing

- Unit tests cover individual transformation functions with fixed inputs and expected `pl.Expr` outputs evaluated against small in-memory DataFrames.
- Integration tests run the full pipeline against fixture files in `tests/fixtures/`.
- No test may call Supabase Storage directly — use a local file path fixture and a mocked uploader.
