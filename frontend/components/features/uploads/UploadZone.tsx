"use client";

// TODO: Implement drag-and-drop file upload zone
// Flow: validate file type/size → POST /api/v1/uploads/presign → PUT to presigned URL
//       → POST /api/v1/uploads/:id/confirm → poll for slice readiness
export function UploadZone({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
      <p className="text-sm text-muted-foreground">
        Upload zone placeholder — project: {projectId}
      </p>
    </div>
  );
}
