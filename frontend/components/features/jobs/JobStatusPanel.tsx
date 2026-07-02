"use client";

// TODO: Implement job status panel
// Poll GET /api/v1/jobs/:jobId every 2s while status === "running"
// States: queued (spinner) | running (progress bar + per-file list) |
//         completed (download button) | completed_with_errors (error accordion + download) |
//         failed (error message + retry button)
export function JobStatusPanel({ jobId }: { jobId: string }) {
  return (
    <div className="rounded-md border p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Job status placeholder — job: {jobId}
      </p>
    </div>
  );
}
