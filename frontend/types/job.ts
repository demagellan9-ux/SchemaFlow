// Mirrors FastAPI JobResponse, JobFileResponse, ExportResponse, CreateJobRequest

export type JobStatus = "queued" | "running" | "completed" | "completed_with_errors" | "failed";

export type ExportStatus = "pending" | "available" | "expired" | "error";

export type FileError = {
  upload_id: string;
  filename: string;
  stage: string;
  message: string;
  row_index?: number | null;
};

export type Job = {
  id: string;
  project_id: string;
  user_id: string;
  schema_id: string;
  status: JobStatus;
  total_files: number;
  completed_files: number;
  failed_files: number;
  errors: { files: FileError[] } | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobFile = {
  id: string;
  job_id: string;
  upload_id: string;
  status: "pending" | "running" | "completed" | "failed";
  rows_processed: number | null;
  rows_failed: number | null;
  error_detail: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Export = {
  id: string;
  job_id: string;
  user_id: string;
  format: "csv" | "xlsx";
  size_bytes: number | null;
  row_count: number | null;
  status: ExportStatus;
  download_url: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobListResponse = {
  items: Job[];
  next_cursor: string | null;
};

export type CreateJobRequest = {
  project_id: string;
  schema_id: string;
  upload_ids: string[];
};

export type CreateExportRequest = {
  job_id: string;
  format: "csv" | "xlsx";
};
