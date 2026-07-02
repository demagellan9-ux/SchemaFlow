"use client";

import { useQuery } from "@tanstack/react-query";
import { listUploads, getUpload } from "@/lib/api/uploads";

export function useUploads(projectId: string) {
  return useQuery({
    queryKey: ["uploads", projectId],
    queryFn: () => listUploads(projectId),
    enabled: !!projectId,
  });
}

export function useUpload(uploadId: string) {
  return useQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => getUpload(uploadId),
    enabled: !!uploadId,
  });
}
