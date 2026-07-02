// Mirrors FastAPI UploadResponse and related models

export type UploadStatus = "pending" | "sliced" | "error";

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
  rows: Record<string, unknown>[];  // max 100 rows — enforced by API
};

export type Upload = {
  id: string;
  project_id: string;
  user_id: string;
  original_filename: string;
  filename: string;
  file_extension: string | null;
  size_bytes: number | null;
  status: UploadStatus;
  slice_data: SliceData | null;
  created_at: string;
  updated_at: string;
};

export type UploadListResponse = {
  items: Upload[];
  next_cursor: string | null;
};

export type PresignResponse = {
  upload_id: string;
  presigned_url: string;
  storage_path: string;
  expires_in: number;
};
