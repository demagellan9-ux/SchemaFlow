import { apiFetch } from "@/lib/api/client";
import type {
  Transformation,
  TransformationListResponse,
  TransformationRegistryResponse,
  SaveTransformationRequest,
} from "@/types/transformation";

export async function getTransformationRegistry(): Promise<TransformationRegistryResponse> {
  return apiFetch<TransformationRegistryResponse>("/transformations/registry");
}

export async function listTransformations(schemaId: string): Promise<TransformationListResponse> {
  return apiFetch<TransformationListResponse>(`/transformations?schema_id=${schemaId}`);
}

export async function getTransformation(transformationId: string): Promise<Transformation> {
  return apiFetch<Transformation>(`/transformations/${transformationId}`);
}

export async function saveTransformation(req: SaveTransformationRequest): Promise<Transformation> {
  return apiFetch<Transformation>("/transformations", {
    method: "PUT",
    body: JSON.stringify(req),
  });
}
