import { apiFetch } from "@/lib/api/client";
import type { Mapping, AutoMapResponse, SaveMappingRequest } from "@/types/mapping";

export async function getMapping(uploadId: string): Promise<Mapping> {
  return apiFetch<Mapping>(`/mappings/${uploadId}`);
}

export async function saveMapping(req: SaveMappingRequest): Promise<Mapping> {
  return apiFetch<Mapping>(`/mappings/${req.upload_id}`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

export async function autoMap(uploadId: string, schemaId: string): Promise<AutoMapResponse> {
  return apiFetch<AutoMapResponse>("/mappings/auto-map", {
    method: "POST",
    body: JSON.stringify({ upload_id: uploadId, schema_id: schemaId }),
  });
}
