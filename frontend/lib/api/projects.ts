import { apiFetch } from "@/lib/api/client";
import type {
  Project,
  ProjectListResponse,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types/project";

export async function listProjects(cursor?: string): Promise<ProjectListResponse> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<ProjectListResponse>(`/projects${params}`);
}

export async function getProject(projectId: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${projectId}`);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
  return apiFetch<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, { method: "DELETE" });
}
