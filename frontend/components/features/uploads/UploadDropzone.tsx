"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useToast } from "@/hooks/useToast";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/types/upload";

interface Props {
  projectId: string;
  onUploaded?: () => void;
}

export function UploadDropzone({ projectId, onUploaded }: Props) {
  const { toast } = useToast();
  const upload = useFileUpload(projectId);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await upload.mutateAsync(file);
        successCount++;
      } catch {
        failCount++;
        toast({
          title: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast({
        title: `${successCount} file${successCount > 1 ? "s" : ""} uploaded`,
        description: failCount > 0 ? `${failCount} failed` : undefined,
      });
      onUploaded?.();
    }
  }

  return (
    <FileDropzone
      accept={ALLOWED_EXTENSIONS.join(",")}
      maxSizeMb={MAX_FILE_SIZE_BYTES / (1024 * 1024)}
      disabled={uploading}
      onFiles={handleFiles}
    />
  );
}
