import { apiFetch } from "@/lib/api/client";
import type {
  Job,
  JobFile,
  JobListResponse,
  Export,
  CreateJobRequest,
  CreateExportRequest,
} from "@/types/job";

export async function createJob(req: CreateJobRequest): Promise<Job> {
  return apiFetch<Job>("/jobs", { method: "POST", body: JSON.stringify(req) });
}

export async function getJob(jobId: string): Promise<Job> {
  return apiFetch<Job>(`/jobs/${jobId}`);
}

export async function listJobs(projectId: string, cursor?: string): Promise<JobListResponse> {
  const params = new URLSearchParams({ project_id: projectId });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<JobListResponse>(`/jobs?${params}`);
}

export async function listJobFiles(jobId: string): Promise<JobFile[]> {
  return apiFetch<JobFile[]>(`/jobs/${jobId}/files`);
}

export async function createExport(req: CreateExportRequest): Promise<Export> {
  return apiFetch<Export>(`/jobs/${req.job_id}/exports`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getExport(jobId: string, exportId: string): Promise<Export> {
  return apiFetch<Export>(`/jobs/${jobId}/exports/${exportId}`);
}
