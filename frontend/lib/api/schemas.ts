import { apiFetch } from "@/lib/api/client";
import type { Schema, SchemaListResponse, CreateSchemaInput } from "@/types/schema";

export async function listSchemas(projectId: string, cursor?: string): Promise<SchemaListResponse> {
  const params = new URLSearchParams({ project_id: projectId });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<SchemaListResponse>(`/schemas?${params}`);
}

export async function getSchema(schemaId: string): Promise<Schema> {
  return apiFetch<Schema>(`/schemas/${schemaId}`);
}

export async function createSchema(input: CreateSchemaInput & { project_id: string }): Promise<Schema> {
  return apiFetch<Schema>("/schemas", { method: "POST", body: JSON.stringify(input) });
}

export async function deleteSchema(schemaId: string): Promise<void> {
  return apiFetch<void>(`/schemas/${schemaId}`, { method: "DELETE" });
}
