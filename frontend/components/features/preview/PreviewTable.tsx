"use client";

// TODO: Implement 100-row structural preview using TanStack Table
// Column widths: resizable, persisted to localStorage
// Virtualize rows when count > 50
// Hard limit enforced: API returns max 100 rows; this component renders what it receives
export function PreviewTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Record<string, unknown>[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <p className="p-4 text-xs text-muted-foreground">
        Preview table placeholder — {columns.length} columns, {rows.length} rows
      </p>
    </div>
  );
}
