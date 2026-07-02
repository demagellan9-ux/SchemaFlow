# Skill: Frontend UI Development

Invoke this skill when: building the column mapper, preview table, job dashboard, file upload flow, transformation rule builder, or any complex UI feature.

---

## File Upload Flow

SchemaFlow uploads files directly to Supabase Storage via a presigned URL — never through FastAPI as a multipart form body.

### Steps

1. **User selects files** — validate client-side (extension, size limit).
2. **Request presigned URL** — `POST /api/v1/uploads/presign` → FastAPI returns `{ upload_id, presigned_url, storage_path }`.
3. **PUT to Supabase Storage** — upload directly using the presigned URL.
4. **Confirm upload** — `POST /api/v1/uploads/{upload_id}/confirm` → triggers structural slice extraction in FastAPI.
5. **Poll for slice** — `GET /api/v1/uploads/{upload_id}/slice` with TanStack Query until `status === "ready"`.

```typescript
// hooks/useFileUpload.ts
export function useFileUpload(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { upload_id, presigned_url } = await api.presignUpload(projectId, {
        filename: file.name,
        size: file.size,
      });

      await fetch(presigned_url, { method: "PUT", body: file });

      await api.confirmUpload(upload_id);
      return upload_id;
    },
    onSuccess: (upload_id) => {
      queryClient.invalidateQueries({ queryKey: ["uploads", projectId] });
    },
  });
}
```

**Never** send the file binary to FastAPI. FastAPI only receives the metadata and confirmation.

---

## Preview Table (100-Row Slice)

Use TanStack Table with the structural slice returned from the API.

```typescript
// components/features/upload/PreviewTable.tsx
"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

interface PreviewTableProps {
  columns: string[];
  rows: Record<string, unknown>[];  // max 100 rows — enforced by API
}

export function PreviewTable({ columns, rows }: PreviewTableProps) {
  const colDefs: ColumnDef<Record<string, unknown>>[] = columns.map((col) => ({
    accessorKey: col,
    header: col,
    size: 150,
    enableResizing: true,
  }));

  const table = useReactTable({
    data: rows,
    columns: colDefs,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b bg-muted/50">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  style={{ width: h.getSize() }}
                  className="px-3 py-2 text-left font-medium"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Column Mapper UI

The mapper displays two panels: source columns (from the uploaded file) and destination columns (from the project schema). Users draw connections between them.

### State Shape

```typescript
// types/mapping.ts
type ColumnMapping = {
  source_col: string;
  dest_col: string | null;    // null = unmapped
  confidence: number;         // 0–100, from RapidFuzz
  user_confirmed: boolean;    // true after user explicitly maps or confirms
};

type MappingState = {
  upload_id: string;
  mappings: ColumnMapping[];
};
```

### UI Rules

- Source columns without a match are shown with a yellow "Unmapped" badge.
- Destination columns without a source are shown with a red "Missing" badge.
- Confidence ≥80: green indicator. 60–79: yellow. <60 (or null): red.
- "Auto-map" button applies the highest-confidence suggestion for all unmapped columns. It sets `user_confirmed: false` — user must still review.
- Clicking a connection line opens an inline override dropdown.
- Mapping state is persisted via `PATCH /api/v1/mappings/{upload_id}` on every change (debounced 500ms).

### Submission

```typescript
const mapping = state.mappings.map(({ source_col, dest_col }) => ({
  source_col,
  dest_col,            // null entries are included — backend validates
}));

await api.saveMappings(upload_id, { mappings: mapping });
```

---

## Transformation Rule Builder

Each destination column can have an ordered chain of transformation rules.

### Rule Shape

```typescript
type TransformationRule = {
  id: string;               // uuid, client-generated
  type: string;             // matches ETL registry key: "trim", "cast", "regex_extract", etc.
  params: Record<string, unknown>;
  order: number;            // 0-indexed; controls execution order
};
```

### UI Rules

- Display rules as a vertical ordered list with drag-to-reorder (use `@dnd-kit/sortable`).
- Each rule card has: type selector (dropdown of available types from API), param inputs (dynamic based on type schema), delete button.
- Param schemas are fetched from `GET /api/v1/transformations/types` — never hardcoded in the frontend.
- Order is maintained as array index; recalculate `order` fields before submission.
- Save on blur or explicit "Save" button — never auto-save on every keystroke.

---

## Job Dashboard

Display job status with real-time updates.

```typescript
// hooks/useJobStatus.ts
export function useJobStatus(jobId: string) {
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => api.getJob(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
  });
}
```

### Status Display

| Status | UI Treatment |
|---|---|
| `queued` | Spinner + "Waiting to start" |
| `running` | Animated progress bar + per-file status list |
| `completed` | Green checkmark + download button |
| `completed_with_errors` | Yellow warning + per-file error accordion + download button |
| `failed` | Red X + error message + retry button |

Per-file errors are displayed in a collapsible accordion. Each entry shows: filename, stage that failed, error message. Never show raw stack traces.

---

## Form Validation Pattern

```typescript
// types/schemas/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

```typescript
// components/features/projects/CreateProjectForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function CreateProjectForm() {
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  // ...
}
```

---

## API Client Pattern

All FastAPI calls go through a typed client in `lib/api/`:

```typescript
// lib/api/jobs.ts
import type { Job, CreateJobRequest } from "@/types/job";

export async function createJob(req: CreateJobRequest): Promise<Job> {
  const res = await fetch("/api/v1/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Failed to create job");
  }

  return res.json() as Promise<Job>;
}
```

Never call `fetch` directly inside a component or hook — always import from `lib/api/`.
