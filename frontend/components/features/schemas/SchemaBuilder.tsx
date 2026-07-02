"use client";

// TODO: Implement destination schema builder
// User defines destination columns: name, type, nullable, validation rules
// Each column entry: React Hook Form + zod validated
// Submission: POST /api/v1/schemas or PATCH /api/v1/schemas/:schemaId
export function SchemaBuilder({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Schema builder placeholder — project: {projectId}
      </p>
    </div>
  );
}
