# Skill: ETL Engine Development

Invoke this skill when: building new transformation functions, adding pipeline stages, debugging parsing issues, extending the type profiler, or modifying the transformation registry.

---

## Transformation Function Checklist

Before writing a new transformation function, verify:

- [ ] The function is **pure** — no I/O, no global state, no external calls.
- [ ] It accepts `(col: str, params: dict) -> pl.Expr` and nothing else.
- [ ] It validates its own `params` at the top (raise `ValueError` with a clear message on invalid config).
- [ ] It has a unit test in `etl/tests/unit/transformation/test_<name>.py`.
- [ ] It is registered in `etl/engine/transformation/registry.py`.
- [ ] Its name in the registry matches the string key used in the JSONB config.

### Template

```python
# etl/engine/transformation/functions/my_transform.py
import polars as pl


def my_transform(col: str, params: dict) -> pl.Expr:
    """
    Params:
        required_param (str): description
        optional_param (int): description. Default: 0.
    """
    required = params.get("required_param")
    if required is None:
        raise ValueError("my_transform requires 'required_param'")

    optional = params.get("optional_param", 0)

    return pl.col(col)  # replace with actual expression
```

### Registering in registry.py

```python
# etl/engine/transformation/registry.py
from .functions.trim import trim
from .functions.cast import cast
from .functions.my_transform import my_transform

REGISTRY: dict[str, Callable] = {
    "trim": trim,
    "cast": cast,
    "my_transform": my_transform,
}


def get_transform(name: str) -> Callable:
    if name not in REGISTRY:
        raise KeyError(f"Unknown transformation: '{name}'. Available: {list(REGISTRY)}")
    return REGISTRY[name]
```

---

## Adding a Pipeline Stage

The pipeline in `etl/jobs/runner.py` is a sequential list of stage functions. Each stage receives the current `pl.LazyFrame` and the job config, and returns a new `pl.LazyFrame`.

```python
# Stage contract
def my_stage(lf: pl.LazyFrame, config: JobConfig) -> pl.LazyFrame:
    # Transform and return — never collect here
    return lf.with_columns(...)
```

Stages are composed in `runner.py`:

```python
PIPELINE_STAGES = [
    ingest_stage,
    detect_headers_stage,
    profile_stage,        # operates on 100-row slice
    map_columns_stage,
    apply_transforms_stage,
    validate_stage,
    export_stage,
]

for stage in PIPELINE_STAGES:
    lf = stage(lf, config)
    progress.emit(stage.__name__)
```

**Rules:**
- Never `.collect()` between stages except at `export_stage`.
- Each stage must be independently unit-testable with a mock `LazyFrame`.
- Add the stage to `PIPELINE_STAGES` in runner.py — no other wiring needed.

---

## Streaming XLSX Files (OpenPyXL)

For files over 1MB, always use read-only streaming mode:

```python
from openpyxl import load_workbook

wb = load_workbook(filename=file_path, read_only=True, data_only=True)
ws = wb[sheet_name]

rows = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    rows.append(row)
    if i >= 99:  # structural slice: first 100 rows only
        break

wb.close()  # critical — releases file handle and memory
```

Never call `ws.values` or `list(ws.iter_rows(...))` without a row limit on unknown file sizes.

---

## Header Detection Heuristic

The header detector scores candidate rows using these signals:

| Signal | Score |
|---|---|
| Row contains all strings (no numerics) | +3 |
| All cells non-empty | +2 |
| Values are unique within the row | +2 |
| Row immediately precedes rows with mixed types | +1 |
| Row index is 0–5 | +1 |

The row with the highest score is selected as the header. Ties break on lower row index.

To add a new signal, add a scoring function to `etl/engine/profiling/header_detector.py` that returns an integer delta and register it in the `SIGNALS` list.

---

## Type Inference Priority

Applied in order — first type that satisfies ≥95% of non-null values wins:

```python
TYPE_CHECKS = [
    ("boolean", is_boolean),   # "true"/"false", "yes"/"no", "1"/"0"
    ("integer", is_integer),
    ("float",   is_float),
    ("date",    is_date),      # tries ISO 8601, common locale formats
    ("string",  lambda _: True),  # always matches — final fallback
]
```

Date parsing uses `dateutil.parser.parse` with `dayfirst=False`. On ambiguous dates, default to ISO 8601 interpretation and record the format pattern detected.

---

## RapidFuzz Column Matching

```python
from rapidfuzz import process, fuzz
from etl.engine.mapping.scoring import normalize_col_name

def match_columns(
    source_cols: list[str],
    dest_cols: list[str],
    threshold: int = 60,
) -> dict[str, str | None]:
    normalized_dest = {normalize_col_name(d): d for d in dest_cols}
    results = {}

    for src in source_cols:
        norm_src = normalize_col_name(src)
        match = process.extractOne(
            norm_src,
            list(normalized_dest.keys()),
            scorer=fuzz.token_sort_ratio,
            score_cutoff=threshold,
        )
        results[src] = normalized_dest[match[0]] if match else None

    return results
```

`normalize_col_name`: lowercase, strip leading/trailing whitespace, replace non-alphanumeric with single space, collapse multiple spaces.

---

## Writing Unit Tests for Transformation Functions

```python
# etl/tests/unit/transformation/test_trim.py
import polars as pl
from etl.engine.transformation.functions.trim import trim


def test_trim_removes_whitespace():
    lf = pl.LazyFrame({"col": ["  hello  ", " world", "no_spaces"]})
    expr = trim("col", {})
    result = lf.select(expr.alias("col")).collect()
    assert result["col"].to_list() == ["hello", "world", "no_spaces"]


def test_trim_handles_nulls():
    lf = pl.LazyFrame({"col": [None, "  x  "]})
    expr = trim("col", {})
    result = lf.select(expr.alias("col")).collect()
    assert result["col"][0] is None
```

Every function test must cover: happy path, null handling, and invalid params (expect `ValueError`).

---

## Memory Wipe Between Files

In the job runner, explicitly delete references after each file:

```python
for file_config in job_config.files:
    try:
        lf = run_pipeline(file_config, job_config)
        lf = None          # release LazyFrame reference
        del lf
    except Exception as exc:
        progress.emit_error(file_config.upload_id, exc)
    finally:
        import gc
        gc.collect()       # force collection between large files
```
