"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Upload } from "@/types/upload";

const columns: ColumnDef<Upload>[] = [
  {
    accessorKey: "filename",
    header: "File",
    cell: ({ getValue }) => (
      <span className="font-medium text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "size_bytes",
    header: "Size",
    cell: ({ getValue }) => {
      const bytes = getValue<number | null>();
      if (!bytes) return <span className="text-muted-foreground text-sm">—</span>;
      const kb = bytes / 1024;
      return (
        <span className="text-sm">
          {kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue<Upload["status"]>()} />,
  },
  {
    accessorKey: "created_at",
    header: "Uploaded",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(getValue<string>()).toLocaleString()}
      </span>
    ),
  },
];

interface Props {
  uploads: Upload[];
  isLoading?: boolean;
}

export function UploadTable({ uploads, isLoading }: Props) {
  return (
    <DataTable
      columns={columns}
      data={uploads}
      loading={isLoading}
      emptyTitle="No files yet"
      emptyDescription="Upload a CSV or XLSX file to get started."
    />
  );
}
