// =============================================================================
// SchemaFlow — Supabase JSONB Type Specifications
// Cross-layer reference for JSONB column shapes.
// These are TypeScript type aliases — not runtime code.
// Imported by frontend/types/ and referenced by backend Pydantic models.
// =============================================================================

// ---------------------------------------------------------------------------
// uploads.slice_data
// ---------------------------------------------------------------------------
export type ColumnType = "string" | "integer" | "float" | "date" | "boolean";

export type SourceColumn = {
  name: string;
  inferred_type: ColumnType;
  null_rate: number;              // 0.0–1.0
  sample_values: unknown[];       // up to 5 non-null representative values
  cardinality_estimate: number | null;
};

export type SliceData = {
  version: number;                // bump when shape changes incompatibly
  worksheet: string;              // name of the worksheet parsed
  header_row_index: number;       // 0-indexed row that was detected as header
  columns: SourceColumn[];
  rows: Record<string, unknown>[]; // max 100 rows — never the full dataset
};

// ---------------------------------------------------------------------------
// schemas.definition
// ---------------------------------------------------------------------------
export type ValidationRuleType =
  | "required"
  | "regex_match"
  | "range"
  | "allowed_values"
  | "type_check";

export type ValidationRule = {
  type: ValidationRuleType;
  params: Record<string, unknown>;  // rule-specific; validated by ETL rule_engine
};

export type DestinationColumn = {
  name: string;                   // unique within the schema; used as output column name
  display_name?: string;          // human-readable label for UI
  type: ColumnType;
  nullable: boolean;
  date_format?: string;           // ISO 8601 format string — only when type = "date"
  validation_rules?: ValidationRule[];
};

export type SchemaDefinition = {
  version: number;
  columns: DestinationColumn[];
};

// ---------------------------------------------------------------------------
// mappings.mapping_data
// ---------------------------------------------------------------------------
export type MappingEntry = {
  source_col: string;             // column name from the source file
  dest_col: string | null;        // null = explicitly unmapped
  confidence: number;             // 0–100; from RapidFuzz token_sort_ratio
  user_confirmed: boolean;        // true after user explicitly acts on this mapping
};

export type MappingData = {
  version: number;
  entries: MappingEntry[];
};

// ---------------------------------------------------------------------------
// transformations.rules
// ---------------------------------------------------------------------------
export type TransformationRule = {
  id: string;                     // client-generated UUID; stable across reorders
  type: string;                   // matches ETL registry key (e.g. "trim", "cast")
  params: Record<string, unknown>; // passed as-is to the transformation function
  order: number;                  // 0-indexed execution order; matches array index
};

export type TransformationRuleSet = {
  version: number;
  rules: TransformationRule[];    // ordered; executed in array order by ETL engine
};

// ---------------------------------------------------------------------------
// jobs.errors
// ---------------------------------------------------------------------------
export type FileError = {
  upload_id: string;
  filename: string;
  stage: string;                  // pipeline stage that raised the error
  message: string;
  row_index?: number;             // null for stage-level (non-row) errors
};

export type JobErrors = {
  files: FileError[];
};

// ---------------------------------------------------------------------------
// audit_logs.payload
// ---------------------------------------------------------------------------
export type AuditPayload = {
  before?: Record<string, unknown>; // previous state snapshot (for update events)
  after?: Record<string, unknown>;  // new state snapshot
  metadata?: Record<string, unknown>; // additional event context
};
