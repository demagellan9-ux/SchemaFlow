"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

// TODO: Replace fetch calls with typed API client functions from lib/api/
export function useFileUpload(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Request presigned URL from FastAPI via Next.js proxy
      const presignRes = await fetch("/api/v1/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, filename: file.name, size: file.size }),
      });
      if (!presignRes.ok) throw new Error("Failed to get presigned URL");
      const { upload_id, presigned_url } = await presignRes.json();

      // Step 2: PUT file binary directly to Supabase Storage
      const putRes = await fetch(presigned_url, { method: "PUT", body: file });
      if (!putRes.ok) throw new Error("Storage upload failed");

      // Step 3: Confirm upload to trigger structural slice extraction
      const confirmRes = await fetch(`/api/v1/uploads/${upload_id}/confirm`, { method: "POST" });
      if (!confirmRes.ok) throw new Error("Upload confirmation failed");

      return upload_id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads", projectId] });
    },
  });
}
