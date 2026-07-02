export type UploadStatus = "pending" | "sliced" | "mapped" | "error";

export type SourceColumn = {
  name: string;
  inferred_type: "string" | "integer" | "float" | "date" | "boolean";
  null_rate: number;
  sample_values: unknown[];
  cardinality_estimate: number | null;
};

export type SliceData = {
  version: number;
  worksheet: string;
  header_row_index: number;
  columns: SourceColumn[];
  rows: Record<string, unknown>[];
};

export type Upload = {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  size_bytes: number | null;
  status: UploadStatus;
  slice_data: SliceData | null;
  created_at: string;
  updated_at: string;
};
