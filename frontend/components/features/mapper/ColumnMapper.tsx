"use client";

// TODO: Implement visual column mapper
// Left panel: source columns with inferred types and null rates
// Right panel: destination schema columns
// Connections: drag-to-map or click-to-select; confidence score badges
// Actions: auto-map (suggestion only), manual override, clear mapping
// State: Record<sourceCol, destCol | null> — PATCH /api/v1/mappings/:uploadId on change (debounced 500ms)
export function ColumnMapper({
  uploadId,
  schemaId,
}: {
  uploadId: string;
  schemaId: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="rounded-md border p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Source Columns
        </p>
        {/* TODO: SourceColumnList */}
      </div>
      <div className="rounded-md border p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Destination Columns
        </p>
        {/* TODO: DestinationColumnList */}
      </div>
    </div>
  );
}
