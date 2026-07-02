# SchemaFlow — ETL Engine

Python ETL engine. Parses spreadsheets, profiles columns, matches source to destination schemas, applies configurable transformations, validates data, and exports standardized output.

## Stack

- **Language:** Python 3.11+
- **DataFrames:** Polars (LazyFrame pipeline)
- **XLSX parsing:** OpenPyXL (read-only streaming mode)
- **Column matching:** RapidFuzz
- **Date parsing:** python-dateutil

## Key Constraints

- **Never load multiple files concurrently.** Process sequentially; `gc.collect()` between files.
- **LazyFrames only** — `collect()` is called once at export.
- **Structural slice:** profiling uses first 100 rows only.
- **No domain logic** — transformation functions are generic; rules come from metadata config.

## Running

```bash
pip install -r requirements.txt
python -m pytest tests/
```

## Entry Point

`pipeline.py` → `run_job(config: JobConfig)` — receives a job config from the FastAPI dispatcher.

## Adding a Transformation

1. Create `engine/transformation/functions/<name>.py` implementing `(col, params) -> pl.Expr`.
2. Register it in `engine/transformation/registry.py`.
3. Add a unit test in `tests/unit/transformation/`.

See `.claude/skills/etl-engine/SKILL.md` for the full template and checklist.
