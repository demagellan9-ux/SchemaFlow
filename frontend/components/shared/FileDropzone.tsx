"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FileDropzoneProps {
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  className?: string;
  // Phase 7: onFiles will wire into useFileUpload mutation
  onFiles?: (files: File[]) => void;
}

export function FileDropzone({
  accept = ".xlsx,.xls,.csv",
  maxSizeMb = 30,
  disabled = false,
  className,
  onFiles,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !onFiles) return;
    const valid = Array.from(files).filter((f) => f.size <= maxSizeMb * 1024 * 1024);
    if (valid.length) onFiles(valid);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-primary/50 hover:bg-muted/30",
        className
      )}
    >
      <Upload className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">Drop files here or click to browse</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {accept.toUpperCase().replace(/\./g, "").replace(/,/g, ", ")} &mdash; max {maxSizeMb}MB per file
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
