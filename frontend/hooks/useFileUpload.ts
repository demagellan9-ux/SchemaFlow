"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { presignUpload, confirmUpload } from "@/lib/api/uploads";

export function useFileUpload(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { upload_id, presigned_url } = await presignUpload({
        project_id: projectId,
        filename: file.name,
        size_bytes: file.size,
        content_type: file.type || "application/octet-stream",
      });

      const putRes = await fetch(presigned_url, { method: "PUT", body: file });
      if (!putRes.ok) throw new Error("Storage upload failed");

      const upload = await confirmUpload({ upload_id, storage_path: presigned_url });
      return upload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads", projectId] });
    },
  });
}
