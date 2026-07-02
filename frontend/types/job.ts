// Mirrors FastAPI JobResponse and CreateJobRequest models

export type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed";

export type FileError = {
  upload_id: string;
  filename: string;
  stage: string;
  message: string;
  row_index?: number;
};

export type Job = {
  id: string;
  project_id: string;
  user_id: string;
  schema_id: string;
  status: JobStatus;
  output_path: string | null;
  errors: { files: FileError[] } | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateJobRequest = {
  project_id: string;
  schema_id: string;
  upload_ids: string[];
};
