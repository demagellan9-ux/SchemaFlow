import { apiFetch } from "@/lib/api/client";
import type { Upload, UploadListResponse, PresignResponse } from "@/types/upload";

export async function presignUpload(params: {
  project_id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
}): Promise<PresignResponse> {
  return apiFetch<PresignResponse>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function confirmUpload(params: {
  upload_id: string;
  storage_path: string;
}): Promise<Upload> {
  return apiFetch<Upload>("/uploads/confirm", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listUploads(projectId: string, cursor?: string): Promise<UploadListResponse> {
  const params = new URLSearchParams({ project_id: projectId });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<UploadListResponse>(`/uploads?${params}`);
}

export async function getUpload(uploadId: string): Promise<Upload> {
  return apiFetch<Upload>(`/uploads/${uploadId}`);
}
